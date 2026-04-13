from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.services import is_staff_account
from .models import Supplier, SupplierRequest
from .serializers import SupplierRequestSerializer, SupplierSerializer


def staff_only(user):
    return is_staff_account(user)


class SupplierListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not staff_only(request.user):
            return Response(
                {"detail": "Only staff can view suppliers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        suppliers = Supplier.objects.all()
        return Response(SupplierSerializer(suppliers, many=True).data)

    def post(self, request):
        if not staff_only(request.user):
            return Response(
                {"detail": "Only staff can add suppliers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SupplierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        supplier = serializer.save(supplier_id=Supplier.generate_supplier_id())
        return Response(SupplierSerializer(supplier).data, status=status.HTTP_201_CREATED)


class SupplierRequestListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not staff_only(request.user):
            return Response(
                {"detail": "Only staff can view supplier requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        supplier_requests = SupplierRequest.objects.select_related(
            "supplier",
            "requested_by",
        ).all()
        return Response(SupplierRequestSerializer(supplier_requests, many=True).data)

    def post(self, request):
        if not staff_only(request.user):
            return Response(
                {"detail": "Only staff can create supplier requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SupplierRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        supplier_request = serializer.save(
            request_id=SupplierRequest.generate_request_id(),
            requested_by=request.user,
        )
        return Response(
            SupplierRequestSerializer(supplier_request).data,
            status=status.HTTP_201_CREATED,
        )

