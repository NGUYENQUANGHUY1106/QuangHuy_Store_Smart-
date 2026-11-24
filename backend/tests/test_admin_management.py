import pytest
from django.test import Client

from apps.identity.models import User
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_admin_users_crud_and_role_protection(client: Client) -> None:
    admin = User.objects.create_user(username="admin-crud", role=User.Role.ADMIN)
    customer = User.objects.create_user(username="customer-crud")
    headers = auth_headers(admin)
    url = "/admin/users"
    assert client.get(url).status_code == 401
    assert client.get(url, **auth_headers(customer)).status_code == 403
    response = client.post(
        url,
        {
            "email": "local@example.test",
            "password": "Local-Test-Password-92",
            "role": "ADMIN",
        },
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 201, response.json()
    assert response.json()["role"] == "CUSTOMER"
    assert "password" not in response.json()
    record = url + "/" + response.json()["id"]
    assert client.get(record, **headers).status_code == 200
    assert (
        client.patch(
            record, {"first_name": "Local"}, content_type="application/json", **headers
        ).json()["first_name"]
        == "Local"
    )
    assert client.delete(f"{url}/{admin.pk}", **headers).status_code == 404
    assert client.delete(record, **headers).status_code == 204
    assert client.get(record, **headers).json()["is_active"] is False


@pytest.mark.django_db
def test_admin_vouchers_crud_and_counter_protection(client: Client) -> None:
    admin = User.objects.create_user(username="voucher-admin", role=User.Role.ADMIN)
    customer = User.objects.create_user(username="voucher-customer")
    headers = auth_headers(admin)
    url = "/admin/vouchers"
    assert client.get(url, **auth_headers(customer)).status_code == 403
    payload = {
        "code": "local10",
        "name": "Local",
        "discount_type": "PERCENT",
        "value": 10,
        "max_discount": 10000,
        "start_date": "2026-11-23T00:00:00+07:00",
        "end_date": "2026-11-25T00:00:00+07:00",
        "usage_limit": 3,
        "used_count": 2,
    }
    assert (
        client.post(
            url,
            {**payload, "max_discount": None},
            content_type="application/json",
            **headers,
        ).status_code
        == 400
    )
    response = client.post(url, payload, content_type="application/json", **headers)
    assert response.status_code == 201, response.json()
    assert response.json()["code"] == "LOCAL10"
    assert response.json()["used_count"] == 0
    record = url + "/" + str(response.json()["id"])
    assert client.get(record, **headers).status_code == 200
    assert (
        client.patch(
            record, {"name": "Updated"}, content_type="application/json", **headers
        ).json()["name"]
        == "Updated"
    )
    assert client.delete(record, **headers).status_code == 204
    assert client.get(record, **headers).json()["is_active"] is False
