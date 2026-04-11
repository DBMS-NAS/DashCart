from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db import models
from users.models import User
from products.models import Product


class Order(models.Model):
    order_id = models.CharField(max_length=50, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return self.order_id

    @staticmethod
    def generate_order_id():
        return f"ORD-{uuid4().hex[:8].upper()}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.order.order_id} - {self.product.name}"

    def save(self, *args, **kwargs):
        from inventory.models import Inventory

        if not self._state.adding:
            super().save(*args, **kwargs)
            return

        inventories = list(
            Inventory.objects.select_for_update()
            .filter(product=self.product)
            .order_by("id")
        )
        total_available = sum(inventory.quantity for inventory in inventories)

        if self.quantity > total_available:
            raise ValidationError(
                f"Not enough stock for {self.product.name}. "
                f"Available: {total_available}, Requested: {self.quantity}"
            )

        super().save(*args, **kwargs)

        remaining = self.quantity
        for inventory in inventories:
            if remaining <= 0:
                break

            reduction = min(inventory.quantity, remaining)
            inventory.quantity -= reduction
            inventory.save()
            remaining -= reduction
