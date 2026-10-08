# ============================================================
# HealthTriage AI - Doctor Visit Copilot Service
# Prepares users for in-person clinical consultations with structured summaries,
# vital trends, abnormal report highlights, and targeted questions for the doctor
# ============================================================

from typing import Dict, Any, List, Optional
from datetime import datetime
from database.database import (
    get_user_latest_vitals,
    get_user_medical_reports,
    get_user_medications,
    get_user_triage_history
)

class DoctorVisitCopilotService:
    """
    Empowers patients to have productive, focused clinical encounters with their doctors.
    Generates a clear 1-page pre-consultation briefing document.
    """

    @staticmethod
    def generate_consultation_brief(
        user_id: int,
        patient_name: str,
        current_concern: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assembles longitudinal records into a patient consultation briefing.
        """
        # 1. Fetch patient longitudinal records
        vitals = get_user_latest_vitals(user_id) or {}
        reports = get_user_medical_reports(user_id, limit=3) or []
        meds = get_user_medications(user_id, active_only=True) or []
        history = get_user_triage_history(user_id) or []

        latest_triage = history[0] if history else None

        # 2. Extract vitals summary
        vitals_summary = []
        for vtype, vobj in vitals.items():
            if isinstance(vobj, dict):
                vitals_summary.append({
                    "type": vtype.replace("_", " ").title(),
                    "value": f"{vobj.get('value')} {vobj.get('unit', '')}",
                    "date": vobj.get("recorded_at", "Recent")
                })

        # 3. Extract abnormal lab report flags
        lab_highlights = []
        for r in reports:
            abnormal_count = r.get("abnormal_count", 0)
            if abnormal_count > 0:
                lab_highlights.append({
                    "report_name": r.get("file_name") or r.get("report_type") or "Lab Report",
                    "abnormal_count": abnormal_count,
                    "summary": r.get("summary") or r.get("plain_language_explanation") or "Parameters outside reference range."
                })

        # 4. Active prescriptions
        active_prescriptions = []
        for m in meds:
            active_prescriptions.append(f"{m.get('name')} {m.get('dosage')} ({m.get('frequency')})")

        # 5. Formulate personalized, high-value questions for the doctor
        tailored_questions = [
            "What do you think is the primary cause of my current symptoms?",
            "Are there any specific warning signs that should prompt me to go to the emergency room?",
        ]

        if lab_highlights:
            tailored_questions.append("How do my recent abnormal test results relate to the symptoms I am having?")

        if active_prescriptions:
            tailored_questions.append("Do any of my current daily medications need adjustment based on these symptoms?")

        if vitals.get("blood_pressure_systolic") or vitals.get("heart_rate"):
            tailored_questions.append("Are my current vital signs within your target range for my age and health history?")

        tailored_questions.append("When should I schedule a follow-up visit with you or your clinic?")

        chief_complaint = current_concern or (latest_triage.get("symptoms") if latest_triage else "Routine medical consultation")

        return {
            "success": True,
            "patient_name": patient_name,
            "chief_complaint": chief_complaint,
            "vitals_summary": vitals_summary,
            "lab_highlights": lab_highlights,
            "active_medications": active_prescriptions,
            "tailored_questions": tailored_questions,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    @staticmethod
    def get_printable_copilot_html(brief: Dict[str, Any]) -> str:
        """Renders an elegant, compact 1-page printable consultation guide for the patient."""
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Doctor Visit Briefing — {brief.get('patient_name')}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 36px; color: #1e293b; background: #fff; line-height: 1.5; }}
  .header {{ border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }}
  .badge {{ background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }}
  .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }}
  .title {{ font-size: 13px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 8px; }}
  ul {{ margin: 0; padding-left: 20px; }}
  li {{ margin-bottom: 6px; font-size: 13px; }}
  .question-box {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }}
  .footer {{ margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; }}
  @media print {{ body {{ padding: 20px; }} }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0 0 4px 0; color: #0f172a;">Doctor Visit Copilot — Patient Briefing</h2>
      <div style="font-size: 13px; color: #64748b;">Patient: <strong>{brief.get('patient_name')}</strong> | Date: {brief.get('generated_at')}</div>
    </div>
    <span class="badge">CONSULTATION GUIDE</span>
  </div>

  <div class="card" style="margin-bottom: 16px;">
    <div class="title">Chief Health Concern</div>
    <div style="font-size: 14px; font-weight: 600;">{brief.get('chief_complaint')}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="title">Current Vital Signs</div>
      {('<ul>' + ''.join([f"<li><strong>{v['type']}:</strong> {v['value']}</li>" for v in brief.get('vitals_summary', [])]) + '</ul>') if brief.get('vitals_summary') else '<p style="font-size:12px;color:#64748b;">No recent vitals logged.</p>'}
    </div>
    <div class="card">
      <div class="title">Active Medications</div>
      {('<ul>' + ''.join([f"<li>{m}</li>" for m in brief.get('active_medications', [])]) + '</ul>') if brief.get('active_medications') else '<p style="font-size:12px;color:#64748b;">No active prescriptions recorded.</p>'}
    </div>
  </div>

  <div class="card" style="margin-bottom: 16px;">
    <div class="title">Recent Diagnostic Highlights</div>
    {('<ul>' + ''.join([f"<li><strong>{l['report_name']} ({l['abnormal_count']} abnormal):</strong> {l['summary']}</li>" for l in brief.get('lab_highlights', [])]) + '</ul>') if brief.get('lab_highlights') else '<p style="font-size:12px;color:#64748b;">All recent tests within normal limits or none uploaded.</p>'}
  </div>

  <div class="question-box">
    <div class="title" style="color:#1d4ed8;">Top Questions to Ask Your Doctor</div>
    <ul>
      {''.join([f"<li>{q}</li>" for q in brief.get('tailored_questions', [])])}
    </ul>
  </div>

  <div class="footer">
    HealthTriage AI Doctor Visit Copilot is an educational preparation aid and does not substitute for clinical history taking by your doctor.
  </div>
</body>
</html>"""
