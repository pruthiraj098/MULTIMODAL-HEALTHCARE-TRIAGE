import unittest
from fastapi.testclient import TestClient
from api import app
from ai.medication_guidance import (
    check_drug_interactions,
    get_food_and_lifestyle_warnings,
    get_missed_dose_guidance,
    MEDICATION_EDUCATIONAL_DISCLAIMER
)

client = TestClient(app)


class TestMedicationGuidance(unittest.TestCase):

    def test_severe_drug_interaction_warfarin_aspirin(self):
        res = check_drug_interactions(["Warfarin 5mg", "Aspirin 81mg"])
        self.assertTrue(res["has_severe"])
        self.assertTrue(len(res["interactions"]) > 0)
        severe_int = next((i for i in res["interactions"] if i["severity"] == "Severe"), None)
        self.assertIsNotNone(severe_int)
        self.assertIn("bleeding", severe_int["clinical_effect"].lower())

    def test_severe_drug_interaction_sildenafil_nitrates(self):
        res = check_drug_interactions(["Sildenafil 50mg", "Nitroglycerin sublingual"])
        self.assertTrue(res["has_severe"])
        severe_int = next((i for i in res["interactions"] if i["severity"] == "Severe"), None)
        self.assertIsNotNone(severe_int)
        self.assertIn("hypotension", severe_int["clinical_effect"].lower())

    def test_moderate_drug_interaction_lisinopril_ibuprofen(self):
        res = check_drug_interactions(["Lisinopril 10mg", "Ibuprofen 400mg"])
        self.assertTrue(res["has_moderate"])
        mod_int = next((i for i in res["interactions"] if i["severity"] == "Moderate"), None)
        self.assertIsNotNone(mod_int)
        self.assertIn("nsaids", mod_int["clinical_effect"].lower())

    def test_safe_medication_pair(self):
        res = check_drug_interactions(["Amoxicillin 500mg", "Acetaminophen 500mg"])
        self.assertFalse(res["has_severe"])
        self.assertIn("disclaimer", res)

    def test_food_and_lifestyle_warnings(self):
        # Statin grapefruit warning
        warnings_statin = get_food_and_lifestyle_warnings(["Atorvastatin 20mg"])
        self.assertTrue(len(warnings_statin) > 0)
        self.assertIn("grapefruit", warnings_statin[0]["avoid"].lower())

        # Warfarin Vitamin K warning
        warnings_warfarin = get_food_and_lifestyle_warnings(["Warfarin 5mg"])
        self.assertTrue(len(warnings_warfarin) > 0)
        self.assertIn("vitamin k", warnings_warfarin[0]["avoid"].lower())

        # Metformin alcohol warning
        warnings_metformin = get_food_and_lifestyle_warnings(["Metformin 500mg"])
        self.assertTrue(len(warnings_metformin) > 0)
        self.assertIn("alcohol", warnings_metformin[0]["avoid"].lower())

    def test_missed_dose_guidance(self):
        guidance = get_missed_dose_guidance("Metformin")
        self.assertIn("medication", guidance)
        self.assertIn("never take a double dose", guidance["general_safe_protocol"].lower())
        self.assertIn("glucose", guidance["specific_guidance"].lower())

    def test_api_endpoints_require_authentication(self):
        # GET medications list
        r_list = client.get("/api/medications")
        self.assertEqual(r_list.status_code, 401)

        # POST create medication
        r_create = client.post("/api/medications", json={
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "Once daily"
        })
        self.assertEqual(r_create.status_code, 401)

        # GET schedule
        r_sched = client.get("/api/medications/schedule")
        self.assertEqual(r_sched.status_code, 401)

        # POST log dose
        r_log = client.post("/api/medications/log", json={
            "medication_id": 1,
            "scheduled_date": "2026-10-04",
            "time_of_day": "Morning",
            "status": "taken"
        })
        self.assertEqual(r_log.status_code, 401)

        # POST check interactions
        r_inter = client.post("/api/medications/check-interactions", json={
            "medications": ["Warfarin", "Aspirin"]
        })
        self.assertEqual(r_inter.status_code, 401)

        # POST missed dose
        r_missed = client.post("/api/medications/missed-dose", json={
            "medication_name": "Lisinopril"
        })
        self.assertEqual(r_missed.status_code, 401)

        # POST scan prescription
        r_scan = client.post("/api/medications/scan-prescription", json={
            "file_data": "dGVzdA=="
        })
        self.assertEqual(r_scan.status_code, 401)


if __name__ == "__main__":
    unittest.main()
