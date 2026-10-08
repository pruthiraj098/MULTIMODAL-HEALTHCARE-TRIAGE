# ============================================================
# HealthTriage AI - SANA Conversation & Triage Engine (Phase 8)
# Smart AI Nursing & Assessment Assistant
# Central Intelligence Hub connecting:
# 1. Health Monitoring & Physiological Trends (Phase 2)
# 2. AI Health Risk Score & Longitudinal Risk (Phase 3)
# 3. Smart Medical Report Analyzer (Phase 4)
# 4. Medication Guidance & Drug Interaction Checks (Phase 5)
# 5. Evidence-Based Natural & Self-Care Guidance (Phase 6)
# 6. Nearby Emergency Trauma Center Locator (Phase 7)
# ============================================================

import re
import json
from typing import Optional, List, Dict, Any, Union
from google import genai
from google.genai import types

from ai.prompts import SANA_SYSTEM_PROMPT, TRIAGE_CATEGORIES
from ai.risk_engine import check_vital_signs, assess_triage_risk
from ai.gemini_service import PRIMARY_MODEL, BACKUP_MODELS, make_file_part
from ai.ai_safety_guard import AISafetyGuard
from language_service import detect_language, SUPPORTED_LANGUAGES, get_disclaimer


# ============================================================
# VERBAL VITAL SIGNS EXTRACTION
# ============================================================

def extract_vitals_from_speech(text: str) -> Dict[str, Any]:
    """
    Extracts numerical vital signs spoken in natural language.
    Examples:
    - "My oxygen is 91" -> spo2: 91
    - "heart rate is 110" / "pulse is 85" -> heart_rate: 110
    - "temperature is 101.4" / "fever is 102" -> temperature: 101.4
    - "BP is 130 over 85" / "BP is 140/90" -> systolic: 140, diastolic: 90
    - "breathing 24" -> respiratory_rate: 24
    """
    extracted: Dict[str, Any] = {}
    if not text:
        return extracted

    clean = text.lower()

    # SpO2 / Oxygen (e.g. "oxygen is 91", "checked my oxygen and it is 91", "spo2 94%")
    spo2_match = re.search(
        r"(?:oxygen|spo2|o2|sat(?:uration)?)(?:\s+(?:level|reading|count))?(?:\s+(?:is|was|at|of|showed|shows|and\s+it\s+is|is\s+around|is\s+about|:))?\s*(\d{2,3})(?:\s*%)?",
        clean
    )
    if spo2_match:
        try:
            val = float(spo2_match.group(1))
            if 50 <= val <= 100:
                extracted["spo2"] = val
        except ValueError:
            pass

    # Heart Rate / Pulse (e.g. "heart rate is 110", "pulse is 85", "heart rate around 95")
    hr_match = re.search(
        r"(?:heart\s*rate|pulse(?:\s*rate)?|bpm)(?:\s+(?:reading))?(?:\s+(?:is|was|at|of|showed|shows|and\s+it\s+is|is\s+around|is\s+about|:))?\s*(\d{2,3})",
        clean
    )
    if hr_match:
        try:
            val = float(hr_match.group(1))
            if 30 <= val <= 240:
                extracted["heart_rate"] = val
        except ValueError:
            pass

    # Temperature / Fever (e.g. "temp is 101.4", "fever is 102", "temperature 102.5")
    temp_match = re.search(
        r"(?:temp(?:erature)?|fever)(?:\s+(?:reading))?(?:\s+(?:is|was|at|of|showed|shows|and\s+it\s+is|is\s+around|is\s+about|:))?\s*(\d{2,3}(?:\.\d)?)",
        clean
    )
    if temp_match:
        try:
            val = float(temp_match.group(1))
            if (34.0 <= val <= 43.0) or (93.0 <= val <= 108.0):
                extracted["temperature"] = val
        except ValueError:
            pass

    # Blood Pressure (e.g. "120/80" or "120 over 80", "BP is 140 over 90")
    bp_match = re.search(
        r"(?:bp|blood\s*pressure)(?:\s+(?:reading))?(?:\s+(?:is|was|at|of|showed|shows|and\s+it\s+is|is\s+around|is\s+about|:))?\s*(\d{2,3})\s*(?:/|over)\s*(\d{2,3})",
        clean
    )
    if bp_match:
        try:
            sys_val = float(bp_match.group(1))
            dia_val = float(bp_match.group(2))
            if 60 <= sys_val <= 260 and 40 <= dia_val <= 160:
                extracted["systolic_bp"] = sys_val
                extracted["diastolic_bp"] = dia_val
        except ValueError:
            pass

    # Respiratory rate
    resp_match = re.search(
        r"(?:respirat(?:ion|ory)|breath(?:ing)?\s*rate)\s*(?:is|was|:)?\s*(\d{1,2})",
        clean
    )
    if resp_match:
        try:
            val = float(resp_match.group(1))
            if 6 <= val <= 60:
                extracted["respiratory_rate"] = val
        except ValueError:
            pass

    return extracted


