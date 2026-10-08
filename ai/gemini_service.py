# ============================================================
# HealthTriage AI - Gemini Multimodal Healthcare Service
# ============================================================

import base64
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types

from ai.prompts import SYSTEM_PROMPT, TRIAGE_CATEGORIES
from language_service import detect_language, SUPPORTED_LANGUAGES


# ============================================================
# GEMINI MODEL CONFIGURATION
# ============================================================

PRIMARY_MODEL = "gemini-3.5-flash-lite"

BACKUP_MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-pro-latest",
]


# ============================================================
# CONVERSATION CONTEXT BUILDER
# ============================================================

def build_conversation_context(conversation: Optional[List[Dict[str, Any]]]) -> str:
    """
    Format previous chat messages into structured clinical dialogue history
    so HealthTriage AI remembers user details (name, age, symptoms) across turns.
    """
    if not conversation:
        return "No previous conversation."

    conversation_parts = []

    for message in conversation:
        role = message.get("role", "")
        content = message.get("content", "")

        if not content:
            continue

        if role == "user":
            conversation_parts.append(f"Patient: {content}")
        elif role == "assistant":
            conversation_parts.append(f"HealthTriage AI: {content}")

    # Keep last 16 messages for deep conversational context
    recent_messages = conversation_parts[-16:]

    if not recent_messages:
        return "No previous conversation."

    return "\n".join(recent_messages)


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_prompt(
    name=None,
    age=None,
    gender=None,
    symptoms="",
    temperature=None,
    spo2=None,
    heart_rate=None,
    respiratory_rate=None,
    systolic_bp=None,
    diastolic_bp=None,
    safety_warnings=None,
    conversation=None,
    language="auto",
    final_assessment=False
) -> str:
    """
    Construct the complete prompt for Gemini incorporating:
    - HealthTriage AI clinical system prompt and safety rules
    - Multilingual instructions (en, hi, or, te, ta)
    - Patient vitals, reported symptoms, and conversation history
    """
    if safety_warnings:
        warnings = "\n".join(f"- {warning}" for warning in safety_warnings)
    else:
        warnings = "- No vital-sign red flags detected by the safety engine."

    conversation_context = build_conversation_context(conversation)

    # Format vital signs
    vitals_provided = any(
        v is not None
        for v in [temperature, spo2, heart_rate, respiratory_rate, systolic_bp, diastolic_bp]
    )

    if vitals_provided:
        bp_str = f"{systolic_bp}/{diastolic_bp} mmHg" if (systolic_bp and diastolic_bp) else "Not provided"
        vitals_text = f"""
- Heart Rate: {heart_rate if heart_rate is not None else "Not provided"} BPM
- SpO2 (Blood Oxygen): {spo2 if spo2 is not None else "Not provided"}%
- Temperature: {temperature if temperature is not None else "Not provided"}
- Respiratory Rate: {respiratory_rate if respiratory_rate is not None else "Not provided"} breaths/min
- Blood Pressure: {bp_str}
"""
    else:
        vitals_text = "No vital signs were provided (Vital signs are strictly optional)."

    # Determine language guidance
    if language and language != "auto" and language in SUPPORTED_LANGUAGES:
        target_info = SUPPORTED_LANGUAGES[language]
        lang_instruction = (
            f"MANDATORY LANGUAGE: You MUST generate your response directly in {target_info['name']} ({target_info['native_name']}). "
            "Maintain fluent, empathetic, and culturally respectful phrasing. "
            "Preserve all medical terms, medication names, dosages, numbers, and units without distortion."
        )
    else:
        lang_instruction = (
            "LANGUAGE AUTO-DETECTION: Detect the language of the user's latest message or spoken input. "
            "If the user writes in English, reply in English. "
            "If the user writes in Hindi (हिंदी), reply in Hindi. "
            "If the user writes in Odia (ଓଡ଼ିଆ), reply in Odia. "
            "If the user writes in Telugu (తెలుగు), reply in Telugu. "
            "If the user writes in Tamil (தமிழ்), reply in Tamil. "
            "If the user asks to switch languages (e.g., 'अब हिंदी में बात करो', 'ଏବେ ଓଡ଼ିଆରେ କୁହ', 'speak in telugu'), "
            "switch to that language IMMEDIATELY without losing any prior conversation memory."
        )

    if final_assessment:
        mode = f"""
{lang_instruction}

Generate your complete triage assessment following this exact structured format:

### 1. Empathy & Understanding
Validate the user's feelings and situation in 1-2 supportive sentences.

### 2. Triage Category
Specify ONE of the four categories on its own line:
- 🔴 Emergency (Immediate ER / Ambulance)
- 🟠 High Urgency (Urgent Care / Doctor within 24 hours)
- 🟡 Moderate (Doctor Visit within 24–48 hours)
- 🟢 Low / Self-Care & Monitoring

### 3. Plain-Language Explanation
Explain clearly what could be contributing to the symptoms. Frame these as possibilities to explore with a medical professional, never a definitive diagnosis.

### 4. Key Findings & Observations
Summarize reported symptoms, correlated vital signs, or findings from uploaded reports/images.

### 5. Clinical Follow-Up Questions
If any vital detail is missing, ask 1 or 2 targeted questions (e.g. duration, pain 1-10, radiation). If complete, state no further questions needed.

### 6. Recommended Next Steps
Practical, clear guidance on seeking care or safe home comfort steps.

### 7. Important Safety Disclaimer
Include the standard safety disclaimer in the target language.
"""
    else:
        mode = f"""
{lang_instruction}

Respond warmly, empathetically, and conversationally as HealthTriage AI.
- Keep the response clear, calm, and natural (avoid excessively long lectures).
- Acknowledge their concern and ask 1 to 2 gentle follow-up questions if needed (e.g., severity scale 1-10, duration, accompanying signs).
- Remember information already provided in the conversation (e.g. name, age, past symptoms). Do NOT ask for information the patient already provided.
- If emergency symptoms are present, advise seeking emergency medical care immediately.
- Never offer a definitive disease diagnosis.
- Include the standard safety disclaimer in the response language.
"""

    return f"""
{SYSTEM_PROMPT}

============================================================
PATIENT PROFILE
============================================================
Name: {name if name else "Not specified"}
Age: {age if age is not None else "Not specified"}
Gender: {gender if gender else "Not specified"}

============================================================
VITAL SIGNS (OPTIONAL)
============================================================
{vitals_text}

============================================================
INDEPENDENT SAFETY ENGINE SIGNALS
============================================================
{warnings}

============================================================
LATEST PATIENT INPUT / SYMPTOMS
============================================================
{symptoms}

============================================================
RECENT CONVERSATION HISTORY
============================================================
{conversation_context}

============================================================
TASK INSTRUCTIONS
============================================================
{mode}

Remember:
- Use clean Markdown formatting. Do not output HTML tags.
- HealthTriage AI is NOT a doctor. Prioritize patient safety at all times.
"""


