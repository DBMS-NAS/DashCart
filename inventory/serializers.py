from rest_framework import serializers

from .models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source="product.product_id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    warehouse_id = serializers.CharField(source="warehouse.warehouse_id", read_only=True)
    warehouse_location = serializers.CharField(source="warehouse.location", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_price",
            "warehouse_id",
            "warehouse_location",
            "quantity",
        ]
