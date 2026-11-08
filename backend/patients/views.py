from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin
from audit.utils import log_action

from .access import visible_patients
from .serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["first_name", "last_name", "phone", "email"]  # ?search=
    ordering_fields = ["first_name", "last_name", "created_at"]    # ?ordering=

    def get_queryset(self):
        # start from the patients this user is allowed to see
        patients = visible_patients(self.request.user)

        # simple filters: ?gender=female&assigned_doctor=3
        gender = self.request.query_params.get("gender")
        if gender:
            patients = patients.filter(gender=gender)
        doctor = self.request.query_params.get("assigned_doctor")
        if doctor:
            patients = patients.filter(assigned_doctor_id=doctor)
        return patients

    def get_permissions(self):
        # only admins may delete records
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        log_action(self.request.user, "patient_created", "patient", patient.id)

    def perform_update(self, serializer):
        patient = serializer.save()
        log_action(self.request.user, "patient_updated", "patient", patient.id)

    def perform_destroy(self, instance):
        patient_id = instance.id
        instance.delete()
        log_action(self.request.user, "patient_deleted", "patient", patient_id)