# ============================================================
# MULTIMODAL FILE HANDLING (IMAGES, PDF, AUDIO)
# ============================================================

def make_file_part(uploaded_file):
    """Convert various file input formats into a Gemini Part."""
    if uploaded_file is None:
        return None

    try:
        data = None
        mime_type = "application/octet-stream"

        # Case 1: Browser base64 data URL
        if isinstance(uploaded_file, str):
            if uploaded_file.startswith("data:") and ";base64," in uploaded_file:
                header, encoded = uploaded_file.split(";base64,", 1)
                mime_type = header.replace("data:", "")
                data = base64.b64decode(encoded)
            else:
                try:
                    data = base64.b64decode(uploaded_file)
                except Exception:
                    data = uploaded_file.encode("utf-8")
                    mime_type = "text/plain"

        # Case 2: Dict format {"data": ..., "mime_type": ...}
        elif isinstance(uploaded_file, dict):
            raw_data = uploaded_file.get("data")
            mime_type = uploaded_file.get("mime_type") or mime_type
            if isinstance(raw_data, str) and raw_data.startswith("data:"):
                return make_file_part(raw_data)
            elif isinstance(raw_data, str):
                try:
                    data = base64.b64decode(raw_data)
                except Exception:
                    data = raw_data.encode("utf-8")
            elif isinstance(raw_data, (bytes, bytearray)):
                data = bytes(raw_data)

        # Case 3: Streamlit UploadedFile
        elif hasattr(uploaded_file, "getvalue"):
            data = uploaded_file.getvalue()
            mime_type = (
                getattr(uploaded_file, "type", None)
                or getattr(uploaded_file, "content_type", None)
                or mime_type
            )

        # Case 4: File-like with .read()
        elif hasattr(uploaded_file, "read"):
            data = uploaded_file.read()
            mime_type = getattr(uploaded_file, "content_type", None) or mime_type

        # Case 5: Raw bytes
        elif isinstance(uploaded_file, (bytes, bytearray)):
            data = bytes(uploaded_file)

        if not data:
            return None

        # Normalize common MIME types
        if mime_type == "application/octet-stream" and hasattr(uploaded_file, "name"):
            name = uploaded_file.name.lower()
            if name.endswith(".pdf"):
                mime_type = "application/pdf"
            elif name.endswith(".png"):
                mime_type = "image/png"
            elif name.endswith((".jpg", ".jpeg")):
                mime_type = "image/jpeg"
            elif name.endswith(".wav"):
                mime_type = "audio/wav"
            elif name.endswith(".mp3"):
                mime_type = "audio/mp3"

        return types.Part.from_bytes(data=data, mime_type=mime_type)

    except Exception as error:
        print("Unable to process uploaded file for Gemini:", error)
        return None


