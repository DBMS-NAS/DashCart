from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("review_id", "product", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("review_id", "product__name", "comment")
