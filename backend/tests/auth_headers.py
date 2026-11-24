from typing import TypedDict

from rest_framework_simplejwt.tokens import RefreshToken

from apps.identity.models import User


class AuthHeaders(TypedDict):
    HTTP_AUTHORIZATION: str


def auth_headers(user: User) -> AuthHeaders:
    return {"HTTP_AUTHORIZATION": f"Bearer {RefreshToken.for_user(user).access_token}"}
