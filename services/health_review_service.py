# ============================================================
# HealthTriage AI - SANA Health Review Service (Module 13)
# 360-Degree Longitudinal Synthesis of Patient History,
# Reports, Vitals, Medications, and Follow-up Directives
# ============================================================

import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from database.database import (
    get_user_medical_reports,
    get_user_medications,
    get_user_latest_vitals,
    get_user_followups,
    get_latest_health_risk_assessment
)
from services.report_comparison_service import ReportComparisonService
from ai.ai_safety_guard import AISafetyGuard

HEALTH_REVIEW_DISCLAIMER = (
    "This SANA Health Review is an automated longitudinal synthesis of your recorded health information. "
    "It is designed to prepare you for clinical consultations and organize your medical profile. "
    "It does not replace an in-person physical examination or clinical diagnosis."
)

class HealthReviewService:
    @staticmethod
    def generate_360_health_review(
        user_id: int,
        patient_name: str = "Patient",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assembles a comprehensive 360-degree health review synthesizing reports,
        vitals, medications, changes, and follow-ups into a concise narrative.
        """
        api_key = api_key or os.getenv("GEMINI_API_KEY")

        # 1. Fetch patient longitudinal profile
        reports = get_user_medical_reports(user_id=user_id, limit=10)
        meds = get_user_medications(user_id=user_id, active_only=True)
        vitals = get_user_latest_vitals(user_id) or {}
        followups = get_user_followups(user_id)
        risk = get_latest_health_risk_assessment(user_id)

        # 2. Run 'What Changed?' analysis
        changes_data = ReportComparisonService.get_what_changed_summary(user_id=user_id, api_key=api_key)

        # 3. Assemble structured sections
        # Vitals snapshot
        vitals_formatted = {}
        for k, v in vitals.items():
            if isinstance(v, dict):
                vitals_formatted[k] = f"{v.get('value')} {v.get('unit', '')}".strip()
            elif v is not None:
                vitals_formatted[k] = str(v)

        # Medications list
        med_items = [
            f"{m['name']} ({m.get('dosage', 'Standard')} - {m.get('time_of_day', 'Daily')})"
            for m in meds
        ]

        # Scheduled followups
        pending_followups = [
            f"{f.get('followup_type', 'Follow-up')}: {f.get('clinical_objective', 'Review')} (Scheduled: {f.get('scheduled_date')})"
            for f in followups if f.get("status") in ["SCHEDULED", "PENDING"]
        ]

        # 4. Synthesize AI narrative
        spoken_summary = (
            f"Here is your complete health review, {patient_name}. "
            f"You have {len(reports)} diagnostic reports on file and {len(meds)} active medications recorded. "
        )

        if changes_data.get("counts", {}).get("needs_attention", 0) > 0:
            spoken_summary += f"We noticed {changes_data['counts']['needs_attention']} parameter(s) that warrant clinical discussion with your doctor. "
        elif changes_data.get("counts", {}).get("improved", 0) > 0:
            spoken_summary += f"{changes_data['counts']['improved']} of your tracked lab values have improved since your earlier records. "
        else:
            spoken_summary += "Your recorded vitals and reports appear consistent. "

        spoken_summary += "I have compiled your vital trends, medication schedule, and questions to ask your doctor."

        return {
            "success": True,
            "patient_name": patient_name,
            "review_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "spoken_summary": spoken_summary,
            "vitals_snapshot": vitals_formatted,
            "active_medications": med_items,
            "recent_reports_count": len(reports),
            "changes_detected": changes_data.get("changes", []),
            "changes_counts": changes_data.get("counts", {}),
            "scheduled_followups": pending_followups,
            "health_risk_score": risk.get("risk_score") if risk else None,
            "health_risk_category": risk.get("risk_level") if risk else "Not Assessed",
            "doctor_questions": changes_data.get("doctor_questions", []),
            "disclaimer": HEALTH_REVIEW_DISCLAIMER
        }
