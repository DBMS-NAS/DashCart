from django.urls import path
from .views import DiscountListAPI, DiscountDetailAPI, ProductDiscountAPI

urlpatterns = [
    path("", DiscountListAPI.as_view()),
    path("assign/", ProductDiscountAPI.as_view()),
    path("<str:discount_id>/", DiscountDetailAPI.as_view()),
]