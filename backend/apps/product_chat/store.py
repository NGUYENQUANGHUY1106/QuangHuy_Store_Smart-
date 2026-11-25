from dataclasses import dataclass, field
from time import monotonic
from typing import Any


@dataclass
class Conversation:
    customer: dict[str, str]
    messages: dict[str, dict[str, Any]] = field(default_factory=dict)


# One ASGI process owns the local demo. Nothing in this module writes to disk.
conversations: dict[str, Conversation] = {}
online: dict[str, int] = {}
rate: dict[str, tuple[float, int]] = {}


def allow_send(user_id: str) -> bool:
    now = monotonic()
    started, count = rate.get(user_id, (now, 0))
    if now - started >= 10:
        started, count = now, 0
    if count >= 8:
        return False
    rate[user_id] = (started, count + 1)
    return True
