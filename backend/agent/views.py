import logging

from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .serializers import AgentRequestSerializer
from .services import run_agent

logger = logging.getLogger(__name__)


class AgentThrottle(UserRateThrottle):
    scope = "agent"
    rate = "20/min"  # every question costs an AI call, so we limit them


class AgentChatView(APIView):
    throttle_classes = [AgentThrottle]

    def post(self, request):
        serializer = AgentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            answer, tools_used = run_agent(
                request.user,
                serializer.validated_data["message"],
                serializer.validated_data.get("history", []),
            )
        except Exception as error:
            logger.error("Agent failed: %s", type(error).__name__)
            return Response(
                {"error": "The assistant is not available right now. Please try again later."},
                status=503,
            )

        return Response({"answer": answer, "tools_used": tools_used})
