from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, User
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserPublicSerializer,
)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserPublicSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(
            {
                "user": UserPublicSerializer(data["user"]).data,
                "access": data["access"],
                "refresh": data["refresh"],
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Thiếu refresh token.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            if token["user_id"] != str(user.pk):
                raise TokenError("Refresh token belongs to another account")
            token.blacklist()
        except TokenError:
            return Response(
                {
                    "error": {
                        "code": "invalid_token",
                        "message": "Refresh token không hợp lệ.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView[User]):
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        user = self.request.user
        assert isinstance(user, User)
        return user


class AddressListCreateView(generics.ListCreateAPIView[Address]):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> QuerySet[Address]:
        user = self.request.user
        assert isinstance(user, User)
        return Address.objects.filter(user=user).order_by(
            "-is_default", "-created_at", "pk"
        )

    def perform_create(self, serializer: Any) -> None:
        user = self.request.user
        assert isinstance(user, User)
        with transaction.atomic():
            if serializer.validated_data.get("is_default"):
                User.objects.select_for_update().only("pk").get(pk=user.pk)
                Address.objects.filter(
                    user=user,
                    is_default=True,
                ).update(is_default=False)
            serializer.save(user=user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView[Address]):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> QuerySet[Address]:
        user = self.request.user
        assert isinstance(user, User)
        return Address.objects.filter(user=user)

    @transaction.atomic
    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = request.user
        assert isinstance(user, User)
        User.objects.select_for_update().only("pk").get(pk=user.pk)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer: Any) -> None:
        user = self.request.user
        assert isinstance(user, User)
        if serializer.validated_data.get("is_default"):
            Address.objects.filter(user=user, is_default=True).exclude(
                pk=serializer.instance.pk
            ).update(is_default=False)
        serializer.save()
