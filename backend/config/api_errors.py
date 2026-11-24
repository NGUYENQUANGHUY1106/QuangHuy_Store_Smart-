import logging
from typing import Any
from uuid import uuid4

from rest_framework.response import Response
from rest_framework.views import exception_handler, set_rollback

logger = logging.getLogger(__name__)


def handle_api_error(exc: Exception, context: dict[str, Any]) -> Response:
    response = exception_handler(exc, context)
    if response is not None:
        return response
    set_rollback()
    reference = str(uuid4())
    logger.error(
        "Unhandled API error reference=%s exception_type=%s",
        reference,
        type(exc).__name__,
    )
    return Response(
        {
            "error": {
                "code": "internal_error",
                "message": "Máy chủ gặp lỗi. Vui lòng thử lại.",
                "reference": reference,
            }
        },
        status=500,
    )
