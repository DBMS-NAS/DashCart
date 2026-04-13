from django.urls import path

from .views import InventoryListAPI, StockMovementListCreateAPI

urlpatterns = [
    path("", InventoryListAPI.as_view()),
    path("stock-movements/", StockMovementListCreateAPI.as_view()),
]
