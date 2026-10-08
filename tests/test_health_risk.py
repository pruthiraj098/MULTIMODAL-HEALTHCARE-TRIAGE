import unittest
from fastapi.testclient import TestClient
from api import app
from ai.health_risk_score import (
    calculate_rule_based_risk,
    analyze_health_risk,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    RISK_LEVEL_HIGH
)

client = TestClient(app)


class TestHealthRiskScore(unittest.TestCase):

    def test_low_risk_baseline(self):
        vitals = {
            "heart_rate": 72,
            "spo2": 98,
            "temperature": 98.6,
            "systolic_bp": 118,
            "diastolic_bp": 76,
            "respiratory_rate": 16
        }
        res = analyze_health_risk(
            api_key=None,
            symptoms="Mild tension headache after screen time, relieved by rest",
            vitals=vitals
        )
        self.assertEqual(res["risk_level"], RISK_LEVEL_LOW)
        self.assertLess(res["risk_score"], 40)
        self.assertFalse(res["is_emergency"])
        self.assertTrue(res["explanation"].startswith("Based on the information provided"))
        self.assertTrue(len(res["factors"]) > 0)

    def test_moderate_risk_fever_and_symptoms(self):
        vitals = {
            "heart_rate": 88,
            "spo2": 96,
            "temperature": 101.2,
            "systolic_bp": 124,
            "diastolic_bp": 82
        }
        res = analyze_health_risk(
            api_key=None,
            symptoms="Persistent fever, productive cough, and body aches for 3 days",
            vitals=vitals
        )
        self.assertIn(res["risk_level"], [RISK_LEVEL_MODERATE, RISK_LEVEL_HIGH])
        self.assertGreaterEqual(res["risk_score"], 40)
        self.assertTrue(res["explanation"].startswith("Based on the information provided"))

    def test_emergency_override_hypoxemia(self):
        # SpO2 < 90% must unconditionally trigger HIGH risk and emergency flag
        vitals = {
            "heart_rate": 105,
            "spo2": 87,
            "temperature": 98.4
        }
        res = analyze_health_risk(
            api_key=None,
            symptoms="Shortness of breath walking up stairs",
            vitals=vitals
        )
        self.assertEqual(res["risk_level"], RISK_LEVEL_HIGH)
        self.assertGreaterEqual(res["risk_score"], 75)
        self.assertTrue(res["is_emergency"])
        self.assertTrue(any("SpO2 < 90%" in f["details"] or "Critically low SpO₂" in f["details"] for f in res["factors"]))

    def test_emergency_override_hypertensive_crisis(self):
        # BP > 180 / 120 must trigger emergency
        vitals = {
            "systolic_bp": 195,
            "diastolic_bp": 125
        }
        res = analyze_health_risk(
            api_key=None,
            symptoms="Severe headache and blurry vision",
            vitals=vitals
        )
        self.assertEqual(res["risk_level"], RISK_LEVEL_HIGH)
        self.assertGreaterEqual(res["risk_score"], 75)
        self.assertTrue(res["is_emergency"])

    def test_emergency_override_critical_keywords(self):
        # Crushing chest pain radiating to arm
        res = analyze_health_risk(
            api_key=None,
            symptoms="Sudden crushing chest pain radiating to left arm and cold sweats",
            vitals={"heart_rate": 80, "spo2": 98}
        )
        self.assertEqual(res["risk_level"], RISK_LEVEL_HIGH)
        self.assertGreaterEqual(res["risk_score"], 75)
        self.assertTrue(res["is_emergency"])

    def test_cautious_phrasing_and_no_percentage_probability(self):
        res = analyze_health_risk(
            api_key=None,
            symptoms="Fatigue and sore throat",
            vitals={"temperature": 99.0}
        )
        explanation = res["explanation"]
        self.assertTrue(explanation.startswith("Based on the information provided"))
        # Never diagnose or give percentage probability
        self.assertNotIn("probability of disease", explanation.lower())
        self.assertNotIn("% probability", explanation.lower())

    def test_api_endpoints_require_authentication(self):
        # POST analyze
        r_analyze = client.post("/api/health-risk/analyze", json={"symptoms": "Headache"})
        self.assertEqual(r_analyze.status_code, 401)

        # GET latest
        r_latest = client.get("/api/health-risk/latest")
        self.assertEqual(r_latest.status_code, 401)

        # GET history
        r_history = client.get("/api/health-risk/history")
        self.assertEqual(r_history.status_code, 401)


if __name__ == "__main__":
    unittest.main()
