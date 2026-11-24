from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import User


class IsAdminRole(BasePermission):
    """Require the application ADMIN role."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return isinstance(user, User) and user.role == User.Role.ADMIN