# ============================================================
# CONVERSATION CONTEXT FORMATTER
# ============================================================

def format_sana_history(conversation: Optional[List[Dict[str, Any]]]) -> str:
    """Format dialogue history into structured SANA turn transcripts."""
    if not conversation:
        return "No prior turns in this session."

    turns = []
    for msg in conversation:
        role = msg.get("role", "")
        content = msg.get("content") or msg.get("spoken_response") or ""
        if not content:
            continue
        if role == "user":
            turns.append(f"Patient: {content}")
        elif role in ["assistant", "sana"]:
            turns.append(f"SANA: {content}")

    recent = turns[-12:]
    return "\n".join(recent) if recent else "No prior turns in this session."


# ============================================================
# MEDICATION & INTERACTION CHECKER HELPER FOR SANA
# ============================================================

KNOWN_SUBSTANCES_TO_CHECK = [
    "aspirin", "ibuprofen", "advil", "motrin", "paracetamol", "acetaminophen",
    "tylenol", "naproxen", "aleve", "turmeric", "curcumin", "ginger", "ginseng",
    "ginkgo", "st john", "st. john", "garlic", "clarithromycin", "ciprofloxacin",
    "grapefruit", "alcohol", "potassium", "vitamin k", "spinach", "kale"
]

def check_patient_medication_context(
    user_message: str,
    active_medications: Optional[List[Any]] = None
) -> List[Dict[str, Any]]:
    """
    Cross-checks active patient medications and any newly mentioned substances
    in patient dialogue against known drug-drug and food-drug interactions.
    """
    cautions: List[Dict[str, Any]] = []
    if not active_medications:
        return cautions

    from ai.medication_guidance import check_drug_interactions, FOOD_LIFESTYLE_RULES

    # Normalize active medication names
    active_med_names = []
    for m in active_medications:
        if isinstance(m, dict):
            name = m.get("name") or m.get("medication_name") or ""
            if name:
                active_med_names.append(name.strip())
        elif isinstance(m, str) and m.strip():
            active_med_names.append(m.strip())

    if not active_med_names:
        return cautions

    clean_msg = user_message.lower()

    # Detect any OTC drugs, herbs, or substances mentioned by user
    detected_substances = [
        sub for sub in KNOWN_SUBSTANCES_TO_CHECK
        if re.search(r"\b" + re.escape(sub) + r"\b", clean_msg)
    ]

    # Combine active medications with mentioned substances to check interactions
    combined_drugs_to_check = list(set(active_med_names + detected_substances))

    if len(combined_drugs_to_check) >= 2:
        try:
            interaction_result = check_drug_interactions(combined_drugs_to_check)
            inters = interaction_result.get("interactions", [])
            for inter in inters:
                d_a = inter.get("drug_a") or ""
                d_b = inter.get("drug_b") or ""
                cautions.append({
                    "type": "DRUG_INTERACTION",
                    "severity": inter.get("severity", "Moderate"),
                    "title": f"Interaction: {d_a} + {d_b}",
                    "effect": inter.get("clinical_effect") or inter.get("effect", ""),
                    "recommendation": inter.get("recommendation", "")
                })
        except Exception as e:
            print(f"[SANA Agent] Drug interaction check notice: {e}")

    # Check food and lifestyle rules for active medications
    for med in active_med_names:
        med_lower = med.lower()
        for rule_key, rule in FOOD_LIFESTYLE_RULES.items():
            if rule_key in med_lower:
                avoid_items = rule.get("avoid", "").lower()
                # Check if patient mentioned the food/substance
                for substance in detected_substances:
                    if substance in avoid_items:
                        cautions.append({
                            "type": "FOOD_LIFESTYLE_WARNING",
                            "severity": rule.get("severity", "Moderate"),
                            "title": f"Caution: {rule.get('drug')} & {substance.title()}",
                            "effect": rule.get("reason", ""),
                            "recommendation": f"Avoid {rule.get('avoid')} while taking {rule.get('drug')}."
                        })

    return cautions


