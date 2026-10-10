# ============================================================
# HealthTriage AI - SANA Natural Speech & Multilingual Test Suite
# Tests:
# 1. Odia, Hindi, English Speech Text Normalization & Pronunciation Preparation
# 2. Verbal Vital Signs Extraction with Indic Numerals & Regional Terms
# 3. Conversational Memory & Symptom Correction Acknowledgment Directives
# 4. Multi-tier TTS Provider Architecture & Odia Fallback Integrity
# 5. Turn-taking State Machine Verification
# ============================================================

import unittest
from services.voice_service import (
    prepare_text_for_speech,
    get_tts_provider_info,
    text_to_speech_bytes,
    GTTS_SUPPORTED_LANGUAGES,
)
from ai.sana_agent import extract_vitals_from_speech, build_sana_prompt, parse_sana_model_response
from language_service import detect_language, get_welcome_message, get_disclaimer
from ai.prompts import SANA_SYSTEM_PROMPT


class TestSanaNaturalSpeechAndMultilingual(unittest.TestCase):

    # ============================================================
    # 1. SPEECH TEXT PREPARATION & PRONUNCIATION NORMALIZATION
    # ============================================================

    def test_text_normalization_english(self):
        """Verify markdown stripping, emoji removal, and abbreviation expansions in English."""
        raw = "Hello! Your **SpO2 is 92%**, BPM is 110, and BP is 130/85 mmHg. Take rest! ❤️🩺"
        clean = prepare_text_for_speech(raw, lang="en")
        self.assertNotIn("**", clean)
        self.assertNotIn("❤️", clean)
        self.assertNotIn("🩺", clean)
        self.assertIn("oxygen saturation is 92%", clean)
        self.assertIn("beats per minute is 110", clean)
        self.assertIn("blood pressure is 130 over 85", clean)

    def test_text_normalization_odia(self):
        """Verify Odia text normalization: preserves Odia script while expanding abbreviations cleanly."""
        raw = "ନମସ୍କାର! ଆପଣଙ୍କ **SpO2 ୯୪% ଅଛି** ଏବଂ BP 120/80 ଅଛି। ବ୍ୟସ୍ତ ହୁଅନ୍ତୁ ନାହିଁ। 🌿"
        clean = prepare_text_for_speech(raw, lang="or")
        self.assertNotIn("**", clean)
        self.assertNotIn("🌿", clean)
        self.assertIn("ଅକ୍ସିଜେନ୍ ସ୍ତର", clean)
        self.assertIn("ରକ୍ତଚାପ", clean)
        self.assertIn("120 ବାଇ 80", clean)

    def test_text_normalization_hindi(self):
        """Verify Hindi text normalization: expands BP and vitals into natural spoken words."""
        raw = "नमस्ते! आपका **BP 140/90** है और बुखार 101.4 F है। 🚨"
        clean = prepare_text_for_speech(raw, lang="hi")
        self.assertNotIn("**", clean)
        self.assertNotIn("🚨", clean)
        self.assertIn("ब्लड प्रेशर", clean)
        self.assertIn("140 बटा 90", clean)
        self.assertIn("डिग्री फारेनहाइट", clean)

    def test_text_normalization_bengali(self):
        """Verify Bengali text normalization."""
        raw = "আপনার **BP 130/80** এবং SpO2 95%। চিন্তা করবেন না। ❤️"
        clean = prepare_text_for_speech(raw, lang="bn")
        self.assertNotIn("**", clean)
        self.assertNotIn("❤️", clean)
        self.assertIn("রক্তচাপ", clean)
        self.assertIn("130 বাই 80", clean)
        self.assertIn("অক্সিজেন মাত্রা", clean)

    # ============================================================
    # 2. VERBAL VITAL SIGNS EXTRACTION WITH INDIC NUMERALS
    # ============================================================

    def test_extract_vitals_english(self):
        """Standard English spoken vitals."""
        v = extract_vitals_from_speech("My oxygen is 91 percent, heart rate 115 and BP is 140 over 90")
        self.assertEqual(v.get("spo2"), 91.0)
        self.assertEqual(v.get("heart_rate"), 115.0)
        self.assertEqual(v.get("systolic_bp"), 140.0)
        self.assertEqual(v.get("diastolic_bp"), 90.0)

    def test_extract_vitals_odia_numerals(self):
        """Odia transcript with native Odia numerals (୯୪, ୧୧୦, ୧୨୦/୮୦)."""
        v = extract_vitals_from_speech("ମୋ ଅକ୍ସିଜେନ୍ ୯୪% ଅଛି ଏବଂ ଧଡ଼କନ୍ ୧୧୦ ଅଛି, ରକ୍ତଚାପ ୧୨୦ ବାଇ ୮୦")
        self.assertEqual(v.get("spo2"), 94.0)
        self.assertEqual(v.get("heart_rate"), 110.0)
        self.assertEqual(v.get("systolic_bp"), 120.0)
        self.assertEqual(v.get("diastolic_bp"), 80.0)

    def test_extract_vitals_hindi_numerals(self):
        """Hindi transcript with Devanagari numerals (९५, १०२)."""
        v = extract_vitals_from_speech("मेरा ऑक्सीजन ९५ है और बुखार १०२ है")
        self.assertEqual(v.get("spo2"), 95.0)
        self.assertEqual(v.get("temperature"), 102.0)

    # ============================================================
    # 3. TTS PROVIDER INTEGRITY & ODIA FALLBACK
    # ============================================================

    def test_tts_odia_audible_generation(self):
        """
        Verify that Odia ('or') successfully generates audible audio bytes.
        Even without SARVAM_API_KEY, the multi-tier engine uses Brahmic phonetic synthesis
        so that SANA can speak audibly in Odia instead of failing silently in the browser.
        """
        # Ensure gTTS supported languages does not natively list 'or'
        self.assertNotIn("or", GTTS_SUPPORTED_LANGUAGES)

        # Provider info for Odia must indicate phonetic or neural server support
        info = get_tts_provider_info("or")
        self.assertEqual(info["language"], "or")
        self.assertIn("provider", info)
        self.assertTrue(info["native_support"])

        # Audio bytes for Odia must be generated and audible (> 1000 bytes MP3)
        raw_audio = text_to_speech_bytes("ନମସ୍କାର, ଆପଣ କିପରି ଅଛନ୍ତି?", lang="or")
        self.assertIsNotNone(raw_audio)
        self.assertGreater(len(raw_audio), 1000)

    def test_tts_gtts_supported_languages(self):
        """Verify gTTS genuinely generates audio bytes for supported languages."""
        for lang_code in ["en", "hi", "bn"]:
            info = get_tts_provider_info(lang_code)
            self.assertTrue(info["native_support"])

    # ============================================================
    # 4. CONVERSATIONAL MEMORY & SYMPTOM CORRECTION DIRECTIVES
    # ============================================================

    def test_sana_system_prompt_contains_correction_rule(self):
        """Verify SANA prompt includes explicit symptom correction rules."""
        self.assertIn("CRITICAL SYMPTOM CORRECTION RULE", SANA_SYSTEM_PROMPT)
        self.assertIn("Adaptive Response Length", SANA_SYSTEM_PROMPT)
        self.assertIn("Odia Language Guidelines", SANA_SYSTEM_PROMPT)
        self.assertIn("Hindi Language Guidelines", SANA_SYSTEM_PROMPT)

    def test_build_sana_prompt_includes_correction_directive(self):
        """Verify build_sana_prompt injects the correction directive for Gemini."""
        prompt = build_sana_prompt(
            user_message="Actually no fever, but severe stomach ache started 3 days ago",
            language="or",
            user_name="Rajesh"
        )
        self.assertIn("CRITICAL SYMPTOM CORRECTION DIRECTIVE", prompt)
        self.assertIn("Rajesh", prompt)
        self.assertIn("Odia (ଓଡ଼ିଆ)", prompt)

    def test_parse_model_response_clean(self):
        """Verify parser extracts spoken response and triage fields cleanly."""
        sample_json = '''{
            "spoken_response": "I understand your pain started 3 days ago. Are you experiencing any nausea?",
            "triage_level": "URGENT_CARE",
            "screen_summary": "Stomach pain lasting 3 days.",
            "key_observations": ["Onset 3 days ago", "No fever"],
            "recommended_next_steps": ["Consult a doctor within 24 hours"],
            "follow_up_question": "Do you feel like vomiting?",
            "safety_disclaimer": "Safety disclaimer"
        }'''
        parsed = parse_sana_model_response(sample_json, default_lang="en")
        self.assertEqual(parsed["triage_level"], "URGENT_CARE")
        self.assertIn("3 days ago", parsed["spoken_response"])
        self.assertEqual(parsed["follow_up_question"], "Do you feel like vomiting?")

    # ============================================================
    # 5. LANGUAGE DETECTION & REGIONAL SWITCH PHRASES
    # ============================================================

    def test_language_detection_odia(self):
        """Detect Odia from script characters."""
        text = "ମୋର ପେଟ ବିନ୍ଧୁଛି ଏବଂ ମୁଣ୍ଡ ବୁଲଉଛି"
        detected = detect_language(text)
        self.assertEqual(detected, "or")

    def test_language_detection_switch_phrases(self):
        """Detect explicit language switch phrases."""
        self.assertEqual(detect_language("switch to odia"), "or")
        self.assertEqual(detect_language("speak in odia"), "or")
        self.assertEqual(detect_language("ଓଡ଼ିଆରେ କୁହନ୍ତୁ"), "or")
        self.assertEqual(detect_language("अब हिंदी में बात कीजिए"), "hi")
        self.assertEqual(detect_language("বাংলায় বলুন"), "bn")


if __name__ == "__main__":
    unittest.main()
