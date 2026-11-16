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
