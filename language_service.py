# ============================================================
# HealthTriage AI - Multilingual Language Service
# Supports: English (en), Hindi (hi), Odia (or), Telugu (te), Tamil (ta)
# ============================================================

import re
from typing import Tuple, Dict, Any

# Supported Languages Definition
SUPPORTED_LANGUAGES = {
    "auto": {
        "code": "auto",
        "name": "Auto Detect",
        "native_name": "Auto Detect",
        "flag": "🌐",
        "display": "🌐 Auto Detect",
        "stt_code": "en-US",
        "tts_code": "en",
    },
    "en": {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "flag": "🇬🇧",
        "display": "🇬🇧 English",
        "stt_code": "en-US",
        "tts_code": "en",
    },
    "hi": {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिंदी",
        "flag": "🇮🇳",
        "display": "🇮🇳 हिंदी",
        "stt_code": "hi-IN",
        "tts_code": "hi",
    },
    "or": {
        "code": "or",
        "name": "Odia",
        "native_name": "ଓଡ଼ିଆ",
        "flag": "🇮🇳",
        "display": "🇮🇳 ଓଡ଼ିଆ",
        "stt_code": "or-IN",
        "tts_code": "or",
    },
    "bn": {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "flag": "🇮🇳",
        "display": "🇮🇳 বাংলা",
        "stt_code": "bn-IN",
        "tts_code": "bn",
    },
    "te": {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "flag": "🇮🇳",
        "display": "🇮🇳 తెలుగు",
        "stt_code": "te-IN",
        "tts_code": "te",
    },
    "ta": {
        "code": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "flag": "🇮🇳",
        "display": "🇮🇳 தமிழ்",
        "stt_code": "ta-IN",
        "tts_code": "ta",
    },
}

# Translated Disclaimers
SAFETY_DISCLAIMERS = {
    "en": "HealthTriage AI and SANA provide general health information and triage assistance. It is not a substitute for a qualified healthcare professional or emergency medical services.",
    "hi": "HealthTriage AI और SANA सामान्य स्वास्थ्य जानकारी और ट्राइएज सहायता प्रदान करते हैं। यह योग्य डॉक्टर या आपातकालीन चिकित्सा सेवाओं का विकल्प नहीं है।",
    "or": "HealthTriage AI ଏବଂ SANA ସାଧାରଣ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା ଏବଂ ଟ୍ରାଇଜ୍ ସହାୟତା ପ୍ରଦାନ କରେ। ଏହା ଜଣେ ଯୋଗ୍ୟ ଡାକ୍ତର କିମ୍ବା ଜରୁରୀକାଳୀନ ଚିକିତ୍ସା ସେବାର ବିକଳ୍ପ ନୁହେଁ।",
    "bn": "HealthTriage AI এবং SANA সাধারণ স্বাস্থ্য তথ্য এবং ট্রায়াজ সহায়তা প্রদান করে। এটি একজন যোগ্য ডাক্তার বা জরুরি চিকিৎসা সেবার বিকল্প নয়।",
    "te": "HealthTriage AI సాధారణ ఆరోగ్య సమాచారం మరియు ట్రయాజ్ సహాయాన్ని అందిస్తుంది. ఇది అర్హత కలిగిన వైద్య నిపుణులు లేదా అత్యవసర వైద్య సేవలకు ప్రత్యామ్నాయం కాదు.",
    "ta": "HealthTriage AI பொதுவான சுகாதார தகவல் மற்றும் ட்ரையേജ് உதவியை வழங்குகிறது. இது தகுதியான மருத்துவர் அல்லது அவசர மருத்துவ சேவைகளுக்கு மாற்றாகாது.",
}

# Default Welcome Greetings
WELCOME_MESSAGES = {
    "en": "Hello! I am SANA, your Smart AI Nursing & Assessment Assistant. I'm here when you need me. How are you feeling today?",
    "hi": "नमस्ते! मैं साना (SANA) हूँ, आपकी स्मार्ट AI नर्सिंग एवं स्वास्थ्य मूल्यांकन सहायिका। मैं आपकी मदद के लिए यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?",
    "or": "ନମସ୍କାର! ମୁଁ ସାନା (SANA), ଆପଣଙ୍କ ସ୍ମାର୍ଟ AI ନର୍ସିଂ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ଆକଳନ ସହାୟିକା। ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ମୁଁ ପ୍ରସ୍ତୁତ। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି କୁହନ୍ତୁ?",
    "bn": "নমস্কার! আমি সানা (SANA), আপনার স্মার্ট এআই নার্সিং ও স্বাস্থ্য মূল্যায়ন সহকারী। আপনার প্রয়োজনে আমি সাথে আছি। আজ আপনি কেমন অনুভব করছেন বলুন?",
    "te": "నమస్కారం! నేను సానా (SANA), మీ స్మార్ట్ AI నర్సింగ్ & హెల్త్ అసిస్టెంట్. ఈరోజు మీరు ఎలా ఉన్నారు?",
    "ta": "வணக்கம்! நான் சானா (SANA), உங்கள் ஸ்மார்ட் AI நர்சிங் & ஹெல்த் அசிஸ்டெண்ட். இன்று நீங்கள் எவ்வாறு உணர்கிறீர்கள்?",
}

