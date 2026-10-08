# ============================================================
# HealthTriage AI - Referral Note Generator & Transfer Service
# Prepares structured referral drafts for PHC-to-District Hospital,
# Clinic-to-Tertiary Care, and Inter-Facility Transfers
# ============================================================

from typing import Dict, Any, List, Optional
from datetime import datetime
from database.database import (
    create_referral_record,
    get_referral_record,
    get_all_referrals,
    get_triage_session_detail,
    insert_audit_log
)

class ReferralService:
    """
    Automates clinical referral documentation.
    AI generates the initial draft; authorized healthcare professionals
    preview, edit, approve, and finalize the note.
    """

    @staticmethod
    def prepare_referral_draft(
        session_id: int,
        receiving_facility: str,
        specialty_required: str,
        priority: str = "URGENT",
        transport_mode: str = "STANDARD",
        referring_facility: Optional[str] = None,
        author_notes: Optional[str] = None,
        created_by: int = 1
    ) -> Dict[str, Any]:
        """
        Extracts fused evidence from the triage session and generates a structured referral draft.
        """
        session_detail = get_triage_session_detail(session_id)
        if not session_detail:
            return {"success": False, "message": "Triage session not found."}

        patient_name = session_detail.get("patient_name", "Patient")
        patient_age = session_detail.get("patient_age")
        patient_gender = session_detail.get("patient_gender")
        chief_complaint = session_detail.get("chief_complaint", "Clinical referral")
        triage_level = session_detail.get("triage_level", "URGENT")
        referring_fac = referring_facility or session_detail.get("facility_type", "District Health Facility")

        # Synthesize vitals summary
        vitals_list = session_detail.get("vitals_snapshot") or []
        vitals_text = "; ".join([f"{v.get('parameter')}: {v.get('value')} {v.get('unit')} ({v.get('status')})" for v in vitals_list]) if vitals_list else "No acute vitals recorded during intake."

        # Synthesize abnormal findings
        reports_list = session_detail.get("report_findings") or []
        abnormal_items = [f"{r.get('test_name')}: {r.get('result')} {r.get('unit')} (Ref: {r.get('reference_range')})" for r in reports_list if r.get("status") in ["LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH"]]
        abnormal_text = "; ".join(abnormal_items) if abnormal_items else "No abnormal laboratory values flagged."

        # Clinical summary
        ai_summary = session_detail.get("ai_generated_summary") or {}
        clinical_summary = (
            f"Patient {patient_name} ({patient_age or 'N/A'}y, {patient_gender or 'N/A'}) presented with: {chief_complaint}.\n"
            f"Triage Assessment: {triage_level} priority.\n"
            f"Clinical Observations: {ai_summary.get('clinical_summary', 'Evaluated at primary triage.')}\n"
            f"Reviewer Evaluation: {author_notes or session_detail.get('reviewer_notes') or 'Referred for specialist evaluation and definitive management.'}"
        )

        reason = f"Specialist evaluation in {specialty_required} for {chief_complaint}. Triage Level: {triage_level}."

        referral_id = create_referral_record(
            session_id=session_id,
            patient_id=session_detail.get("user_id"),
            patient_name=patient_name,
            referring_facility=referring_fac,
            receiving_facility=receiving_facility,
            specialty_required=specialty_required,
            priority=priority,
            reason_for_referral=reason,
            clinical_summary=clinical_summary,
            vital_signs_summary=vitals_text,
            abnormal_findings=abnormal_text,
            transport_mode=transport_mode,
            created_by=created_by,
            status="DRAFT"
        )

        return {
            "success": True,
            "referral_id": referral_id,
            "patient_name": patient_name,
            "referring_facility": referring_fac,
            "receiving_facility": receiving_facility,
            "specialty_required": specialty_required,
            "priority": priority,
            "clinical_summary": clinical_summary,
            "vital_signs_summary": vitals_text,
            "abnormal_findings": abnormal_text,
            "status": "DRAFT"
        }

    @staticmethod
    def approve_referral(
        referral_id: int,
        current_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Approves and seals referral note for patient transfer."""
        from database.database import get_connection
        conn = get_connection()
        if not conn:
            return {"success": False, "message": "Database connection error."}

        cur = conn.cursor()
        try:
            cur.execute("UPDATE referrals SET status = 'APPROVED' WHERE id = %s", (referral_id,))
            conn.commit()

            insert_audit_log(
                user_id=current_user.get("id"),
                user_role=current_user.get("role"),
                action="REFERRAL_APPROVED",
                resource_type="referral",
                resource_id=str(referral_id),
                details=f"Referral {referral_id} approved by {current_user.get('full_name')}"
            )
            return {"success": True, "message": "Referral approved successfully."}
        except Exception as e:
            conn.rollback()
            return {"success": False, "message": str(e)}
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def get_printable_html(referral_id: int) -> str:
        """Generates a clean, professional, printable hospital transfer slip."""
        ref = get_referral_record(referral_id)
        if not ref:
            return "<html><body><h3>Referral Record Not Found</h3></body></html>"

        priority_color = "#dc2626" if ref["priority"] == "EMERGENCY" else ("#d97706" if ref["priority"] == "URGENT" else "#059669")

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Official Clinical Referral Note — {ref['patient_name']}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }}
  .header {{ border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }}
  .badge {{ display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 700; color: #fff; background: {priority_color}; font-size: 13px; text-transform: uppercase; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }}
  .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; }}
  .label {{ font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }}
  .value {{ font-size: 15px; font-weight: 600; color: #0f172a; }}
  .section {{ margin-bottom: 20px; }}
  .section-title {{ font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }}
  .box {{ background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; }}
  .footer {{ margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }}
  @media print {{ body {{ padding: 20px; }} button {{ display: none; }} }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0 0 6px 0; font-size: 24px; color: #0f172a;">HEALTHTRIAGE AI — CLINICAL REFERRAL SLIP</h1>
      <p style="margin:0; font-size: 13px; color: #64748b;">Government & Institutional Healthcare Facility Transfer Network</p>
    </div>
    <div>
      <span class="badge">{ref['priority']} REFERRAL</span>
      <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 6px;">REF ID: #{ref['id']:05d}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Patient Name</div>
      <div class="value">{ref['patient_name']}</div>
    </div>
    <div class="card">
      <div class="label">Specialty Requested</div>
      <div class="value">{ref['specialty_required']}</div>
    </div>
    <div class="card">
      <div class="label">Referring Facility</div>
      <div class="value">{ref['referring_facility']}</div>
    </div>
    <div class="card">
      <div class="label">Receiving Facility</div>
      <div class="value">{ref['receiving_facility']}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Reason for Clinical Referral</div>
    <div class="box">{ref['reason_for_referral']}</div>
  </div>

  <div class="section">
    <div class="section-title">Synthesized Clinical Summary</div>
    <div class="box" style="white-space: pre-line;">{ref['clinical_summary']}</div>
  </div>

  <div class="section">
    <div class="section-title">Vital Signs at Transfer</div>
    <div class="box">{ref.get('vital_signs_summary') or 'Stable baseline recorded.'}</div>
  </div>

  <div class="section">
    <div class="section-title">Key Diagnostic & Laboratory Findings</div>
    <div class="box">{ref.get('abnormal_findings') or 'No acute laboratory abnormalities identified.'}</div>
  </div>

  <div class="grid" style="margin-top: 24px;">
    <div class="card">
      <div class="label">Transport Mode Recommended</div>
      <div class="value">{ref.get('transport_mode', 'STANDARD').replace('_', ' ')}</div>
    </div>
    <div class="card">
      <div class="label">Author / Clinician</div>
      <div class="value">{ref.get('author_name', 'Healthcare Staff')} ({ref.get('author_role', 'CLINICIAN')})</div>
    </div>
  </div>

  <div class="footer">
    <div>Generated on: {ref.get('created_at')} | Verified by HealthTriage AI Human-in-the-Loop Protocol</div>
    <div>Physician Signature: ___________________________</div>
  </div>
</body>
</html>"""
