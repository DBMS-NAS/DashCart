from django.urls import path
from .views import CategoryListCreateAPI, ProductDetailAPI, ProductListAPI

urlpatterns = [
    path('', ProductListAPI.as_view()),
    path('categories/', CategoryListCreateAPI.as_view()),
    path('<str:product_id>/', ProductDetailAPI.as_view()),
]
