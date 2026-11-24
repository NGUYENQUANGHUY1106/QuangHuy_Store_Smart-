import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize("missing", ["POSTGRES_DB", "DJANGO_SECRET_KEY"])
def test_missing_required_configuration_fails_without_sqlite(missing: str) -> None:
    env = os.environ.copy()
    env["PYTHON_DOTENV_DISABLED"] = "1"
    env.pop(missing, None)
    result = subprocess.run(
        [sys.executable, "manage.py", "check"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode != 0
    assert f"Missing required environment variable: {missing}" in result.stderr


def test_debug_off_rejects_weak_signing_secret() -> None:
    env = {
        **os.environ,
        "DJANGO_DEBUG": "false",
        "DJANGO_ALLOWED_HOSTS": "127.0.0.1",
        "DJANGO_SECRET_KEY": "weak-test-key",
    }
    result = subprocess.run(
        [sys.executable, "manage.py", "check"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode != 0
    assert "Non-debug settings require a strong key" in result.stderr
    assert "weak-test-key" not in result.stderr
