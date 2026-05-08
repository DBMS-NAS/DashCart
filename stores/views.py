from uuid import uuid4

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import get_assigned_store, is_staff_account
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

        assigned_store = get_assigned_store(request.user)
        stores = Store.objects.filter(store_id=assigned_store.store_id) if assigned_store else Store.objects.none()
        return Response(StoreSerializer(stores, many=True).data)

    def post(self, request):
        return Response(
            {"detail": "Stores are managed centrally and cannot be created from this dashboard."},
            status=status.HTTP_403_FORBIDDEN,
        )


class WarehouseListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can view warehouses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        assigned_store = get_assigned_store(request.user)
        warehouses = Warehouse.objects.select_related("store").order_by("location")
        if assigned_store is None:
            warehouses = warehouses.none()
        else:
            warehouses = warehouses.filter(store=assigned_store)
        return Response(WarehouseSerializer(warehouses, many=True).data)

    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can add warehouses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        assigned_store = get_assigned_store(request.user)
        if assigned_store is None:
            return Response(
                {"detail": "Staff must be assigned to a store before adding warehouses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WarehouseSerializer(
            data={
                "store": assigned_store.store_id,
                "location": request.data.get("location"),
            }
        )
        serializer.is_valid(raise_exception=True)
        warehouse = serializer.save(warehouse_id=f"WH-{uuid4().hex[:8].upper()}")
        return Response(
            WarehouseSerializer(warehouse).data,
            status=status.HTTP_201_CREATED,
        )
