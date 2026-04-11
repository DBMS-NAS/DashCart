from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from inventory.models import Inventory
from orders.models import Order, OrderItem
from products.models import Product
from users.models import UserRole
from users.services import get_account_role, get_or_create_database_user


def format_currency(amount):
    return f"${amount:.2f}"


def order_total(order_items):
    line_total = ExpressionWrapper(
        F("quantity") * F("price"),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    return order_items.aggregate(total=Sum(line_total))["total"] or Decimal("0.00")


class DashboardAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_account_role(request.user)

        if role == UserRole.STAFF:
            total_sales = order_total(OrderItem.objects.all())
            cards = [
                {
                    "label": "Total Sales",
                    "value": format_currency(total_sales),
                    "description": "Revenue from all placed orders.",
                },
                {
                    "label": "Orders",
                    "value": Order.objects.count(),
                    "description": "Total customer orders.",
                },
                {
                    "label": "Products",
                    "value": Product.objects.count(),
                    "description": "Products stored in the database.",
                },
                {
                    "label": "Low Stock",
                    "value": Inventory.objects.filter(quantity__lte=5).count(),
                    "description": "Inventory rows with 5 or fewer units.",
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

        return Response(
            {
                "username": request.user.username,
                "role": role,
                "cards": cards,
            }
        )
