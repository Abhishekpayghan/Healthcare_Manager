from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=50)       # e.g. "patient_updated"
    object_type = models.CharField(max_length=50)  # e.g. "patient"
    object_id = models.IntegerField(null=True)     # only the id, no patient details
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} {self.action} {self.object_type} {self.object_id}"
