from django.urls import path

from .views import OrderListAPI

urlpatterns = [
    path("", OrderListAPI.as_view()),
]
