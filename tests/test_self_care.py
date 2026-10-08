# ============================================================
# HealthTriage AI - Test Suite for Natural & Self-Care Guidance
# Phase 6 Verification
# ============================================================

import unittest
from unittest.mock import patch, MagicMock
from ai.self_care_guidance import (
    evaluate_symptom_safety,
    find_matching_remedy_category,
    get_evidence_based_remedies,
    analyze_wellness_trends,
    detect_emergency_red_flags,
    SELF_CARE_DISCLAIMER
)
from services.self_care_service import (
    get_remedies_for_patient,
    record_patient_wellness_checkin,
    get_patient_wellness_history
)


class TestSelfCareGuidanceEngine(unittest.TestCase):

    def test_detect_emergency_red_flags(self):
        """Emergency patterns like chest pain, dyspnea, thunderclap headache are detected."""
        self.assertTrue(len(detect_emergency_red_flags("I feel severe chest pain and arm numbness")) > 0)
        self.assertTrue(len(detect_emergency_red_flags("Having shortness of breath")) > 0)
        self.assertTrue(len(detect_emergency_red_flags("Worst headache of my life, sudden onset")) > 0)
        self.assertTrue(len(detect_emergency_red_flags("Coughing up blood")) > 0)
        self.assertEqual(len(detect_emergency_red_flags("Mild throat tickle and runny nose")), 0)

    def test_evaluate_symptom_safety_safe(self):
        """Mild symptoms with short duration and normal vitals are approved for home care."""
        result = evaluate_symptom_safety(
            symptom="Mild dry cough after dust exposure",
            severity="mild",
            duration_days=2,
            user_vitals={"body_temperature": {"value": 36.8}, "oxygen_saturation": {"value": 98}}
        )
        self.assertTrue(result["is_safe_for_home_care"])
        self.assertFalse(result["emergency_escalation"])
        self.assertEqual(result["alert_level"], "ROUTINE")

    def test_evaluate_symptom_safety_acute_override(self):
        """Acute red-flag symptoms immediately trigger emergency escalation."""
        result = evaluate_symptom_safety(
            symptom="Severe chest pressure radiating to left jaw",
            severity="severe",
            duration_days=1
        )
        self.assertFalse(result["is_safe_for_home_care"])
        self.assertTrue(result["emergency_escalation"])
        self.assertEqual(result["alert_level"], "EMERGENCY")

    def test_evaluate_symptom_safety_abnormal_vitals(self):
        """Critically abnormal vitals (SpO2 < 92%, Temp >= 39.4C) override home care safety."""
        # Low SpO2
        result_spo2 = evaluate_symptom_safety(
            symptom="Mild cough",
            severity="mild",
            duration_days=2,
            user_vitals={"oxygen_saturation": {"value": 89}}
        )
        self.assertFalse(result_spo2["is_safe_for_home_care"])
        self.assertTrue(result_spo2["emergency_escalation"])

        # High fever
        result_temp = evaluate_symptom_safety(
            symptom="Mild headache",
            severity="mild",
            duration_days=1,
            user_vitals={"body_temperature": {"value": 39.6}}
        )
        self.assertFalse(result_temp["is_safe_for_home_care"])
        self.assertEqual(result_temp["alert_level"], "HIGH_PRIORITY")

    def test_find_matching_remedy_category(self):
        """Symptom keywords map correctly to established clinical remedy categories."""
        self.assertEqual(find_matching_remedy_category("dry cough and khansi"), "cough")
        self.assertEqual(find_matching_remedy_category("scratchy sore throat"), "sore_throat")
        self.assertEqual(find_matching_remedy_category("sinus congestion and cold"), "congestion")
        self.assertEqual(find_matching_remedy_category("dull tension headache"), "headache")
        self.assertEqual(find_matching_remedy_category("queasy nausea"), "nausea")
        self.assertEqual(find_matching_remedy_category("burning acid reflux and heartburn"), "acidity")
        self.assertEqual(find_matching_remedy_category("mild muscle ache and ankle sprain"), "muscle_ache")
        self.assertEqual(find_matching_remedy_category("hard stool constipation"), "constipation")
        self.assertEqual(find_matching_remedy_category("sleeplessness and insomnia"), "insomnia")
        self.assertIsNone(find_matching_remedy_category("random unrelated phrase xyz"))

    def test_get_evidence_based_remedies_cough(self):
        """Cough query returns evidence remedies, pediatric warnings, and when to see doctor."""
        res = get_evidence_based_remedies("mild dry cough", severity="mild", duration_days=2)
        self.assertEqual(res["status"], "SAFE_SUPPORTIVE_CARE")
        self.assertTrue(res["is_safe_for_home_care"])
        self.assertGreater(len(res["remedies"]), 0)

        # Check infant botulism precaution is strictly present
        honey_remedy = next((r for r in res["remedies"] if "Honey" in r["name"]), None)
        self.assertIsNotNone(honey_remedy)
        self.assertIn("infants under 12 months", honey_remedy["precautions"])

        # Check contraindications and when to see doctor are present
        self.assertGreater(len(res["contraindications"]), 0)
        self.assertGreater(len(res["when_to_see_doctor"]), 0)
        self.assertIn("Hydration", " ".join(res["general_lifestyle"]))

    def test_get_evidence_based_remedies_emergency_blocks_remedies(self):
        """Emergency symptoms return zero home remedies and instruct immediate ER care."""
        res = get_evidence_based_remedies("chest tightness and can't breathe", severity="severe")
        self.assertEqual(res["status"], "EMERGENCY_ESCALATION")
        self.assertFalse(res["is_safe_for_home_care"])
        self.assertEqual(len(res["remedies"]), 0)
        self.assertIn("112 / 108 / 911", res["warning"])

    def test_analyze_wellness_trends_empty(self):
        """Empty wellness logs return graceful default statistics."""
        trends = analyze_wellness_trends([])
        self.assertEqual(trends["total_checkins"], 0)
        self.assertEqual(trends["average_water_glasses"], 0)
        self.assertEqual(trends["average_sleep_hours"], 0.0)

    def test_analyze_wellness_trends_populated(self):
        """Populated wellness logs correctly aggregate hydration, sleep, mood, and insights."""
        sample_logs = [
            {"water_glasses": 8, "sleep_hours": 7.5, "mood": "Energetic", "energy_level": "High"},
            {"water_glasses": 9, "sleep_hours": 8.0, "mood": "Calm", "energy_level": "Medium"},
            {"water_glasses": 6, "sleep_hours": 6.5, "mood": "Calm", "energy_level": "Medium"},
        ]
        trends = analyze_wellness_trends(sample_logs)
        self.assertEqual(trends["total_checkins"], 3)
        self.assertAlmostEqual(trends["average_water_glasses"], 7.7, places=1)
        self.assertAlmostEqual(trends["average_sleep_hours"], 7.3, places=1)
        self.assertEqual(trends["hydration_goal_met_days"], 2)
        self.assertEqual(trends["dominant_mood"], "Calm")
        self.assertEqual(trends["dominant_energy"], "Medium")
        self.assertTrue(len(trends["lifestyle_insights"]) > 0)


