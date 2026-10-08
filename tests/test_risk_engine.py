import unittest
from ai.risk_engine import check_vital_signs


class TestRiskEngine(unittest.TestCase):

    def test_normal_vitals(self):
        warnings = check_vital_signs(
            temperature=98.6,  # Normal Fahrenheit
            spo2=98,
            heart_rate=72,
            respiratory_rate=16,
            systolic_bp=120,
            diastolic_bp=80
        )
        self.assertEqual(len(warnings), 0)

    def test_celsius_normal(self):
        warnings = check_vital_signs(
            temperature=37.0,
            spo2=99,
            heart_rate=70,
            respiratory_rate=14
        )
        self.assertEqual(len(warnings), 0)

    def test_low_spo2(self):
        warnings = check_vital_signs(spo2=90)
        self.assertTrue(any("Low SpO₂" in w for w in warnings))

    def test_critical_spo2(self):
        warnings = check_vital_signs(spo2=85)
        self.assertTrue(any("Critically low SpO₂" in w for w in warnings))

    def test_high_temperature_fahrenheit(self):
        warnings = check_vital_signs(temperature=104.5)
        self.assertTrue(any("Very high temperature" in w for w in warnings))

    def test_fever_celsius(self):
        warnings = check_vital_signs(temperature=38.8)
        self.assertTrue(any("Fever detected" in w for w in warnings))

    def test_abnormal_heart_rate(self):
        high_hr = check_vital_signs(heart_rate=140)
        self.assertTrue(any("Very high heart rate" in w for w in high_hr))

        low_hr = check_vital_signs(heart_rate=40)
        self.assertTrue(any("Very low heart rate" in w for w in low_hr))

    def test_empty_vitals(self):
        warnings = check_vital_signs()
        self.assertEqual(warnings, [])


if __name__ == "__main__":
    unittest.main()
