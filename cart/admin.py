from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("cart_id", "user", "created_at")
    inlines = [CartItemInline]
    search_fields = ("user__username",)
    list_filter = ("created_at",)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "product", "quantity")
    search_fields = ("product__name",)