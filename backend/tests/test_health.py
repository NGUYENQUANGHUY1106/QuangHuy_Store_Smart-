from unittest.mock import patch

import pytest
from django.db import OperationalError, connection
from django.test import Client


@pytest.mark.django_db
def test_health_queries_postgresql(client: Client) -> None:
    assert connection.vendor == "postgresql"
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response["Cache-Control"] == "no-store"


def test_health_database_failure_is_safe(client: Client) -> None:
    with patch(
        "config.views.connection.cursor", side_effect=OperationalError("private")
    ):
        response = client.get("/health")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
    assert b"private" not in response.content


def test_health_rejects_post(client: Client) -> None:
    assert client.post("/health").status_code == 405


def test_cors_denies_unlisted_origin(client: Client) -> None:
    response = client.options("/health", HTTP_ORIGIN="https://untrusted.example")
    assert "Access-Control-Allow-Origin" not in response
