from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ADMIN = "admin"
    DOCTOR = "doctor"
    STAFF = "staff"
    ROLE_CHOICES = [(ADMIN, "Admin"), (DOCTOR, "Doctor"), (STAFF, "Staff")]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STAFF)

    def save(self, *args, **kwargs):
        # accounts made with "createsuperuser" are always admins
        if self.is_superuser:
            self.role = self.ADMIN
        super().save(*args, **kwargs)
