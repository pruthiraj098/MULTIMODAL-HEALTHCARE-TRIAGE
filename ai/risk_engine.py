# ============================================================
# HealthTriage AI - Healthcare Risk & Triage Engine
# Independent Rule-Based Vital Sign & Multilingual Symptom Safety
# ============================================================

import re
from typing import List, Dict, Any, Optional

# ============================================================
# EMERGENCY & HIGH RISK MULTILINGUAL SYMPTOM PATTERNS
# ============================================================

EMERGENCY_SYMPTOM_PATTERNS = [
    # English
    r"\b(?:severe\s+)?chest\s+pain\b",
    r"\bchest\s+pressure\b",
    r"\bheart\s+attack\b",
    r"\bcrushing\s+pain\b",
    r"\b(?:difficulty|can't|unable\s+to|trouble)\s+breath(?:ing)?\b",
    r"\bshortness\s+of\s+breath\b",
    r"\bpassed\s+out\b",
    r"\bloss\s+of\s+consciousness\b",
    r"\bunconscious\b",
    r"\bseizure\b",
    r"\bconvulsion\b",
    r"\bface\s+droop(?:ing)?\b",
    r"\bslurred\s+speech\b",
    r"\bparalysis\b",
    r"\bsudden\s+weakness\b",
    r"\bstroke\b",
    r"\bcoughing\s+up\s+blood\b",
    r"\bvomiting\s+blood\b",
    r"\banaphylaxis\b",
    r"\bthroat\s+closing\b",
    r"\bsudden\s+blindness\b",
    r"\bsudden\s+loss\s+of\s+vision\b",
    # Hindi (हिंदी)
    r"छाती\s+में\s+(?:तेज़\s+)?दर्द",
    r"सीने\s+में\s+(?:तेज़\s+)?दर्द",
    r"सांस\s+लेने\s+में\s+(?:बहुत\s+)?तबलीफ़",
    r"सांस\s+फूलना",
    r"बेहोश",
    r"दौरा\s+पड़ना",
    r"मुंह\s+टेढ़ा",
    r"आवाज़\s+लड़खड़ाना",
    r"खून\s+की\s+उल्टी",
    r"खांसी\s+में\s+खून",
    r"लकवा",
    # Odia (ଓଡ଼ିଆ)
    r"ଛାତିରେ\s+(?:ପ୍ରବଳ\s+)?ଯନ୍ତ୍ରଣା",
    r"ଛାତି\s+ବିନ୍ଧା",
    r"ନିଶ୍ୱାସ\s+ପ୍ରଶ୍ୱାସରେ\s+କଷ୍ଟ",
    r"ନିଶ୍ୱାସ\s+ବନ୍ଦ",
    r"ଅଚେତ",
    r"ମୂର୍ଚ୍ଛା",
    r"ବାନ୍ତିରେ\s+ରକ୍ତ",
    r"ପାରାଲିସିସ୍",
    r"ପକ୍ଷାଘାତ",
    # Bengali (বাংলা)
    r"বুকে\s+(?:তীব্র\s+)?ব্যথা",
    r"বুকে\s+চাপ",
    r"হার্ট\s+অ্যাটাক",
    r"শ্বাস\s+নিতে\s+কষ্ট",
    r"শ্বাসকষ্ট",
    r"অজ্ঞান",
    r"মূর্ছা",
    r"খিঁচুনি",
    r"মুখ\s+বেঁকে\s+যাওয়া",
    r"কথা\s+জড়িয়ে\s+যাওয়া",
    r"রক্তবমি",
    r"কাশিতে\s+রক্ত",
    r"পক্ষাঘাত",
    r"স্ট্রোক",
    # Telugu (తెలుగు)
    r"గుండె\s+(?:తీవ్ర\s+)?నొప్పి",
    r"ఛాతీలో\s+(?:తీవ్ర\s+)?నొప్పి",
    r"శ్వాస\s+(?:తీసుకోవడంలో\s+)?ఇబ్బంది",
    r"స్పృహ\s+తప్పడం",
    r"రక్తం\s+వాంతి",
    r"పక్షవాతం",
    # Tamil (தமிழ்)
    r"மார்பு\s+(?:கடுமையான\s+)?வலி",
    r"சுவாசிப்பதில்\s+சிரமம்",
    r"மூச்சுத்\s+திணறல்",
    r"மயக்கம்",
    r"இரத்த\s+வாந்தி",
    r"பக்கவாதம்",
]

