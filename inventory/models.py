from django.db import models
from products.models import Product
from stores.models import Warehouse

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.product.name} - {self.warehouse.location} ({self.quantity})"
