from django.urls import path
from .views import CartAPI

urlpatterns = [
    path("", CartAPI.as_view()),
]