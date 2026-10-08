# ============================================================
# HealthTriage AI - AI Health Monitor Engine
# Evaluates physiological measurements, safety boundaries, and trends
# (Strictly Non-Diagnostic / Lifestyle & Clinical Context Only)
# ============================================================

from typing import Dict, Any, List, Optional
from datetime import datetime

HEALTH_MONITOR_DISCLAIMER = (
    "Personal health trends are informational and provide lifestyle and triage context. "
    "Measurements should be interpreted alongside professional medical evaluation. "
    "Never diagnose disease or alter treatments based solely on individual readings."
)

# Reference physiological boundaries (Standard Clinical Adult Baselines)
VITAL_REFERENCE_RANGES = {
    "heart_rate": {
        "name": "Heart Rate",
        "unit": "BPM",
        "normal_min": 60.0,
        "normal_max": 100.0,
        "critical_low": 45.0,
        "critical_high": 130.0,
        "normal_label": "Normal Resting Heart Rate (60-100 BPM)",
        "low_label": "Low (Bradycardia range)",
        "high_label": "Elevated (Tachycardia range)",
    },
    "spo2": {
        "name": "Blood Oxygen (SpO2)",
        "unit": "%",
        "normal_min": 95.0,
        "normal_max": 100.0,
        "critical_low": 90.0,
        "critical_high": None,
        "normal_label": "Normal Oxygen Saturation (95-100%)",
        "low_label": "Mildly Sub-optimal (90-94%)",
        "high_label": "Normal Range",
    },
    "temperature": {
        "name": "Body Temperature",
        "unit": "°F",
        "normal_min": 97.0,
        "normal_max": 99.0,
        "critical_low": 95.0,
        "critical_high": 103.0,
        "normal_label": "Normal Body Temperature (97.0-99.0°F)",
        "low_label": "Sub-normal / Low",
        "high_label": "Elevated / Feverish",
    },
    "blood_pressure_systolic": {
        "name": "Systolic Blood Pressure",
        "unit": "mmHg",
        "normal_min": 90.0,
        "normal_max": 120.0,
        "critical_low": 80.0,
        "critical_high": 180.0,
        "normal_label": "Normal Systolic (< 120 mmHg)",
        "low_label": "Low Systolic (< 90 mmHg)",
        "high_label": "Elevated / High Systolic (>= 120 mmHg)",
    },
    "blood_pressure_diastolic": {
        "name": "Diastolic Blood Pressure",
        "unit": "mmHg",
        "normal_min": 60.0,
        "normal_max": 80.0,
        "critical_low": 50.0,
        "critical_high": 120.0,
        "normal_label": "Normal Diastolic (< 80 mmHg)",
        "low_label": "Low Diastolic (< 60 mmHg)",
        "high_label": "Elevated / High Diastolic (>= 80 mmHg)",
    },
    "respiratory_rate": {
        "name": "Respiratory Rate",
        "unit": "breaths/min",
        "normal_min": 12.0,
        "normal_max": 20.0,
        "critical_low": 8.0,
        "critical_high": 30.0,
        "normal_label": "Normal Breathing Rate (12-20 /min)",
        "low_label": "Low Breathing Rate",
        "high_label": "Elevated Breathing Rate",
    },
    "weight": {
        "name": "Body Weight",
        "unit": "kg",
        "normal_min": 30.0,
        "normal_max": 250.0,
        "critical_low": None,
        "critical_high": None,
        "normal_label": "Recorded Weight",
        "low_label": "Underweight baseline",
        "high_label": "Above typical baseline",
    }
}


def normalize_temperature(value: float, unit: str = "°F") -> float:
    """Normalize temperature to Fahrenheit for consistent comparison."""
    if "c" in unit.lower():
        return round((value * 9 / 5) + 32, 1)
    return round(value, 1)


