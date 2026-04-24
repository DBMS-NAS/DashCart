from decimal import Decimal

from django.db.models import Avg
from rest_framework import serializers

from backend.mysql_routines import (
    get_average_rating_value,
    get_total_inventory_value,
    using_mysql,
)
from discounts.utils import get_best_discount, get_effective_price
from inventory.models import Inventory

from .models import Category, Product, ProductCategory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["category_id", "name"]
        read_only_fields = ["category_id"]


class ProductSerializer(serializers.ModelSerializer):
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
            "discount_percent",
            "discounted_price",
            "discount_name",
            "average_rating",
        ]

    def _get_inventory_queryset(self, obj):
        inventory = Inventory.objects.filter(product=obj).select_related("warehouse__store")
        store = self.context.get("store")
        if store:
            inventory = inventory.filter(warehouse__store=store)
        return inventory

    def get_stock(self, obj):
        if using_mysql() and not self.context.get("store"):
            return get_total_inventory_value(obj.product_id)

        return sum(
            inventory.quantity
            for inventory in self._get_inventory_queryset(obj)
        )

    def get_store_name(self, obj):
        store = self.context.get("store")
        if store:
            return store.name

        inventories = list(self._get_inventory_queryset(obj))
        if len(inventories) > 1:
            return f"{len(inventories)} stores"

        inventory = inventories[0] if inventories else None
        if inventory and inventory.warehouse and inventory.warehouse.store:
            return inventory.warehouse.store.name
        return "Unknown store"

    def get_available_stores(self, obj):
        return [
            {
                "warehouse_id": inventory.warehouse.warehouse_id,
                "warehouse_location": inventory.warehouse.location,
                "store_id": inventory.warehouse.store.store_id,
                "store_name": inventory.warehouse.store.name,
                "store_location": inventory.warehouse.store.location,
                "stock": inventory.quantity,
            }
            for inventory in self._get_inventory_queryset(obj).filter(quantity__gt=0)
        ]

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
        product_discount = get_best_discount(obj)
        return product_discount.discount if product_discount else None

    def get_discount_percent(self, obj):
        discount = self._get_active_discount(obj)
        return str(discount.discount_percent) if discount else None

    def get_discounted_price(self, obj):
        effective_price = get_effective_price(obj)
        if effective_price == Decimal(obj.price):
            return None
        return str(effective_price.quantize(Decimal("0.01")))

    def get_discount_name(self, obj):
        discount = self._get_active_discount(obj)
        return discount.name if discount else None

    def get_average_rating(self, obj):
        if using_mysql():
            rating = get_average_rating_value(obj.product_id)
            return str(rating.quantize(Decimal("0.01"))) if rating is not None else None

        aggregate = obj.reviews.aggregate(avg_rating=Avg("rating"))
        rating = aggregate["avg_rating"]
        if rating is None:
            return None
        return str(Decimal(str(rating)).quantize(Decimal("0.01")))
