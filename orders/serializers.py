from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem
from payments.serializers import PaymentSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["product_name", "quantity", "price", "subtotal"]

    def get_subtotal(self, obj):
        subtotal = Decimal(obj.quantity) * obj.price
        return f"{subtotal:.2f}"


class OrderSerializer(serializers.ModelSerializer):
    customer = serializers.CharField(source="user.name", read_only=True)
    items = OrderItemSerializer(source="orderitem_set", many=True, read_only=True)
    total = serializers.SerializerMethodField()
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ["order_id", "customer", "status", "created_at", "items", "total", "payment"]

    def get_total(self, obj):
        total = sum(
            Decimal(item.quantity) * item.price
            for item in obj.orderitem_set.all()
        )
        return f"{total:.2f}"