from django.contrib import admin
from .models import Inventory, StockMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("product", "warehouse", "quantity")
    list_filter = ("warehouse",)
    search_fields = ("product__name",)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        "movement_id",
        "product",
        "warehouse",
        "quantity",
        "movement_type",
        "created_at",
    )
    list_filter = ("movement_type", "warehouse", "created_at")
    search_fields = ("movement_id", "product__name", "warehouse__location")
