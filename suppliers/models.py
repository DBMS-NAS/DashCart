from uuid import uuid4

from django.conf import settings
from django.db import models


class Supplier(models.Model):
    supplier_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=120)
    contact_person = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @staticmethod
    def generate_supplier_id():
        return f"SUP-{uuid4().hex[:8].upper()}"


class SupplierRequest(models.Model):
    STATUS_PENDING = "Pending"
    STATUS_APPROVED = "Approved"
    STATUS_ORDERED = "Ordered"
    STATUS_RECEIVED = "Received"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_ORDERED, "Ordered"),
        (STATUS_RECEIVED, "Received"),
    ]

    request_id = models.CharField(max_length=50, primary_key=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="product_requests",
    )
    product_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supplier_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.request_id} - {self.product_name}"

    @staticmethod
    def generate_request_id():
        return f"REQ-{uuid4().hex[:8].upper()}"

