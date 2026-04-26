from django.db import DatabaseError, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.mysql_routines import (
    call_stock_movement_procedure,
    get_database_error_message,
    using_mysql,
)
from products.models import Product
from users.services import get_assigned_store, is_staff_account
from .models import Inventory, StockMovement
from .serializers import (
    InventorySerializer,
    InventoryProductOptionSerializer,
    StockMovementSerializer,
    StockTransferSerializer,
)


class InventoryProductListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view inventory products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        products = Product.objects.all().order_by("name")
        return Response(InventoryProductOptionSerializer(products, many=True).data)


class InventoryListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view inventory."},
                status=status.HTTP_403_FORBIDDEN,
            )

        store = get_assigned_store(request.user)
        inventory = (
            Inventory.objects.select_related("product", "warehouse", "warehouse__store")
            .all()
            .order_by("product__name", "warehouse__location")
        )
        if store:
            inventory = inventory.filter(warehouse__store=store)
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

        if using_mysql():
            try:
                movement_id = call_stock_movement_procedure(
                    product.product_id,
                    warehouse.warehouse_id,
                    quantity,
                    movement_type,
                )
            except DatabaseError as exc:
                return Response(
                    {"detail": get_database_error_message(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            movement = StockMovement.objects.select_related(
                "product",
                "warehouse",
                "warehouse__store",
            ).get(movement_id=movement_id)
            return Response(
                StockMovementSerializer(movement).data,
                status=status.HTTP_201_CREATED,
            )

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


class StockTransferCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can transfer stock."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StockTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        source_warehouse = serializer.validated_data["source_warehouse"]
        destination_warehouse = serializer.validated_data["destination_warehouse"]
        quantity = serializer.validated_data["quantity"]

        try:
            source_inventory = Inventory.objects.select_for_update().get(
                product=product,
                warehouse=source_warehouse,
            )
        except Inventory.DoesNotExist:
            return Response(
                {"detail": "The selected source warehouse does not stock this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if source_inventory.quantity < quantity:
            return Response(
                {
                    "detail": (
                        "Cannot transfer more stock than is available in the source "
                        f"warehouse. Available: {source_inventory.quantity}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        destination_inventory, _ = Inventory.objects.select_for_update().get_or_create(
            product=product,
            warehouse=destination_warehouse,
            defaults={"quantity": 0},
        )

        source_inventory.quantity -= quantity
        destination_inventory.quantity += quantity
        source_inventory.save()
        destination_inventory.save()

        out_movement = StockMovement.objects.create(
            movement_id=StockMovement.generate_movement_id(),
            product=product,
            warehouse=source_warehouse,
            quantity=quantity,
            movement_type=StockMovement.MOVEMENT_OUT,
        )
        in_movement = StockMovement.objects.create(
            movement_id=StockMovement.generate_movement_id(),
            product=product,
            warehouse=destination_warehouse,
            quantity=quantity,
            movement_type=StockMovement.MOVEMENT_IN,
        )

        return Response(
            {
                "detail": "Stock transferred successfully.",
                "out_movement": StockMovementSerializer(out_movement).data,
                "in_movement": StockMovementSerializer(in_movement).data,
                "source_inventory": InventorySerializer(source_inventory).data,
                "destination_inventory": InventorySerializer(destination_inventory).data,
            },
            status=status.HTTP_201_CREATED,
        )
