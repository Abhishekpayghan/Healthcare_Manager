from rest_framework import mixins, viewsets

from audit.utils import log_action
from patients.access import visible_patients

from .models import Document
from .serializers import DocumentSerializer
from .services import start_processing


class DocumentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin,
                      mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        # only documents of patients this user can see
        documents = Document.objects.filter(patient__in=visible_patients(self.request.user))

        # filters: ?patient=1&status=completed
        patient = self.request.query_params.get("patient")
        if patient:
            documents = documents.filter(patient_id=patient)
        status = self.request.query_params.get("status")
        if status:
            documents = documents.filter(status=status)
        return documents

    def perform_create(self, serializer):
        document = serializer.save(uploaded_by=self.request.user)
        log_action(self.request.user, "document_uploaded", "document", document.id)
        start_processing(document.id)  # runs in the background
