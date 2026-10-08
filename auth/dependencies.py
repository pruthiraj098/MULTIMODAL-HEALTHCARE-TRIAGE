from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any

import jwt

from auth.auth_service import SECRET_KEY, ALGORITHM
from database.database import get_user_by_id


# ============================================================
# JWT Bearer Authentication
# ============================================================

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# ============================================================
# Get Current User
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify JWT token and return the logged-in user.
    """

    token = credentials.credentials

    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token."
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your login session has expired. Please login again."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

    # Get user from database
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )

    # Check whether account is active
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled."
        )

    return user


# ============================================================
# Require Admin
# ============================================================

def require_admin(
    current_user=Depends(get_current_user)
):
    """
    Allow access to ADMIN or SYSTEM_ADMIN users.
    """
    allowed = ["ADMIN", "SYSTEM_ADMIN", "FACILITY_ADMIN"]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )

    return current_user


# ============================================================
# Require Clinical Staff (Nurses, Doctors, Medical Officers, Health Workers)
# ============================================================

def require_clinical_staff(
    current_user=Depends(get_current_user)
):
    """
    Allow access to clinical healthcare workers, nurses, doctors, medical officers, and admins.
    """
    allowed = [
        "HEALTH_WORKER", "NURSE", "DOCTOR", "MEDICAL_OFFICER",
        "FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"
    ]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinical healthcare worker authorization required."
        )

    return current_user


# ============================================================
# Require Clinical Reviewer (Nurses, Doctors, Medical Officers)
# ============================================================

def require_reviewer(
    current_user=Depends(get_current_user)
):
    """
    Allow access to qualified clinical reviewers (Nurses, Doctors, Medical Officers).
    """
    allowed = [
        "NURSE", "DOCTOR", "MEDICAL_OFFICER",
        "ADMIN", "SYSTEM_ADMIN"
    ]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Qualified clinical reviewer (Nurse/Doctor/Medical Officer) authorization required."
        )

    return current_user


# ============================================================
# Require Doctor (Doctors, Medical Officers, Admins)
# ============================================================

def require_doctor(
    current_user=Depends(get_current_user)
):
    """
    Allow access to qualified Doctors, Medical Officers, and System Admins.
    """
    allowed = ["DOCTOR", "MEDICAL_OFFICER", "ADMIN", "SYSTEM_ADMIN"]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor or Medical Officer authorization required."
        )

    return current_user


# ============================================================
# Require Nurse (Nurses, Doctors, Medical Officers, Health Workers)
# ============================================================

def require_nurse(
    current_user=Depends(get_current_user)
):
    """
    Allow access to Nurses, Doctors, Medical Officers, and Clinical Staff.
    """
    allowed = [
        "NURSE", "DOCTOR", "MEDICAL_OFFICER", "HEALTH_WORKER",
        "FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"
    ]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nurse or clinical staff authorization required."
        )

    return current_user


# ============================================================
# Require Facility Admin
# ============================================================

def require_facility_admin(
    current_user=Depends(get_current_user)
):
    """
    Allow access to facility administrators and system admins.
    """
    allowed = ["FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Facility Administrator authorization required."
        )

    return current_user


# ============================================================
# Require Public Health Authority / Facility Admin
# ============================================================

def require_public_health(
    current_user=Depends(get_current_user)
):
    """
    Allow access to public health officers, medical officers, and facility admins.
    """
    allowed = [
        "MEDICAL_OFFICER", "FACILITY_ADMIN",
        "ADMIN", "SYSTEM_ADMIN"
    ]
    if current_user["role"] not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public Health Officer or Facility Administrator authorization required."
        )

    return current_user



# ============================================================
# Get Optional Current User (Guest or Authenticated)
# ============================================================

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[dict]:
    """
    Safely inspect JWT token if provided.
    Returns user dict if valid and active, or None if guest/unauthenticated.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("user_id")
        if user_id is None:
            return None

        user = get_user_by_id(user_id)
        if user and user.get("is_active"):
            return user
    except Exception:
        pass

    return None