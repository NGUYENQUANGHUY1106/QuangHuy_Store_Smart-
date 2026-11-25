import pytest
from django.contrib.auth.hashers import identify_hasher
from django.test import Client

from apps.identity.models import User
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_register_login_profile_logout(client: Client) -> None:
    register = client.post(
        "/auth/register",
        {
            "email": "customer@example.com",
            "password": "StrongPassword123",
            "display_name": "Khách Hàng",
        },
        content_type="application/json",
    )
    assert register.status_code == 201
    body = register.json()
    assert body["user"]["role"] == "CUSTOMER"
    assert body["user"]["full_name"] == "Khách Hàng"
    assert "access" in body
    assert "refresh" in body

    user = User.objects.get(email="customer@example.com")
    assert identify_hasher(user.password).algorithm == "bcrypt_sha256"

    login = client.post(
        "/auth/login",
        {"email": "customer@example.com", "password": "StrongPassword123"},
        content_type="application/json",
    )
    assert login.status_code == 200
    access = login.json()["access"]
    refresh = login.json()["refresh"]

    me = client.get(
        "/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )
    assert me.status_code == 200
    assert me.json()["email"] == "customer@example.com"
    assert me.json()["display_name"] == "Khách Hàng"

    rotated = client.post(
        "/auth/refresh", {"refresh": refresh}, content_type="application/json"
    )
    assert rotated.status_code == 200
    assert rotated.json()["refresh"] != refresh
    assert (
        client.post(
            "/auth/refresh", {"refresh": refresh}, content_type="application/json"
        ).status_code
        == 401
    )
    access = rotated.json()["access"]
    refresh = rotated.json()["refresh"]

    logout = client.post(
        "/auth/logout",
        {"refresh": refresh},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )
    assert logout.status_code == 204
    assert (
        client.post(
            "/auth/refresh", {"refresh": refresh}, content_type="application/json"
        ).status_code
        == 401
    )


@pytest.mark.django_db
def test_profile_uses_full_name_and_handles_legacy_email_names(client: Client) -> None:
    user = User.objects.create_user(
        username="legacy-huy@example.com",
        email="legacy-huy@example.com",
        first_name="legacy-huy@example.com",
    )
    headers = auth_headers(user)
    profile = client.get("/auth/me", **headers).json()
    assert profile["display_name"] == "legacy-huy"
    assert profile["full_name"] == ""
    invalid = client.patch(
        "/auth/me",
        {"display_name": user.email},
        content_type="application/json",
        **headers,
    )
    assert invalid.status_code == 400
    updated = client.patch(
        "/auth/me",
        {"display_name": "  Nguyễn   Quang Huy "},
        content_type="application/json",
        **headers,
    )
    assert updated.status_code == 200
    assert updated.json()["display_name"] == "Nguyễn Quang Huy"
    assert updated.json()["full_name"] == "Nguyễn Quang Huy"
    assert updated.json()["email"] == user.email
    assert client.get("/auth/me", **headers).json()["full_name"] == "Nguyễn Quang Huy"


@pytest.mark.django_db
def test_duplicate_email_and_bad_password(client: Client) -> None:
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPassword123",
    }
    assert (
        client.post(
            "/auth/register", payload, content_type="application/json"
        ).status_code
        == 201
    )
    duplicate = client.post("/auth/register", payload, content_type="application/json")
    assert duplicate.status_code == 400

    bad_login = client.post(
        "/auth/login",
        {"email": "duplicate@example.com", "password": "wrong-password"},
        content_type="application/json",
    )
    assert bad_login.status_code == 400


@pytest.mark.django_db
def test_payload_cannot_assign_admin_role(client: Client) -> None:
    response = client.post(
        "/auth/register",
        {
            "email": "customer2@example.com",
            "password": "StrongPassword123",
            "role": "ADMIN",
        },
        content_type="application/json",
    )
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "CUSTOMER"


@pytest.mark.django_db
def test_address_crud_is_user_owned(client: Client) -> None:
    first = client.post(
        "/auth/register",
        {"email": "address1@example.com", "password": "StrongPassword123"},
        content_type="application/json",
    )
    second = client.post(
        "/auth/register",
        {"email": "address2@example.com", "password": "StrongPassword123"},
        content_type="application/json",
    )
    first_token = first.json()["access"]
    second_token = second.json()["access"]

    created = client.post(
        "/addresses",
        {
            "receiver": "Nguyễn Văn A",
            "phone": "0900000000",
            "street": "123 Test",
            "area": {"city": "TP HCM"},
            "is_default": True,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {first_token}",
    )
    assert created.status_code == 201
    address_id = created.json()["id"]

    own = client.get(
        f"/addresses/{address_id}",
        HTTP_AUTHORIZATION=f"Bearer {first_token}",
    )
    assert own.status_code == 200

    foreign = client.get(
        f"/addresses/{address_id}",
        HTTP_AUTHORIZATION=f"Bearer {second_token}",
    )
    assert foreign.status_code == 404


@pytest.mark.django_db
def test_superuser_can_log_in_by_email_when_username_differs(client: Client) -> None:
    user = User.objects.create_superuser(
        username="local-admin",
        email="gym-admin@example.com",
        password="StrongPassword123",
        role=User.Role.ADMIN,
    )
    login = client.post(
        "/auth/login",
        {"email": "GYM-ADMIN@example.com", "password": "StrongPassword123"},
        content_type="application/json",
    )
    assert login.status_code == 200
    assert login.json()["user"]["id"] == str(user.pk)
    assert login.json()["user"]["role"] == User.Role.ADMIN
