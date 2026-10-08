# ============================================================
# HealthTriage AI - AI Health Risk Score Engine (Phase 3)
# Multi-Factor Clinical Triage Risk Indicator (Deterministic + AI)
# ============================================================

import os
import json
import re
from typing import Dict, Any, List, Optional
from google import genai

from ai.risk_engine import (
    check_vital_signs,
    EMERGENCY_SYMPTOM_PATTERNS,
    HIGH_RISK_SYMPTOM_PATTERNS,
)
from ai.gemini_service import PRIMARY_MODEL

RISK_LEVEL_LOW = "LOW"
RISK_LEVEL_MODERATE = "MODERATE"
RISK_LEVEL_HIGH = "HIGH"

RISK_SCORE_DISCLAIMER = (
    "The AI Triage Risk Indicator combines physiological vital indicators and reported symptoms "
    "to assist in healthcare prioritization. It is NOT a medical diagnosis and does not compute disease probability."
)


def calculate_rule_based_risk(
    vitals: Dict[str, Any],
    symptoms: str = "",
    recent_history: Optional[List[Dict[str, Any]]] = None,
    report_findings: Optional[str] = None
) -> Dict[str, Any]:
    """
    Deterministic rule-based baseline risk score (0 to 100).
    Evaluates:
    1. Physiological vital signs & critical red flags
    2. Emergency and high-risk symptom keyword matches
    3. Trajectory in recent health history
    4. Reported lab/imaging findings
    """
    score = 15  # Baseline normal adult resting score
    factors = []
    deterministic_emergency = False
    emergency_reasons = []

    symptom_text = (symptoms or "").strip().lower()

    # 1. Evaluate vital signs
    vital_warnings = check_vital_signs(
        temperature=vitals.get("temperature"),
        spo2=vitals.get("spo2"),
        heart_rate=vitals.get("heart_rate"),
        respiratory_rate=vitals.get("respiratory_rate"),
        systolic_bp=vitals.get("systolic_bp"),
        diastolic_bp=vitals.get("diastolic_bp"),
    )

    if vitals:
        vitals_provided = any(v is not None for v in vitals.values())
        if vitals_provided:
            if not vital_warnings:
                factors.append({
                    "name": "Vital Signs",
                    "status": "normal",
                    "details": "Recorded vital signs are within normal adult physiological baselines."
                })
            else:
                for w in vital_warnings:
                    if "Critically low SpO₂" in w:
                        score += 65
                        deterministic_emergency = True
                        emergency_reasons.append("Severe hypoxemia (SpO2 < 90%)")
                    elif "Hypertensive crisis" in w:
                        score += 60
                        deterministic_emergency = True
                        emergency_reasons.append("Hypertensive crisis blood pressure reading")
                    elif "Very high temperature" in w or "High fever" in w:
                        score += 40
                        emergency_reasons.append("Markedly elevated body temperature")
                    elif "tachycardia" in w.lower():
                        score += 35
                    elif "bradycardia" in w.lower():
                        score += 35
                    elif "respiratory rate" in w.lower():
                        score += 30
                    else:
                        score += 15

                factors.append({
                    "name": "Vital Signs",
                    "status": "alert" if deterministic_emergency else "warning",
                    "details": f"Flagged indicators: {'; '.join(vital_warnings)}"
                })
        else:
            factors.append({
                "name": "Vital Signs",
                "status": "neutral",
                "details": "No current vital signs provided (optional)."
            })
    else:
        factors.append({
            "name": "Vital Signs",
            "status": "neutral",
            "details": "No current vital signs provided (optional)."
        })

    # 2. Evaluate Symptoms
    if symptom_text:
        found_emergency = False
        for pat in EMERGENCY_SYMPTOM_PATTERNS:
            m = re.search(pat, symptom_text, re.IGNORECASE)
            if m:
                found_emergency = True
                deterministic_emergency = True
                score += 65
                emergency_reasons.append(f"Emergency keyword detected: '{m.group(0)}'")
                break

        found_high = False
        if not found_emergency:
            for pat in HIGH_RISK_SYMPTOM_PATTERNS:
                m = re.search(pat, symptom_text, re.IGNORECASE)
                if m:
                    found_high = True
                    score += 30
                    break

        if found_emergency:
            factors.append({
                "name": "Current Symptoms",
                "status": "critical",
                "details": f"Critical symptom indicators detected requiring immediate evaluation."
            })
        elif found_high:
            factors.append({
                "name": "Current Symptoms",
                "status": "warning",
                "details": f"High-priority symptoms noted that warrant prompt medical review."
            })
        else:
            score += 10
            factors.append({
                "name": "Current Symptoms",
                "status": "active",
                "details": "Mild to moderate symptoms reported without acute red flags."
            })
    else:
        factors.append({
            "name": "Current Symptoms",
            "status": "neutral",
            "details": "No active acute symptoms reported."
        })

    # 3. Evaluate Recent Health History
    if recent_history and len(recent_history) > 0:
        # Check if past readings had alerts
        past_alerts = [
            h for h in recent_history
            if (h.get("measurement_type") == "spo2" and h.get("value", 100) < 92)
            or (h.get("measurement_type") == "heart_rate" and (h.get("value", 70) > 120 or h.get("value", 70) < 50))
        ]
        if past_alerts:
            score += 15
            factors.append({
                "name": "Recent Health History",
                "status": "warning",
                "details": f"Patient history shows {len(past_alerts)} recent borderline/abnormal vital reading(s)."
            })
        else:
            factors.append({
                "name": "Recent Health History",
                "status": "normal",
                "details": "Recent measurements show steady and stable physiological trajectory."
            })
    else:
        factors.append({
            "name": "Recent Health History",
            "status": "neutral",
            "details": "No historical health measurements logged yet."
        })

    # 4. Evaluate Uploaded Reports / Documents
    if report_findings and report_findings.strip():
        report_lower = report_findings.lower()
        if any(w in report_lower for w in ["critical", "severe", "malignant", "acute", "infarct"]):
            score += 25
            factors.append({
                "name": "Uploaded Information",
                "status": "warning",
                "details": "Laboratory or clinical report indicates findings outside normal ranges."
            })
        else:
            score += 5
            factors.append({
                "name": "Uploaded Information",
                "status": "active",
                "details": "Clinical documentation reviewed."
            })
    else:
        factors.append({
            "name": "Uploaded Information",
            "status": "neutral",
            "details": "No medical reports uploaded."
        })

    # Normalize score
    clamped_score = min(max(score, 0), 100)

    # Deterministic emergency override
    if deterministic_emergency:
        clamped_score = max(clamped_score, 75)

    return {
        "base_score": clamped_score,
        "deterministic_emergency": deterministic_emergency,
        "emergency_reasons": emergency_reasons,
        "factors": factors,
        "vital_warnings": vital_warnings
    }