class TestSelfCareService(unittest.TestCase):

    @patch("services.self_care_service.db.get_user_latest_vitals")
    @patch("services.self_care_service.db.get_user_medications")
    def test_get_remedies_for_patient_with_med_warning(self, mock_meds, mock_vitals):
        """If patient is taking blood thinners, ginger remedy receives special caution."""
        mock_vitals.return_value = {}
        mock_meds.return_value = [{"name": "Warfarin 5mg", "is_active": True}]

        result = get_remedies_for_patient(
            user_id=1,
            symptom="Mild nausea",
            severity="mild",
            duration_days=1
        )
        self.assertTrue(result["is_safe_for_home_care"])
        safety_warnings = " ".join(result.get("safety_warnings", []))
        self.assertIn("anticoagulant", safety_warnings.lower())

    @patch("services.self_care_service.db.save_wellness_checkin")
    def test_record_patient_wellness_checkin(self, mock_save):
        """Service properly saves check-in data and returns status."""
        mock_save.return_value = True
        res = record_patient_wellness_checkin(
            user_id=1,
            checkin_date="2026-10-04",
            water_glasses=8,
            sleep_hours=7.5,
            mood="Good",
            energy_level="High"
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["checkin_date"], "2026-10-04")

    @patch("services.self_care_service.db.get_user_wellness_checkins")
    def test_get_patient_wellness_history(self, mock_get):
        """Service returns check-in logs and computed trends."""
        mock_get.return_value = [
            {"checkin_date": "2026-10-04", "water_glasses": 8, "sleep_hours": 7.0, "mood": "Calm", "energy_level": "Medium"}
        ]
        history = get_patient_wellness_history(user_id=1, days=7)
        self.assertTrue(history["success"])
        self.assertEqual(len(history["logs"]), 1)
        self.assertIn("trends", history)
        self.assertEqual(history["trends"]["average_water_glasses"], 8.0)


if __name__ == "__main__":
    unittest.main()
