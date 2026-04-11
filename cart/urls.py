from django.urls import path
from .views import AddToCartAPI, CartAPI, CartItemAPI, CheckoutAPI

urlpatterns = [
    path("", CartAPI.as_view()),
    path("add/", AddToCartAPI.as_view()),
    path("checkout/", CheckoutAPI.as_view()),
    path("items/<int:item_id>/", CartItemAPI.as_view()),
]
