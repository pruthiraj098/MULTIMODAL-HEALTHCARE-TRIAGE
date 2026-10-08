# ============================================================
# HealthTriage AI - Health Monitor Service
# Service layer for personal health measurements and trends
# ============================================================

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from database.database import (
    save_health_measurement,
    save_bulk_measurements,
    get_user_health_measurements,
    get_user_latest_vitals,
    delete_health_measurement
)
from ai.health_monitor import (
    evaluate_vital_status,
    analyze_health_trend,
    VITAL_REFERENCE_RANGES,
    HEALTH_MONITOR_DISCLAIMER
)

ALLOWED_TIME_RANGES = {
    "today": 1,
    "7d": 7,
    "30d": 30,
    "3m": 90,
}

VALID_MEASUREMENT_TYPES = {
    "heart_rate": {"unit": "BPM", "min": 20, "max": 250},
    "spo2": {"unit": "%", "min": 40, "max": 100},
    "temperature": {"unit": "°F", "min": 85.0, "max": 110.0},
    "blood_pressure_systolic": {"unit": "mmHg", "min": 50, "max": 260},
    "blood_pressure_diastolic": {"unit": "mmHg", "min": 30, "max": 180},
    "respiratory_rate": {"unit": "breaths/min", "min": 4, "max": 70},
    "weight": {"unit": "kg", "min": 10, "max": 350},
}


def validate_measurement_input(measurement_type: str, value: float) -> Tuple[bool, Optional[str]]:
    """
    Validate that measurement type is recognized and numerical value is physiologically plausible.
    """
    m_type = measurement_type.lower()
    if m_type not in VALID_MEASUREMENT_TYPES:
        return False, f"Unknown measurement type '{measurement_type}'. Supported: {', '.join(VALID_MEASUREMENT_TYPES.keys())}"

    bounds = VALID_MEASUREMENT_TYPES[m_type]
    if not (bounds["min"] <= value <= bounds["max"]):
        return False, f"Value {value} is outside plausible range ({bounds['min']}-{bounds['max']} {bounds['unit']}) for {measurement_type}."

    return True, None


