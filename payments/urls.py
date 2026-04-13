from django.urls import path
from .views import RefundRequestAPI, RefundUpdateAPI

urlpatterns = [
    path("refund/<str:order_id>/", RefundRequestAPI.as_view()),
    path("refund/update/<int:refund_id>/", RefundUpdateAPI.as_view()),
]