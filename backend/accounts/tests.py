from rest_framework.test import APITestCase

from audit.utils import log_action
from patients.models import Patient

from .models import User

PASSWORD = "Strongpass#123"


class AuthTests(APITestCase):
    def test_register_doctor(self):
        data = {"username": "drsmith", "email": "d@example.com", "password": PASSWORD, "role": "doctor"}
        response = self.client.post("/api/auth/register/", data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.get(username="drsmith").role, "doctor")
        self.assertNotIn("password", response.data)

    def test_cannot_register_as_admin(self):
        data = {"username": "sneaky", "email": "s@example.com", "password": PASSWORD, "role": "admin"}
        response = self.client.post("/api/auth/register/", data)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="sneaky").exists())

    def test_weak_password_rejected(self):
        data = {"username": "weak", "email": "w@example.com", "password": "123", "role": "staff"}
        response = self.client.post("/api/auth/register/", data)
        self.assertEqual(response.status_code, 400)

    def test_login_returns_token(self):
        User.objects.create_user(username="nurse", password=PASSWORD, role="staff")
        response = self.client.post("/api/auth/login/", {"username": "nurse", "password": PASSWORD})
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

    def test_login_wrong_password(self):
        User.objects.create_user(username="nurse", password=PASSWORD, role="staff")
        response = self.client.post("/api/auth/login/", {"username": "nurse", "password": "wrong"})
        self.assertEqual(response.status_code, 401)

    def test_me_needs_login(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)


class AdminUserTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin1", password=PASSWORD, role="admin", email="a@x.com")
        self.staff = User.objects.create_user(username="staff1", password=PASSWORD, role="staff", email="s@x.com")
        self.doctor = User.objects.create_user(username="doc1", password=PASSWORD, role="doctor", email="d@x.com")
        self.patient = Patient.objects.create(
            first_name="Asha", last_name="Rao", date_of_birth="1990-05-01",
            gender="female", created_by=self.staff,
        )
        log_action(self.staff, "patient_created", "patient", self.patient.id)

    def test_admin_lists_users_with_counts(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/auth/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)
        staff_row = [u for u in response.data if u["username"] == "staff1"][0]
        self.assertEqual(staff_row["patients_created"], 1)
        self.assertIsNotNone(staff_row["last_activity"])
        self.assertNotIn("password", staff_row)

    def test_staff_and_doctor_cannot_list_users(self):
        for user in (self.staff, self.doctor):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get("/api/auth/users/").status_code, 403)

    def test_not_logged_in_cannot_list_users(self):
        self.assertEqual(self.client.get("/api/auth/users/").status_code, 401)

    def test_admin_sees_patients_and_activity_of_a_user(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(f"/api/auth/users/{self.staff.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["username"], "staff1")
        self.assertEqual(response.data["patients"][0]["name"], "Asha Rao")
        self.assertEqual(response.data["activity"][0]["action"], "patient_created")

    def test_non_admin_cannot_open_user_detail(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get(f"/api/auth/users/{self.doctor.id}/").status_code, 403)

    def test_unknown_user_gives_404(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/auth/users/9999/").status_code, 404)

    def test_filter_by_role_and_search(self):
        self.client.force_authenticate(self.admin)
        doctors = self.client.get("/api/auth/users/?role=doctor")
        self.assertEqual([u["username"] for u in doctors.data], ["doc1"])
        found = self.client.get("/api/auth/users/?search=staff")
        self.assertEqual([u["username"] for u in found.data], ["staff1"])
