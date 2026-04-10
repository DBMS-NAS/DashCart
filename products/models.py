from django.db import models

# Create your models here.
from django.db import models

class Brand(models.Model):
    brand_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
class Product(models.Model):
    product_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
class Category(models.Model):
    category_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
class ProductCategory(models.Model):
    id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)