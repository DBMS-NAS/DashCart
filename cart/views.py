from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import DatabaseError, transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from backend.mysql_routines import (
    get_database_error_message,
    using_mysql,
)
from discounts.utils import get_effective_price
from inventory.models import Inventory
from orders.models import Order, OrderItem
from payments.models import Payment
from products.models import Product
from stores.models import Warehouse
from users.models import UserRole
from users.services import get_account_role, get_or_create_database_user
from .models import Cart, CartItem
from .serializers import CartSerializer


def parse_quantity(value, default=1):
    try:
        quantity = int(value)
    except (TypeError, ValueError):
        return None

    return quantity if quantity > 0 else None


def get_current_cart(auth_user):
    database_user = get_or_create_database_user(auth_user)
    cart, _ = Cart.objects.get_or_create(user=database_user)
    return cart


def serialize_cart(cart):
    cart = Cart.objects.prefetch_related("items__product", "items__warehouse__store").get(
        cart_id=cart.cart_id
    )
    return CartSerializer(cart).data


def customer_required(request):
    if get_account_role(request.user) != UserRole.CUSTOMER:
        return Response(
            {"detail": "Only customers can use the cart."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


def get_selected_warehouse(warehouse_id):
    if not warehouse_id:
        return None

    try:
        return Warehouse.objects.select_related("store").get(warehouse_id=warehouse_id)
    except Warehouse.DoesNotExist:
        return None


def get_inventory_for_product(product, warehouse):
    if warehouse is None:
        return None

    return Inventory.objects.filter(product=product, warehouse=warehouse).first()


class CartAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        permission_error = customer_required(request)
        if permission_error:
            return permission_error

        cart = get_current_cart(request.user)
        return Response(serialize_cart(cart))


class AddToCartAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        permission_error = customer_required(request)
        if permission_error:
            return permission_error

        product_id = request.data.get("product_id")
        warehouse_id = request.data.get("warehouse_id")
        quantity = parse_quantity(request.data.get("quantity", 1))

        if quantity is None:
            return Response(
                {"quantity": ["Quantity must be greater than zero."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        warehouse = get_selected_warehouse(warehouse_id)
        if warehouse is None:
            return Response(
                {"detail": "Select a valid store before adding this item to cart."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inventory = get_inventory_for_product(product, warehouse)
        if inventory is None or inventory.quantity <= 0:
            return Response(
                {"detail": "This product is not available in the selected store."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = get_current_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            warehouse=warehouse,
            defaults={"quantity": quantity},
        )

        if not created:
            next_quantity = item.quantity + quantity
            if next_quantity > inventory.quantity:
                return Response(
                    {
                        "detail": (
                            "Selected store does not have enough stock. "
                            f"Available: {inventory.quantity}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = next_quantity
            item.save(update_fields=["quantity"])
        elif quantity > inventory.quantity:
            item.delete()
            return Response(
                {
                    "detail": (
                        "Selected store does not have enough stock. "
                        f"Available: {inventory.quantity}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serialize_cart(cart), status=status.HTTP_201_CREATED)


class CartItemAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_cart_item(self, request, item_id):
        cart = get_current_cart(request.user)
        return CartItem.objects.get(id=item_id, cart=cart)

    @transaction.atomic
    def patch(self, request, item_id):
        permission_error = customer_required(request)
        if permission_error:
            return permission_error

        quantity = parse_quantity(request.data.get("quantity"))
        if quantity is None:
            return Response(
                {"quantity": ["Quantity must be greater than zero."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item = self.get_cart_item(request, item_id)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        inventory = get_inventory_for_product(item.product, item.warehouse)
        if inventory is None or quantity > inventory.quantity:
            available = inventory.quantity if inventory else 0
            return Response(
                {"detail": f"Selected store only has {available} unit(s) available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(serialize_cart(item.cart))

    @transaction.atomic
    def delete(self, request, item_id):
        permission_error = customer_required(request)
        if permission_error:
            return permission_error

        try:
            item = self.get_cart_item(request, item_id)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        cart = item.cart
        item.delete()
        return Response(serialize_cart(cart))


class CheckoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        permission_error = customer_required(request)
        if permission_error:
            return permission_error

        database_user = get_or_create_database_user(request.user)
        cart = get_current_cart(request.user)
        items = list(cart.items.select_related("product"))

        if not items:
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.create(
            order_id=Order.generate_order_id(),
            user=database_user,
            status="pending",
        )

        try:
            for item in items:
                if item.warehouse is None:
                    raise ValidationError(
                        f"{item.product.name} is missing a selected store. Remove it and add it again."
                    )

                inventory = get_inventory_for_product(item.product, item.warehouse)
                if inventory is None:
                    raise ValidationError(
                        f"{item.product.name} is not available in the selected store."
                    )

                order_item = OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=get_effective_price(item.product),
                )
                order_item._selected_warehouse = item.warehouse
                order_item.save()
        except ValidationError as exc:
            order.delete()
            return Response(
                {"detail": exc.messages[0] if exc.messages else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            total = sum(
                Decimal(item.quantity) * get_effective_price(item.product)
                for item in items
            )
            Payment.objects.create(
                order=order,
                amount=total,
                method=request.data.get("payment_method", "card"),
                status="paid",
            )
        except DatabaseError as exc:
            order.delete()
            return Response(
                {"detail": get_database_error_message(exc) if using_mysql() else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart.items.all().delete()

        return Response(
            {
                "order_id": order.order_id,
                "status": order.status,
                "total": f"{total:.2f}",
                "item_count": sum(item.quantity for item in items),
                "cart": serialize_cart(cart),
            },
            status=status.HTTP_201_CREATED,
        )
