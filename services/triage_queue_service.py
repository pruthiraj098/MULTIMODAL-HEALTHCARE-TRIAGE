# ============================================================
# HealthTriage AI - Smart Healthcare Queue & Review Service
# Manages clinical case queues, role-based assignments,
# and Human-in-the-Loop review actions (Approve / Modify / Escalate / Refer)
# ============================================================

from typing import Dict, Any, List, Optional
from database.database import (
    get_triage_queue,
    get_triage_session_detail,
    assign_triage_session,
    save_triage_review_decision,
    insert_audit_log
)

class TriageQueueService:
    """
    Coordinates clinical workload for healthcare workers, nurses, doctors, and medical officers.
    Keeps human clinical judgment in the loop at all times.
    """

    @staticmethod
    def get_queue_cases(
        filter_type: str = "all",
        facility_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieves cases prioritized by emergency red flags and clinical urgency.
        Filters: 'all', 'emergency', 'urgent', 'routine', 'review_needed'
        """
        cases = get_triage_queue(
            filter_type=filter_type,
            facility_id=facility_id,
            search=search,
            limit=limit,
            offset=offset
        )

        # Quick breakdown counts for queue summary pills
        counts = {
            "all": len(cases),
            "emergency": sum(1 for c in cases if c.get("triage_level") == "EMERGENCY" or c.get("is_emergency")),
            "urgent": sum(1 for c in cases if c.get("triage_level") == "URGENT"),
            "routine": sum(1 for c in cases if c.get("triage_level") == "ROUTINE"),
            "pending_review": sum(1 for c in cases if c.get("status") == "PENDING_REVIEW")
        }

        return {
            "success": True,
            "filter": filter_type,
            "counts": counts,
            "cases": cases
        }

    @staticmethod
    def get_case(session_id: int, current_user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Retrieves complete case details with multimodal evidence and audit trail."""
        case = get_triage_session_detail(session_id)
        if not case:
            return {"success": False, "message": "Clinical case not found."}

        # Audit view access
        if current_user:
            insert_audit_log(
                user_id=current_user.get("id"),
                user_role=current_user.get("role"),
                action="CASE_VIEWED",
                resource_type="triage_session",
                resource_id=str(session_id),
                details=f"Case viewed by {current_user.get('full_name')} ({current_user.get('role')})"
            )

        return {"success": True, "case": case}

    @staticmethod
    def assign_case_to_reviewer(
        session_id: int,
        reviewer_id: int,
        current_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assigns a case to the specified reviewer or self."""
        success = assign_triage_session(session_id, reviewer_id)
        if not success:
            return {"success": False, "message": "Failed to assign case."}

        insert_audit_log(
            user_id=current_user.get("id"),
            user_role=current_user.get("role"),
            action="CASE_ASSIGNED",
            resource_type="triage_session",
            resource_id=str(session_id),
            details=f"Assigned to user ID {reviewer_id} by {current_user.get('full_name')}"
        )

        return {"success": True, "message": "Case assigned successfully."}

    @staticmethod
    def submit_review_decision(
        session_id: int,
        reviewer_id: int,
        decision: str,
        reviewer_notes: str,
        new_status: str = "APPROVED",
        new_triage_level: Optional[str] = None,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a human reviewer decision:
        - APPROVE: Clinician validates AI triage assessment.
        - MODIFY: Clinician alters triage category, vitals, or clinical guidance.
        - REQUEST_INFO: Clinician requests additional lab/vitals before disposition.
        - ESCALATE: Clinician escalates to senior medical officer / emergency resuscitation.
        - REFER: Clinician prepares outpatient/tertiary hospital transfer.
        """
        valid_decisions = ["APPROVED", "MODIFIED", "REQUEST_INFO", "ESCALATED", "REFERRED"]
        clean_decision = decision.upper().strip()
        if clean_decision not in valid_decisions:
            clean_decision = "APPROVED"

        success = save_triage_review_decision(
            session_id=session_id,
            reviewer_id=reviewer_id,
            decision=clean_decision,
            reviewer_notes=reviewer_notes,
            new_status=new_status,
            new_triage_level=new_triage_level
        )

        if not success:
            return {"success": False, "message": "Failed to record review decision."}

        if current_user:
            insert_audit_log(
                user_id=current_user.get("id"),
                user_role=current_user.get("role"),
                action=f"REVIEW_{clean_decision}",
                resource_type="triage_session",
                resource_id=str(session_id),
                details=f"Review decision: {clean_decision}. Notes: {reviewer_notes[:100]}"
            )

        return {
            "success": True,
            "message": f"Review action '{clean_decision}' recorded successfully.",
            "decision": clean_decision,
            "status": new_status
        }
