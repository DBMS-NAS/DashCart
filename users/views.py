from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import DashCartTokenObtainPairSerializer, RegisterSerializer


class DashCartTokenObtainPairView(TokenObtainPairView):
    serializer_class = DashCartTokenObtainPairSerializer


class RegisterAPI(generics.CreateAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
