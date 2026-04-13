import uuid
from django.db import models
from products.models import Product
from stores.models import Store


class Discount(models.Model):
    discount_id = models.CharField(max_length=50, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.discount_percent}%)"


class ProductDiscount(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_discounts")
    discount = models.ForeignKey(Discount, on_delete=models.CASCADE, related_name="product_discounts")

    class Meta:
        unique_together = ("product", "discount")

    def __str__(self):
        return f"{self.product.name} - {self.discount.name}"