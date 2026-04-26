from decimal import Decimal

from rest_framework import serializers

from discounts.utils import get_effective_price
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source="product.product_id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_id = serializers.CharField(source="warehouse.warehouse_id", read_only=True)
    warehouse_location = serializers.CharField(source="warehouse.location", read_only=True)
    store_name = serializers.CharField(source="warehouse.store.name", read_only=True)
    store_location = serializers.CharField(source="warehouse.store.location", read_only=True)
    price = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "warehouse_id",
            "warehouse_location",
            "store_name",
            "store_location",
            "price",
            "quantity",
            "subtotal",
        ]

    def get_price(self, obj):
        return f"{get_effective_price(obj.product):.2f}"

    def get_subtotal(self, obj):
        subtotal = Decimal(obj.quantity) * get_effective_price(obj.product)
        return f"{subtotal:.2f}"


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["cart_id", "items", "item_count", "total"]

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_total(self, obj):
        total = sum(
            Decimal(item.quantity) * get_effective_price(item.product)
            for item in obj.items.select_related("product")
        )
        return f"{total:.2f}"
