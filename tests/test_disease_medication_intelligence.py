# ============================================================
# HealthTriage AI - Disease & Medication Intelligence Module Tests
# Comprehensive Unit Tests for Knowledge Bases, Symptom Analysis,
# Best Next Step, Pharmacopeia, Safety Checking, and Report Comparison
# ============================================================

import unittest
from ai.disease_knowledge_base import (
    DISEASE_DATABASE,
    search_disease_knowledge,
    get_disease_by_id,
    get_all_disease_categories
)
from ai.medication_knowledge_base import (
    MEDICATION_DATABASE,
    search_medication_knowledge,
    get_medication_by_id
)
from services.disease_intelligence_service import DiseaseIntelligenceService
from services.medication_schedule_service import MedicationScheduleService
from services.report_comparison_service import ReportComparisonService
from ai.ai_safety_guard import AISafetyGuard

class TestDiseaseMedicationIntelligence(unittest.TestCase):

    def test_disease_knowledge_base_structure(self):
        """Verifies disease database contains structured records across multiple categories."""
        self.assertGreater(len(DISEASE_DATABASE), 10)
        categories = get_all_disease_categories()
        self.assertIn("Common Diseases", categories)
        self.assertIn("Cardiovascular Conditions", categories)
        self.assertIn("Respiratory Conditions", categories)

        for d in DISEASE_DATABASE:
            self.assertTrue(d["id"].startswith("DIS-"))
            self.assertIn("condition_name", d)
            self.assertIn("common_symptoms", d)
            self.assertIn("warning_signs", d)
            self.assertIn("emergency_warning_signs", d)
            self.assertIn("evidence_source", d)
            self.assertIn("typical_investigations", d)
            self.assertIn("medication_classes_commonly_used", d)

    def test_disease_search(self):
        """Tests searching disease knowledge base by name and symptom."""
        fever_matches = search_disease_knowledge("fever")
        self.assertGreater(len(fever_matches), 0)

        dengue = get_disease_by_id("DIS-005")
        self.assertIsNotNone(dengue)
        self.assertEqual(dengue["condition_name"], "Dengue Fever")

    def test_symptom_analysis_and_ranking(self):
        """Tests symptom correlation, uncertainty classification, and ranked possibilities."""
        res = DiseaseIntelligenceService.analyze_patient_symptoms(
            symptoms="High fever with severe joint pain and retro-orbital headache for 3 days",
            duration="3 days"
        )
        self.assertTrue(res["success"])
        self.assertIn("ranked_possibilities", res)
        self.assertIn("best_next_step", res)
        self.assertIn("disclaimer", res)

        # Verify uncertainty classification
        for p in res["ranked_possibilities"]:
            self.assertIn(p["certainty_level"], ["Possible condition", "Suspected condition"])

    def test_best_next_step_emergency_override(self):
        """Verifies emergency symptoms trigger immediate emergency care action."""
        step = DiseaseIntelligenceService.determine_best_next_step(
            symptoms="Crushing chest pain radiating to my left arm with shortness of breath",
            vitals={"heart_rate": 110, "spo2": 96}
        )
        self.assertEqual(step["action_code"], "EMERGENCY_CARE_NOW")
        self.assertEqual(step["urgency_level"], "CRITICAL EMERGENCY")
        self.assertIn("112", step["recommended_action"])

    def test_best_next_step_routine(self):
        """Verifies mild cold symptoms recommend monitoring at home."""
        step = DiseaseIntelligenceService.determine_best_next_step(
            symptoms="Mild runny nose and sneezing for 1 day",
            vitals={"temperature": 98.6, "spo2": 99}
        )
        self.assertEqual(step["action_code"], "MONITOR_AT_HOME")

    def test_best_medicine_safety_control(self):
        """Verifies SANA never autonomously prescribes and includes mandatory disclaimer."""
        res = DiseaseIntelligenceService.get_best_medicine_guidance("Hypertension")
        self.assertTrue(res["success"])
        self.assertIn("disclaimer", res)
        self.assertIn("doctor or pharmacist", res["disclaimer"].lower())
        self.assertIn("common_medication_classes", res)
        self.assertIn("factors_doctors_consider", res)

    def test_medication_knowledge_base(self):
        """Tests medication knowledge base pharmacology and missed-dose rules."""
        self.assertGreater(len(MEDICATION_DATABASE), 5)
        para = get_medication_by_id("MED-001")
        self.assertIsNotNone(para)
        self.assertIn("Paracetamol", para["generic_name"])
        self.assertIn("Crocin", para["common_brand_names"])
        self.assertIn("never take two doses", para["missed_dose_safety"].lower())

        search_res = search_medication_knowledge("metformin")
        self.assertGreater(len(search_res), 0)

    def test_comprehensive_interaction_checker(self):
        """Tests multi-drug conflicts, food warnings, duplicate statin detection, and renal precautions."""
        # 1. Severe DDI (Warfarin + Aspirin)
        ddi = MedicationScheduleService.check_comprehensive_safety(
            medication_list=["Warfarin", "Aspirin"]
        )
        self.assertTrue(ddi["has_severe_issue"])
        self.assertEqual(ddi["overall_status"], "SAFETY_ALERT")

        # 2. Duplicate Statin Detection
        dup = MedicationScheduleService.check_comprehensive_safety(
            medication_list=["Atorvastatin", "Rosuvastatin"]
        )
        self.assertTrue(dup["has_severe_issue"])
        self.assertTrue(any(a["type"] == "DUPLICATE_THERAPY" for a in dup["alerts"]))

        # 3. Renal eGFR Contraindication for Metformin
        renal = MedicationScheduleService.check_comprehensive_safety(
            medication_list=["Metformin"],
            kidney_function_egfr=22.0
        )
        self.assertTrue(renal["has_severe_issue"])
        self.assertTrue(any(a["type"] == "RENAL_CONTRAINDICATION" for a in renal["alerts"]))

        # 4. Pregnancy Contraindication for Statins
        preg = MedicationScheduleService.check_comprehensive_safety(
            medication_list=["Atorvastatin"],
            is_pregnant=True
        )
        self.assertTrue(preg["has_severe_issue"])
        self.assertTrue(any(a["type"] == "PREGNANCY_CONTRAINDICATION" for a in preg["alerts"]))

    def test_ai_safety_guard_prescribing_and_double_dosing(self):
        """Verifies AI Safety Guard blocks double dosing and stopping medications."""
        raw_text = "If you missed your dose, double the dose next time. Stop taking your blood pressure medication."
        sanitized = AISafetyGuard.sanitize_ai_text(raw_text)
        self.assertNotIn("double the dose", sanitized.lower())
        self.assertIn("medication evaluation requires in-person prescription", sanitized.lower())
        self.assertIn("only qualified healthcare professionals can prescribe", sanitized.lower())

    def test_report_comparison_numeric_parsing(self):
        """Tests safe numeric extraction from lab result strings."""
        self.assertEqual(ReportComparisonService._parse_numeric("14.2 g/dL"), 14.2)
        self.assertEqual(ReportComparisonService._parse_numeric("120 mg/dL"), 120.0)
        self.assertEqual(ReportComparisonService._parse_numeric(85), 85.0)
        self.assertIsNone(ReportComparisonService._parse_numeric("Positive"))

if __name__ == "__main__":
    unittest.main()