def record_patient_measurement(
    user_id: int,
    measurement_type: str,
    value: float,
    unit: Optional[str] = None,
    source: str = "manual",
    notes: Optional[str] = None,
    symptoms: Optional[str] = None,
    wellness_status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate and save a health measurement for the user.
    """
    m_type = measurement_type.lower()
    is_valid, error = validate_measurement_input(m_type, value)
    if not is_valid:
        return {"success": False, "error": error}

    resolved_unit = unit or VALID_MEASUREMENT_TYPES[m_type]["unit"]

    # Evaluate physiological status
    evaluation = evaluate_vital_status(m_type, value, resolved_unit)

    success = save_health_measurement(
        user_id=user_id,
        measurement_type=m_type,
        value=value,
        unit=resolved_unit,
        source=source,
        notes=notes,
        symptoms=symptoms,
        wellness_status=wellness_status
    )

    if not success:
        return {"success": False, "error": "Database error saving measurement."}

    return {
        "success": True,
        "evaluation": evaluation,
        "message": f"Successfully logged {measurement_type} ({value} {resolved_unit})."
    }


def record_vital_batch(
    user_id: int,
    vitals_data: Dict[str, Any],
    source: str = "manual",
    notes: Optional[str] = None,
    symptoms: Optional[str] = None,
    wellness_status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Log multiple vitals from a single intake form turn.
    """
    items_to_save = []
    evaluations = {}

    for k, v in vitals_data.items():
        if v is None or v == "":
            continue
        try:
            val = float(v)
        except (ValueError, TypeError):
            continue

        clean_type = k.lower()
        if clean_type in VALID_MEASUREMENT_TYPES:
            is_valid, _ = validate_measurement_input(clean_type, val)
            if is_valid:
                unit = VALID_MEASUREMENT_TYPES[clean_type]["unit"]
                items_to_save.append({
                    "measurement_type": clean_type,
                    "value": val,
                    "unit": unit,
                    "source": source,
                    "notes": notes,
                    "symptoms": symptoms,
                    "wellness_status": wellness_status
                })
                evaluations[clean_type] = evaluate_vital_status(clean_type, val, unit)

    count = save_bulk_measurements(user_id, items_to_save)
    return {
        "success": count > 0,
        "logged_count": count,
        "evaluations": evaluations
    }


def get_patient_monitoring_overview(user_id: int) -> Dict[str, Any]:
    """
    Assembles the standard Health Monitoring overview:
    - Latest readings for HR, SpO2, Temp, BP, RR
    - Visual indicators (Normal, Warning, Critical)
    - Recent measurement logs
    """
    latest_raw = get_user_latest_vitals(user_id)
    recent_logs = get_user_health_measurements(user_id, limit=15)

    cards = {}
    for m_type in ["heart_rate", "spo2", "temperature", "blood_pressure_systolic", "blood_pressure_diastolic", "respiratory_rate", "weight"]:
        item = latest_raw.get(m_type)
        if item:
            val = item["value"]
            unit = item["unit"]
            eval_res = evaluate_vital_status(m_type, val, unit)
            cards[m_type] = {
                "recorded": True,
                "value": val,
                "unit": unit,
                "recorded_at": item["recorded_at"],
                "status": eval_res["status"],
                "badge": eval_res["badge"],
                "message": eval_res["message"],
                "is_emergency": eval_res.get("is_emergency", False)
            }
        else:
            ref = VITAL_REFERENCE_RANGES.get(m_type, {})
            cards[m_type] = {
                "recorded": False,
                "value": None,
                "unit": ref.get("unit", ""),
                "status": "NOT_RECORDED",
                "badge": "neutral",
                "message": "No measurements recorded yet.",
                "is_emergency": False
            }

    # Consolidated Blood Pressure card if both systolic & diastolic present
    bp_card = None
    sys = cards.get("blood_pressure_systolic")
    dia = cards.get("blood_pressure_diastolic")
    if sys and sys["recorded"] and dia and dia["recorded"]:
        is_emerg = sys.get("is_emergency", False) or dia.get("is_emergency", False)
        status = "CRITICAL" if is_emerg else ("NORMAL" if sys["status"] == "NORMAL" and dia["status"] == "NORMAL" else "BORDERLINE")
        badge = "critical" if is_emerg else ("normal" if status == "NORMAL" else "warning")
        bp_card = {
            "recorded": True,
            "display": f"{int(sys['value'])}/{int(dia['value'])} mmHg",
            "systolic": sys["value"],
            "diastolic": dia["value"],
            "recorded_at": sys["recorded_at"],
            "status": status,
            "badge": badge,
            "message": f"{sys['message']} / {dia['message']}"
        }

    return {
        "cards": cards,
        "blood_pressure_card": bp_card,
        "recent_logs": recent_logs,
        "disclaimer": HEALTH_MONITOR_DISCLAIMER
    }


def get_patient_vital_trends(user_id: int, time_range: str = "7d", measurement_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculates time-series trends over Today, 7 days, 30 days, or 3 months.
    """
    days = ALLOWED_TIME_RANGES.get(time_range.lower(), 7)

    # If a specific type requested, query just that
    if measurement_type and measurement_type.lower() in VALID_MEASUREMENT_TYPES:
        rows = get_user_health_measurements(user_id, measurement_type=measurement_type.lower(), days=days, limit=300)
        # Sort chronologically for chart display
        chrono_rows = sorted(rows, key=lambda x: str(x.get("recorded_at", "")))
        trend_analysis = analyze_health_trend(chrono_rows, measurement_type.lower())
        return {
            "range": time_range,
            "days": days,
            "measurement_type": measurement_type.lower(),
            "data": chrono_rows,
            "analysis": trend_analysis
        }

    # Otherwise return trend overview across standard 4 vitals
    standard_types = ["heart_rate", "spo2", "temperature", "blood_pressure_systolic"]
    results = {}
    for st in standard_types:
        rows = get_user_health_measurements(user_id, measurement_type=st, days=days, limit=200)
        chrono_rows = sorted(rows, key=lambda x: str(x.get("recorded_at", "")))
        results[st] = {
            "data": chrono_rows,
            "analysis": analyze_health_trend(chrono_rows, st)
        }

    return {
        "range": time_range,
        "days": days,
        "vitals": results,
        "disclaimer": HEALTH_MONITOR_DISCLAIMER
    }
