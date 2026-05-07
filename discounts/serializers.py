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
            {
                "product_id": pd.product.product_id,
                "name": pd.product.name,
                "start_date": pd.start_date,
                "end_date": pd.end_date,
            }
            for pd in obj.product_discounts.select_related("product").all()
        ]


class ProductDiscountAssignSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    discount_id = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after the start date."}
            )
        return attrs


class ProductDiscountSerializer(serializers.ModelSerializer):
    discount = DiscountSerializer(read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductDiscount
        fields = ["id", "product", "product_name", "discount", "start_date", "end_date"]
