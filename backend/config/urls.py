from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from api.auth_views import HybridLogoutView, HybridTokenObtainPairView, HybridTokenRefreshView


def root(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("", root),

    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),

    # Auth (JWT)
    path("api/auth/login/", HybridTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", HybridTokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", HybridLogoutView.as_view(), name="token_logout"),
]
