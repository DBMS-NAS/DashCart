from django.urls import path

from .views import InventoryListAPI

urlpatterns = [
    path("", InventoryListAPI.as_view()),
]
