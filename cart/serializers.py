from decimal import Decimal

from rest_framework import serializers

from discounts.utils import get_effective_price_for_base_price
from inventory.models import Inventory
from .models import Cart, CartItem


def get_store_unit_price(product, warehouse):
    inventory = (
        Inventory.objects.filter(
            product=product,
            warehouse__store=warehouse.store,
        )
        .exclude(unit_price__isnull=True)
        .select_related("warehouse", "warehouse__store")
        .order_by("warehouse__location")
        .first()
    )
    if inventory and inventory.unit_price is not None:
        return inventory.unit_price
    return product.price


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
        return f"{get_effective_price_for_base_price(obj.product, get_store_unit_price(obj.product, obj.warehouse)):.2f}"

    def get_subtotal(self, obj):
        subtotal = Decimal(obj.quantity) * get_effective_price_for_base_price(
            obj.product,
            get_store_unit_price(obj.product, obj.warehouse),
        )
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
            Decimal(item.quantity)
            * get_effective_price_for_base_price(
                item.product,
                get_store_unit_price(item.product, item.warehouse),
            )
            for item in obj.items.select_related("product", "warehouse", "warehouse__store")
        )
        return f"{total:.2f}"
