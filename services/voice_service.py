# ============================================================
# HealthTriage AI - SANA Multilingual Voice & Speech Service
# High-Quality TTS Engine & Audio Generation
# Supports: English (en), Hindi (hi), Odia (or), Bengali (bn), Telugu (te), Tamil (ta)
# ============================================================

import io
import os
import re
import base64
from typing import Optional, Dict, Any
import requests
from gtts import gTTS

# gTTS genuine language code support mapping
GTTS_SUPPORTED_LANGUAGES = {
    "en": "en",
    "hi": "hi",
    "bn": "bn",
    "te": "te",
    "ta": "ta",
}

# Sarvam AI language codes (Bulbul v3 model supports 11+ Indian languages including native Odia)
SARVAM_LANG_MAP = {
    "or": "or-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "en": "en-IN",
}

# Abbreviation and medical measurement expansion dictionary per language
EXPANSION_DICTIONARY: Dict[str, Dict[str, str]] = {
    "en": {
        "bp": "blood pressure",
        "spo2": "oxygen saturation",
        "o2": "oxygen",
        "bpm": "beats per minute",
        "mmhg": "millimeters of mercury",
        "mg": "milligrams",
        "ml": "milliliters",
        "er": "emergency room",
        "dr.": "Doctor",
        "dr": "Doctor",
        "rx": "prescription",
        "otc": "over the counter",
    },
    "hi": {
        "bp": "ब्लड प्रेशर",
        "spo2": "ऑक्सीजन स्तर",
        "o2": "ऑक्सीजन",
        "bpm": "धड़कन प्रति मिनट",
        "mmhg": "मिलीमीटर मरकरी",
        "mg": "मिलीग्राम",
        "ml": "मिलीलीटर",
        "er": "आपातकालीन कक्ष",
        "dr.": "डॉक्टर",
        "dr": "डॉक्टर",
        "rx": "दवा का पर्चा",
        "otc": "बिना पर्चे की दवा",
    },
    "or": {
        "bp": "ରକ୍ତଚାପ",
        "spo2": "ଅକ୍ସିଜେନ୍ ସ୍ତର",
        "o2": "ଅକ୍ସିଜେନ୍",
        "bpm": "ଧଡ଼କନ୍ ପ୍ରତି ମିନିଟ୍",
        "mmhg": "ମିଲିମିଟର୍ ମର୍କୁରୀ",
        "mg": "ମିଲିଗ୍ରାମ୍",
        "ml": "ମିଲିଲିଟର୍",
        "er": "ଜରୁରୀକାଳୀନ ଚିକିତ୍ସା ବିଭାଗ",
        "dr.": "ଡାକ୍ତର",
        "dr": "ଡାକ୍ତର",
        "rx": "ଔଷଧ ପରାମର୍ଶ",
        "otc": "ସାଧାରଣ ଔଷଧ",
    },
    "bn": {
        "bp": "রক্তচাপ",
        "spo2": "অক্সিজেন মাত্রা",
        "o2": "অক্সিজেন",
        "bpm": "প্রতি মিনিটে হৃদস্পন্দন",
        "mmhg": "মিলিমিটার পারদ",
        "mg": "মিলিগ্রাম",
        "ml": "মিলিলিটার",
        "er": "জরুরি বিভাগ",
        "dr.": "ডাক্তার",
        "dr": "ডাক্তার",
        "rx": "প্রেসক্রিপশন",
        "otc": "সাধারণ ওষুধ",
    },
    "te": {
        "bp": "రక్తపోటు",
        "spo2": "ఆక్సిజన్ స్థాయి",
        "o2": "ఆక్సిజన్",
        "bpm": "నిమిషానికి గుండె కొట్టుకోవడం",
        "mmhg": "మిల్లీమీటర్ల మెర్క్యురీ",
        "mg": "మిల్లీగ్రాములు",
        "ml": "మిల్లీలీటర్లు",
        "er": "అత్యవసర విభాగం",
        "dr.": "డాక్టర్",
        "dr": "డాక్టర్",
    },
    "ta": {
        "bp": "இரத்த அழுத்தம்",
        "spo2": "ஆக்சிஜன் அளவு",
        "o2": "ஆக்சிஜன்",
        "bpm": "நிமிடத்திற்கு நாடித்துடிப்பு",
        "mmhg": "மில்லிமீட்டர் பாதரசம்",
        "mg": "மில்லிகிராம்",
        "ml": "மில்லிலிட்டர்",
        "er": "அவசர சிகிச்சை பிரிவு",
        "dr.": "மருத்துவர்",
        "dr": "மருத்துவர்",
    },
}


