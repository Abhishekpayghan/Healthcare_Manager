from rest_framework.test import APITestCase

from accounts.models import User
from audit.models import AuditLog

from .models import Patient


def make_user(username, role):
    return User.objects.create_user(username=username, password="Strongpass#123", role=role)


def make_patient(created_by, **extra):
    data = {"first_name": "Asha", "last_name": "Rao", "date_of_birth": "1990-05-01", "gender": "female"}
    data.update(extra)
    return Patient.objects.create(created_by=created_by, **data)


class PatientTests(APITestCase):
    def setUp(self):
        self.staff = make_user("staff1", "staff")
        self.other_staff = make_user("staff2", "staff")
        self.doctor = make_user("doc1", "doctor")
        self.other_doctor = make_user("doc2", "doctor")
        self.admin = make_user("admin1", "admin")

    def test_needs_login(self):
        response = self.client.get("/api/patients/")
        self.assertEqual(response.status_code, 401)

    def test_create_patient_writes_audit_log(self):
        self.client.force_authenticate(self.staff)
        data = {"first_name": "Ravi", "last_name": "Kumar", "date_of_birth": "1985-01-10", "gender": "male"}
        response = self.client.post("/api/patients/", data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_by"], self.staff.id)
        self.assertTrue(AuditLog.objects.filter(action="patient_created", user=self.staff).exists())

    def test_invalid_input_rejected(self):
        self.client.force_authenticate(self.staff)
        data = {"first_name": "Ravi", "date_of_birth": "2999-01-01", "gender": "robot"}
        response = self.client.post("/api/patients/", data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("last_name", response.data["details"])
        self.assertIn("date_of_birth", response.data["details"])
        self.assertIn("gender", response.data["details"])

    def test_staff_sees_only_own_patients(self):
        make_patient(self.staff)
        make_patient(self.other_staff, first_name="Other")
        self.client.force_authenticate(self.staff)
        response = self.client.get("/api/patients/")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["first_name"], "Asha")

    def test_staff_cannot_open_someone_elses_patient(self):
        patient = make_patient(self.other_staff)
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"/api/patients/{patient.id}/")
        self.assertEqual(response.status_code, 404)

    def test_doctor_sees_assigned_patients_only(self):
        patient = make_patient(self.staff, assigned_doctor=self.doctor)
        self.client.force_authenticate(self.doctor)
        self.assertEqual(len(self.client.get("/api/patients/").data), 1)
        self.client.force_authenticate(self.other_doctor)
        self.assertEqual(len(self.client.get("/api/patients/").data), 0)
        self.assertEqual(self.client.get(f"/api/patients/{patient.id}/").status_code, 404)

    def test_admin_sees_everything(self):
        make_patient(self.staff)
        make_patient(self.other_staff)
        self.client.force_authenticate(self.admin)
        self.assertEqual(len(self.client.get("/api/patients/").data), 2)

    def test_update_writes_audit_log(self):
        patient = make_patient(self.staff)
        self.client.force_authenticate(self.staff)
        response = self.client.patch(f"/api/patients/{patient.id}/", {"phone": "9999999999"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(AuditLog.objects.filter(action="patient_updated", object_id=patient.id).exists())

    def test_only_admin_can_delete(self):
        patient = make_patient(self.staff)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.delete(f"/api/patients/{patient.id}/").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/patients/{patient.id}/").status_code, 204)
        self.assertFalse(Patient.objects.filter(id=patient.id).exists())

    def test_search_and_filter(self):
        make_patient(self.staff, first_name="Asha", gender="female")
        make_patient(self.staff, first_name="Ravi", gender="male")
        self.client.force_authenticate(self.staff)
        found = self.client.get("/api/patients/?search=rav")
        self.assertEqual([p["first_name"] for p in found.data], ["Ravi"])
        filtered = self.client.get("/api/patients/?gender=female")
        self.assertEqual([p["first_name"] for p in filtered.data], ["Asha"])
