# ============================================================
# HealthTriage AI - AI Safety Guard (Healthcare Safety Controller)
# Protects against:
# 1. Definitive autonomous medical diagnosis
# 2. Unsafe prescription / dosing instructions
# 3. Dangerous self-treatment / unsupported claims
# 4. False reassurance and downplaying of red flags
# 5. Overriding of deterministic emergency rules
# 6. Privacy & token leakage
# 7. Low-internet / AI service failure fallback mode
# ============================================================

import re
from typing import Dict, Any, List, Optional
from ai.risk_engine import check_vital_signs, assess_triage_risk
from language_service import get_disclaimer, SUPPORTED_LANGUAGES

# Prohibited definitive diagnostic language patterns
PROHIBITED_DIAGNOSIS_PATTERNS = [
    (r"\byou\s+(?:definitely|certainly|surely)\s+have\b", "your symptoms appear consistent with"),
    (r"\byou\s+have\s+been\s+diagnosed\s+with\b", "your reported signs suggest possible"),
    (r"\bmy\s+diagnosis\s+is\b", "clinical triage observation suggests"),
    (r"\bi\s+diagnose\s+you\s+with\b", "clinical triage observation indicates possible"),
    (r"\bthis\s+is\s+definitely\b", "this appears consistent with"),
    (r"\byou\s+are\s+suffering\s+from\b", "your reported symptoms may relate to"),
    (r"\bthere\s+is\s+no\s+need\s+to\s+worry\b", "monitor your symptoms closely"),
    (r"\byou\s+will\s+be\s+completely\s+fine\b", "symptoms should be carefully observed"),
    (r"\bguaranteed\s+cure\b", "supportive measure"),
]

# Prohibited prescribing patterns
PROHIBITED_PRESCRIPTION_PATTERNS = [
    r"\btake\s+\d+\s*(?:mg|ml|tablets?|capsules?)\s+of\s+[a-zA-Z]+",
    r"\bstart\s+taking\s+(?:amoxicillin|azithromycin|ciprofloxacin|antibiotic)",
    r"\bi\s+prescribe\b",
    r"\byou\s+should\s+take\s+antibiotics\b",
    r"\bstop\s+taking\s+your\s+prescribed\b",
    r"\bdouble\s+(?:up\s+on\s+)?(?:the\s+)?(?:next\s+)?dose\b",
    r"\bstop\s+taking\s+(?:your\s+)?(?:blood\s+pressure|heart|diabetes|cholesterol|thyroid)\s+medication\b",
]

