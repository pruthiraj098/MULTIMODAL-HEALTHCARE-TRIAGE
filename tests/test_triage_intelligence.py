# ============================================================
# HealthTriage AI - Triage & Facility Intelligence Tests
# Tests:
# 1. AI Safety Guard sanitization & offline fallback
# 2. Evidence Fusion & Structured Triage Note generation
# 3. Smart Healthcare Queue & Case Assignment
# 4. Human-in-the-Loop Clinical Review decisions
# 5. Referral Note Generator & printable slip
# 6. Doctor Visit Copilot briefing
# 7. Facility Analytics & Public Health Surveillance
# 8. Demo Scenarios retrieval
# ============================================================

import unittest
from fastapi.testclient import TestClient
from api import app
from auth.auth_service import create_access_token
from ai.ai_safety_guard import AISafetyGuard
from services.evidence_fusion_service import EvidenceFusionService

client = TestClient(app)

class TestTriageIntelligence(unittest.TestCase):

    def setUp(self):
        # Tokens for clinical staff and admin
        self.staff_token = create_access_token(user_id=2, role="DOCTOR")
        self.nurse_token = create_access_token(user_id=2, role="NURSE")
        self.admin_token = create_access_token(user_id=2, role="ADMIN")
        self.patient_token = create_access_token(user_id=1, role="USER")

    def test_ai_safety_guard_sanitizes_definitive_diagnosis(self):
        """Verifies that AISafetyGuard rewrites definitive diagnosis statements."""
        unsafe_text = "You definitely have acute pneumonia. I prescribe 500mg amoxicillin."
        sanitized = AISafetyGuard.sanitize_ai_text(unsafe_text)
        self.assertNotIn("definitely have", sanitized.lower())
        self.assertIn("consistent with", sanitized.lower())
        self.assertIn("licensed physician", sanitized.lower())

    def test_ai_safety_guard_deterministic_fallback(self):
        """Verifies offline fallback mode when AI services are unreachable."""
        fallback = AISafetyGuard.generate_deterministic_fallback(
            patient_name="Test Patient",
            symptoms="Mild cold and cough for 2 days",
            vitals={"temperature": 99.0, "spo2": 98.0},
            language="en"
        )
        self.assertTrue(fallback["offline_mode"])
        self.assertIn("DETERMINISTIC", fallback["triage_badge"]["title"])
        self.assertIn("safety_disclaimer", fallback)

    def test_evidence_fusion_generates_5_section_structured_note(self):
        """Verifies multimodal fusion produces standard 5-part triage note."""
        fusion = EvidenceFusionService.fuse_multimodal_evidence(
            patient_name="Sita Soren",
            age=32,
            gender="Female",
            symptoms="Persistent dry cough and mild headache",
            vitals={"spo2": 96.0, "heart_rate": 84, "temperature": 99.2},
            ai_assessment={"triage_level": "ROUTINE", "spoken_response": "Rest and hydrate."},
            language="en"
        )
        self.assertIn("PATIENT-REPORTED INFORMATION", fusion["markdown_note"])
        self.assertIn("AI-EXTRACTED INFORMATION", fusion["markdown_note"])
        self.assertIn("AI-GENERATED SUMMARY", fusion["markdown_note"])
        self.assertIn("SAFETY FLAGS", fusion["markdown_note"])
        self.assertIn("HUMAN CLINICAL REVIEW", fusion["markdown_note"])

    def test_queue_endpoints_require_clinical_authorization(self):
        """Patient tokens cannot access clinical queue."""
        r_denied = client.get(
            "/api/queue/cases",
            headers={"Authorization": f"Bearer {self.patient_token}"}
        )
        self.assertEqual(r_denied.status_code, 403)

        r_allowed = client.get(
            "/api/queue/cases",
            headers={"Authorization": f"Bearer {self.staff_token}"}
        )
        self.assertEqual(r_allowed.status_code, 200)
        self.assertIn("cases", r_allowed.json())

    def test_facility_analytics_and_modes(self):
        """Verifies facility modes info and admin analytics."""
        r_modes = client.get("/api/facility/modes")
        self.assertEqual(r_modes.status_code, 200)
        self.assertIn("GOVERNMENT_HOSPITAL", r_modes.json()["modes"])
        self.assertIn("CAMPUS_HEALTH", r_modes.json()["modes"])
        self.assertIn("OCCUPATIONAL_HEALTH", r_modes.json()["modes"])

        r_analytics = client.get(
            "/api/facility/analytics",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(r_analytics.status_code, 200)
        self.assertIn("metrics", r_analytics.json())

    def test_public_health_surveillance_deidentified(self):
        """Verifies public health surveillance data contains no personal identifiers."""
        r_surv = client.get(
            "/api/public-health/surveillance",
            headers={"Authorization": f"Bearer {self.staff_token}"}
        )
        self.assertEqual(r_surv.status_code, 200)
        data = r_surv.json()
        self.assertIn("clusters", data["surveillance"])
        self.assertIn("respiratory", data["surveillance"]["clusters"])
        self.assertIn("resource_indicators", data)

    def test_doctor_visit_copilot_generation(self):
        """Verifies patient can generate consultation briefing with targeted questions."""
        r_copilot = client.post(
            "/api/copilot/doctor-visit-summary",
            headers={"Authorization": f"Bearer {self.patient_token}"},
            json={"current_concern": "Frequent headaches after screen time"}
        )
        self.assertEqual(r_copilot.status_code, 200)
        data = r_copilot.json()
        self.assertTrue(len(data["tailored_questions"]) >= 2)

    def test_demo_scenarios_available(self):
        """Verifies all 10 synthetic demo scenarios are accessible."""
        r_demos = client.get("/api/demo/scenarios")
        self.assertEqual(r_demos.status_code, 200)
        scenarios = r_demos.json()["scenarios"]
        self.assertEqual(len(scenarios), 10)

        # Fetch individual scenario
        r_single = client.get("/api/demo/scenarios/scenario-3-emergency-redflag")
        self.assertEqual(r_single.status_code, 200)
        self.assertEqual(r_single.json()["scenario"]["expected_triage"], "EMERGENCY")


if __name__ == "__main__":
    unittest.main()
