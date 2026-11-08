import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

MESSAGES = {
    400: "Invalid input",
    401: "Authentication required",
    403: "Permission denied",
    404: "Not found",
}


def custom_exception_handler(exc, context):
    """Every error leaves the API in the same shape: {"error": ..., "details": ...}"""
    response = exception_handler(exc, context)

    if response is None:
        # Something we did not expect. Log only the error type, send a generic message.
        logger.error("Unhandled error in %s: %s", context["view"].__class__.__name__, type(exc).__name__)
        return Response({"error": "Something went wrong on the server."}, status=500)

    response.data = {
        "error": MESSAGES.get(response.status_code, "Request failed"),
        "details": response.data,
    }
    return response