# ============================================================
# SANA PROMPT BUILDER
# ============================================================

def build_sana_prompt(
    user_message: str,
    conversation: Optional[List[Dict[str, Any]]] = None,
    language: str = "en",
    vitals: Optional[Dict[str, Any]] = None,
    safety_warnings: Optional[List[str]] = None,
    risk_assessment: Optional[Dict[str, Any]] = None,
    user_name: Optional[str] = None,
    patient_profile: Optional[Dict[str, Any]] = None
) -> str:
    """
    Constructs the prompt for Gemini to act as SANA with dual spoken/screen output
    enriched by longitudinal patient medical history (vitals, risk, meds, reports).
    """
    vitals = vitals or {}
    safety_warnings = safety_warnings or []
    history_text = format_sana_history(conversation)

    # Format current vitals text
    has_vitals = any(v is not None for v in vitals.values() if v != "")
    if has_vitals:
        vitals_lines = []
        if vitals.get("heart_rate"):
            vitals_lines.append(f"- Heart Rate: {vitals['heart_rate']} BPM")
        if vitals.get("spo2"):
            vitals_lines.append(f"- SpO2: {vitals['spo2']}%")
        if vitals.get("temperature"):
            vitals_lines.append(f"- Temperature: {vitals['temperature']}°")
        if vitals.get("respiratory_rate"):
            vitals_lines.append(f"- Respiration: {vitals['respiratory_rate']} breaths/min")
        if vitals.get("systolic_bp") and vitals.get("diastolic_bp"):
            vitals_lines.append(f"- Blood Pressure: {vitals['systolic_bp']}/{vitals['diastolic_bp']} mmHg")
        vitals_text = "\n".join(vitals_lines)
    else:
        vitals_text = "No vital signs provided in current turn (strictly optional)."

    # Format longitudinal patient profile if available
    profile_lines = []
    if patient_profile:
        # Active medications
        meds = patient_profile.get("active_medications", [])
        if meds:
            med_strs = []
            for m in meds:
                if isinstance(m, dict):
                    m_name = m.get("name") or m.get("medication_name", "")
                    m_dose = m.get("dosage", "")
                    m_freq = m.get("frequency", "")
                    med_strs.append(f"{m_name} {m_dose} ({m_freq})".strip())
                elif isinstance(m, str):
                    med_strs.append(m)
            if med_strs:
                profile_lines.append(f"- Active Prescriptions: {', '.join(med_strs)}")

        # Health risk score
        risk_data = patient_profile.get("risk_assessment")
        if risk_data:
            score = risk_data.get("health_risk_score") or risk_data.get("risk_score")
            cat = risk_data.get("risk_category") or risk_data.get("category")
            drivers = risk_data.get("risk_drivers") or []
            driver_str = f" | Key Risk Factors: {', '.join(drivers[:3])}" if drivers else ""
            profile_lines.append(f"- AI Health Risk Score: {score}/100 ({cat}){driver_str}")

        # Recent medical reports
        reports = patient_profile.get("recent_reports", [])
        if reports:
            rep_strs = []
            for r in reports[:3]:
                if isinstance(r, dict):
                    r_title = r.get("report_type") or r.get("title") or "Medical Report"
                    r_findings = r.get("summary") or r.get("key_findings") or ""
                    if r_findings and len(r_findings) > 75:
                        r_findings = r_findings[:72] + "..."
                    rep_strs.append(f"{r_title}: {r_findings}" if r_findings else r_title)
                elif isinstance(r, str):
                    rep_strs.append(r)
            if rep_strs:
                profile_lines.append(f"- Recent Diagnostic Reports: {'; '.join(rep_strs)}")

        # Recent wellness checkins
        wellness = patient_profile.get("wellness_status")
        if wellness:
            profile_lines.append(f"- Wellness & Energy State: {wellness}")

        # Baseline physiological history
        base_vitals = patient_profile.get("baseline_vitals", {})
        if base_vitals:
            v_parts = []
            for k, val in base_vitals.items():
                if isinstance(val, dict):
                    v_parts.append(f"{k}: {val.get('value')} {val.get('unit', '')}")
                elif val is not None:
                    v_parts.append(f"{k}: {val}")
            if v_parts:
                profile_lines.append(f"- Baseline Recorded Vitals: {', '.join(v_parts)}")

        # Clinician treatment plan
        plan = patient_profile.get("treatment_plan")
        if plan:
            meds_list = []
            for m in plan.get("medications", []):
                meds_list.append(f"{m.get('medicine_name')} {m.get('dosage')} ({m.get('frequency')}, {m.get('food_relation')})")
            meds_info = f"Prescribed Meds: {', '.join(meds_list)}" if meds_list else ""
            profile_lines.append(f"- Clinician-Approved Treatment Plan by Dr. {plan.get('doctor_name', 'Doctor')}: Assessment: {plan.get('clinical_assessment')}. {meds_info}. Follow-up: {plan.get('follow_up_date') or 'None'}")

    if profile_lines:
        profile_text = "\n".join(profile_lines)
    else:
        profile_text = "No prior longitudinal health profile found (New patient session or guest)."

    # Role directive
    user_role = (patient_profile.get("user_role") if patient_profile else "PATIENT") or "PATIENT"
    user_role = str(user_role).upper()
    if user_role in ["DOCTOR", "MEDICAL_OFFICER"]:
        role_directive = "USER ROLE: Clinician/Medical Officer. Provide precise clinical summaries, analyte comparisons, and differential observations."
    elif user_role == "NURSE":
        role_directive = "USER ROLE: Nurse. Focus on vital stability, intake queue status, and immediate clinical alerts."
    elif user_role in ["FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"]:
        role_directive = "USER ROLE: Facility/System Administrator. Summarize facility workload, triage queue counts, and operational throughput."
    else:
        role_directive = "USER ROLE: Patient. Be warm, empathetic, clear, avoid jargon, explain approved plans simply, and never claim definitive diagnosis."

    # Independent safety warnings
    if safety_warnings:
        warn_text = "\n".join(f"⚠️ {w}" for w in safety_warnings)
    else:
        warn_text = "No acute vital sign alerts from independent safety engine."

    # Language guidance
    lang_info = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["en"])
    lang_directive = (
        f"MANDATORY OUTPUT LANGUAGE: You MUST generate BOTH the 'spoken_response' and 'screen_response' "
        f"directly in {lang_info['name']} ({lang_info['native_name']}). "
        f"Speak naturally in everyday, fluent, empathetic {lang_info['name']}."
    )

    emergency_directive = ""
    if risk_assessment and risk_assessment.get("is_emergency"):
        emergency_directive = (
            "CRITICAL EMERGENCY ALERT: The safety engine detected critical symptoms or vitals! "
            "Your spoken_response MUST immediately instruct the patient to seek urgent emergency care (ER/ambulance). "
            "Do NOT stall, delay, or offer casual chit-chat."
        )

    disclaimer = get_disclaimer(language)

    return f"""
{SANA_SYSTEM_PROMPT}

============================================================
SESSION METADATA
============================================================
Patient Name: {user_name or "Patient"}
Target Language: {lang_info['name']} ({lang_info['native_name']})
{role_directive}
{lang_directive}

============================================================
LONGITUDINAL PATIENT PROFILE & HEALTH HISTORY
============================================================
{profile_text}

============================================================
CURRENT VITAL SIGNS (OPTIONAL)
============================================================
{vitals_text}

============================================================
INDEPENDENT SAFETY RISK ENGINE EVALUATION
============================================================
Triage Level Determined: {risk_assessment.get('level', 'LOW') if risk_assessment else 'LOW'}
Safety Engine Alerts:
{warn_text}
{emergency_directive}

============================================================
RECENT DIALOGUE MEMORY
============================================================
{history_text}

============================================================
LATEST PATIENT INPUT (VOICE OR TEXT)
============================================================
"{user_message}"

============================================================
INSTRUCTIONS FOR SANA
============================================================
You must respond with valid JSON with the exact keys:
{{
  "spoken_response": "1 to 3 concise, friendly, spoken sentences for audio TTS playback. Natural, reassuring, never robotic. If emergency, urge ER immediately. If asking follow-up, ask only 1 or 2 targeted questions.",
  "triage_level": "EMERGENCY" or "URGENT_CARE" or "SELF_CARE",
  "screen_summary": "1-2 sentence plain-language clinical summary for the screen",
  "key_observations": ["Observation 1", "Observation 2"],
  "recommended_next_steps": ["Step 1", "Step 2"],
  "follow_up_question": "Gentle follow-up question if needed, or empty string",
  "safety_disclaimer": "{disclaimer}"
}}

Rules:
1. ONLY return the valid JSON object, without backticks or markdown wrap.
2. The 'spoken_response' MUST BE SHORT (max 3 sentences) so the patient doesn't have to listen to a lecture.
3. If an image or report is attached, reference its findings in plain words without diagnosing.
4. Remember previous context and known active medications. If patient mentions taking new medicines or supplements that might conflict with their known medications, alert them.
5. All text fields MUST be in {lang_info['name']} ({lang_info['native_name']}).
"""


