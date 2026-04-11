from django.urls import path
from .views import ProductDetailAPI, ProductListAPI

urlpatterns = [
    path('', ProductListAPI.as_view()),
    path('<str:product_id>/', ProductDetailAPI.as_view()),
]
