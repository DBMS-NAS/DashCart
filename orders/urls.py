from django.urls import path
from .views import OrderListAPI, OrderUpdateAPI

urlpatterns = [
    path("", OrderListAPI.as_view(), name="order-list"),
    path("<str:order_id>/", OrderUpdateAPI.as_view(), name="order-update"),
]