def analyze_health_risk(
    api_key: Optional[str] = None,
    symptoms: str = "",
    vitals: Optional[Dict[str, Any]] = None,
    recent_history: Optional[List[Dict[str, Any]]] = None,
    report_findings: Optional[str] = None,
    conversation_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Multi-stage AI Health Risk Score calculation:
    User Data -> Rule-Based Risk Engine + AI Contextual Analysis -> Safety Controller -> AI Triage Risk Indicator.
    """
    resolved_vitals = vitals or {}

    # Stage 1: Rule-Based Deterministic Risk Engine
    rule_result = calculate_rule_based_risk(
        vitals=resolved_vitals,
        symptoms=symptoms,
        recent_history=recent_history,
        report_findings=report_findings
    )

    base_score = rule_result["base_score"]
    deterministic_emergency = rule_result["deterministic_emergency"]
    emergency_reasons = rule_result["emergency_reasons"]
    factors = rule_result["factors"]

    explanation = ""
    recommended_action = ""
    ai_score_adjustment = 0

    # Stage 2: AI Contextual Analysis (if API key available)
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are the clinical safety scoring component of HealthTriage AI.
Analyze the following patient data to evaluate the AI Triage Risk Indicator.

PATIENT INFORMATION:
- Reported Symptoms: {symptoms or 'None specified'}
- Vital Signs: {resolved_vitals}
- Deterministic Safety Flags: {emergency_reasons or 'None'}
- Recent History Factors: {factors}
- Additional Context: {conversation_context or 'None'}

MANDATORY RULES:
1. This is an AI Triage Risk Indicator to help prioritize care, NOT a medical diagnosis.
2. DO NOT state or estimate probability of disease (Never say 'Your probability of disease is X%').
3. DO NOT state definitive diagnoses ('You definitely have...').
4. ALWAYS use cautious clinical wording starting with: 'Based on the information provided...'.
5. Propose an AI score adjustment between -10 (if symptoms are clearly benign) and +15 (if subtle comorbidity/duration concerns exist).
6. Provide a concise 2-3 sentence clinical explanation and clear recommended next steps.

Return ONLY a valid JSON object matching this schema:
{{
  "ai_score_adjustment": 0,
  "explanation": "Based on the information provided...",
  "recommended_action": "..."
}}
"""
            response = client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=prompt
            )

            raw_text = response.text.strip()
            # Clean markdown codeblocks if returned
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                raw_text = re.sub(r"\n?```$", "", raw_text)

            ai_data = json.loads(raw_text)
            ai_score_adjustment = int(ai_data.get("ai_score_adjustment", 0))
            explanation = ai_data.get("explanation", "")
            recommended_action = ai_data.get("recommended_action", "")

        except Exception as ai_err:
            print("[Risk Score Engine] AI contextual analysis notice:", ai_err)
            ai_score_adjustment = 0

    # Fallback explanation if AI was unavailable or empty
    if not explanation:
        if deterministic_emergency:
            explanation = (
                f"Based on the information provided, acute clinical indicators were identified "
                f"({', '.join(emergency_reasons) if emergency_reasons else 'critical vital signs or symptoms'}). "
                "These findings represent immediate clinical priorities."
            )
            recommended_action = (
                "Seek immediate emergency medical attention or contact emergency services (112 / 108 / 911) right away."
            )
        elif base_score >= 40:
            explanation = (
                "Based on the information provided, notable symptom patterns or borderline physiological indicators "
                "were identified that warrant medical consultation."
            )
            recommended_action = (
                "Schedule a clinical evaluation with a qualified physician or healthcare clinic within 24 to 48 hours."
            )
        else:
            explanation = (
                "Based on the information provided, current symptoms and physiological indicators appear low-risk "
                "with no red-flag markers detected by the safety engine."
            )
            recommended_action = (
                "Continue supportive home care, practice good hydration and rest, and seek clinical review if symptoms worsen or persist."
            )

    # Stage 3: Safety Controller (DETERMINISTIC OVERRIDE)
    final_score = base_score + ai_score_adjustment

    # ENFORCE RULE: Do NOT allow Gemini alone to override deterministic emergency safety rules.
    if deterministic_emergency:
        final_score = max(final_score, 75)

    final_score = min(max(final_score, 0), 100)

    # Assign Triage Level
    if final_score >= 70 or deterministic_emergency:
        risk_level = RISK_LEVEL_HIGH
        color = "#ef4444"
        badge_label = "HIGH"
    elif final_score >= 40:
        risk_level = RISK_LEVEL_MODERATE
        color = "#f59e0b"
        badge_label = "MODERATE"
    else:
        risk_level = RISK_LEVEL_LOW
        color = "#10b981"
        badge_label = "LOW"

    return {
        "risk_level": risk_level,
        "risk_score": final_score,
        "badge_label": badge_label,
        "color": color,
        "factors": factors,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "is_emergency": deterministic_emergency,
        "vital_warnings": rule_result["vital_warnings"],
        "disclaimer": RISK_SCORE_DISCLAIMER
    }
