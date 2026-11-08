from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Admins are not allowed to sign themselves up
    role = serializers.ChoiceField(choices=[("doctor", "Doctor"), ("staff", "Staff")])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]
        extra_kwargs = {"email": {"required": True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class AdminUserSerializer(serializers.ModelSerializer):
    """Used only on the admin pages. The counts are added by users_with_counts()."""
    patients_created = serializers.IntegerField(read_only=True)
    documents_uploaded = serializers.IntegerField(read_only=True)
    last_activity = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "is_active", "date_joined", "last_login",
            "patients_created", "documents_uploaded", "last_activity",
        ]
