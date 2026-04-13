from uuid import uuid4

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import is_staff_account
from .models import Store, Warehouse
from .serializers import StoreSerializer, WarehouseSerializer


class StoreListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view stores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        stores = Store.objects.all().order_by("name")
        return Response(StoreSerializer(stores, many=True).data)

    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can add stores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        store = serializer.save(store_id=f"STORE-{uuid4().hex[:8].upper()}")
        return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)


class WarehouseListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view warehouses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        warehouses = Warehouse.objects.select_related("store").all().order_by(
            "store__name",
            "location",
        )
        return Response(WarehouseSerializer(warehouses, many=True).data)

    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can add warehouses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WarehouseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        warehouse = serializer.save(warehouse_id=f"WH-{uuid4().hex[:8].upper()}")
        return Response(
            WarehouseSerializer(warehouse).data,
            status=status.HTTP_201_CREATED,
        )
