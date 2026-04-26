from django.urls import path
from .views import (
    CategoryListCreateAPI,
    ProductDetailAPI,
    ProductFavoriteDetailAPI,
    ProductFavoriteListCreateAPI,
    ProductListAPI,
)

urlpatterns = [
    path('', ProductListAPI.as_view()),
    path('categories/', CategoryListCreateAPI.as_view()),
    path('favorites/', ProductFavoriteListCreateAPI.as_view()),
    path('favorites/<str:product_id>/', ProductFavoriteDetailAPI.as_view()),
    path('<str:product_id>/', ProductDetailAPI.as_view()),
]