class AISafetyGuard:
    """
    Independent healthcare safety layer sitting between generative AI models
    and patient / clinical presentation layers.
    Enforces the hierarchy:
    Deterministic Safety Rules > Human Healthcare Review > AI Safety Guard > Generative AI
    """

    @staticmethod
    def sanitize_ai_text(text: str, language: str = "en") -> str:
        """
        Removes definitive medical diagnoses, false reassurance, and unsafe phrasing,
        replacing them with uncertainty-aware, professional triage terminology.
        """
        if not text:
            return ""

        sanitized = text

        # Replace definitive diagnosis phrasing
        for pattern, replacement in PROHIBITED_DIAGNOSIS_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        # Check for unsafe prescribing and append clinical caution if detected
        prescribing_flag = False
        for pat in PROHIBITED_PRESCRIPTION_PATTERNS:
            if re.search(pat, sanitized, flags=re.IGNORECASE):
                prescribing_flag = True
                sanitized = re.sub(pat, "[Medication evaluation requires in-person prescription by licensed physician]", sanitized, flags=re.IGNORECASE)

        if prescribing_flag:
            sanitized += "\n\n⚠️ NOTE: Only qualified healthcare professionals can prescribe or adjust prescription medications."

        # Sanitize sensitive patterns (API keys, env paths)
        sanitized = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[PROTECTED_KEY]", sanitized)
        sanitized = re.sub(r"eyJ[a-zA-Z0-9_\-\.]+", "[PROTECTED_TOKEN]", sanitized)

        return sanitized.strip()

    @staticmethod
    def enforce_safety_constraints(
        gemini_result: Dict[str, Any],
        risk_assessment: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Validates and enforces deterministic safety rules over Gemini output.
        - Guarantees deterministic EMERGENCY override cannot be softened or downgraded.
        - Sanitizes spoken response and screen summary.
        - Injects clinical disclaimers.
        """
        safe_result = dict(gemini_result)
        is_emergency = risk_assessment.get("is_emergency", False)
        deterministic_level = risk_assessment.get("level", "LOW")

        # 1. Enforce emergency priority
        if is_emergency or deterministic_level == "EMERGENCY":
            safe_result["triage_level"] = "EMERGENCY"
            safe_result["is_emergency"] = True
            safe_result["triage_badge"] = {
                "level": "EMERGENCY",
                "title": "🔴 EMERGENCY",
                "subtext": "Immediate emergency medical evaluation recommended",
                "color": "#ef4444",
                "bg": "#fef2f2",
                "icon": "🚨"
            }
        else:
            # Map standard levels
            incoming_level = str(safe_result.get("triage_level", "ROUTINE")).upper()
            if "EMERGENCY" in incoming_level or "RED" in incoming_level:
                safe_result["triage_level"] = "EMERGENCY"
            elif "URGENT" in incoming_level or "MODERATE" in incoming_level:
                safe_result["triage_level"] = "URGENT"
            elif "INSUFFICIENT" in incoming_level:
                safe_result["triage_level"] = "INSUFFICIENT_INFO"
            else:
                safe_result["triage_level"] = "ROUTINE"

        # 2. Sanitize text outputs
        if "spoken_response" in safe_result:
            safe_result["spoken_response"] = AISafetyGuard.sanitize_ai_text(
                safe_result["spoken_response"], language
            )

        if "screen_summary" in safe_result:
            safe_result["screen_summary"] = AISafetyGuard.sanitize_ai_text(
                safe_result["screen_summary"], language
            )

        # 3. Always guarantee clinical disclaimer
        safe_result["safety_disclaimer"] = get_disclaimer(language)

        # 4. Attach deterministic vital/symptom warnings
        safe_result["safety_warnings"] = risk_assessment.get("vital_warnings", []) + risk_assessment.get("symptom_warnings", [])

        return safe_result

    @staticmethod
    def generate_deterministic_fallback(
        patient_name: str,
        symptoms: str,
        vitals: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Low-Internet / AI Failure Mode:
        When Gemini or network connectivity is completely unavailable, this deterministic
        fallback engine safely processes the patient using purely rule-based triage,
        informs the user transparently, and queues the case for human clinician review.
        """
        vitals = vitals or {}
        risk_eval = assess_triage_risk(
            symptoms=symptoms,
            temperature=vitals.get("temperature"),
            spo2=vitals.get("spo2"),
            heart_rate=vitals.get("heart_rate"),
            respiratory_rate=vitals.get("respiratory_rate"),
            systolic_bp=vitals.get("systolic_bp"),
            diastolic_bp=vitals.get("diastolic_bp"),
            language=language
        )

        is_emergency = risk_eval.get("is_emergency", False)
        triage_level = "EMERGENCY" if is_emergency else ("URGENT" if risk_eval.get("level") == "HIGH" else "ROUTINE")

        # Fallback messaging respecting selected language
        lang_messages = {
            "en": {
                "emergency_spoken": "Immediate emergency care is needed based on your safety indicators. Please seek medical help immediately.",
                "standard_spoken": "Your information has been logged safely using offline clinical rules. A healthcare professional will review your case.",
                "summary": "Offline deterministic safety triage completed. Case queued for healthcare worker verification.",
            },
            "hi": {
                "emergency_spoken": "आपके लक्षणों के आधार पर तुरंत आपातकालीन चिकित्सा सहायता की आवश्यकता है। कृपया तुरंत अस्पताल जाएं।",
                "standard_spoken": "आपकी जानकारी सुरक्षित रूप से दर्ज कर ली गई है। स्वास्थ्य कर्मी जल्द ही समीक्षा करेंगे।",
                "summary": "ऑफ़लाइन सुरक्षा ट्राइएज पूर्ण। स्वास्थ्य कार्यकर्ता समीक्षा के लिए कतारबद्ध।",
            },
            "or": {
                "emergency_spoken": "ଆପଣଙ୍କ ସୁରକ୍ଷା ଲକ୍ଷଣ ଅନୁଯାୟୀ ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯିବା ଆବଶ୍ୟକ। ଦୟାକରି ତୁରନ୍ତ ଚିକିତ୍ସା ନିଅନ୍ତୁ।",
                "standard_spoken": "ଆପଣଙ୍କ ଲକ୍ଷଣ ଅଫଲାଇନ୍ ନିୟମ ଅନୁସାରେ ଲିପିବଦ୍ଧ ହୋଇଛି। ଜଣେ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀ ଏହାକୁ ଯାଞ୍ଚ କରିବେ।",
                "summary": "ଅଫଲାଇନ୍ ସୁରକ୍ଷା ଟ୍ରାଇଜ୍ ସମ୍ପୂର୍ଣ୍ଣ। ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀ ଯାଞ୍ଚ ପାଇଁ ତାଲିକାଭୁକ୍ତ।",
            },
            "bn": {
                "emergency_spoken": "আপনার জরুরি চিকিৎসার প্রয়োজন। অনুগ্রহ করে এখনই নিকটস্থ হাসপাতালে যান।",
                "standard_spoken": "আপনার লক্ষণগুলি অফলাইনে নথিভুক্ত হয়েছে। স্বাস্থ্যকর্মী শীঘ্রই পর্যালোচনা করবেন।",
                "summary": "অফলাইন সুরক্ষা ট্রায়াজ সম্পন্ন। স্বাস্থ্যকর্মী পর্যালোচনার জন্য অপেক্ষমাণ।",
            },
            "te": {
                "emergency_spoken": "మీ అత్యవసర సంకేతాల దృష్ట్యా తక్షణమే అత్యవసర వైద్య సహాయం పొందండి.",
                "standard_spoken": "మీ సమాచారం భద్రంగా నమోదైంది. ఆరోగ్య సిబ్బంది త్వరలో పరిశీలిస్తారు.",
                "summary": "ఆఫ్‌లైన్ భద్రతా ట్రయాజ్ పూర్తయింది. ఆరోగ్య కార్యకర్త సమీక్ష కోసం నిరీక్షణలో ఉంది.",
            },
            "ta": {
                "emergency_spoken": "உங்கள் அவசர அறிகுறிகளின் அடிப்படையில் உடனடியாக அவசர மருத்துவ உதவியை நாடுங்கள்.",
                "standard_spoken": "உங்கள் தகவல்கள் பாதுகாப்பாக பதிவு செய்யப்பட்டுள்ளன. சுகாதார பணியாளர் பரிசீலிப்பார்.",
                "summary": "ஆஃப்லைன் பாதுகாப்பு ட்ரையേജ് முடிந்தது. சுகாதார பணியாளர் மதிப்பாய்வுக்காக காத்திருக்கிறது.",
            }
        }

        lang_cfg = lang_messages.get(language, lang_messages["en"])
        spoken = lang_cfg["emergency_spoken"] if is_emergency else lang_cfg["standard_spoken"]

        badge_map = {
            "EMERGENCY": {
                "level": "EMERGENCY",
                "title": "🔴 EMERGENCY (OFFLINE SAFETY ENGINE)",
                "subtext": "Immediate emergency medical evaluation recommended",
                "color": "#ef4444",
                "bg": "#fef2f2",
                "icon": "🚨"
            },
            "URGENT": {
                "level": "URGENT",
                "title": "🟠 URGENT CARE (OFFLINE SAFETY ENGINE)",
                "subtext": "Clinical evaluation recommended within 24 hours",
                "color": "#f59e0b",
                "bg": "#fffbeb",
                "icon": "⚠️"
            },
            "ROUTINE": {
                "level": "ROUTINE",
                "title": "🟢 ROUTINE (OFFLINE DETERMINISTIC) / QUEUED FOR NURSE REVIEW",
                "subtext": "Deterministic intake complete. Queued for staff review.",
                "color": "#10b981",
                "bg": "#ecfdf5",
                "icon": "📋"
            }
        }

        return {
            "spoken_response": spoken,
            "triage_level": triage_level,
            "triage_badge": badge_map.get(triage_level, badge_map["ROUTINE"]),
            "is_emergency": is_emergency,
            "screen_summary": f"[LOW-INTERNET / OFFLINE FALLBACK MODE] {lang_cfg['summary']}",
            "key_observations": [
                f"SOURCE: PATIENT - Symptoms: {symptoms[:100]}",
                f"SOURCE: MEASURED VITALS - {len(vitals)} parameters evaluated by rule engine",
                "MODE: DETERMINISTIC SAFETY RULES (Generative AI bypassed)"
            ],
            "recommended_next_steps": [
                "A qualified nurse or medical officer will review this triage summary in the facility queue.",
                "If symptoms worsen or you experience severe chest pain or shortness of breath, call 108 or proceed to the ER immediately."
            ],
            "follow_up_question": "Are your symptoms staying the same, getting worse, or improving?",
            "safety_disclaimer": get_disclaimer(language),
            "safety_warnings": risk_eval.get("vital_warnings", []) + risk_eval.get("symptom_warnings", []),
            "extracted_vitals": {},
            "updated_vitals": vitals,
            "language": language,
            "offline_mode": True,
            "patient_profile_applied": False
        }
