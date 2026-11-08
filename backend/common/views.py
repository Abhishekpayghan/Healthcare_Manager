from rest_framework.decorators import api_view
from rest_framework.response import Response

from documents.models import Document
from patients.access import visible_patients


@api_view(["GET"])
def dashboard(request):
    """Numbers for the dashboard. Only counts what this user is allowed to see."""
    patients = visible_patients(request.user)
    documents = Document.objects.filter(patient__in=patients)

    by_status = {}
    for status, _label in Document.STATUS_CHOICES:
        by_status[status] = documents.filter(status=status).count()

    return Response({
        "total_patients": patients.count(),
        "total_documents": documents.count(),
        "documents_by_status": by_status,
    })