# Language Switch Phrases (e.g. "अब हिंदी में बात करो", "speak in odia")
LANGUAGE_SWITCH_PATTERNS = [
    # Hindi triggers
    (r"(?:अब\s+)?हिंदी\s+में\s+(?:बात\s+करो|बात\s+कीजिए|बोलिए|बोलो|बताओ|बताइए|कहो)", "hi"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+hindi", "hi"),
    (r"\bhindi\s+please\b", "hi"),
    # Odia triggers
    (r"(?:ଏବେ\s+)?ଓଡ଼ିଆ(?:ରେ)?\s+(?:କୁହ|କୁହନ୍ତୁ|କହନ୍ତୁ|କଥା\s+ହୁଅ|କଥା\s+ହୁଅନ୍ତୁ|କହ|କଥାବାର୍ତ୍ତା\s+କର|କଥାବାର୍ତ୍ତା\s+କରନ୍ତୁ)", "or"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+odia", "or"),
    (r"\bodia\s+please\b", "or"),
    (r"\boriya\b", "or"),
    # Bengali triggers
    (r"(?:এবার\s+|এখন\s+)?বাংলা(?:য়)?\s+(?:বলুন|বলো|কথা\s+বলুন|কথা\s+বলো)", "bn"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+bengali", "bn"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+bangla", "bn"),
    (r"\bbengali\s+please\b", "bn"),
    (r"\bbangla\b", "bn"),
    # Telugu triggers
    (r"(?:ఇప్పుడు\s+)?తెలుగు(?:లో)?\s+(?:మాట్లాడు|చెప్పు|రాయి)", "te"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+telugu", "te"),
    (r"\btelugu\s+please\b", "te"),
    # Tamil triggers
    (r"(?:இப்போது\s+)?தமிழ்(?:இல்)?\s+(?:பேசுங்கள்|பேசு|கூறு)", "ta"),
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+tamil", "ta"),
    (r"\btamil\s+please\b", "ta"),
    # English triggers
    (r"(?:switch\s+to|speak\s+in|talk\s+in|in)\s+english", "en"),
    (r"\benglish\s+please\b", "en"),
]

# Unicode Ranges for Indic Scripts
SCRIPT_RANGES = {
    "or": (0x0B00, 0x0B7F),  # Odia script
    "bn": (0x0980, 0x09FF),  # Bengali script
    "te": (0x0C00, 0x0C7F),  # Telugu script
    "ta": (0x0B80, 0x0BFF),  # Tamil script
    "hi": (0x0900, 0x097F),  # Devanagari script (Hindi, Marathi, etc.)
}


def detect_language(text: str, default: str = "en") -> str:
    """
    Detect the language of the user input text.
    Handles explicit language switch requests first,
    then evaluates character script frequencies.
    Returns: language code ('en', 'hi', 'or', 'te', 'ta')
    """
    if not text or not text.strip():
        return default

    clean_text = text.strip()
    lower_text = clean_text.lower()

    # 1. Check for explicit language switch requests
    for pattern, lang_code in LANGUAGE_SWITCH_PATTERNS:
        if re.search(pattern, lower_text, re.IGNORECASE):
            return lang_code

    # 2. Count script characters
    script_counts = {
        "or": 0,
        "bn": 0,
        "te": 0,
        "ta": 0,
        "hi": 0,
        "en": 0,
    }

    for char in clean_text:
        code_point = ord(char)
        matched = False
        for lang_code, (start, end) in SCRIPT_RANGES.items():
            if start <= code_point <= end:
                script_counts[lang_code] += 1
                matched = True
                break
        if not matched and ('a' <= char <= 'z' or 'A' <= char <= 'Z'):
            script_counts["en"] += 1

    # Check Indic scripts first
    indic_counts = {k: v for k, v in script_counts.items() if k != "en" and v > 0}
    if indic_counts:
        # Return the Indic language with highest count
        best_indic = max(indic_counts, key=indic_counts.get)
        return best_indic

    # If Latin characters dominate or no Indic characters found
    if script_counts["en"] > 0:
        return "en"

    return default


def get_language_display_name(lang_code: str) -> str:
    """Get the user-facing display label for a language code."""
    lang_info = SUPPORTED_LANGUAGES.get(lang_code, SUPPORTED_LANGUAGES["en"])
    return f"{lang_info['flag']} {lang_info['name']} ({lang_info['native_name']})"


def get_disclaimer(lang_code: str) -> str:
    """Get the safety disclaimer in the target language."""
    return SAFETY_DISCLAIMERS.get(lang_code, SAFETY_DISCLAIMERS["en"])


def get_welcome_message(lang_code: str) -> str:
    """Get the opening greeting in the target language."""
    return WELCOME_MESSAGES.get(lang_code, WELCOME_MESSAGES["en"])
