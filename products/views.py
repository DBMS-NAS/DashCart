from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Inventory
from stores.models import Store, Warehouse
from users.services import is_staff_account
from .models import Brand, Product
from .serializers import ProductSerializer


def get_or_create_brand(brand_name):
    normalized_name = str(brand_name or "").strip()
    if not normalized_name:
        raise ValueError("Product brand is required.")

    brand = Brand.objects.filter(name__iexact=normalized_name).first()
    if brand:
        return brand

    return Brand.objects.create(
        brand_id=f"BR-{uuid4().hex[:8].upper()}",
        name=normalized_name,
    )


def get_warehouse_for_user(user):
    profile = getattr(user, "account_profile", None)
    store = profile.store if profile else None

    if not store:
        store = Store.objects.get_or_create(
            store_id="STORE-DEFAULT",
            defaults={"name": "Main Store", "location": "Local"},
        )[0]

    return Warehouse.objects.get_or_create(
        warehouse_id=f"WH-{store.store_id}",
        defaults={"store": store, "location": f"{store.name} Warehouse"},
    )[0]


def parse_price(value):
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None

    return price if price >= 0 else None


def parse_stock(value):
    try:
        stock = int(value)
    except (TypeError, ValueError):
        return None

    return stock if stock >= 0 else None


def set_product_stock(product, stock, user=None):
    warehouse = get_warehouse_for_user(user) if user else get_warehouse_for_user(None)
    inventory, _ = Inventory.objects.get_or_create(
        product=product,
        warehouse=warehouse,
        defaults={"quantity": stock},
    )
    inventory.quantity = stock
    inventory.save()


class ProductListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.select_related("brand").all().order_by("name")
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can add products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        name = str(request.data.get("name", "")).strip()
        brand_name = str(request.data.get("brand_name", "")).strip()
        price = parse_price(request.data.get("price"))
        stock = parse_stock(request.data.get("stock", 0))
        image = request.FILES.get("image")

        if not name:
            return Response({"name": ["Product name is required."]}, status=400)
        if not brand_name:
            return Response({"brand_name": ["Product brand is required."]}, status=400)
        if price is None:
            return Response({"price": ["Enter a valid non-negative price."]}, status=400)
        if stock is None:
            return Response({"stock": ["Enter a valid non-negative stock quantity."]}, status=400)

        product = Product.objects.create(
            product_id=f"PROD-{uuid4().hex[:8].upper()}",
            name=name,
            price=price,
            brand=get_or_create_brand(brand_name),
            image=image,
        )
        set_product_stock(product, stock, request.user)

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_product(self, product_id):
        return Product.objects.select_related("brand").get(product_id=product_id)

    @transaction.atomic
    def patch(self, request, product_id):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can edit products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            product = self.get_product(product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if "name" in request.data:
            name = str(request.data.get("name", "")).strip()
            if not name:
                return Response({"name": ["Product name is required."]}, status=400)
            product.name = name

        if "price" in request.data:
            price = parse_price(request.data.get("price"))
            if price is None:
                return Response({"price": ["Enter a valid non-negative price."]}, status=400)
            product.price = price

        if "brand_name" in request.data:
            brand_name = str(request.data.get("brand_name", "")).strip()
            if not brand_name:
                return Response({"brand_name": ["Product brand is required."]}, status=400)
            product.brand = get_or_create_brand(brand_name)

        if "image" in request.FILES:
            product.image = request.FILES["image"]

        product.save()

        if "stock" in request.data:
            stock = parse_stock(request.data.get("stock"))
            if stock is None:
                return Response({"stock": ["Enter a valid non-negative stock quantity."]}, status=400)
            set_product_stock(product, stock, request.user)

        return Response(ProductSerializer(product).data)

    @transaction.atomic
    def delete(self, request, product_id):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can delete products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            product = self.get_product(product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)