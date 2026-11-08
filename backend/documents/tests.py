import json
import tempfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User
from audit.models import AuditLog
from patients.models import Patient

from . import services
from .models import Document
from .services import AIResponseError, process_document, validate_ai_response

TEMP_MEDIA = tempfile.mkdtemp()

GOOD_AI_ANSWER = json.dumps({
    "document_type": "lab report",
    "summary": "Blood test report.",
    "test_results": [{"name": "Hemoglobin", "value": "13.5", "unit": "g/dL", "date": "2025-01-10"}],
})


def pdf_file(name="report.pdf", content=b"%PDF-1.4 fake"):
    return SimpleUploadedFile(name, content, content_type="application/pdf")


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class DocumentUploadTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="staff1", password="x", role="staff")
        self.other_staff = User.objects.create_user(username="staff2", password="x", role="staff")
        self.patient = Patient.objects.create(
            first_name="Asha", last_name="Rao", date_of_birth="1990-05-01",
            gender="female", created_by=self.staff,
        )
        self.client.force_authenticate(self.staff)

    def upload(self, file, patient=None):
        data = {"patient": (patient or self.patient).id, "file": file}
        return self.client.post("/api/documents/", data, format="multipart")

    @patch("documents.views.start_processing")
    def test_upload_pdf(self, mock_start):
        response = self.upload(pdf_file())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["name"], "report.pdf")
        mock_start.assert_called_once()
        self.assertTrue(AuditLog.objects.filter(action="document_uploaded").exists())

    @patch("documents.views.start_processing")
    def test_reject_wrong_extension(self, mock_start):
        response = self.upload(SimpleUploadedFile("notes.txt", b"hello"))
        self.assertEqual(response.status_code, 400)
        mock_start.assert_not_called()

    @patch("documents.views.start_processing")
    def test_reject_fake_pdf(self, mock_start):
        response = self.upload(pdf_file(content=b"this is not a pdf"))
        self.assertEqual(response.status_code, 400)

    @patch("documents.views.start_processing")
    def test_reject_big_file(self, mock_start):
        big = pdf_file(content=b"%PDF-" + b"0" * (5 * 1024 * 1024 + 1))
        response = self.upload(big)
        self.assertEqual(response.status_code, 400)

    @patch("documents.views.start_processing")
    def test_cannot_upload_for_someone_elses_patient(self, mock_start):
        self.client.force_authenticate(self.other_staff)
        response = self.upload(pdf_file())
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Document.objects.count(), 0)

    @patch("documents.views.start_processing")
    def test_cannot_see_documents_of_unauthorized_patients(self, mock_start):
        self.upload(pdf_file())
        self.client.force_authenticate(self.other_staff)
        response = self.client.get("/api/documents/")
        self.assertEqual(len(response.data), 0)

    def test_needs_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/documents/").status_code, 401)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ProcessingTests(APITestCase):
    def setUp(self):
        user = User.objects.create_user(username="staff1", password="x", role="staff")
        patient = Patient.objects.create(
            first_name="Asha", last_name="Rao", date_of_birth="1990-05-01",
            gender="female", created_by=user,
        )
        self.document = Document.objects.create(
            patient=patient, name="report.pdf", file=pdf_file(), uploaded_by=user,
        )

    def run_processing(self, text="Hemoglobin 13.5 g/dL", ai_answer=GOOD_AI_ANSWER, ai_error=None):
        with patch.object(services, "extract_text", return_value=text), \
                patch.object(services, "call_gemini", return_value=ai_answer, side_effect=ai_error):
            process_document(self.document.id)
        self.document.refresh_from_db()

    def test_success(self):
        self.run_processing()
        self.assertEqual(self.document.status, "completed")
        self.assertEqual(self.document.document_type, "lab report")
        self.assertEqual(self.document.ai_result["test_results"][0]["name"], "Hemoglobin")

    def test_malformed_ai_answer_marks_failed(self):
        self.run_processing(ai_answer="not json at all")
        self.assertEqual(self.document.status, "failed")
        self.assertTrue(self.document.error_message)
        self.assertIsNone(self.document.ai_result)

    def test_ai_api_failure_marks_failed(self):
        self.run_processing(ai_error=Exception("network down"))
        self.assertEqual(self.document.status, "failed")
        self.assertNotIn("network down", self.document.error_message)

    def test_pdf_without_text_marks_failed(self):
        self.run_processing(text="")
        self.assertEqual(self.document.status, "failed")


class ValidateAIResponseTests(APITestCase):
    def test_missing_fields_become_none(self):
        raw = json.dumps({"document_type": "lab report", "summary": "ok",
                          "test_results": [{"name": "Glucose"}]})
        result = validate_ai_response(raw)
        self.assertEqual(result["test_results"][0],
                         {"name": "Glucose", "value": None, "unit": None, "date": None})

    def test_missing_test_results_is_empty_list(self):
        result = validate_ai_response(json.dumps({"document_type": "prescription", "summary": "ok"}))
        self.assertEqual(result["test_results"], [])

    def test_unknown_type_becomes_other(self):
        result = validate_ai_response(json.dumps({"document_type": "poem", "summary": "ok"}))
        self.assertEqual(result["document_type"], "other")

    def test_missing_summary_rejected(self):
        with self.assertRaises(AIResponseError):
            validate_ai_response(json.dumps({"document_type": "lab report"}))

    def test_result_without_name_rejected(self):
        raw = json.dumps({"summary": "ok", "test_results": [{"value": "5"}]})
        with self.assertRaises(AIResponseError):
            validate_ai_response(raw)

    def test_not_json_rejected(self):
        with self.assertRaises(AIResponseError):
            validate_ai_response("hello")
