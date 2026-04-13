from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "review_id",
            "product",
            "product_name",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["review_id", "product_name", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        comment = value.strip()
        if not comment:
            raise serializers.ValidationError("Comment is required.")
        return comment
