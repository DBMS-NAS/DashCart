from django.db import models
import uuid

from orders.models import Order


class Payment(models.Model):
    payment_id = models.CharField(primary_key=True, max_length=50, default=uuid.uuid4)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=50, default="card")
    status = models.CharField(max_length=20, default="paid")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.payment_id} for Order {self.order_id}"


class Refund(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name="refund")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        default="requested",
        choices=[
            ("requested", "Requested"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
        ],
    )

    def __str__(self):
        return f"Refund for Payment {self.payment_id}"