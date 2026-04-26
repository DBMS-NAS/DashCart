from django.db import DatabaseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from backend.mysql_routines import (
    call_refund_request_procedure,
    get_database_error_message,
    using_mysql,
)
from users.services import get_assigned_store, get_or_create_database_user, is_staff_account
from orders.models import Order
from orders.query_utils import filter_orders_for_store
from .models import Payment, Refund
from .serializers import RefundSerializer


class RefundRequestAPI(APIView):
    """Customer-facing: request a refund on a cancelled order."""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        db_user = get_or_create_database_user(request.user)
        store = get_assigned_store(request.user) if is_staff_account(request.user) else None

        try:
            if is_staff_account(request.user):
                orders = Order.objects.filter(order_id=order_id)
                if store:
                    orders = filter_orders_for_store(orders, store)
                order = orders.get()
            else:
                order = Order.objects.get(order_id=order_id, user=db_user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status != "cancelled":
            return Response(
                {"detail": "Order must be cancelled before requesting a refund."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = Payment.objects.get(order=order)
        except Payment.DoesNotExist:
            return Response({"detail": "No payment found for this order."}, status=status.HTTP_404_NOT_FOUND)

        if Refund.objects.filter(payment=payment).exists():
            return Response({"detail": "A refund was already requested for this order."}, status=status.HTTP_400_BAD_REQUEST)

        if using_mysql():
            try:
                refund_id = call_refund_request_procedure(order_id)
            except DatabaseError as exc:
                return Response(
                    {"detail": get_database_error_message(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            refund = Refund.objects.get(id=refund_id)
            return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)

        refund = Refund.objects.create(payment=payment, amount=payment.amount)
        return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)


class RefundUpdateAPI(APIView):
    """Staff-facing: approve or reject a refund."""
    permission_classes = [IsAuthenticated]

    VALID_STATUSES = ["requested", "approved", "rejected"]

    def patch(self, request, refund_id):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can update refund status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            refunds = Refund.objects.filter(id=refund_id)
            store = get_assigned_store(request.user)
            if store:
                refunds = refunds.filter(
                    payment__order__orderitem__allocations__warehouse__store=store
                ).distinct()
            refund = refunds.get()
        except Refund.DoesNotExist:
            return Response({"detail": "Refund not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in self.VALID_STATUSES:
            return Response(
                {"detail": f"Invalid status. Choose from: {', '.join(self.VALID_STATUSES)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund.status = new_status
        refund.save()
        return Response(RefundSerializer(refund).data)
