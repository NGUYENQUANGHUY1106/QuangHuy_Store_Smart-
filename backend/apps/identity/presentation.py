from django.urls import reverse

from .models import User


def profile_full_name(user: User) -> str:
    name = user.get_full_name().strip()
    return name if "@" not in name else ""


def public_name(user: User) -> str:
    # Existing accounts can use their email as the login username.
    return profile_full_name(user) or user.get_username().partition("@")[0]


def avatar_url(user: User) -> str | None:
    avatar = getattr(user, "avatar", None)
    return reverse("profile-avatar-image", args=[avatar.key]) if avatar else None