# ============================================================
# RESPONSE PARSER
# ============================================================

def parse_sana_model_response(raw_text: str, default_lang: str = "en") -> Dict[str, Any]:
    """Parse Gemini output into structured SANA payload."""
    clean = raw_text.strip()
    # Strip markdown code blocks if model wrapped JSON
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\n?", "", clean)
        clean = re.sub(r"\n?```$", "", clean)
        clean = clean.strip()

    try:
        data = json.loads(clean)
        spoken = data.get("spoken_response", "").strip()
        triage_level = data.get("triage_level", "SELF_CARE").upper()

        if triage_level not in ["EMERGENCY", "URGENT_CARE", "SELF_CARE"]:
            if "EMERGENCY" in triage_level or "RED" in triage_level:
                triage_level = "EMERGENCY"
            elif "URGENT" in triage_level or "MODERATE" in triage_level:
                triage_level = "URGENT_CARE"
            else:
                triage_level = "SELF_CARE"

        return {
            "spoken_response": spoken,
            "triage_level": triage_level,
            "screen_summary": data.get("screen_summary", ""),
            "key_observations": data.get("key_observations", []),
            "recommended_next_steps": data.get("recommended_next_steps", []),
            "follow_up_question": data.get("follow_up_question", ""),
            "safety_disclaimer": data.get("safety_disclaimer", get_disclaimer(default_lang))
        }
    except Exception:
        # Fallback if model returned unstructured plain text
        lines = [line.strip() for line in clean.split("\n") if line.strip()]
        spoken = lines[0] if lines else clean
        if len(spoken) > 220:
            spoken = spoken[:217] + "..."

        triage_level = "SELF_CARE"
        lower = clean.lower()
        if "emergency" in lower or "immediate" in lower:
            triage_level = "EMERGENCY"
        elif "urgent" in lower or "doctor" in lower:
            triage_level = "URGENT_CARE"

        return {
            "spoken_response": spoken,
            "triage_level": triage_level,
            "screen_summary": clean[:250],
            "key_observations": [],
            "recommended_next_steps": ["Consult a healthcare professional for clinical confirmation."],
            "follow_up_question": "",
            "safety_disclaimer": get_disclaimer(default_lang)
        }


