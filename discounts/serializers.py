from rest_framework import serializers
from .models import Discount, ProductDiscount


class AssignedProductSerializer(serializers.Serializer):
    product_id = serializers.CharField(source="product.product_id")
    name = serializers.CharField(source="product.name")

    class Meta:
        fields = ["product_id", "name"]


class DiscountSerializer(serializers.ModelSerializer):
    assigned_products = serializers.SerializerMethodField()

    class Meta:
        model = Discount
        fields = ["discount_id", "name", "discount_percent", "assigned_products"]

    def get_assigned_products(self, obj):
        return [
            {"product_id": pd.product.product_id, "name": pd.product.name}
            for pd in obj.product_discounts.select_related("product").all()
        ]


class ProductDiscountSerializer(serializers.ModelSerializer):
    discount = DiscountSerializer(read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductDiscount
        fields = ["id", "product", "product_name", "discount"]