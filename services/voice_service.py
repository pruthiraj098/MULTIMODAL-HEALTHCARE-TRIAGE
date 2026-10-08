# ============================================================
# HealthTriage AI - SANA Voice Service
# Text-to-Speech (TTS) & Audio Generation
# ============================================================

import io
import base64
from typing import Optional
from gtts import gTTS


# Mapping of application language codes to gTTS language codes
TTS_LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "bn": "bn",
    "te": "te",
    "ta": "ta",
    # gTTS does not have native Odia; Hindi or English can be used as fallback
    # while the frontend Web Speech API utilizes browser native Odia voices
    "or": "hi",
}


def text_to_speech_bytes(text: str, lang: str = "en") -> Optional[bytes]:
    """
    Generate MP3 audio bytes using gTTS.
    Returns bytes or None if generation fails.
    """
    if not text or not text.strip():
        return None

    clean_text = text.strip()
    target_lang = TTS_LANG_MAP.get(lang, "en")

    try:
        tts = gTTS(text=clean_text, lang=target_lang, slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer.read()
    except Exception as e:
        print(f"[Voice Service] gTTS generation failed for lang='{target_lang}': {e}")
        # Retry with English if target language failed
        if target_lang != "en":
            try:
                tts = gTTS(text=clean_text, lang="en", slow=False)
                audio_buffer = io.BytesIO()
                tts.write_to_fp(audio_buffer)
                audio_buffer.seek(0)
                return audio_buffer.read()
            except Exception as e2:
                print(f"[Voice Service] Fallback to 'en' also failed: {e2}")
        return None


def text_to_speech_base64(text: str, lang: str = "en") -> Optional[str]:
    """
    Generate MP3 audio as base64 data URI:
    data:audio/mp3;base64,<encoded>
    """
    raw_bytes = text_to_speech_bytes(text, lang)
    if not raw_bytes:
        return None
    encoded = base64.b64encode(raw_bytes).decode("utf-8")
    return f"data:audio/mp3;base64,{encoded}"
