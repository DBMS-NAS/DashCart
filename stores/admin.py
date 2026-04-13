from django.contrib import admin
from .models import Store, Warehouse


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("store_id", "name", "location")
    search_fields = ("store_id", "name", "location")


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("warehouse_id", "store", "location")
    list_filter = ("store",)
    search_fields = ("warehouse_id", "store__name", "location")
