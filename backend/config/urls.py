from django.contrib import admin
from django.urls import include, path

from common.views import dashboard

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/patients/", include("patients.urls")),
    path("api/documents/", include("documents.urls")),
    path("api/dashboard/", dashboard),
    path("api/agent/", include("agent.urls")),
]
