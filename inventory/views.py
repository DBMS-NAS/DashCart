from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import is_staff_account
from .models import Inventory
from .serializers import InventorySerializer


class InventoryListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view inventory."},
                status=status.HTTP_403_FORBIDDEN,
            )

        inventory = (
            Inventory.objects.select_related("product", "warehouse")
            .all()
            .order_by("product__name", "warehouse__location")
        )
        return Response(InventorySerializer(inventory, many=True).data)