# ============================================================
# GEMINI PATIENT ANALYSIS
# ============================================================

def analyze_patient(
    api_key: str,
    name=None,
    age=None,
    gender=None,
    symptoms="",
    temperature=None,
    spo2=None,
    heart_rate=None,
    respiratory_rate=None,
    systolic_bp=None,
    diastolic_bp=None,
    safety_warnings=None,
    report=None,
    image=None,
    audio=None,
    conversation=None,
    language="auto",
    final_assessment=False
) -> str:
    """
    Centralized Gemini multimodal call.
    Accepts patient info, vitals, text symptoms, medical reports, images,
    audio, and conversation memory.
    """
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY was not found. Please verify your .env file.")

    if safety_warnings is None:
        safety_warnings = []

    client = genai.Client(api_key=api_key)

    prompt = build_prompt(
        name=name,
        age=age,
        gender=gender,
        symptoms=symptoms,
        temperature=temperature,
        spo2=spo2,
        heart_rate=heart_rate,
        respiratory_rate=respiratory_rate,
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp,
        safety_warnings=safety_warnings,
        conversation=conversation,
        language=language,
        final_assessment=final_assessment
    )

    contents = [prompt]

    # Attach medical report
    if report is not None:
        report_part = make_file_part(report)
        if report_part:
            contents.append(report_part)

    # Attach medical image
    if image is not None:
        image_part = make_file_part(image)
        if image_part:
            contents.append(image_part)

    # Attach audio recording
    if audio is not None:
        audio_part = make_file_part(audio)
        if audio_part:
            contents.append(audio_part)

    models = [PRIMARY_MODEL, *BACKUP_MODELS]
    last_error = None

    print(f"\n[HealthTriage AI] Sending request with language='{language}'...")

    for model in models:
        try:
            print(f"Trying Gemini model: {model}...")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.25,
                    max_output_tokens=1400
                )
            )

            if response and response.text:
                result = response.text.strip().replace(r"\###", "###")
                print(f"[HealthTriage AI] SUCCESS with {model}\n")
                return result

            raise RuntimeError("Gemini returned an empty response.")

        except Exception as error:
            last_error = error
            print(f"[HealthTriage AI] Model {model} failed: {error}. Trying next...")
            continue

    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")