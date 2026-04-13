from decimal import Decimal
from rest_framework import serializers
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
    category_ids = serializers.SerializerMethodField()
    category_names = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    discount_name = serializers.SerializerMethodField()

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
            "category_ids",
            "category_names",
            "image",
            "discount_percent",
            "discounted_price",
            "discount_name",
        ]

    def get_stock(self, obj):
        return sum(
            inventory.quantity
            for inventory in Inventory.objects.filter(product=obj)
        )

    def get_store_name(self, obj):
        inventory = Inventory.objects.filter(product=obj).select_related("warehouse__store").first()
        if inventory and inventory.warehouse and inventory.warehouse.store:
            return inventory.warehouse.store.name
        return "Unknown store"

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
        pd = (
            obj.product_discounts
            .select_related("discount")
            .order_by("-discount__discount_percent")
            .first()
        )
        return pd.discount if pd else None

    def get_discount_percent(self, obj):
        discount = self._get_active_discount(obj)
        return str(discount.discount_percent) if discount else None

    def get_discounted_price(self, obj):
        discount = self._get_active_discount(obj)
        if not discount:
            return None
        reduction = Decimal(obj.price) * Decimal(discount.discount_percent) / Decimal("100")
        return str((Decimal(obj.price) - reduction).quantize(Decimal("0.01")))

    def get_discount_name(self, obj):
        discount = self._get_active_discount(obj)
        return discount.name if discount else None
