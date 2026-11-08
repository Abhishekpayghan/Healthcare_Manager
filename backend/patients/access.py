from django.db.models import Q

from .models import Patient


def visible_patients(user):
    """The one place that decides which patients a user may see.

    Admin  -> everyone
    Doctor -> patients assigned to them or created by them
    Staff  -> patients they created
    """
    if user.role == "admin":
        return Patient.objects.all()
    if user.role == "doctor":
        return Patient.objects.filter(Q(assigned_doctor=user) | Q(created_by=user))
    return Patient.objects.filter(created_by=user)
