import unittest
from fastapi.testclient import TestClient
from api import app
from ai.medical_report_analyzer import (
    evaluate_parameter,
    rule_based_report_parser,
    analyze_medical_report
)

client = TestClient(app)


class TestMedicalReportAnalyzer(unittest.TestCase):

    def test_evaluate_parameter_normal(self):
        res = evaluate_parameter("Hemoglobin", 14.2, "g/dL")
        self.assertEqual(res["status"], "normal")
        self.assertFalse(res["is_abnormal"])
        self.assertFalse(res["is_critical"])

    def test_evaluate_parameter_abnormal_low(self):
        res = evaluate_parameter("Hemoglobin", 9.2, "g/dL")
        self.assertEqual(res["status"], "low")
        self.assertTrue(res["is_abnormal"])
        self.assertIn("Lower than normal", res["explanation"])

    def test_evaluate_parameter_critical(self):
        # Critical low hemoglobin
        res_crit_hb = evaluate_parameter("Hemoglobin", 6.2, "g/dL")
        self.assertEqual(res_crit_hb["status"], "critical_low")
        self.assertTrue(res_crit_hb["is_critical"])

        # Critical high potassium
        res_crit_k = evaluate_parameter("Serum Potassium (K+)", 6.4, "mEq/L")
        self.assertEqual(res_crit_k["status"], "critical_high")
        self.assertTrue(res_crit_k["is_critical"])

    def test_rule_based_report_parser(self):
        report_text = """
        METROPOLITAN CLINICAL LABORATORY
        PATIENT LAB REPORT
        Hemoglobin: 9.2 g/dL
        WBC: 12.8 x10^3/µL
        Platelet Count: 250 x10^3/µL
        Fasting Blood Glucose: 95 mg/dL
        Serum Creatinine: 0.9 mg/dL
        """
        parsed = rule_based_report_parser(
            text=report_text,
            patient_symptoms="Severe fatigue, mild dizziness, and low grade fever"
        )
        self.assertGreaterEqual(len(parsed["parameters"]), 4)
        self.assertGreaterEqual(parsed["abnormal_count"], 1)

        # Check hemoglobin is detected as low
        hb_param = next((p for p in parsed["parameters"] if "Hemoglobin" in p["name"]), None)
        self.assertIsNotNone(hb_param)
        self.assertEqual(hb_param["status"], "low")

        # Check plain language explanation
        self.assertTrue(parsed["plain_language_explanation"].startswith("Based on the information provided"))

        # Check doctor questions
        self.assertTrue(len(parsed["doctor_questions"]) >= 3)

        # Check symptom correlation
        self.assertTrue("fatigue" in parsed["symptom_correlations"].lower() or "hemoglobin" in parsed["symptom_correlations"].lower())

    def test_analyze_medical_report_disclaimer(self):
        sample_bytes = "Hemoglobin: 13.5 g/dL\nWBC: 6.0 x10^3/uL".encode("utf-8")
        result = analyze_medical_report(
            api_key=None,
            file_bytes=sample_bytes,
            file_name="sample_lab.txt",
            mime_type="text/plain"
        )
        self.assertIn("disclaimer", result)
        self.assertTrue(result["plain_language_explanation"].startswith("Based on the information provided"))

    def test_api_endpoints_require_authentication(self):
        # POST analyze
        r_post = client.post("/api/reports/analyze", json={
            "file_data": "SGVtb2dsb2JpbjogOS4y",
            "file_name": "test.txt"
        })
        self.assertEqual(r_post.status_code, 401)

        # GET reports list
        r_get = client.get("/api/reports")
        self.assertEqual(r_get.status_code, 401)

        # GET single report
        r_single = client.get("/api/reports/1")
        self.assertEqual(r_single.status_code, 401)

        # DELETE report
        r_del = client.delete("/api/reports/1")
        self.assertEqual(r_del.status_code, 401)


if __name__ == "__main__":
    unittest.main()
