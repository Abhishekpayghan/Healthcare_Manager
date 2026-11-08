import uuid

from django.conf import settings
from django.db import models

from patients.models import Patient


def upload_path(instance, filename):
    # random file name so nobody can guess the path of a patient's file
    return f"documents/{uuid.uuid4()}.pdf"


class Document(models.Model):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (PROCESSING, "Processing"),
        (COMPLETED, "Completed"),
        (FAILED, "Failed"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, blank=True)  # filled in by the AI
    file = models.FileField(upload_to=upload_path)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    extracted_text = models.TextField(blank=True)
    ai_result = models.JSONField(null=True, blank=True)
    error_message = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.name
