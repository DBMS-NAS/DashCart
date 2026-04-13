from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from users.services import get_or_create_database_user, is_staff_account
from .models import Order
from .serializers import OrderSerializer


class OrderListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.select_related("user")
            .prefetch_related("orderitem_set__product")
            .order_by("-created_at")
        )

        if not is_staff_account(request.user):
            orders = orders.filter(user=get_or_create_database_user(request.user))

        return Response(OrderSerializer(orders, many=True).data)


class OrderUpdateAPI(APIView):
    permission_classes = [IsAuthenticated]

    VALID_STATUSES = ["pending", "processing", "delivered", "cancelled"]

    def patch(self, request, order_id):
        db_user = get_or_create_database_user(request.user)
        staff = is_staff_account(request.user)

        try:
            if staff:
                order = Order.objects.get(order_id=order_id)
            else:
                order = Order.objects.get(order_id=order_id, user=db_user)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        if not staff:
            # Customers can only cancel, and only if still pending/processing
            if new_status != "cancelled":
                return Response(
                    {"detail": "Customers can only cancel orders."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if order.status not in ["pending", "processing"]:
                return Response(
                    {"detail": "Only pending or processing orders can be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            if new_status not in self.VALID_STATUSES:
                return Response(
                    {"detail": f"Invalid status. Choose from: {', '.join(self.VALID_STATUSES)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)