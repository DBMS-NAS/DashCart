from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.db import transaction
from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Inventory
from stores.models import Store, Warehouse
from users.services import get_or_create_database_user, is_staff_account

from .models import Brand, Category, Product, ProductCategory, ProductFavorite
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductPreviewSerializer,
    ProductSerializer,
)


def get_product_queryset():
    return (
        Product.objects.select_related("brand")
        .prefetch_related(
            "productcategory_set__category",
            "product_discounts__discount",
            "reviews",
            "inventory_set__warehouse__store",
        )
        .annotate(
            average_rating=Avg("reviews__rating"),
            review_count=Count("reviews", distinct=True),
        )
    )


def get_favorite_product_ids(request):
    if is_staff_account(request.user):
        return set()

    customer = get_or_create_database_user(request.user)
    return set(
        ProductFavorite.objects.filter(customer=customer).values_list("product_id", flat=True)
    )


def build_serializer_context(request):
    return {
        "request": request,
        "favorite_product_ids": get_favorite_product_ids(request),
    }


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


def get_or_create_category(category_name):
    normalized_name = str(category_name or "").strip()
    if not normalized_name:
        return None

    category = Category.objects.filter(name__iexact=normalized_name).first()
    if category:
        return category

    return Category.objects.create(
        category_id=f"CAT-{uuid4().hex[:8].upper()}",
        name=normalized_name,
    )


def set_product_category(product, category_name):
    ProductCategory.objects.filter(product=product).delete()
    category = get_or_create_category(category_name)

    if category:
        ProductCategory.objects.create(product=product, category=category)


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
        products = get_product_queryset().order_by("name")
        serializer = ProductSerializer(
            products,
            many=True,
            context=build_serializer_context(request),
        )
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
        category_name = str(request.data.get("category_name", "")).strip()
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
        set_product_category(product, category_name)
        set_product_stock(product, stock, request.user)

        fresh_product = get_product_queryset().get(product_id=product.product_id)
        return Response(
            ProductSerializer(fresh_product, context=build_serializer_context(request)).data,
            status=status.HTTP_201_CREATED,
        )


class ProductDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_product(self, product_id):
        return get_product_queryset().get(product_id=product_id)

    def get(self, request, product_id):
        try:
            product = self.get_product(product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            ProductDetailSerializer(
                product,
                context=build_serializer_context(request),
            ).data
        )

    @transaction.atomic
    def patch(self, request, product_id):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can edit products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            product = Product.objects.get(product_id=product_id)
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

        if "category_name" in request.data:
            set_product_category(product, request.data.get("category_name", ""))

        if "stock" in request.data:
            stock = parse_stock(request.data.get("stock"))
            if stock is None:
                return Response({"stock": ["Enter a valid non-negative stock quantity."]}, status=400)
            set_product_stock(product, stock, request.user)

        fresh_product = self.get_product(product_id)
        return Response(
            ProductSerializer(fresh_product, context=build_serializer_context(request)).data
        )

    @transaction.atomic
    def delete(self, request, product_id):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can delete products."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductFavoriteListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_customer(self, request):
        if is_staff_account(request.user):
            return None
        return get_or_create_database_user(request.user)

    def get(self, request):
        customer = self.get_customer(request)
        if customer is None:
            return Response(
                {"detail": "Only customers can use favorites."},
                status=status.HTTP_403_FORBIDDEN,
            )

        products = (
            get_product_queryset()
            .filter(favorited_by__customer=customer)
            .order_by("-favorited_by__created_at", "name")
            .distinct()
        )
        context = {
            "request": request,
            "favorite_product_ids": set(products.values_list("product_id", flat=True)),
        }
        return Response(ProductPreviewSerializer(products, many=True, context=context).data)

    @transaction.atomic
    def post(self, request):
        customer = self.get_customer(request)
        if customer is None:
            return Response(
                {"detail": "Only customers can use favorites."},
                status=status.HTTP_403_FORBIDDEN,
            )

        product_id = request.data.get("product_id")
        if not product_id:
            return Response({"product_id": ["Product is required."]}, status=400)

        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        _, created = ProductFavorite.objects.get_or_create(
            customer=customer,
            product=product,
        )
        return Response(
            {
                "detail": "Added to favorites." if created else "Already in favorites.",
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ProductFavoriteDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def delete(self, request, product_id):
        if is_staff_account(request.user):
            return Response(
                {"detail": "Only customers can use favorites."},
                status=status.HTTP_403_FORBIDDEN,
            )

        customer = get_or_create_database_user(request.user)
        deleted, _ = ProductFavorite.objects.filter(
            customer=customer,
            product_id=product_id,
        ).delete()

        if not deleted:
            return Response({"detail": "Favorite not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        return Response(CategorySerializer(categories, many=True).data)

    def post(self, request):
        if not is_staff_account(request.user):
            return Response(
                {"detail": "Only staff can add categories."},
                status=status.HTTP_403_FORBIDDEN,
            )

        category_name = str(request.data.get("name", "")).strip()
        if not category_name:
            return Response({"name": ["Category name is required."]}, status=400)

        category = get_or_create_category(category_name)
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
