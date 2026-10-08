import unittest
from fastapi.testclient import TestClient
from api import app
from ai.health_monitor import evaluate_vital_status, analyze_health_trend
from services.health_monitor_service import validate_measurement_input, record_patient_measurement

client = TestClient(app)


class TestHealthMonitor(unittest.TestCase):

    def test_evaluate_vital_normal(self):
        eval_hr = evaluate_vital_status("heart_rate", 72, "BPM")
        self.assertEqual(eval_hr["status"], "NORMAL")
        self.assertFalse(eval_hr["is_emergency"])

        eval_spo2 = evaluate_vital_status("spo2", 98, "%")
        self.assertEqual(eval_spo2["status"], "NORMAL")

    def test_evaluate_vital_critical(self):
        eval_spo2_crit = evaluate_vital_status("spo2", 84, "%")
        self.assertEqual(eval_spo2_crit["status"], "CRITICAL")
        self.assertTrue(eval_spo2_crit["is_emergency"])

        eval_hr_crit = evaluate_vital_status("heart_rate", 145, "BPM")
        self.assertEqual(eval_hr_crit["status"], "CRITICAL")

    def test_validate_measurement_input(self):
        valid, _ = validate_measurement_input("heart_rate", 80)
        self.assertTrue(valid)

        invalid_val, err = validate_measurement_input("heart_rate", 999)
        self.assertFalse(invalid_val)
        self.assertIn("outside plausible range", err)

        invalid_type, err = validate_measurement_input("unknown_vital", 50)
        self.assertFalse(invalid_type)

    def test_analyze_health_trend_stable(self):
        measurements = [
            {"value": 72, "recorded_at": "2026-10-01 10:00:00"},
            {"value": 74, "recorded_at": "2026-10-02 10:00:00"},
            {"value": 73, "recorded_at": "2026-10-03 10:00:00"},
        ]
        trend = analyze_health_trend(measurements, "heart_rate")
        self.assertEqual(trend["direction"], "stable")
        self.assertEqual(trend["count"], 3)
        self.assertEqual(trend["average"], 73.0)

    def test_api_health_endpoints_require_auth(self):
        r_overview = client.get("/api/health/monitoring")
        self.assertEqual(r_overview.status_code, 401)

        r_trends = client.get("/api/health/trends")
        self.assertEqual(r_trends.status_code, 401)

        r_log = client.post("/api/health/measurements", json={"heart_rate": 75})
        self.assertEqual(r_log.status_code, 401)


if __name__ == "__main__":
    unittest.main()
