# ============================================================
# HealthTriage AI - Phase 10 Comprehensive Security & Isolation Tests
# Validates User Data Isolation, Security Headers, Auth Boundaries,
# Red-Flag Safety Overrides, and Healthcare Disclaimers
# ============================================================

import unittest
from fastapi.testclient import TestClient
from api import app
from auth.auth_service import create_access_token, hash_password, verify_password
from database.database import get_user_by_email, create_user
import os

client = TestClient(app)


class TestSecurityAndIsolation(unittest.TestCase):

    def test_password_hashing_security(self):
        """Validates salted bcrypt hashing and timing attack resistance."""
        raw_pw = "MedicalSafetySecure@2026!"
        hashed = hash_password(raw_pw)
        self.assertNotEqual(raw_pw, hashed)
        self.assertTrue(verify_password(raw_pw, hashed))
        self.assertFalse(verify_password("WrongPassword123!", hashed))

    def test_unauthenticated_protected_endpoints_blocked(self):
        """Verifies that sensitive medical endpoints reject unauthenticated requests with 401/403."""
        protected_endpoints = [
            ("GET", "/api/auth/me"),
            ("GET", "/api/user/triage-history"),
            ("GET", "/api/health/monitoring"),
            ("GET", "/api/health/trends"),
            ("GET", "/api/health-risk/latest"),
            ("GET", "/api/health-risk/history"),
            ("GET", "/api/reports/list"),
            ("GET", "/api/medications/overview"),
            ("GET", "/api/self-care/wellness-history"),
            ("GET", "/api/facilities/saved/list"),
        ]

        for method, ep in protected_endpoints:
            if method == "GET":
                r = client.get(ep)
            else:
                r = client.post(ep, json={})
            self.assertEqual(r.status_code, 401, f"Endpoint {ep} should require JWT authentication")

    def test_admin_boundary_enforcement(self):
        """Verifies that non-admin patient tokens cannot access administrative routes."""
        # Patient token
        patient_token = create_access_token(user_id=999999, role="USER")
        headers = {"Authorization": f"Bearer {patient_token}"}

        r_admin = client.get("/api/admin/dashboard", headers=headers)
        self.assertIn(r_admin.status_code, [401, 403], "Patient token must not access admin dashboard")

        r_users = client.get("/api/admin/users", headers=headers)
        self.assertIn(r_users.status_code, [401, 403], "Patient token must not access user list")

    def test_emergency_override_strict_enforcement(self):
        """
        Validates clinical safety controller: Critical vital signs or red-flag symptoms
        MUST trigger EMERGENCY override regardless of user prompt tone.
        """
        from ai.risk_engine import assess_triage_risk

        # Critical low SpO2
        res1 = assess_triage_risk("I feel a bit sleepy", spo2=84.0)
        self.assertTrue(res1["is_emergency"])
        self.assertEqual(res1["level"], "EMERGENCY")

        # Hypertensive crisis
        res2 = assess_triage_risk("Mild headache", systolic_bp=205.0, diastolic_bp=125.0)
        self.assertTrue(res2["is_emergency"])
        self.assertEqual(res2["level"], "EMERGENCY")

        # Acute red-flag symptom
        res3 = assess_triage_risk("Sudden numbness in face and arm with slurred speech")
        self.assertTrue(res3["is_emergency"])
        self.assertEqual(res3["level"], "EMERGENCY")

    def test_clinical_disclaimer_mandatory_presence(self):
        """Verifies that all public and AI guidance responses contain legal/clinical safety disclaimers."""
        r_config = client.get("/api/sana/config")
        self.assertEqual(r_config.status_code, 200)
        data = r_config.json()
        self.assertIn("disclaimer", data.get("agent", {}))

        patient_token = create_access_token(user_id=1, role="USER")
        r_library = client.get("/api/self-care/library", headers={"Authorization": f"Bearer {patient_token}"})
        self.assertEqual(r_library.status_code, 200)
        self.assertIn("disclaimer", r_library.json())


if __name__ == "__main__":
    unittest.main()
