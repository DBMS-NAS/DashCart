from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import is_staff_account
from .models import Inventory, StockMovement
from .serializers import InventorySerializer, StockMovementSerializer


class InventoryListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view inventory."},
                status=status.HTTP_403_FORBIDDEN,
            )

        inventory = (
            Inventory.objects.select_related("product", "warehouse", "warehouse__store")
            .all()
            .order_by("product__name", "warehouse__location")
        )
        return Response(InventorySerializer(inventory, many=True).data)


class StockMovementListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view stock movements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        movements = StockMovement.objects.select_related(
            "product",
            "warehouse",
            "warehouse__store",
        ).all()
        return Response(StockMovementSerializer(movements, many=True).data)

    @transaction.atomic
    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can create stock movements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StockMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        warehouse = serializer.validated_data["warehouse"]
        quantity = serializer.validated_data["quantity"]
        movement_type = serializer.validated_data["movement_type"]

        inventory, _ = Inventory.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={"quantity": 0},
        )

        if movement_type == StockMovement.MOVEMENT_IN:
            inventory.quantity += quantity
        else:
            if inventory.quantity < quantity:
                return Response(
                    {
                        "quantity": [
                            "Cannot move out more stock than is available. "
                            f"Available: {inventory.quantity}."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            inventory.quantity -= quantity

        inventory.save()
        movement = serializer.save(
            movement_id=StockMovement.generate_movement_id(),
        )
        return Response(
            StockMovementSerializer(movement).data,
            status=status.HTTP_201_CREATED,
        )