HIGH_RISK_SYMPTOM_PATTERNS = [
    # English
    r"\bhigh\s+fever\b",
    r"\bpersistent\s+vomiting\b",
    r"\bdehydrat(?:ion|ed)\b",
    r"\bsevere\s+(?:abdominal|stomach)\s+pain\b",
    r"\bunbearable\s+headache\b",
    r"\bworst\s+headache\b",
    r"\brash\s+with\s+fever\b",
    r"\bpain\s+(?:level\s+)?(?:8|9|10)\s*(?:out\s+of\s*10|/10)?\b",
    # Hindi
    r"तेज़\s+बुखार",
    r"लगातार\s+उल्टी",
    r"पेट\s+में\s+असहनीय\s+दर्द",
    r"असहनीय\s+सिरदर्द",
    # Odia
    r"ପ୍ରବଳ\s+ଜ୍ୱର",
    r"ଲଗାତାର\s+ବାନ୍ତି",
    r"ପେଟରେ\s+ଅସହ୍ୟ\s+ଯନ୍ତ୍ରଣା",
    # Bengali
    r"তীব্র\s+জ্বর",
    r"অনেক\s+জ্বর",
    r"অবিরাম\s+বমি",
    r"পেটে\s+অসহ্য\s+(?:যন্ত্রণা|ব্যথা)",
    r"অসহ্য\s+মাথাব্যথা",
    # Telugu
    r"తీవ్రమైన\s+జ్వరం",
    r"నిరంతర\s+వాంతులు",
    r"కడుపులో\s+తీవ్ర\s+నొప్పి",
    # Tamil
    r"கடுமையான\s+காய்ச்சல்",
    r"தொடர்\s+வாந்தி",
    r"வயிற்றில்\s+கடுமையான\s+வலி",
]


# ============================================================
# VITAL SIGNS SAFETY ENGINE (PRESERVED & ENHANCED)
# ============================================================

def check_vital_signs(
    temperature=None,
    spo2=None,
    heart_rate=None,
    respiratory_rate=None,
    systolic_bp=None,
    diastolic_bp=None,
    symptoms=None
) -> List[str]:
    """
    Independent rule-based safety engine.
    Missing vital signs are allowed (None means not provided).
    Supports temperature in either Celsius (35-42) or Fahrenheit (95-108).
    This engine does NOT diagnose diseases; it flags abnormal physiological parameters.
    """
    warnings = []

    # --------------------------------------------------------
    # SpO2 (Oxygen Saturation)
    # --------------------------------------------------------
    if spo2 is not None:
        try:
            spo2_val = float(spo2)
            if spo2_val < 88:
                warnings.append(
                    "Critically low SpO₂ (<88%) detected. Immediate emergency medical evaluation recommended."
                )
            elif spo2_val < 92:
                warnings.append(
                    "Low SpO₂ (<92%) detected. Prompt medical evaluation may be required."
                )
        except (ValueError, TypeError):
            pass

    # --------------------------------------------------------
    # Temperature (Fahrenheit / Celsius automatic detection)
    # --------------------------------------------------------
    if temperature is not None:
        try:
            temp_val = float(temperature)
            temp_c = (temp_val - 32) * 5 / 9 if temp_val > 60 else temp_val

            if temp_c >= 40.0:  # >= 104°F
                warnings.append(
                    f"Very high temperature detected ({temp_val:.1f}°). High fever requires prompt medical attention."
                )
            elif temp_c >= 38.3:  # >= 101°F
                warnings.append(
                    f"Fever detected ({temp_val:.1f}°)."
                )
            elif temp_c < 35.0:  # < 95°F
                warnings.append(
                    f"Low body temperature ({temp_val:.1f}°) detected. Hypothermia risk."
                )
        except (ValueError, TypeError):
            pass

    # --------------------------------------------------------
    # Heart Rate
    # --------------------------------------------------------
    if heart_rate is not None:
        try:
            hr_val = float(heart_rate)
            if hr_val >= 130:
                warnings.append(
                    f"Very high heart rate detected ({int(hr_val)} BPM)."
                )
            elif hr_val < 45:
                warnings.append(
                    f"Very low heart rate detected ({int(hr_val)} BPM)."
                )
        except (ValueError, TypeError):
            pass

    # --------------------------------------------------------
    # Respiratory Rate
    # --------------------------------------------------------
    if respiratory_rate is not None:
        try:
            rr_val = float(respiratory_rate)
            if rr_val >= 30:
                warnings.append(
                    f"High respiratory rate detected ({int(rr_val)} breaths/min)."
                )
            elif rr_val < 8:
                warnings.append(
                    f"Very low respiratory rate detected ({int(rr_val)} breaths/min)."
                )
        except (ValueError, TypeError):
            pass

    # --------------------------------------------------------
    # Blood Pressure (Optional)
    # --------------------------------------------------------
    if systolic_bp is not None:
        try:
            sys_val = float(systolic_bp)
            if sys_val >= 180:
                warnings.append(
                    f"Hypertensive crisis range systolic blood pressure detected ({int(sys_val)} mmHg). Seek emergency care."
                )
            elif sys_val < 90:
                warnings.append(
                    f"Low systolic blood pressure detected ({int(sys_val)} mmHg - hypotension)."
                )
        except (ValueError, TypeError):
            pass

    if diastolic_bp is not None:
        try:
            dia_val = float(diastolic_bp)
            if dia_val >= 120:
                warnings.append(
                    f"Critically high diastolic blood pressure detected ({int(dia_val)} mmHg)."
                )
        except (ValueError, TypeError):
            pass

    return warnings


