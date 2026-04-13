from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from discounts.utils import get_effective_price
from orders.models import Order, OrderItem
from payments.models import Payment
from products.models import Product
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
    cart = Cart.objects.prefetch_related("items__product").get(cart_id=cart.cart_id)
    return CartSerializer(cart).data


def customer_required(request):
    if get_account_role(request.user) != UserRole.CUSTOMER:
        return Response(
            {"detail": "Only customers can use the cart."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


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

        cart = get_current_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            item.quantity += quantity
            item.save()

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

        item.quantity = quantity
        item.save()
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
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=get_effective_price(item.product),
                )
        except ValidationError as exc:
            order.delete()
            return Response(
                {"detail": exc.messages[0] if exc.messages else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate total and create a Payment record automatically
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

        cart.items.all().delete()

        return Response(
            {
                "order_id": order.order_id,
                "status": order.status,
                "cart": serialize_cart(cart),
            },
            status=status.HTTP_201_CREATED,
        )