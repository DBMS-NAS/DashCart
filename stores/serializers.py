from rest_framework import serializers

from .models import Store, Warehouse


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["store_id", "name", "location"]
        read_only_fields = ["store_id"]


class WarehouseSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source="store.name", read_only=True)

    class Meta:
        model = Warehouse
        fields = [
            "warehouse_id",
            "store",
            "store_name",
            "location",
        ]
        read_only_fields = ["warehouse_id", "store_name"]
