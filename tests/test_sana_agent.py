import unittest
from ai.sana_agent import extract_vitals_from_speech, parse_sana_model_response


class TestSanaAgent(unittest.TestCase):

    def test_extract_spo2(self):
        vitals = extract_vitals_from_speech("I checked my oxygen and it is 91 percent")
        self.assertIn("spo2", vitals)
        self.assertEqual(vitals["spo2"], 91.0)

    def test_extract_heart_rate(self):
        vitals = extract_vitals_from_speech("My heart rate is 115 bpm and I feel dizzy")
        self.assertIn("heart_rate", vitals)
        self.assertEqual(vitals["heart_rate"], 115.0)

    def test_extract_temperature(self):
        vitals = extract_vitals_from_speech("I have high fever, temperature is 102.4")
        self.assertIn("temperature", vitals)
        self.assertEqual(vitals["temperature"], 102.4)

    def test_extract_bp(self):
        vitals = extract_vitals_from_speech("Checked my blood pressure and BP is 140 over 90")
        self.assertIn("systolic_bp", vitals)
        self.assertIn("diastolic_bp", vitals)
        self.assertEqual(vitals["systolic_bp"], 140.0)
        self.assertEqual(vitals["diastolic_bp"], 90.0)

    def test_parse_sana_json(self):
        json_sample = '''{
            "spoken_response": "I'm sorry you're feeling dizzy. When did it start?",
            "triage_level": "URGENT_CARE",
            "screen_summary": "Dizziness with mild headache reported.",
            "key_observations": ["Onset this morning", "No fainting"],
            "recommended_next_steps": ["Rest in seated position", "Drink fluids"],
            "follow_up_question": "Are you experiencing any numbness?",
            "safety_disclaimer": "HealthTriage AI and SANA provide general health guidance."
        }'''
        parsed = parse_sana_model_response(json_sample)
        self.assertEqual(parsed["triage_level"], "URGENT_CARE")
        self.assertEqual(parsed["spoken_response"], "I'm sorry you're feeling dizzy. When did it start?")
        self.assertEqual(len(parsed["key_observations"]), 2)

    def test_parse_fallback(self):
        raw_text = "This is a direct answer without json format."
        parsed = parse_sana_model_response(raw_text)
        self.assertEqual(parsed["spoken_response"], raw_text)
        self.assertIn(parsed["triage_level"], ["SELF_CARE", "URGENT_CARE", "EMERGENCY"])


if __name__ == "__main__":
    unittest.main()
