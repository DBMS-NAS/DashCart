from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from users.services import is_staff_account
from products.models import Product
from .models import Discount, ProductDiscount
from .serializers import DiscountSerializer, ProductDiscountSerializer


def get_staff_store(user):
    profile = getattr(user, "account_profile", None)
    return profile.store if profile else None


class DiscountListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        store = get_staff_store(request.user)
        if store:
            discounts = Discount.objects.filter(store=store).order_by("name")
        else:
            discounts = Discount.objects.all().order_by("name")
        return Response(DiscountSerializer(discounts, many=True).data)

    def post(self, request):
        if not is_staff_account(request.user):
            return Response({"detail": "Only staff can create discounts."}, status=status.HTTP_403_FORBIDDEN)

        store = get_staff_store(request.user)

        serializer = DiscountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(store=store)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DiscountDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, discount_id):
        if not is_staff_account(request.user):
            return Response({"detail": "Only staff can delete discounts."}, status=status.HTTP_403_FORBIDDEN)

        try:
            discount = Discount.objects.get(discount_id=discount_id)
        except Discount.DoesNotExist:
            return Response({"detail": "Discount not found."}, status=status.HTTP_404_NOT_FOUND)

        discount.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductDiscountAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_staff_account(request.user):
            return Response({"detail": "Only staff can assign discounts."}, status=status.HTTP_403_FORBIDDEN)

        product_id = request.data.get("product_id")
        discount_id = request.data.get("discount_id")

        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            discount = Discount.objects.get(discount_id=discount_id)
        except Discount.DoesNotExist:
            return Response({"detail": "Discount not found."}, status=status.HTTP_404_NOT_FOUND)

        pd, created = ProductDiscount.objects.get_or_create(product=product, discount=discount)
        if not created:
            return Response({"detail": "This discount is already applied to this product."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProductDiscountSerializer(pd).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if not is_staff_account(request.user):
            return Response({"detail": "Only staff can remove discounts."}, status=status.HTTP_403_FORBIDDEN)

        product_id = request.data.get("product_id")
        discount_id = request.data.get("discount_id")

        try:
            pd = ProductDiscount.objects.get(product_id=product_id, discount_id=discount_id)
        except ProductDiscount.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        pd.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)