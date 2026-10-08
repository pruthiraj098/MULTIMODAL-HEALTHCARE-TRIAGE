# ============================================================
# HealthTriage AI - Natural & Self-Care Service Layer
# Bridges database, user vitals, and self-care AI engine
# ============================================================

from datetime import date
from typing import Dict, Any, List, Optional
import database.database as db
from ai.self_care_guidance import (
    get_evidence_based_remedies,
    generate_personalized_self_care_gemini,
    analyze_wellness_trends,
    SELF_CARE_DISCLAIMER
)


def get_remedies_for_patient(
    user_id: int,
    symptom: str,
    severity: str = "mild",
    duration_days: int = 1
) -> Dict[str, Any]:
    """
    Produce personalized, safety-screened natural remedies for an authenticated patient.
    Cross-references latest physiological vitals and active medications.
    """
    latest_vitals = db.get_user_latest_vitals(user_id)
    active_meds = db.get_user_medications(user_id, active_only=True)

    context = {
        "severity": severity,
        "duration_days": int(duration_days),
        "vitals": latest_vitals,
        "medications": [m.get("name") for m in active_meds]
    }

    guidance = generate_personalized_self_care_gemini(symptom, context)

    # Check for specific herbal/lifestyle medication interactions
    med_names = [m.get("name", "").lower() for m in active_meds]
    remedy_med_cautions = []

    if any("warfarin" in m or "aspirin" in m or "clopidogrel" in m for m in med_names):
        matched_cat = guidance.get("matched_category", "").lower()
        if "ginger" in symptom.lower() or "nausea" in matched_cat:
            remedy_med_cautions.append(
                "Notice: You are taking anticoagulant/antiplatelet medications. Limit concentrated herbal ginger supplements as large doses can mildly increase bleeding risk."
            )

    if any("metformin" in m or "glipizide" in m or "insulin" in m for m in med_names):
        matched_cat = guidance.get("matched_category", "").lower()
        if "honey" in symptom.lower() or "cough" in matched_cat:
            remedy_med_cautions.append(
                "Notice: You have diabetes medications recorded. If using honey in warm water, monitor blood glucose closely."
            )

    if remedy_med_cautions:
        if "safety_warnings" not in guidance:
            guidance["safety_warnings"] = []
        guidance["safety_warnings"].extend(remedy_med_cautions)

    return guidance


def record_patient_wellness_checkin(
    user_id: int,
    checkin_date: Optional[str] = None,
    water_glasses: int = 0,
    sleep_hours: float = 0.0,
    mood: str = "Neutral",
    energy_level: str = "Medium",
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Save or update patient daily wellness tracking metrics.
    """
    target_date = checkin_date or date.today().isoformat()
    success = db.save_wellness_checkin(
        user_id=user_id,
        checkin_date=target_date,
        water_glasses=int(water_glasses),
        sleep_hours=float(sleep_hours),
        mood=mood,
        energy_level=energy_level,
        notes=notes
    )

    if not success:
        return {"success": False, "message": "Failed to persist wellness check-in"}

    return {
        "success": True,
        "message": f"Wellness check-in recorded for {target_date}",
        "checkin_date": target_date
    }


def get_patient_wellness_history(user_id: int, days: int = 14) -> Dict[str, Any]:
    """
    Retrieve past wellness records and computed lifestyle trend analytics.
    """
    logs = db.get_user_wellness_checkins(user_id, days=days)
    trends = analyze_wellness_trends(logs)

    today_str = date.today().isoformat()
    today_checkin = next((l for l in logs if l.get("checkin_date") == today_str), None)

    return {
        "success": True,
        "logs": logs,
        "trends": trends,
        "today_checkin": today_checkin,
        "disclaimer": SELF_CARE_DISCLAIMER
    }
