from typing import Any

from django.db.models import QuerySet
from rest_framework import generics, serializers

from .models import User
from .permissions import IsAdminRole
from .serializers import RegisterSerializer


class AdminUserSerializer(serializers.ModelSerializer[User]):
    password = serializers.CharField(
        write_only=True, required=False, trim_whitespace=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "is_active",
        ]
        read_only_fields = ["id", "role"]
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if self.instance is not None:
            if email != self.instance.email:
                raise serializers.ValidationError(
                    "Email đăng nhập chỉ được đặt khi tạo."
                )
            return email
        validator = RegisterSerializer()
        return validator.validate_email(email)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is not None and "password" in attrs:
            raise serializers.ValidationError(
                {"password": "Chỉ nhận mật khẩu khi tạo."}
            )
        if self.instance is None:
            if "password" not in attrs:
                raise serializers.ValidationError({"password": "Bắt buộc."})
            RegisterSerializer().validate_password(attrs["password"])
        return attrs

    def create(self, validated_data: dict[str, Any]) -> User:
        return User.objects.create_user(
            username=validated_data["email"], **validated_data
        )


class AdminUserList(generics.ListCreateAPIView[User]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer
    queryset = User.objects.order_by("email", "pk")


class AdminUserDetail(generics.RetrieveUpdateDestroyAPIView[User]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    def perform_destroy(self, instance: User) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def get_queryset(self) -> QuerySet[User]:
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return self.queryset.filter(
                role=User.Role.CUSTOMER, is_staff=False, is_superuser=False
            )
        return self.queryset
