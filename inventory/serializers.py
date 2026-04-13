from rest_framework import serializers

from .models import Inventory, StockMovement


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
    store_name = serializers.CharField(source="warehouse.store.name", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_price",
            "warehouse_id",
            "warehouse_location",
            "store_name",
            "quantity",
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_location = serializers.CharField(
        source="warehouse.location",
        read_only=True,
    )
    store_name = serializers.CharField(source="warehouse.store.name", read_only=True)
    type = serializers.ChoiceField(
        source="movement_type",
        choices=StockMovement.MOVEMENT_TYPE_CHOICES,
    )

    class Meta:
        model = StockMovement
        fields = [
            "movement_id",
            "product",
            "product_name",
            "warehouse",
            "warehouse_location",
            "store_name",
            "quantity",
            "type",
            "created_at",
        ]
        read_only_fields = [
            "movement_id",
            "product_name",
            "warehouse_location",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
