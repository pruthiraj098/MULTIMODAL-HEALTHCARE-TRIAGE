# ============================================================
# HealthTriage AI - Medication Service (Phase 5)
# Safe educational guidance for medications & regimen management
# ============================================================

import os
import base64
from datetime import date
from typing import Dict, Any, Optional, List

from database.database import (
    add_user_medication,
    get_user_medications,
    update_user_medication,
    delete_user_medication,
    log_medication_dose,
    get_medication_logs_for_date
)
from ai.medication_guidance import (
    check_drug_interactions,
    get_food_and_lifestyle_warnings,
    get_missed_dose_guidance,
    extract_prescription_details,
    MEDICATION_EDUCATIONAL_DISCLAIMER
)


def get_patient_medication_overview(user_id: int) -> Dict[str, Any]:
    """
    Returns full medication overview for the authenticated patient:
    - Active medications list
    - Live drug-drug interaction scan
    - Food & lifestyle warnings
    """
    medications = get_user_medications(user_id, active_only=True)
    med_names = [m["name"] for m in medications]

    api_key = os.getenv("GEMINI_API_KEY")
    interactions_result = check_drug_interactions(med_names, api_key=api_key)
    food_warnings = get_food_and_lifestyle_warnings(med_names)

    return {
        "success": True,
        "medications": medications,
        "total_active": len(medications),
        "interactions": interactions_result.get("interactions", []),
        "has_severe_interaction": interactions_result.get("has_severe", False),
        "has_moderate_interaction": interactions_result.get("has_moderate", False),
        "interaction_summary": interactions_result.get("summary", ""),
        "food_warnings": food_warnings,
        "disclaimer": MEDICATION_EDUCATIONAL_DISCLAIMER
    }


def get_patient_daily_schedule(user_id: int, scheduled_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Organizes patient medications into visual time slots:
    Morning, Afternoon, Evening, Night - with taken/missed status.
    """
    target_date = scheduled_date or date.today().isoformat()
    medications = get_user_medications(user_id, active_only=True)
    logs = get_medication_logs_for_date(user_id, target_date)

    # Build lookup of logged statuses: (medication_id, time_of_day) -> status
    log_status_map = {
        (log["medication_id"], log["time_of_day"]): log["status"]
        for log in logs
    }

    schedule_slots = {
        "Morning": [],
        "Afternoon": [],
        "Evening": [],
        "Night": []
    }

    for med in medications:
        slot = med.get("time_of_day", "Morning")
        if slot not in schedule_slots:
            slot = "Morning"

        current_status = log_status_map.get((med["id"], slot), "pending")
        schedule_slots[slot].append({
            **med,
            "status": current_status
        })

    # Calculate summary counts
    total_doses = len(medications)
    taken_count = sum(1 for logs_status in log_status_map.values() if logs_status == "taken")
    missed_count = sum(1 for logs_status in log_status_map.values() if logs_status == "missed")

    return {
        "success": True,
        "scheduled_date": target_date,
        "schedule": schedule_slots,
        "summary": {
            "total_doses": total_doses,
            "taken": taken_count,
            "missed": missed_count,
            "pending": max(total_doses - taken_count - missed_count, 0)
        }
    }


def record_patient_dose(
    user_id: int,
    medication_id: int,
    scheduled_date: str,
    time_of_day: str,
    status: str = "taken"
) -> Dict[str, Any]:
    """
    Record status (taken, missed, pending) for a scheduled dose.
    """
    ok = log_medication_dose(
        user_id=user_id,
        medication_id=medication_id,
        scheduled_date=scheduled_date,
        time_of_day=time_of_day,
        status=status
    )
    if not ok:
        return {"success": False, "error": "Unable to log dose status."}

    return {"success": True, "message": f"Dose marked as {status}."}


def scan_patient_prescription(
    user_id: int,
    file_data: str,
    mime_type: Optional[str] = None,
    file_name: str = "prescription.jpg"
) -> Dict[str, Any]:
    """
    Transcribes prescription image/PDF and checks interactions against existing active medications.
    """
    clean_mime = mime_type or "image/jpeg"
    binary_data = b""

    if file_data.startswith("data:") and ";base64," in file_data:
        header, encoded = file_data.split(";base64,", 1)
        clean_mime = header.replace("data:", "")
        binary_data = base64.b64decode(encoded)
    else:
        try:
            binary_data = base64.b64decode(file_data)
        except Exception:
            binary_data = file_data.encode("utf-8")

    api_key = os.getenv("GEMINI_API_KEY")
    extracted = extract_prescription_details(
        api_key=api_key,
        file_bytes=binary_data,
        mime_type=clean_mime,
        file_name=file_name
    )

    if not extracted.get("success"):
        return extracted

    # Check for potential interactions with existing active medications
    existing_meds = get_user_medications(user_id, active_only=True)
    existing_names = [m["name"] for m in existing_meds]
    new_names = [m["name"] for m in extracted.get("medications", [])]
    combined_names = list(set(existing_names + new_names))

    interaction_check = check_drug_interactions(combined_names, api_key=api_key)
    extracted["potential_interactions"] = interaction_check.get("interactions", [])
    extracted["has_severe_interaction"] = interaction_check.get("has_severe", False)

    return extracted
