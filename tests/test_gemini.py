import unittest
from ai.gemini_service import (
    build_conversation_context,
    build_prompt,
    make_file_part,
    PRIMARY_MODEL
)


class TestGeminiService(unittest.TestCase):

    def test_build_conversation_context_empty(self):
        context = build_conversation_context([])
        self.assertEqual(context, "No previous conversation.")

    def test_build_conversation_context_messages(self):
        messages = [
            {"role": "user", "content": "I have a cough"},
            {"role": "assistant", "content": "How long have you had it?"},
            {"role": "user", "content": "3 days"}
        ]
        context = build_conversation_context(messages)
        self.assertIn("Patient: I have a cough", context)
        self.assertTrue(
            "SANA: How long have you had it?" in context
            or "HealthTriage AI: How long have you had it?" in context
        )
        self.assertIn("Patient: 3 days", context)

    def test_build_prompt_contains_rules(self):
        prompt = build_prompt(
            name="John Doe",
            age=30,
            gender="Male",
            symptoms="Mild headache",
            temperature=37.0,
            spo2=98,
            heart_rate=72,
            respiratory_rate=16,
            safety_warnings=["Warning: check vitals"]
        )
        self.assertTrue("SANA" in prompt or "HealthTriage AI" in prompt)
        self.assertIn("John Doe", prompt)
        self.assertIn("Mild headache", prompt)
        self.assertIn("Warning: check vitals", prompt)

    def test_make_file_part_base64_data_url(self):
        # 1x1 transparent GIF base64
        data_url = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        part = make_file_part(data_url)
        self.assertIsNotNone(part)

    def test_make_file_part_none(self):
        part = make_file_part(None)
        self.assertIsNone(part)

    def test_primary_model_defined(self):
        self.assertTrue(bool(PRIMARY_MODEL))


if __name__ == "__main__":
    unittest.main()
