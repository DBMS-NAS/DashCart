from django.contrib import admin

from .models import Supplier, SupplierProduct, SupplierRequest


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("supplier_id", "name", "contact_person", "email", "phone")
    search_fields = ("supplier_id", "name", "contact_person", "email")


@admin.register(SupplierProduct)
class SupplierProductAdmin(admin.ModelAdmin):
    list_display = ("supplier", "product")
    list_filter = ("supplier",)
    search_fields = ("supplier__name", "product__name")


@admin.register(SupplierRequest)
class SupplierRequestAdmin(admin.ModelAdmin):
    list_display = (
        "request_id",
        "supplier",
        "product_name",
        "quantity",
        "status",
        "requested_by",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("request_id", "product_name", "supplier__name")
