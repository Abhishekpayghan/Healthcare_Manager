from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from patients.access import visible_patients

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id", "patient", "name", "document_type", "file",
            "uploaded_by", "uploaded_at", "status", "ai_result", "error_message",
        ]
        read_only_fields = [
            "document_type", "uploaded_by", "uploaded_at", "status", "ai_result", "error_message",
        ]
        extra_kwargs = {"file": {"write_only": True}, "name": {"required": False}}

    def validate_patient(self, patient):
        user = self.context["request"].user
        if not visible_patients(user).filter(id=patient.id).exists():
            raise PermissionDenied("You do not have access to this patient.")
        return patient

    def validate_file(self, file):
        if not file.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are allowed.")
        if file.size > settings.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("File is too large. The maximum size is 5 MB.")
        # a real PDF always starts with these bytes
        if file.read(5) != b"%PDF-":
            raise serializers.ValidationError("This file is not a valid PDF.")
        file.seek(0)
        return file

    def validate(self, attrs):
        if not attrs.get("name"):
            attrs["name"] = attrs["file"].name
        return attrs
