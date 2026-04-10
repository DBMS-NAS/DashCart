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


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.order.order_id} - {self.product.name}"

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        from inventory.models import Inventory

        # get inventory for product
        inventory = Inventory.objects.get(product=self.product)

        # ✅ STOCK CHECK
        if self.quantity > inventory.quantity:
            raise ValidationError(
                f"Not enough stock for {self.product.name}. "
                f"Available: {inventory.quantity}, Requested: {self.quantity}"
            )

        # save order item first
        super().save(*args, **kwargs)

        # reduce stock
        inventory.quantity -= self.quantity
        inventory.save()