from rest_framework import serializers
from .models import Payment, Refund


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ["id", "amount", "status", "requested_at"]


class PaymentSerializer(serializers.ModelSerializer):
    refund = RefundSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ["payment_id", "amount", "method", "status", "created_at", "refund"]