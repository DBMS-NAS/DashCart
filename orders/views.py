from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
