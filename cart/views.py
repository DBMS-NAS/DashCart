from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Cart


class CartAPI(APIView):

    def get(self, request):
        carts = Cart.objects.all()
        data = []

        for cart in carts:
            data.append({
                "cart_id": cart.cart_id,
                "user": str(cart.user),
                "items": cart.items.count()
            })

        return Response(data)