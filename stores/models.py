from django.db import models

class Store(models.Model):
    store_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Warehouse(models.Model):
    warehouse_id = models.CharField(max_length=50, primary_key=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    location = models.CharField(max_length=200)

    def __str__(self):
        return self.location