def evaluate_vital_status(measurement_type: str, value: float, unit: str = "") -> Dict[str, Any]:
    """
    Evaluates a single measurement value against clinical physiological thresholds.
    Returns categorized level: 'NORMAL', 'BORDERLINE', 'ALERT', or 'CRITICAL'.
    Never outputs a diagnostic conclusion.
    """
    m_type = measurement_type.lower()
    ref = VITAL_REFERENCE_RANGES.get(m_type)

    if not ref:
        return {
            "status": "NORMAL",
            "badge": "recorded",
            "message": "Recorded measurement.",
            "is_emergency": False,
        }

    comp_value = value
    if m_type == "temperature":
        comp_value = normalize_temperature(value, unit or ref["unit"])

    # 1. Critical safety checks
    if ref.get("critical_low") is not None and comp_value < ref["critical_low"]:
        return {
            "status": "CRITICAL",
            "badge": "critical",
            "message": f"Critically low {ref['name']} reading ({value} {ref['unit']}). Seek immediate clinical review if accompanied by distress.",
            "is_emergency": True,
        }

    if ref.get("critical_high") is not None and comp_value >= ref["critical_high"]:
        return {
            "status": "CRITICAL",
            "badge": "critical",
            "message": f"Critically elevated {ref['name']} reading ({value} {ref['unit']}). Prompt medical attention recommended.",
            "is_emergency": True,
        }

    # 2. Normal range
    if ref["normal_min"] <= comp_value <= ref["normal_max"]:
        return {
            "status": "NORMAL",
            "badge": "normal",
            "message": ref["normal_label"],
            "is_emergency": False,
        }

    # 3. Low or elevated
    if comp_value < ref["normal_min"]:
        return {
            "status": "ALERT" if m_type == "spo2" else "BORDERLINE",
            "badge": "warning",
            "message": ref["low_label"],
            "is_emergency": False,
        }

    return {
        "status": "BORDERLINE",
        "badge": "warning",
        "message": ref["high_label"],
        "is_emergency": False,
    }


def analyze_health_trend(measurements: List[Dict[str, Any]], measurement_type: str) -> Dict[str, Any]:
    """
    Calculates statistical trajectory and non-diagnostic summary for a series of readings.
    """
    if not measurements:
        return {
            "trend": "no_data",
            "direction": "flat",
            "count": 0,
            "average": None,
            "min": None,
            "max": None,
            "summary": "No measurements recorded for this time interval.",
            "stability": "insufficient_data"
        }

    values = [m["value"] for m in measurements if isinstance(m.get("value"), (int, float))]
    if not values:
        return {
            "trend": "no_data",
            "direction": "flat",
            "count": 0,
            "average": None,
            "min": None,
            "max": None,
            "summary": "No numerical measurements available.",
            "stability": "insufficient_data"
        }

    avg_val = round(sum(values) / len(values), 1)
    min_val = min(values)
    max_val = max(values)
    count = len(values)

    # Determine trajectory between first recorded and latest
    # (assuming measurements are sorted descending or ascending; sort chronological)
    sorted_m = sorted(measurements, key=lambda x: str(x.get("recorded_at", "")))
    first_val = sorted_m[0]["value"]
    latest_val = sorted_m[-1]["value"]
    diff = latest_val - first_val

    m_name = VITAL_REFERENCE_RANGES.get(measurement_type.lower(), {}).get("name", measurement_type)
    unit = VITAL_REFERENCE_RANGES.get(measurement_type.lower(), {}).get("unit", "")

    if abs(diff) < 0.05 * (avg_val or 1):
        direction = "stable"
        summary = f"Your {m_name} has remained steady across {count} recent logs (average: {avg_val} {unit})."
    elif diff > 0:
        direction = "increasing"
        summary = f"Your {m_name} showed an upward trend from {first_val} to {latest_val} {unit} across {count} logs."
    else:
        direction = "decreasing"
        summary = f"Your {m_name} showed a downward trend from {first_val} to {latest_val} {unit} across {count} logs."

    # Status of latest reading
    latest_eval = evaluate_vital_status(measurement_type, latest_val, unit)

    return {
        "trend": direction,
        "direction": direction,
        "count": count,
        "average": avg_val,
        "min": min_val,
        "max": max_val,
        "first_value": first_val,
        "latest_value": latest_val,
        "latest_status": latest_eval["status"],
        "latest_badge": latest_eval["badge"],
        "summary": summary,
        "disclaimer": HEALTH_MONITOR_DISCLAIMER
    }
