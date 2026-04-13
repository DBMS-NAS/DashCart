from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from backend.views import DashboardAPI
from users.views import DashCartTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT AUTH
    path('api/token/', DashCartTokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),

    # YOUR APIS
    path('api/cart/', include('cart.urls')),
    path('api/dashboard/', DashboardAPI.as_view()),
    path('api/inventory/', include('inventory.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/products/', include('products.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/users/', include('users.urls')),
    path('api/discounts/', include('discounts.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)