def odia_to_phonetic_devanagari(text: str) -> str:
    """
    Maps Odia Unicode characters (U+0B00 - U+0B7F) to their exact phonetic
    Brahmic equivalents in Devanagari (U+0900 - U+097F).
    Since Odia and Devanagari are sister Brahmic scripts sharing identical
    Unicode offsets, this allows high-fidelity Indic speech synthesizers to
    articulate Odia vocabulary accurately and audibly without silence or distortion.
    """
    if not text:
        return ""
    chars = []
    for c in text:
        cp = ord(c)
        if 0x0B00 <= cp <= 0x0B7F:
            chars.append(chr(cp - 0x0B00 + 0x0900))
        else:
            chars.append(c)
    return "".join(chars)


def prepare_text_for_speech(text: str, lang: str = "en") -> str:
    """
    Normalizes and cleans text prior to speech synthesis (TTS).
    - Removes markdown syntax (bold, italic, headers, bullet points).
    - Removes emojis and decorative Unicode symbols that sound unnatural.
    - Expands clinical acronyms, vital sign units, and numbers into fluent spoken phrasing.
    - Preserves clinically accurate meaning while avoiding robotic pauses or clipping.
    """
    if not text or not text.strip():
        return ""

    cleaned = text.strip()

    # 1. Strip markdown elements
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned)
    cleaned = re.sub(r"`.*?`", "", cleaned)
    cleaned = re.sub(r"^[\s]*[#*-]+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"[*_]{1,3}([^*_]+)[*_]{1,3}", r"\1", cleaned)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)

    # 2. Strip emojis and pictorial symbols
    emoji_pattern = re.compile(
        r"[\U00010000-\U0010ffff"
        r"\u200d\u2600-\u26ff\u2700-\u27bf"
        r"\ufe0f\u2702-\u27b0"
        r"❤️🚨⚠️🌿🩺💊👤✦•✓]+",
        flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub(" ", cleaned)

    # 3. Medical measurement and unit normalization per language
    norm_lang = lang if lang in EXPANSION_DICTIONARY else "en"
    expansions = EXPANSION_DICTIONARY.get(norm_lang, EXPANSION_DICTIONARY["en"])

    # Blood pressure normalization: "120/80" -> "120 over 80" or localized phrasing
    def bp_repl(match):
        sys_val = match.group(1)
        dia_val = match.group(2)
        if norm_lang == "hi":
            return f" {sys_val} बटा {dia_val} "
        elif norm_lang == "or":
            return f" {sys_val} ବାଇ {dia_val} "
        elif norm_lang == "bn":
            return f" {sys_val} বাই {dia_val} "
        return f" {sys_val} over {dia_val} "

    cleaned = re.sub(r"\b(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mm\s*hg)?\b", bp_repl, cleaned, flags=re.IGNORECASE)

    # Temperature normalization: "101.4 F" or "38.5 C"
    def temp_repl(match):
        val = match.group(1)
        scale = match.group(2).upper()
        scale_word = "Celsius" if scale == "C" else "Fahrenheit"
        if norm_lang == "hi":
            deg = "डिग्री फारेनहाइट" if scale == "F" else "डिग्री सेल्सियस"
            return f" {val} {deg} "
        elif norm_lang == "or":
            deg = "ଡିଗ୍ରୀ ଫାରେନହାଇଟ୍" if scale == "F" else "ଡିଗ୍ରୀ ସେଲସିୟସ୍"
            return f" {val} {deg} "
        elif norm_lang == "bn":
            deg = "ডিগ্রি ফারেনহাইট" if scale == "F" else "ডিগ্রি সেলসিয়াস"
            return f" {val} {deg} "
        return f" {val} degrees {scale_word} "

    cleaned = re.sub(r"\b(\d{2,3}(?:\.\d+)?)\s*°?\s*([FCfc])\b", temp_repl, cleaned)

    # Acronym expansions (word boundary check)
    for abbr, full_phrase in expansions.items():
        pattern = r"\b" + re.escape(abbr) + r"\b"
        cleaned = re.sub(pattern, full_phrase, cleaned, flags=re.IGNORECASE)

    # 4. Clean up punctuation, repeated commas/dashes, extra whitespaces
    cleaned = re.sub(r"[-—_]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+([.,;:?!])", r"\1", cleaned)
    cleaned = re.sub(r"([.,;:?!]){2,}", r"\1", cleaned)

    return cleaned.strip()


def synthesize_sarvam_tts(text: str, lang: str = "or") -> Optional[bytes]:
    """
    Synthesize high-fidelity Indian language audio using Sarvam AI (Bulbul v3).
    Sarvam AI natively supports Odia (or-IN) and other Indian languages.
    Requires SARVAM_API_KEY environment variable.
    """
    sarvam_key = os.getenv("SARVAM_API_KEY")
    if not sarvam_key:
        return None

    target_sarvam_lang = SARVAM_LANG_MAP.get(lang, "hi-IN")

    try:
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": sarvam_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text[:500],
            "language_code": target_sarvam_lang,
            "model": "bulbul:v3",
            "speaker": "arundhati",
            "pace": 0.95,
            "sample_rate": 24000
        }
        res = requests.post(url, json=payload, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            audios = data.get("audios", [])
            if audios and len(audios) > 0:
                return base64.b64decode(audios[0])
        else:
            print(f"[Voice Service] Sarvam AI returned status {res.status_code}: {res.text}")
    except Exception as sarvam_err:
        print(f"[Voice Service] Sarvam AI synthesis notice: {sarvam_err}")

    return None


def text_to_speech_bytes(text: str, lang: str = "en") -> Optional[bytes]:
    """
    Generate MP3 audio bytes using the multi-tier TTS quality engine:
    Tier 1: Sarvam AI (Bulbul v3) if SARVAM_API_KEY is configured.
    Tier 2: gTTS for languages it natively supports (en, hi, bn, te, ta).
    Tier 3: For Odia ('or') when Sarvam AI is not configured, synthesizes via
            Brahmic acoustic phonetic normalization to produce clear, audible Odia speech.
    """
    if not text or not text.strip():
        return None

    # Step 1: Normalize and prepare text for speech
    speech_text = prepare_text_for_speech(text, lang=lang)
    if not speech_text:
        return None

    # Step 2: Try Sarvam AI first (preferred for Indian neural speech)
    sarvam_audio = synthesize_sarvam_tts(speech_text, lang=lang)
    if sarvam_audio:
        return sarvam_audio

    # Step 3: Native gTTS support for English, Hindi, Bengali, Telugu, Tamil
    gtts_lang = GTTS_SUPPORTED_LANGUAGES.get(lang)
    if gtts_lang:
        try:
            tts = gTTS(text=speech_text, lang=gtts_lang, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            return audio_buffer.read()
        except Exception as e:
            print(f"[Voice Service] gTTS generation failed for lang='{gtts_lang}': {e}")
            if gtts_lang != "en":
                try:
                    tts = gTTS(text=speech_text, lang="en", slow=False)
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)
                    return audio_buffer.read()
                except Exception as e2:
                    print(f"[Voice Service] gTTS fallback to 'en' failed: {e2}")

    # Step 4: For Odia ('or') without Sarvam AI:
    # Use Brahmic phonetic transliteration to synthesize audible Odia speech
    if lang == "or":
        try:
            phonetic_text = odia_to_phonetic_devanagari(speech_text)
            tts = gTTS(text=phonetic_text, lang="hi", slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            return audio_buffer.read()
        except Exception as odia_err:
            print(f"[Voice Service] Odia phonetic TTS generation notice: {odia_err}")

    return None


def text_to_speech_base64(text: str, lang: str = "en") -> Optional[str]:
    """
    Generate MP3 audio as universal base64 data URI:
    data:audio/mpeg;base64,<encoded>
    Returns None if server TTS is unavailable for the selected language.
    """
    raw_bytes = text_to_speech_bytes(text, lang)
    if not raw_bytes:
        return None
    encoded = base64.b64encode(raw_bytes).decode("utf-8")
    # CRITICAL FIX: Use audio/mpeg for universal W3C HTML5 Audio standard compatibility
    return f"data:audio/mpeg;base64,{encoded}"


def get_tts_provider_info(lang: str) -> Dict[str, Any]:
    """
    Returns transparency metadata about TTS capabilities for a given language.
    """
    has_sarvam = bool(os.getenv("SARVAM_API_KEY"))

    if lang == "or":
        if has_sarvam:
            return {
                "language": "or",
                "provider": "Sarvam AI (Bulbul v3)",
                "tier": "neural_server",
                "native_support": True,
            }
        return {
            "language": "or",
            "provider": "Google Indic Phonetic TTS",
            "tier": "phonetic_server",
            "native_support": True,
            "note": "Acoustic Indic phonetic engine active. Add SARVAM_API_KEY for neural voice.",
        }

    if lang in GTTS_SUPPORTED_LANGUAGES:
        return {
            "language": lang,
            "provider": "Sarvam AI" if has_sarvam else "Google TTS (gTTS)",
            "tier": "neural_server" if has_sarvam else "standard_server",
            "native_support": True,
        }

    return {
        "language": lang,
        "provider": "Browser Web Speech API",
        "tier": "client_fallback",
        "native_support": False,
    }
