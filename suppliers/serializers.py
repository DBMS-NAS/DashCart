from rest_framework import serializers

from .models import Supplier, SupplierProduct, SupplierRequest


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "supplier_id",
            "name",
            "contact_person",
            "email",
            "phone",
            "address",
            "created_at",
        ]
        read_only_fields = ["supplier_id", "created_at"]


class SupplierProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SupplierProduct
        fields = [
            "id",
            "supplier",
            "supplier_name",
            "product",
            "product_name",
        ]
        read_only_fields = ["id", "supplier_name", "product_name"]

    def validate(self, attrs):
        supplier = attrs.get("supplier")
        product = attrs.get("product")

        if SupplierProduct.objects.filter(
            supplier=supplier,
            product=product,
        ).exists():
            raise serializers.ValidationError(
                "This supplier is already linked to this product."
            )

        return attrs


class SupplierRequestSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    requested_by_username = serializers.CharField(
        source="requested_by.username",
        read_only=True,
    )

    class Meta:
        model = SupplierRequest
        fields = [
            "request_id",
            "supplier",
            "supplier_name",
            "product_name",
            "quantity",
            "notes",
            "status",
            "requested_by_username",
            "created_at",
        ]
        read_only_fields = [
            "request_id",
            "supplier_name",
            "requested_by_username",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
