from django.contrib import admin

from .models import Brand, Product, Category, ProductCategory


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("brand_id", "name")
    search_fields = ("brand_id", "name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("product_id", "name", "brand", "price")
    list_filter = ("brand",)
    search_fields = ("product_id", "name", "brand__name")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("category_id", "name")
    search_fields = ("category_id", "name")


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("product", "category")
    list_filter = ("category",)
    search_fields = ("product__name", "category__name")
