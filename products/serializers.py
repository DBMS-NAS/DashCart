from rest_framework import serializers
from inventory.models import Inventory

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "product_id",
            "name",
            "price",
            "brand",
            "brand_name",
            "stock",
        ]

    def get_stock(self, obj):
        return sum(
            inventory.quantity
            for inventory in Inventory.objects.filter(product=obj)
        )
