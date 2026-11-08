from datetime import date

from rest_framework import serializers

from accounts.models import User

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    assigned_doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="doctor"), required=False, allow_null=True,
    )
    assigned_doctor_name = serializers.CharField(
        source="assigned_doctor.username", read_only=True, allow_null=True,
    )

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "last_name", "date_of_birth", "gender", "phone", "email",
            "address", "assigned_doctor", "assigned_doctor_name",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
