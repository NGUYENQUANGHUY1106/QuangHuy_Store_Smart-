from django.db import DatabaseError, connection
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request: Request) -> Response:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            healthy = cursor.fetchone() == (1,)
    except DatabaseError:
        healthy = False
    response = Response(
        {"status": "ok" if healthy else "unavailable"},
        status=200 if healthy else 503,
    )
    response["Cache-Control"] = "no-store"
    return response
