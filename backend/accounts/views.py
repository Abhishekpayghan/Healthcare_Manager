from django.contrib.auth import authenticate
from django.db.models import Count, Max
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from audit.models import AuditLog
from audit.utils import log_action

from .models import User
from .permissions import IsAdmin
from .serializers import (
    AdminUserSerializer, DoctorSerializer, LoginSerializer, RegisterSerializer, UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]  # limits repeated login attempts
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response({"error": "Wrong username or password"}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        log_action(user, "login", "user", user.id)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class DoctorListView(generics.ListAPIView):
    """Used by the patient form to pick an assigned doctor."""
    serializer_class = DoctorSerializer
    queryset = User.objects.filter(role="doctor")


def users_with_counts():
    """All users, each with: patients they added, documents they uploaded, last activity."""
    return User.objects.annotate(
        patients_created=Count("created_patients", distinct=True),
        documents_uploaded=Count("document", distinct=True),
        last_activity=Max("auditlog__created_at"),
    )


class UserListView(generics.ListAPIView):
    """Admin only: every user with basic information."""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filter_backends = [SearchFilter]
    search_fields = ["username", "email"]  # ?search=

    def get_queryset(self):
        users = users_with_counts().order_by("-date_joined")
        role = self.request.query_params.get("role")  # ?role=doctor
        if role:
            users = users.filter(role=role)
        return users


class UserDetailView(APIView):
    """Admin only: one user, the patients they added and their recent activity."""
    permission_classes = [IsAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(users_with_counts(), id=user_id)

        patients = [
            {"id": p.id, "name": f"{p.first_name} {p.last_name}",
             "gender": p.gender, "created_at": p.created_at}
            for p in user.created_patients.all()
        ]
        # the audit log only holds ids, so no patient details leak through it
        activity = AuditLog.objects.filter(user=user).values(
            "action", "object_type", "object_id", "created_at",
        )[:50]

        return Response({
            "user": AdminUserSerializer(user).data,
            "patients": patients,
            "activity": list(activity),
        })
