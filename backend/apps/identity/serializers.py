from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, User
from .presentation import avatar_url, profile_full_name, public_name


def validate_profile_name(value: str) -> str:
    if "@" in value:
        raise serializers.ValidationError("Vui lòng nhập họ và tên.")
    return " ".join(value.split())


class UserPublicSerializer(serializers.ModelSerializer[User]):
    capabilities = serializers.SerializerMethodField()
    display_name = serializers.CharField(max_length=150, required=False)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "full_name",
            "phone",
            "birthday",
            "gender",
            "role",
            "capabilities",
        ]
        read_only_fields = ["id", "role", "capabilities"]

    def get_capabilities(self, obj: User) -> list[str]:
        if obj.role == User.Role.ADMIN:
            return [
                "catalog.manage",
                "inventory.manage",
                "orders.manage",
                "users.manage",
            ]
        return ["orders.view", "cart.manage", "profile.manage"]

    def to_representation(self, instance: User) -> dict[str, Any]:
        return {
            **super().to_representation(instance),
            "display_name": public_name(instance),
            "avatar_url": avatar_url(instance),
        }

    def get_full_name(self, obj: User) -> str:
        return profile_full_name(obj)

    def validate_display_name(self, value: str) -> str:
        return validate_profile_name(value)

    def update(self, instance: User, validated_data: dict[str, Any]) -> User:
        if "display_name" in validated_data:
            parts = validated_data.pop("display_name").split(maxsplit=1)
            validated_data["first_name"] = parts[0]
            validated_data["last_name"] = parts[1] if len(parts) > 1 else ""
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.Serializer[User]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    display_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )

    def validate_display_name(self, value: str) -> str:
        return validate_profile_name(value)

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return email

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data: dict[str, Any]) -> User:
        email = validated_data["email"]
        display_name = validated_data.get("display_name", "").strip()
        parts = display_name.split(" ", 1)
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=parts[0] if parts else "",
            last_name=parts[1] if len(parts) > 1 else "",
            role=User.Role.CUSTOMER,
        )
        return user


class LoginSerializer(serializers.Serializer[dict[str, Any]]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        try:
            account = User.objects.only("username").get(email__iexact=email)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            account = None
        user = authenticate(
            username=account.get_username() if account else "",
            password=password,
        )
        if account is None or user is None or not user.is_active:
            raise serializers.ValidationError({"code": "invalid_credentials"})
        refresh = RefreshToken.for_user(user)
        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class AddressSerializer(serializers.ModelSerializer[Address]):
    class Meta:
        model = Address
        fields = [
            "id",
            "receiver",
            "phone",
            "street",
            "area",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChangePasswordSerializer(serializers.Serializer[User]):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu hiện tại không chính xác.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Mật khẩu xác nhận không khớp."}
            )
        user = self.context["request"].user
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs

    def save(self, **kwargs: Any) -> User:
        user: User = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
