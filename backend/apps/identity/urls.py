from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .admin_views import AdminUserDetail, AdminUserList
from .views import (
    AddressDetailView,
    AddressListCreateView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
)

urlpatterns = [
    path("admin/users", AdminUserList.as_view()),
    path("admin/users/<uuid:pk>", AdminUserDetail.as_view()),
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/refresh", TokenRefreshView.as_view()),
    path("auth/me", MeView.as_view()),
    path("addresses", AddressListCreateView.as_view()),
    path("addresses/<uuid:pk>", AddressDetailView.as_view()),
]
