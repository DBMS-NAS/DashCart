from django.urls import path

from .views import ReviewListCreateAPI


urlpatterns = [
    path("", ReviewListCreateAPI.as_view()),
]