# ============================================================
# COMPREHENSIVE TRIAGE ASSESSMENT
# ============================================================

def assess_triage_risk(
    symptoms: Optional[str] = None,
    temperature: Optional[float] = None,
    spo2: Optional[float] = None,
    heart_rate: Optional[float] = None,
    respiratory_rate: Optional[float] = None,
    systolic_bp: Optional[float] = None,
    diastolic_bp: Optional[float] = None,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Combines rule-based vital signs analysis with symptom red-flag detection.
    Assigns a triage risk tier: EMERGENCY, HIGH, MODERATE, or LOW.
    Note: Triage level is for prioritization/safety guidance only, NOT a diagnosis.
    """
    vital_warnings = check_vital_signs(
        temperature=temperature,
        spo2=spo2,
        heart_rate=heart_rate,
        respiratory_rate=respiratory_rate,
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp
    )

    symptom_text = (symptoms or "").strip().lower()
    emergency_reasons = []
    high_reasons = []

    # Check emergency vital sign triggers
    for w in vital_warnings:
        if "Critically low SpO₂" in w or "Hypertensive crisis" in w or "Very high temperature" in w:
            emergency_reasons.append(w)
        else:
            high_reasons.append(w)

    # Check emergency symptom triggers
    for pattern in EMERGENCY_SYMPTOM_PATTERNS:
        match = re.search(pattern, symptom_text, re.IGNORECASE)
        if match:
            emergency_reasons.append(f"Potentially critical symptom detected: '{match.group(0)}'")

    # Check high-risk symptom triggers
    for pattern in HIGH_RISK_SYMPTOM_PATTERNS:
        match = re.search(pattern, symptom_text, re.IGNORECASE)
        if match:
            high_reasons.append(f"High-priority symptom detected: '{match.group(0)}'")

    # Determine Triage Level
    all_warnings = list(dict.fromkeys(emergency_reasons + high_reasons + vital_warnings))
    has_warnings = bool(all_warnings)

    if emergency_reasons:
        return {
            "level": "EMERGENCY",
            "badge_color": "#ff4757",
            "title": "🔴 EMERGENCY — Immediate Medical Attention Required",
            "summary": "These symptoms or vital signs can indicate a potential medical emergency. Please seek immediate emergency medical care (ER or call emergency ambulance services).",
            "reasons": emergency_reasons + high_reasons,
            "vital_warnings": vital_warnings,
            "warnings": all_warnings,
            "has_warnings": has_warnings,
            "is_emergency": True
        }
    elif high_reasons:
        return {
            "level": "HIGH",
            "badge_color": "#ffa502",
            "title": "🟠 HIGH URGENCY — Prompt Clinical Evaluation Recommended",
            "summary": "Significant symptoms or vital signs detected that require prompt medical evaluation, ideally within 24 hours.",
            "reasons": high_reasons,
            "vital_warnings": vital_warnings,
            "warnings": all_warnings,
            "has_warnings": has_warnings,
            "is_emergency": False
        }
    elif symptom_text or vital_warnings:
        return {
            "level": "MODERATE",
            "badge_color": "#eccc68",
            "title": "🟡 MODERATE — Medical Consultation Advised",
            "summary": "Moderate symptoms detected. It is recommended to consult a healthcare provider or doctor within 24 to 48 hours for proper guidance.",
            "reasons": ["Ongoing symptoms require clinical review if persistent or worsening."],
            "vital_warnings": vital_warnings,
            "warnings": all_warnings,
            "has_warnings": has_warnings,
            "is_emergency": False
        }
    else:
        return {
            "level": "LOW",
            "badge_color": "#2ed573",
            "title": "🟢 LOW / SELF-CARE — Monitor & Rest",
            "summary": "Mild symptoms or general inquiry. Practice safe self-care, rest, stay hydrated, and monitor your condition.",
            "reasons": ["No immediate acute red flags detected."],
            "vital_warnings": vital_warnings,
            "warnings": all_warnings,
            "has_warnings": has_warnings,
            "is_emergency": False
        }