from django.urls import path

from .views import SupplierListCreateAPI, SupplierRequestListCreateAPI


urlpatterns = [
    path("", SupplierListCreateAPI.as_view()),
    path("requests/", SupplierRequestListCreateAPI.as_view()),
]

