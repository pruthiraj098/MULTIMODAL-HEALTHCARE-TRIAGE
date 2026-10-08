# ============================================================
# HealthTriage AI - Audit & Compliance Service
# Tracks access to protected health records, reviewer decisions,
# referrals, role assignments, and system security events
# ============================================================

from typing import Dict, Any, List, Optional
from database.database import insert_audit_log, fetch_audit_logs

class AuditService:
    """Security and compliance logging for healthcare data access and clinician actions."""

    @staticmethod
    def log_event(
        user_id: Optional[int],
        user_role: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> bool:
        """Records an auditable healthcare action."""
        return insert_audit_log(
            user_id=user_id,
            user_role=user_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )

    @staticmethod
    def get_logs(limit: int = 100, action: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves audit trail records."""
        return fetch_audit_logs(limit=limit, action=action)
