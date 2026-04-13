from django.db import models
from products.models import Product
from stores.models import Warehouse

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.product.name} - {self.warehouse.location} ({self.quantity})"


class StockMovement(models.Model):
    MOVEMENT_IN = "in"
    MOVEMENT_OUT = "out"

    MOVEMENT_TYPE_CHOICES = [
        (MOVEMENT_IN, "Stock In"),
        (MOVEMENT_OUT, "Stock Out"),
    ]

    movement_id = models.CharField(max_length=50, primary_key=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )
    quantity = models.PositiveIntegerField()
    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_TYPE_CHOICES,
        db_column="type",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stock_movements"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.movement_id} - {self.product.name} "
            f"{self.movement_type} {self.quantity}"
        )

    @staticmethod
    def generate_movement_id():
        from uuid import uuid4

        return f"MOV-{uuid4().hex[:8].upper()}"
