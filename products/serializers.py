from decimal import Decimal
from rest_framework import serializers
from inventory.models import Inventory

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    stock = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    discount_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "product_id",
            "name",
            "price",
            "brand",
            "brand_name",
            "stock",
            "store_name",
            "image",
            "discount_percent",
            "discounted_price",
            "discount_name",
        ]

    def get_stock(self, obj):
        return sum(
            inventory.quantity
            for inventory in Inventory.objects.filter(product=obj)
        )

    def get_store_name(self, obj):
        inventory = Inventory.objects.filter(product=obj).select_related("warehouse__store").first()
        if inventory and inventory.warehouse and inventory.warehouse.store:
            return inventory.warehouse.store.name
        return "Unknown store"

    def _get_active_discount(self, obj):
        pd = (
            obj.product_discounts
            .select_related("discount")
            .order_by("-discount__discount_percent")
            .first()
        )
        return pd.discount if pd else None

    def get_discount_percent(self, obj):
        discount = self._get_active_discount(obj)
        return str(discount.discount_percent) if discount else None

    def get_discounted_price(self, obj):
        discount = self._get_active_discount(obj)
        if not discount:
            return None
        reduction = Decimal(obj.price) * Decimal(discount.discount_percent) / Decimal("100")
        return str((Decimal(obj.price) - reduction).quantize(Decimal("0.01")))

    def get_discount_name(self, obj):
        discount = self._get_active_discount(obj)
        return discount.name if discount else None