# ============================================================
# HealthTriage AI - Phase 8 SANA Unified Integration Tests
# Verifies SANA as central intelligence hub across all platform pillars
# ============================================================

import unittest
from fastapi.testclient import TestClient
from api import app
from ai.sana_agent import (
    build_sana_prompt,
    check_patient_medication_context,
    extract_vitals_from_speech,
    parse_sana_model_response
)

client = TestClient(app)


class TestSanaPhase8Integration(unittest.TestCase):

    def test_sana_config(self):
        """Verifies SANA metadata and 4 primary languages."""
        r = client.get("/api/sana/config")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["agent"]["name"], "SANA")
        lang_codes = [l["code"] for l in data["languages"]]
        for code in ["en", "hi", "or", "bn"]:
            self.assertIn(code, lang_codes)

    def test_tts_generation(self):
        """Verifies SANA TTS generation returns audio or browser fallback."""
        r = client.post("/api/sana/tts", json={"text": "Hello, I am SANA.", "language": "en"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("fallback_to_browser", data)

    def test_sana_emergency_and_trauma_locator(self):
        """
        Emergency signal triggers deterministic safety override AND
        automatically attaches nearest 24x7 trauma hospital (Phase 7 integration).
        """
        r = client.post("/api/sana/chat", json={
            "user_message": "Crushing chest pain radiating to left arm, oxygen is 86",
            "language": "en",
            "generate_audio": False,
            "city": "Bhubaneswar"
        })
        self.assertEqual(r.status_code, 200)
        res = r.json()

        # Emergency validation
        self.assertEqual(res["triage_level"], "EMERGENCY")
        self.assertTrue(res["is_emergency"])
        self.assertEqual(res["extracted_vitals"].get("spo2"), 86.0)

        # Phase 7 Trauma Center routing validation
        self.assertIsNotNone(res.get("nearest_emergency_facility"))
        hospital = res["nearest_emergency_facility"]
        self.assertIn("name", hospital)
        self.assertIn("phone", hospital)
        self.assertIn("distance_km", hospital)
        self.assertIn("directions_url", hospital)
        self.assertTrue(hospital.get("is_24x7", False))

        # Emergency Contacts validation
        contacts = res.get("emergency_contacts", [])
        self.assertTrue(any("108" in c.get("number", "") or "112" in c.get("number", "") for c in contacts))

    def test_sana_self_care_attachment(self):
        """
        Mild self-care complaints automatically attach evidence-based remedies (Phase 6 integration).
        """
        r = client.post("/api/sana/chat", json={
            "user_message": "I have a mild tickle in my throat and dry cough since yesterday, no fever",
            "language": "en",
            "generate_audio": False,
            "patient_age": 30
        })
        self.assertEqual(r.status_code, 200)
        res = r.json()

        # If triaged as self-care, evidence-based guidance should be attached
        if res.get("triage_level") == "SELF_CARE":
            self.assertIsNotNone(res.get("self_care_guidance"))
            guidance = res["self_care_guidance"]
            self.assertIn("remedies", guidance)
            self.assertGreater(len(guidance["remedies"]), 0)
            self.assertIn("disclaimer", guidance)

    def test_sana_medication_drug_interaction_check(self):
        """
        Verifies that SANA detects drug-drug interactions when active patient medications
        conflict with newly mentioned substances (e.g. Warfarin + Ibuprofen) (Phase 5 integration).
        """
        active_meds = [
            {"name": "Warfarin", "dosage": "5mg", "frequency": "Once daily at bedtime"},
            {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily with meals"}
        ]

        user_query = "Can I take ibuprofen or Advil for my joint ache?"
        cautions = check_patient_medication_context(
            user_message=user_query,
            active_medications=active_meds
        )

        self.assertGreater(len(cautions), 0)
        has_warfarin_nsaid_alert = any(
            "warfarin" in c["title"].lower() and "ibuprofen" in c["title"].lower()
            for c in cautions
        )
        self.assertTrue(has_warfarin_nsaid_alert)
        first_alert = cautions[0]
        self.assertIn("recommendation", first_alert)
        self.assertIn("severity", first_alert)

    def test_sana_medication_food_warning(self):
        """
        Verifies that SANA detects food-drug warnings (e.g. Atorvastatin + Grapefruit).
        """
        active_meds = [{"name": "Atorvastatin", "dosage": "20mg", "frequency": "Nightly"}]
        user_query = "I drank a large glass of grapefruit juice this morning, is that fine?"

        cautions = check_patient_medication_context(
            user_message=user_query,
            active_medications=active_meds
        )

        self.assertGreater(len(cautions), 0)
        has_grapefruit_caution = any(
            "grapefruit" in c["title"].lower() for c in cautions
        )
        self.assertTrue(has_grapefruit_caution)

    def test_build_sana_prompt_with_patient_profile(self):
        """
        Verifies that the longitudinal profile (vitals, risk, meds, reports) is properly
        formatted into the Gemini clinical context prompt.
        """
        profile = {
            "active_medications": [{"name": "Lisinopril", "dosage": "10mg", "frequency": "Daily"}],
            "risk_assessment": {
                "health_risk_score": 64,
                "risk_category": "MODERATE",
                "risk_drivers": ["Pre-hypertension", "Elevated LDL"]
            },
            "recent_reports": [{"report_type": "Lipid Panel", "summary": "Borderline high cholesterol"}],
            "wellness_status": "Energy: 7/10, Stress: 4/10",
            "baseline_vitals": {"blood_pressure_systolic": 138, "blood_pressure_diastolic": 88}
        }

        prompt = build_sana_prompt(
            user_message="I feel slightly lightheaded today",
            language="en",
            user_name="John Doe",
            patient_profile=profile
        )

        self.assertIn("John Doe", prompt)
        self.assertIn("Lisinopril", prompt)
        self.assertIn("AI Health Risk Score: 64/100", prompt)
        self.assertIn("Lipid Panel", prompt)
        self.assertIn("LONGITUDINAL PATIENT PROFILE & HEALTH HISTORY", prompt)


if __name__ == "__main__":
    unittest.main()
