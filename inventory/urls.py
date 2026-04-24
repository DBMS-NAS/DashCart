from django.urls import path

from .views import (
    InventoryProductListAPI,
    InventoryListAPI,
    StockMovementListCreateAPI,
    StockTransferCreateAPI,
)

urlpatterns = [
    path("products/", InventoryProductListAPI.as_view()),
    path("", InventoryListAPI.as_view()),
    path("stock-movements/", StockMovementListCreateAPI.as_view()),
    path("transfers/", StockTransferCreateAPI.as_view()),
]
