from decimal import Decimal

from django.db.models import Avg, Count
from rest_framework import serializers

from discounts.utils import get_best_discount, get_effective_price_for_base_price
from inventory.models import Inventory

from .models import Category, Product, ProductCategory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["category_id", "name"]
        read_only_fields = ["category_id"]


class ReviewSummarySerializer(serializers.Serializer):
    review_id = serializers.CharField()
    rating = serializers.IntegerField()
    comment = serializers.CharField()
    created_at = serializers.DateTimeField()


class ProductSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    stock = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    available_stores = serializers.SerializerMethodField()
    category_ids = serializers.SerializerMethodField()
    category_names = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    discount_name = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "product_id",
            "name",
            "price",
            "brand",
            "brand_name",
            "stock",
            "store_name",
            "available_stores",
            "category_ids",
            "category_names",
            "image",
            "created_at",
            "discount_percent",
            "discounted_price",
            "discount_name",
            "average_rating",
            "review_count",
            "is_favorite",
        ]

    def get_stock(self, obj):
        return sum(inventory.quantity for inventory in self._get_scoped_inventory_rows(obj))

    def get_price(self, obj):
        inventory = next(
            (
                row
                for row in self._get_scoped_inventory_rows(obj)
                if row.unit_price is not None
            ),
            None,
        )
        unit_price = inventory.unit_price if inventory and inventory.unit_price is not None else obj.price
        return str(unit_price.quantize(Decimal("0.01")))

    def get_store_name(self, obj):
        inventory = next(
            (row for row in self._get_scoped_inventory_rows(obj) if row.quantity > 0),
            None,
        )
        if inventory and inventory.warehouse and inventory.warehouse.store:
            return inventory.warehouse.store.name
        return "Unknown store"

    def _get_inventory_rows(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get("inventory_set")
        if prefetched is not None:
            return prefetched

        return list(
            Inventory.objects.filter(product=obj).select_related("warehouse__store")
        )

    def _get_scoped_inventory_rows(self, obj):
        rows = self._get_inventory_rows(obj)
        assigned_store = self.context.get("assigned_store")
        if assigned_store is None:
            return rows
        return [
            row for row in rows
            if row.warehouse and row.warehouse.store_id == assigned_store.store_id
        ]

    def get_available_stores(self, obj):
        stores = {}
        for inventory in self._get_scoped_inventory_rows(obj):
            warehouse = inventory.warehouse
            store = warehouse.store if warehouse else None

            if inventory.quantity <= 0 or warehouse is None or store is None:
                continue

            store_key = store.store_id
            unit_price = inventory.unit_price if inventory.unit_price is not None else obj.price
            discounted_price = get_effective_price_for_base_price(obj, unit_price)

            if store_key not in stores:
                stores[store_key] = {
                    "warehouse_id": warehouse.warehouse_id,
                    "warehouse_location": warehouse.location,
                    "store_id": store.store_id,
                    "store_name": store.name,
                    "store_location": store.location,
                    "quantity": 0,
                    "price": str(unit_price.quantize(Decimal("0.01"))),
                    "discounted_price": str(discounted_price.quantize(Decimal("0.01"))),
                }

            stores[store_key]["quantity"] += inventory.quantity
            if (
                inventory.unit_price is not None
                and stores[store_key]["price"] == str(obj.price.quantize(Decimal("0.01")))
            ):
                stores[store_key]["price"] = str(unit_price.quantize(Decimal("0.01")))
                stores[store_key]["discounted_price"] = str(
                    discounted_price.quantize(Decimal("0.01"))
                )

        return sorted(stores.values(), key=lambda item: item["store_name"])

    def _get_product_categories(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get(
            "productcategory_set"
        )
        if prefetched is not None:
            return [relation.category for relation in prefetched]

        return [
            relation.category
            for relation in ProductCategory.objects.filter(product=obj).select_related(
                "category"
            )
        ]

    def get_category_ids(self, obj):
        return [category.category_id for category in self._get_product_categories(obj)]

    def get_category_names(self, obj):
        return [category.name for category in self._get_product_categories(obj)]

    def _get_active_discount(self, obj):
        return get_best_discount(obj)

    def get_discount_percent(self, obj):
        discount = self._get_active_discount(obj)
        return str(discount.discount_percent) if discount else None

    def get_discounted_price(self, obj):
        discount = self._get_active_discount(obj)
        if not discount:
            return None
        return str(
            get_effective_price_for_base_price(obj, Decimal(self.get_price(obj))).quantize(Decimal("0.01"))
        )

    def get_discount_name(self, obj):
        discount = self._get_active_discount(obj)
        return discount.name if discount else None

    def get_average_rating(self, obj):
        annotated_value = getattr(obj, "average_rating", None)
        if annotated_value is None:
            annotated_value = obj.reviews.aggregate(avg=Avg("rating"))["avg"]

        if annotated_value is None:
            return None

        return round(float(annotated_value), 1)

    def get_review_count(self, obj):
        annotated_value = getattr(obj, "review_count", None)
        if annotated_value is not None:
            return annotated_value

        return obj.reviews.count()

    def get_is_favorite(self, obj):
        favorite_ids = self.context.get("favorite_product_ids", set())
        return obj.product_id in favorite_ids


class ProductPreviewSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = [
            "product_id",
            "name",
            "price",
            "brand_name",
            "stock",
            "store_name",
            "available_stores",
            "category_names",
            "image",
            "discount_percent",
            "discounted_price",
            "discount_name",
            "average_rating",
            "review_count",
            "is_favorite",
        ]


class ProductDetailSerializer(ProductSerializer):
    reviews = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ["reviews", "related_products"]

    def get_reviews(self, obj):
        reviews = obj.reviews.order_by("-created_at")
        return ReviewSummarySerializer(reviews, many=True).data

    def get_related_products(self, obj):
        category_ids = [category.pk for category in self._get_product_categories(obj)]
        if not category_ids:
            return []

        related_products = (
            Product.objects.select_related("brand")
            .prefetch_related("productcategory_set__category", "product_discounts__discount")
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Count("reviews", distinct=True),
            )
            .filter(productcategory__category_id__in=category_ids)
            .exclude(product_id=obj.product_id)
            .distinct()
            .order_by("-average_rating", "name")[:4]
        )
        return ProductPreviewSerializer(
            related_products,
            many=True,
            context=self.context,
        ).data
