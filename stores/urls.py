from django.urls import path

from .views import StoreListCreateAPI, WarehouseListCreateAPI


urlpatterns = [
    path("", StoreListCreateAPI.as_view()),
    path("warehouses/", WarehouseListCreateAPI.as_view()),
]
