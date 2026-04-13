from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from products.models import Product
from users.models import User


class Review(models.Model):
    review_id = models.CharField(max_length=50, primary_key=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} - {self.rating} star"

    @staticmethod
    def generate_review_id():
        from uuid import uuid4

        return f"REV-{uuid4().hex[:8].upper()}"