# ============================================================
# SANA CONVERSATION ENGINE (CENTRAL TURN PROCESSOR - PHASE 8)
# ============================================================

def process_sana_turn(
    api_key: str,
    user_message: str,
    conversation: Optional[List[Dict[str, Any]]] = None,
    language: str = "auto",
    vitals: Optional[Dict[str, Any]] = None,
    image_data: Optional[Any] = None,
    report_data: Optional[Any] = None,
    user_name: Optional[str] = None,
    patient_profile: Optional[Dict[str, Any]] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    city: Optional[str] = None,
    patient_age: Optional[int] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes a single conversational turn with SANA, fully unified across all 7 platform pillars:
    1. Extracts verbal vital signs from speech.
    2. Runs deterministic rule-based safety engine.
    3. Detects/respects selected language.
    4. Enriches prompt with longitudinal patient profile (vitals, risk, meds, reports).
    5. Calls Gemini with SANA agent persona.
    6. Applies Safety Controller (overrides if emergency).
    7. Automatically locates nearest 24x7 trauma hospital if emergency triggered (Phase 7).
    8. Automatically attaches evidence-based home remedies if self-care recommended (Phase 6).
    9. Automatically cross-checks active medications against mentioned drugs/supplements (Phase 5).
    10. Returns structured response ready for spoken audio playback and rich screen UI.
    """
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    conversation = conversation or []
    current_vitals = dict(vitals or {})

    # 1. Verbal vital extraction
    extracted_vitals = extract_vitals_from_speech(user_message)
    for k, v in extracted_vitals.items():
        if current_vitals.get(k) is None or current_vitals.get(k) == "":
            current_vitals[k] = v

    # 2. Language resolution
    if not language or language == "auto":
        resolved_lang = detect_language(user_message, default="en")
    else:
        resolved_lang = language

    # 3. Independent Safety Risk Engine
    risk_assessment = assess_triage_risk(
        symptoms=user_message,
        temperature=current_vitals.get("temperature"),
        spo2=current_vitals.get("spo2"),
        heart_rate=current_vitals.get("heart_rate"),
        respiratory_rate=current_vitals.get("respiratory_rate"),
        systolic_bp=current_vitals.get("systolic_bp"),
        diastolic_bp=current_vitals.get("diastolic_bp"),
        language=resolved_lang
    )

    safety_warnings = risk_assessment.get("vital_warnings", [])

    # 4. Build prompt enriched with longitudinal profile
    prompt = build_sana_prompt(
        user_message=user_message,
        conversation=conversation,
        language=resolved_lang,
        vitals=current_vitals,
        safety_warnings=safety_warnings,
        risk_assessment=risk_assessment,
        user_name=user_name,
        patient_profile=patient_profile
    )

    contents = [prompt]

    if report_data:
        part = make_file_part(report_data)
        if part:
            contents.append(part)

    if image_data:
        part = make_file_part(image_data)
        if part:
            contents.append(part)

    # 5. Call Gemini
    client = genai.Client(api_key=api_key)
    models = [PRIMARY_MODEL, *BACKUP_MODELS]
    last_err = None
    raw_response = ""

    for model in models:
        try:
            print(f"[SANA Agent] Calling {model} (lang={resolved_lang})...")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=1000
                )
            )
            if response and response.text:
                raw_response = response.text.strip()
                print(f"[SANA Agent] SUCCESS with {model}")
                break
        except Exception as e:
            last_err = e
            print(f"[SANA Agent] Model {model} failed: {e}. Trying backup...")
            continue

    if not raw_response:
        print(f"[SANA Agent] AI services unreachable ({last_err}). Engaging AISafetyGuard Deterministic Fallback...")
        return AISafetyGuard.generate_deterministic_fallback(
            patient_name=user_name or "Patient",
            symptoms=user_message,
            vitals=current_vitals,
            language=resolved_lang
        )

    # 6. Parse response
    parsed = parse_sana_model_response(raw_response, default_lang=resolved_lang)

    # 7. Safety Controller Check
    is_emergency = risk_assessment.get("is_emergency", False)
    final_level = "EMERGENCY" if is_emergency else parsed["triage_level"]

    # Triage badge metadata
    badge_map = {
        "EMERGENCY": {
            "level": "EMERGENCY",
            "title": "🔴 EMERGENCY",
            "subtext": "Immediate emergency medical evaluation recommended",
            "color": "#ef4444",
            "bg": "#fef2f2",
            "icon": "🚨"
        },
        "URGENT_CARE": {
            "level": "URGENT_CARE",
            "title": "🟡 URGENT CARE",
            "subtext": "Medical evaluation recommended within 24–48 hours",
            "color": "#f59e0b",
            "bg": "#fffbeb",
            "icon": "⚠️"
        },
        "SELF_CARE": {
            "level": "SELF_CARE",
            "title": "🟢 SELF-CARE & MONITORING",
            "subtext": "Rest, hydration, and gentle symptom monitoring",
            "color": "#10b981",
            "bg": "#ecfdf5",
            "icon": "🌿"
        }
    }

    triage_badge = badge_map.get(final_level, badge_map["SELF_CARE"])

    # If emergency was detected by safety engine, ensure spoken text is urgent
    if is_emergency and "emergency" not in parsed["spoken_response"].lower() and "জরুরি" not in parsed["spoken_response"] and "आपातकालीन" not in parsed["spoken_response"]:
        urgent_spoken_map = {
            "en": "I am concerned about what you're describing. Please seek emergency medical care immediately rather than waiting.",
            "hi": "मैं आपके इन लक्षणों को लेकर चिंतित हूँ। कृपया तुरंत आपातकालीन चिकित्सा सहायता लें।",
            "or": "ଆପଣଙ୍କ ଏହି ଲକ୍ଷଣଗୁଡ଼ିକ ଗୁରୁତର ହୋଇପାରେ। ଦୟାକରି ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯାଇ ଜରୁରୀକାଳୀନ ଚିକିତ୍ସା ନିଅନ୍ତୁ।",
            "bn": "আমি আপনার এই লক্ষণগুলো নিয়ে উদ্বিগ্ন। অনুগ্রহ করে অপেক্ষা না করে এখনই নিকটস্থ জরুরি চিকিৎসা সেবা বা হাসপাতালে যান।",
            "te": "మీరు వివరించిన లక్షణాలు తీవ్రమైనవి కావచ్చు. దయచేసి ఆలస్యం చేయకుండా వెంటనే అత్యవసర వైద్య సంరక్షణ పొందండి.",
            "ta": "நீங்கள் விவரிக்கும் அறிகுறிகள் தீவிரமானதாக இருக்கலாம். தயவுசெய்து தாமதிக்காமல் உடனடியாக அவசர மருத்துவ உதவியை நாடுங்கள்."
        }
        parsed["spoken_response"] = urgent_spoken_map.get(resolved_lang, urgent_spoken_map["en"])

    # Enforce AI Safety Guard sanitization and constraints
    safe_enforced = AISafetyGuard.enforce_safety_constraints(
        gemini_result=parsed,
        risk_assessment=risk_assessment,
        language=resolved_lang
    )
    parsed["spoken_response"] = safe_enforced["spoken_response"]
    parsed["screen_summary"] = safe_enforced["screen_summary"]
    parsed["safety_disclaimer"] = safe_enforced["safety_disclaimer"]

    # ============================================================
    # 8. EMERGENCY TRAUMA FACILITY LOCATOR (PHASE 7 INTEGRATION)
    # ============================================================
    nearest_emergency_facility = None
    emergency_contacts = []

    if final_level == "EMERGENCY" or is_emergency:
        try:
            from services.healthcare_finder_service import get_nearest_emergency_trauma_facility
            emergency_info = get_nearest_emergency_trauma_facility(
                user_lat=user_lat,
                user_lng=user_lng,
                city=city
            )
            nearest_emergency_facility = emergency_info.get("nearest_emergency_facility") or emergency_info.get("facility")
            emergency_contacts = emergency_info.get("emergency_contacts", [])
        except Exception as fac_err:
            print(f"[SANA Agent] Emergency facility lookup notice: {fac_err}")

    # ============================================================
    # 9. EVIDENCE-BASED SELF-CARE & HOME REMEDIES (PHASE 6 INTEGRATION)
    # ============================================================
    self_care_guidance = None

    if final_level == "SELF_CARE":
        try:
            from ai.self_care_guidance import get_evidence_based_remedies, SELF_CARE_DISCLAIMER
            if user_id:
                from services.self_care_service import get_remedies_for_patient
                remedy_result = get_remedies_for_patient(
                    user_id=user_id,
                    symptom=user_message
                )
                if remedy_result and remedy_result.get("remedies"):
                    self_care_guidance = remedy_result
            else:
                remedy_result = get_evidence_based_remedies(
                    symptom=user_message
                )
                if remedy_result:
                    matched = remedy_result.get("matched_category", "Symptoms")
                    self_care_guidance = {
                        "category": remedy_result.get("category_type") or remedy_result.get("category", "General Comfort"),
                        "title": remedy_result.get("title") or f"Supportive Home Care for {matched.title()}",
                        "remedies": remedy_result.get("remedies") or remedy_result.get("evidence_remedies", []),
                        "contraindications": remedy_result.get("contraindications", []),
                        "pediatric_warning": remedy_result.get("pediatric_warning"),
                        "disclaimer": remedy_result.get("disclaimer") or SELF_CARE_DISCLAIMER
                    }
        except Exception as self_care_err:
            print(f"[SANA Agent] Self-care guidance lookup notice: {self_care_err}")

    # ============================================================
    # 10. ACTIVE MEDICATION & INTERACTION CHECK (PHASE 5 INTEGRATION)
    # ============================================================
    medication_cautions = []
    if patient_profile and patient_profile.get("active_medications"):
        try:
            medication_cautions = check_patient_medication_context(
                user_message=user_message,
                active_medications=patient_profile.get("active_medications")
            )
        except Exception as med_err:
            print(f"[SANA Agent] Medication caution check notice: {med_err}")

    # ============================================================
    # 11. DISEASE & MEDICATION INTELLIGENCE INTEGRATION (MODULE 1-4, 6)
    # ============================================================
    disease_intelligence = None
    best_medicine_info = None
    msg_lower = user_message.lower().strip()

    try:
        from services.disease_intelligence_service import DiseaseIntelligenceService
        # Check if user asks "what is the best medicine for..."
        if "best medicine" in msg_lower or "best drug" in msg_lower or "what medicine for" in msg_lower:
            target_cond = user_message
            for prefix in ["what is the best medicine for", "best medicine for", "best drug for", "what medicine for"]:
                if prefix in msg_lower:
                    idx = msg_lower.find(prefix) + len(prefix)
                    target_cond = user_message[idx:].strip(" ?.")
                    break
            if target_cond:
                best_medicine_info = DiseaseIntelligenceService.get_best_medicine_guidance(target_cond, api_key=api_key)

        # Run symptom analysis for health concerns
        disease_intelligence = DiseaseIntelligenceService.analyze_patient_symptoms(
            symptoms=user_message,
            vitals=current_vitals,
            api_key=api_key
        )
    except Exception as dis_err:
        print(f"[SANA Agent] Disease intelligence notice: {dis_err}")

    # ============================================================
    # 12. "COMPARE ALL REPORTS", "WHAT CHANGED?", & HEALTH REVIEW (MODULES 9, 10, 11, 13)
    # ============================================================
    report_comparison = None
    what_changed_data = None
    health_review_data = None

    if user_id:
        try:
            from services.report_comparison_service import ReportComparisonService
            from services.health_review_service import HealthReviewService

            if any(cmd in msg_lower for cmd in ["compare all my reports", "compare reports", "compare my reports", "report comparison"]):
                report_comparison = ReportComparisonService.compare_all_reports(user_id=user_id, api_key=api_key)

            if any(cmd in msg_lower for cmd in ["what changed", "what has changed", "health changes"]):
                what_changed_data = ReportComparisonService.get_what_changed_summary(user_id=user_id, api_key=api_key)

            if any(cmd in msg_lower for cmd in ["review my complete health history", "health review", "complete review", "full health review"]):
                health_review_data = HealthReviewService.generate_360_health_review(
                    user_id=user_id,
                    patient_name=user_name or "Patient",
                    api_key=api_key
                )
        except Exception as comp_err:
            print(f"[SANA Agent] Longitudinal comparison notice: {comp_err}")

    return {
        "spoken_response": parsed["spoken_response"],
        "triage_level": final_level,
        "triage_badge": triage_badge,
        "is_emergency": is_emergency or (final_level == "EMERGENCY"),
        "screen_summary": parsed["screen_summary"],
        "key_observations": parsed["key_observations"],
        "recommended_next_steps": parsed["recommended_next_steps"],
        "follow_up_question": parsed["follow_up_question"],
        "safety_disclaimer": parsed["safety_disclaimer"],
        "safety_warnings": safety_warnings,
        "extracted_vitals": extracted_vitals,
        "updated_vitals": current_vitals,
        "language": resolved_lang,
        "nearest_emergency_facility": nearest_emergency_facility,
        "emergency_contacts": emergency_contacts,
        "self_care_guidance": self_care_guidance,
        "medication_cautions": medication_cautions,
        "patient_profile_applied": bool(patient_profile),
        "disease_intelligence": disease_intelligence,
        "best_medicine_info": best_medicine_info,
        "report_comparison": report_comparison,
        "what_changed": what_changed_data,
        "health_review": health_review_data
    }
