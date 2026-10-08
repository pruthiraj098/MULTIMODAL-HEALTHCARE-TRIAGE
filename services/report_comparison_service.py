# ============================================================
# HealthTriage AI - Report Comparison & "What Changed?" Service (Modules 9, 10, 11)
# Longitudinal Diagnostic Analyte Comparison, Delta Tracking,
# Medication Timeline Correlation & Doctor Question Generator
# ============================================================

import os
import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from database.database import (
    get_user_medical_reports,
    get_user_medications,
    get_user_latest_vitals
)
from ai.ai_safety_guard import AISafetyGuard

WHAT_CHANGED_DISCLAIMER = (
    "This longitudinal comparison illustrates changes in your recorded diagnostic parameters over time. "
    "A change in a lab value—even following medication use—does not prove cause and effect. "
    "These findings must be reviewed in clinical context by your treating physician."
)

class ReportComparisonService:
    @staticmethod
    def compare_all_reports(user_id: int, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves all authorized diagnostic reports for the user, extracts parameters
        chronologically, computes analyte deltas, and generates a structured comparison.
        """
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        raw_reports = get_user_medical_reports(user_id=user_id, limit=50)

        if not raw_reports:
            return {
                "success": True,
                "has_reports": False,
                "total_reports": 0,
                "summary": "No historical medical reports have been uploaded yet. Upload your lab tests or scans to enable automatic comparison.",
                "parameter_timeline": {},
                "disclaimer": WHAT_CHANGED_DISCLAIMER
            }

        # Parse extracted parameters from each report
        parsed_reports = []
        for rep in reversed(raw_reports):  # Chronological order (oldest to newest)
            params = []
            raw_p = rep.get("extracted_parameters")
            if raw_p:
                if isinstance(raw_p, str):
                    try:
                        params = json.loads(raw_p)
                    except Exception:
                        params = []
                elif isinstance(raw_p, list):
                    params = raw_p

            date_str = rep.get("report_date") or (
                rep["created_at"].strftime("%Y-%m-%d") if isinstance(rep.get("created_at"), datetime) else str(rep.get("created_at") or "")
            )

            parsed_reports.append({
                "id": rep["id"],
                "file_name": rep["file_name"],
                "report_type": rep.get("report_type") or "Diagnostic Report",
                "date": date_str,
                "parameters": params,
                "abnormal_count": rep.get("abnormal_count", 0),
                "urgency": rep.get("overall_urgency", "ROUTINE")
            })

        # Track parameters chronologically across reports
        # parameter_name -> [{ report_id, date, value, unit, reference_range, status }]
        analyte_tracker: Dict[str, List[Dict[str, Any]]] = {}

        for r in parsed_reports:
            for p in r["parameters"]:
                name = p.get("name") or p.get("parameter") or p.get("test_name")
                if not name:
                    continue
                norm_name = name.strip().title()

                if norm_name not in analyte_tracker:
                    analyte_tracker[norm_name] = []

                analyte_tracker[norm_name].append({
                    "report_id": r["id"],
                    "report_date": r["date"],
                    "value": p.get("value") or p.get("result"),
                    "unit": p.get("unit", ""),
                    "reference_range": p.get("reference_range", ""),
                    "status": p.get("status", "NORMAL")
                })

        # Compute longitudinal changes for multi-point analytes
        comparison_table = []
        improved_list = []
        stable_list = []
        needs_attention_list = []
        new_findings_list = []

        for analyte, points in analyte_tracker.items():
            if len(points) == 1:
                pt = points[0]
                status_cat = "NORMAL" if pt.get("status") in ["NORMAL", "OPTIMAL"] else "ABNORMAL"
                new_findings_list.append({
                    "parameter": analyte,
                    "date": pt["report_date"],
                    "value": f"{pt['value']} {pt['unit']}".strip(),
                    "reference_range": pt.get("reference_range", "N/A"),
                    "status": pt.get("status", "NORMAL")
                })
                continue

            # Compare earliest vs latest
            earliest = points[0]
            latest = points[-1]

            val_early = ReportComparisonService._parse_numeric(earliest["value"])
            val_late = ReportComparisonService._parse_numeric(latest["value"])

            early_status = earliest.get("status", "NORMAL").upper()
            late_status = latest.get("status", "NORMAL").upper()

            # Classify trajectory
            category = "STABLE"
            change_desc = "Consistent across checks"

            if late_status in ["NORMAL", "OPTIMAL"] and early_status in ["HIGH", "LOW", "ABNORMAL"]:
                category = "IMPROVED"
                change_desc = f"Normalized from previous {early_status.lower()} level ({earliest['value']} {earliest['unit']})"
                improved_list.append(analyte)
            elif late_status in ["HIGH", "LOW", "ABNORMAL"] and early_status in ["NORMAL", "OPTIMAL"]:
                category = "NEEDS_ATTENTION"
                change_desc = f"New abnormal finding (previously normal at {earliest['value']} {earliest['unit']})"
                needs_attention_list.append(analyte)
            elif late_status in ["HIGH", "LOW", "ABNORMAL"] and early_status in ["HIGH", "LOW", "ABNORMAL"]:
                category = "NEEDS_ATTENTION"
                change_desc = f"Persistently {late_status.lower()} ({earliest['value']} → {latest['value']} {latest['unit']})"
                needs_attention_list.append(analyte)
            else:
                if val_early is not None and val_late is not None and abs(val_late - val_early) > 0.05 * val_early:
                    category = "CHANGED_MONITOR"
                    direction = "Increased" if val_late > val_early else "Decreased"
                    change_desc = f"{direction} within range ({earliest['value']} → {latest['value']} {latest['unit']})"
                else:
                    category = "STABLE"
                    stable_list.append(analyte)

            comparison_table.append({
                "parameter": analyte,
                "first_recorded": f"{earliest['value']} {earliest['unit']} ({earliest['report_date']})",
                "latest_recorded": f"{latest['value']} {latest['unit']} ({latest['report_date']})",
                "trajectory": category,
                "explanation": change_desc,
                "reference_range": latest.get("reference_range", "N/A"),
                "latest_status": late_status,
                "history_points": points
            })

        # Fetch active medications to check temporal associations
        meds = get_user_medications(user_id=user_id, active_only=True)
        med_timeline = [f"{m['name']} ({m.get('dosage', '')})" for m in meds]

        return {
            "success": True,
            "has_reports": True,
            "total_reports": len(parsed_reports),
            "reports_analyzed": parsed_reports,
            "comparison_table": comparison_table,
            "categories": {
                "improved": improved_list,
                "stable": stable_list,
                "needs_attention": needs_attention_list,
                "new_findings": new_findings_list
            },
            "active_medication_context": med_timeline,
            "disclaimer": WHAT_CHANGED_DISCLAIMER
        }

    @staticmethod
    def get_what_changed_summary(user_id: int, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes the dedicated 'What Changed?' analysis comparing the latest health
        information with previous records, displaying color-coded status badges,
        and generating clinical questions to discuss with the doctor.
        """
        comparison = ReportComparisonService.compare_all_reports(user_id=user_id, api_key=api_key)
        vitals = get_user_latest_vitals(user_id)
        medications = get_user_medications(user_id=user_id, active_only=True)

        items_changed = []

        # 1. Analyte trajectories
        for item in comparison.get("comparison_table", []):
            traj = item["trajectory"]
            if traj == "IMPROVED":
                badge = {"code": "IMPROVED", "symbol": "🟢", "color": "#16a34a", "label": "Improved"}
            elif traj == "STABLE":
                badge = {"code": "STABLE", "symbol": "🔵", "color": "#2563eb", "label": "Stable"}
            elif traj == "CHANGED_MONITOR":
                badge = {"code": "CHANGED_MONITOR", "symbol": "🟡", "color": "#d97706", "label": "Changed / Monitor"}
            else:
                badge = {"code": "NEEDS_ATTENTION", "symbol": "🔴", "color": "#dc2626", "label": "Needs Attention"}

            items_changed.append({
                "title": item["parameter"],
                "badge": badge,
                "previous_value": item["first_recorded"],
                "current_value": item["latest_recorded"],
                "explanation": item["explanation"],
                "reference_range": item["reference_range"]
            })

        # 2. Recommended questions to ask doctor
        doctor_questions = []
        needs_attn = comparison.get("categories", {}).get("needs_attention", [])
        if needs_attn:
            doctor_questions.append(
                f"My recent tests show persistent or new changes in {', '.join(needs_attn[:2])}. Should we investigate further or repeat these tests?"
            )

        if medications and needs_attn:
            doctor_questions.append(
                f"Could any of my current medications ({', '.join([m['name'] for m in medications[:2]])}) be related to these test changes?"
            )

        doctor_questions.extend([
            "Are my current values within an acceptable target range for my overall health profile?",
            "What lifestyle or dietary adjustments do you recommend based on these trends?",
            "When should I schedule my next follow-up lab screening?"
        ])

        return {
            "success": True,
            "total_tracked": len(items_changed),
            "changes": items_changed,
            "counts": {
                "improved": len([i for i in items_changed if i["badge"]["code"] == "IMPROVED"]),
                "stable": len([i for i in items_changed if i["badge"]["code"] == "STABLE"]),
                "monitoring": len([i for i in items_changed if i["badge"]["code"] == "CHANGED_MONITOR"]),
                "needs_attention": len([i for i in items_changed if i["badge"]["code"] == "NEEDS_ATTENTION"])
            },
            "temporal_medication_note": (
                "Lab changes recorded after starting a medication indicate a chronological timeline. "
                "This does not prove the medication caused the change; discuss with your doctor."
            ),
            "doctor_questions": doctor_questions,
            "disclaimer": WHAT_CHANGED_DISCLAIMER
        }

    @staticmethod
    def _parse_numeric(val: Any) -> Optional[float]:
        """Safely parses float from raw strings with units (e.g. '12.5 g/dL')."""
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        try:
            match = re.search(r"[-+]?\d*\.\d+|\d+", str(val))
            return float(match.group()) if match else None
        except Exception:
            return None
