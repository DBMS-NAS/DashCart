from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from inventory.models import Inventory
from orders.models import Order, OrderItem, OrderItemAllocation
from orders.query_utils import filter_orders_for_store
from products.models import Product
from users.models import UserRole
from users.services import get_account_role, get_or_create_database_user


def format_currency(amount):
    return f"${amount:.2f}"


def order_total(order_items):
    return sum(Decimal(item.quantity) * item.price for item in order_items)


def allocation_total(allocations):
    return sum(
        Decimal(allocation.quantity) * allocation.order_item.price
        for allocation in allocations
    )


class DashboardAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_account_role(request.user)
        profile = getattr(request.user, "account_profile", None)
        store = profile.store if profile else None

        if role == UserRole.STAFF:
            if store:
                allocations = OrderItemAllocation.objects.select_related(
                    "order_item",
                    "order_item__product",
                    "warehouse",
                ).filter(warehouse__store=store)
                orders = filter_orders_for_store(Order.objects.all(), store)
                products = Product.objects.filter(
                    inventory__warehouse__store=store
                ).distinct()
                low_stock = Inventory.objects.filter(
                    warehouse__store=store,
                    quantity__lte=5,
                )
                sales_description = f"Revenue fulfilled by {store.name}."
                orders_description = f"Orders fulfilled by {store.name}."
                products_description = f"Products stocked in {store.name}."
                low_stock_description = (
                    f"Inventory rows in {store.name} with 5 or fewer units."
                )
            else:
                order_items = OrderItem.objects.all()
                orders = Order.objects.all()
                products = Product.objects.all()
                low_stock = Inventory.objects.filter(quantity__lte=5)
                sales_description = "Revenue from all placed orders."
                orders_description = "Total customer orders."
                products_description = "Products stored in the database."
                low_stock_description = "Inventory rows with 5 or fewer units."

            total_sales = allocation_total(allocations) if store else order_total(order_items)
            cards = [
                {
                    "label": "Total Sales",
                    "value": format_currency(total_sales),
                    "description": sales_description,
                },
                {
                    "label": "Orders",
                    "value": orders.count(),
                    "description": orders_description,
                },
                {
                    "label": "Products",
                    "value": products.count(),
                    "description": products_description,
                },
                {
                    "label": "Low Stock",
                    "value": low_stock.count(),
                    "description": low_stock_description,
                },
            ]
        else:
            database_user = get_or_create_database_user(request.user)
            orders = Order.objects.filter(user=database_user)
            cart = Cart.objects.filter(user=database_user).prefetch_related("items__product").first()
            cart_items = sum(item.quantity for item in cart.items.all()) if cart else 0
            cart_total = (
                sum(Decimal(item.quantity) * item.product.price for item in cart.items.all())
                if cart
                else Decimal("0.00")
            )

            cards = [
                {
                    "label": "My Orders",
                    "value": orders.count(),
                    "description": "Orders you have placed.",
                },
                {
                    "label": "Cart Items",
                    "value": cart_items,
                    "description": "Items currently in your cart.",
                },
                {
                    "label": "Cart Total",
                    "value": format_currency(cart_total),
                    "description": "Current cart value.",
                },
                {
                    "label": "Available Products",
                    "value": Product.objects.filter(inventory__quantity__gt=0).distinct().count(),
                    "description": "Products with stock available.",
                },
            ]

        store_name = profile.store.name if profile and profile.store else None
        store_location = profile.store.location if profile and profile.store else None

        return Response(
            {
                "username": request.user.username,
                "role": role,
                "store_name": store_name,
                "store_location": store_location,
                "cards": cards,
            }
        )
