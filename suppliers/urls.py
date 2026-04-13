from django.urls import path

from .views import (
    SupplierListCreateAPI,
    SupplierProductListCreateAPI,
    SupplierRequestListCreateAPI,
)


urlpatterns = [
    path("", SupplierListCreateAPI.as_view()),
    path("products/", SupplierProductListCreateAPI.as_view()),
    path("requests/", SupplierRequestListCreateAPI.as_view()),
]
