from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime

from dotenv import load_dotenv
import os

from ai.gemini_service import analyze_patient
from ai.risk_engine import check_vital_signs, assess_triage_risk

from database.database import (
    initialize_database,
    save_triage_result,
    delete_health_measurement,
    save_health_risk_assessment,
    get_latest_health_risk_assessment,
    get_user_health_risk_history,
    get_user_latest_vitals,
    get_user_health_measurements,
    save_medical_report,
    get_user_medical_reports,
    get_medical_report_by_id,
    delete_medical_report,
    add_user_medication,
    get_user_medications,
    update_user_medication,
    delete_user_medication,
    create_treatment_plan,
    get_treatment_plans_for_patient,
    get_active_treatment_plan_for_patient,
    update_treatment_plan_status,
    create_doctor_assessment,
    get_doctor_assessments_for_patient,
    assign_patient_to_staff,
    get_assigned_patients
)
from ai.health_risk_score import analyze_health_risk
from services.report_service import process_patient_report
from services.medication_service import (
    get_patient_medication_overview,
    get_patient_daily_schedule,
    record_patient_dose,
    scan_patient_prescription
)
from ai.medication_guidance import (
    check_drug_interactions,
    get_food_and_lifestyle_warnings,
    get_missed_dose_guidance
)
from services.self_care_service import (
    get_remedies_for_patient,
    record_patient_wellness_checkin,
    get_patient_wellness_history
)
from ai.self_care_guidance import (
    EVIDENCE_BASED_REMEDIES,
    SELF_CARE_DISCLAIMER
)
from services.healthcare_finder_service import (
    find_nearby_healthcare_facilities,
    get_nearest_emergency_trauma_facility,
    save_patient_favorite_facility,
    get_patient_favorite_facilities,
    remove_patient_favorite_facility,
    CITY_COORDINATES
)

from auth.auth_service import (
    register_user,
    login_user,
    request_password_reset,
    reset_password
)

from auth.dependencies import (
    get_current_user,
    require_admin,
    get_optional_current_user,
    require_clinical_staff,
    require_reviewer,
    require_facility_admin,
    require_public_health,
    require_doctor,
    require_nurse
)

from admin.admin_service import (
    get_dashboard_statistics,
    get_all_users,
    update_user_status
)

from services.health_monitor_service import (
    get_patient_monitoring_overview,
    get_patient_vital_trends,
    record_patient_measurement,
    record_vital_batch
)


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="HealthTriage AI API",
    description="Backend API for the HealthTriage AI application",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8501",
    "http://127.0.0.1:8501"
]

frontend_env = os.getenv("FRONTEND_URL")
if frontend_env and frontend_env not in default_origins:
    default_origins.append(frontend_env)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    for origin in allowed_origins_env.split(","):
        o = origin.strip()
        if o and o not in default_origins:
            default_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "PATIENT"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class NewPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserStatusRequest(BaseModel):
    is_active: bool


class TriageRequest(BaseModel):
    name: str = ""
    age: int | None = None
    gender: str = ""
    symptoms: str = ""
    temperature: float | None = None
    spo2: float | None = None
    heart_rate: float | None = None
    respiratory_rate: float | None = None
    systolic_bp: float | None = None
    diastolic_bp: float | None = None
    conversation: list[dict] = []
    final_assessment: bool = True
    image_data: str | None = None
    report_data: str | None = None
    audio_data: str | None = None
    language: str = "auto"


class MeasurementLogRequest(BaseModel):
    measurement_type: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    heart_rate: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    respiratory_rate: Optional[float] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    symptoms: Optional[str] = None
    wellness_status: Optional[str] = None
    source: str = "manual"


class HealthRiskAnalyzeRequest(BaseModel):
    symptoms: Optional[str] = ""
    vitals: Optional[dict] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[List[str]] = None
    report_findings: Optional[str] = None
    conversation_context: Optional[str] = None
    save_result: bool = True


class ReportAnalyzeRequest(BaseModel):
    file_data: str
    file_name: str
    mime_type: Optional[str] = None
    symptoms: Optional[str] = ""
    save_report: bool = True


class MedicationAddRequest(BaseModel):
    name: str
    dosage: str
    frequency: str = "Once daily"
    time_of_day: str = "Morning"
    instructions: Optional[str] = None
    food_warnings: Optional[str] = None


class MedicationUpdateRequest(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    time_of_day: Optional[str] = None
    instructions: Optional[str] = None
    food_warnings: Optional[str] = None
    is_active: Optional[bool] = None


class MedicationLogDoseRequest(BaseModel):
    medication_id: int
    scheduled_date: str
    time_of_day: str
    status: str = "taken"


class InteractionCheckRequest(BaseModel):
    medications: Optional[List[str]] = None


class MissedDoseRequest(BaseModel):
    medication_name: str


class PrescriptionScanRequest(BaseModel):
    file_data: str
    mime_type: Optional[str] = "image/jpeg"
    file_name: Optional[str] = "prescription.jpg"


# ============================================================
# CLINICAL QUEUE & REVIEW REQUEST MODELS
# ============================================================

class CaseAssignRequest(BaseModel):
    reviewer_id: int


class CaseReviewRequest(BaseModel):
    decision: str
    reviewer_notes: str
    new_status: Optional[str] = "APPROVED"
    new_triage_level: Optional[str] = None


class ReferralPrepareRequest(BaseModel):
    session_id: int
    receiving_facility: str
    specialty_required: str
    priority: Optional[str] = "URGENT"
    transport_mode: Optional[str] = "STANDARD"
    referring_facility: Optional[str] = None
    author_notes: Optional[str] = None


class DoctorVisitBriefRequest(BaseModel):
    current_concern: Optional[str] = None


class FollowupScheduleRequest(BaseModel):
    session_id: Optional[int] = None
    patient_id: int
    followup_type: str = "GENERAL_CHECKIN"
    scheduled_date: str
    reminder_channel: str = "APP_NOTIFICATION"
    clinical_objective: str
    notes: Optional[str] = None


class FacilityModeUpdateRequest(BaseModel):
    active_mode: str


class TreatmentPlanMedicationItem(BaseModel):
    medicine_name: str
    dosage: str = "As directed"
    frequency: str = "Once daily"
    duration_days: int = 7
    instructions: Optional[str] = None
    food_relation: str = "After food"
    time_of_day: str = "Morning"


class CreateTreatmentPlanRequest(BaseModel):
    patient_id: int
    clinical_assessment: str
    diagnosis_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    tests_recommended: Optional[str] = None
    lifestyle_guidance: Optional[str] = None
    session_id: Optional[int] = None
    medications: Optional[List[TreatmentPlanMedicationItem]] = []


class TreatmentPlanStatusRequest(BaseModel):
    status: str


class DoctorAssessmentCreateRequest(BaseModel):
    patient_id: int
    clinical_findings: str
    chief_complaint: Optional[str] = None
    differential_notes: Optional[str] = None
    severity_level: str = "ROUTINE"
    session_id: Optional[int] = None


class PatientAssignmentRequest(BaseModel):
    patient_id: int
    staff_id: int
    role: str = "DOCTOR"
    facility_id: Optional[int] = None


class NurseIntakeRequest(BaseModel):
    patient_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    symptoms: str
    heart_rate: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    observations: Optional[str] = None
    escalate_to_doctor: bool = False



# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():
    try:
        initialize_database()
    except Exception as e:
        print("Notice: Database initialization deferred:", e)


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def home():
    return {
        "message": "HealthTriage AI API is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# USER REGISTRATION
# ============================================================

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    result = register_user(
        full_name=request.full_name,
        email=request.email,
        password=request.password,
        role=request.role or "PATIENT"
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


# ============================================================
# USER LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(request: LoginRequest):
    result = login_user(
        email=request.email,
        password=request.password
    )

    if not result["success"]:
        raise HTTPException(
            status_code=401,
            detail=result["message"]
        )

    return result


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/api/auth/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "full_name": current_user["full_name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "is_active": bool(
                current_user["is_active"]
            )
        }
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================

@app.post("/api/auth/forgot-password")
def forgot_password(
    request: PasswordResetRequest
):
    result = request_password_reset(
        request.email
    )

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result["message"]
        )

    return result


# ============================================================
# RESET PASSWORD
# ============================================================

@app.post("/api/auth/reset-password")
def reset_user_password(
    request: NewPasswordRequest
):
    result = reset_password(
        request.token,
        request.new_password
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@app.get("/api/admin/dashboard")
def admin_dashboard(
    current_admin=Depends(require_admin)
):
    try:
        statistics = get_dashboard_statistics()

        return {
            "success": True,
            "message": "Admin dashboard data retrieved successfully.",
            "admin": {
                "id": current_admin["id"],
                "full_name": current_admin["full_name"],
                "email": current_admin["email"],
                "role": current_admin["role"]
            },
            "statistics": statistics
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET ALL USERS
# ============================================================

@app.get("/api/admin/users")
def admin_users(
    current_admin=Depends(require_admin)
):
    try:
        users = get_all_users()

        return {
            "success": True,
            "users": users
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# ACTIVATE / DEACTIVATE USER
# ============================================================

@app.put("/api/admin/users/{user_id}/status")
def change_user_status(
    user_id: int,
    request: UserStatusRequest,
    current_admin=Depends(require_admin)
):
    try:
        result = update_user_status(
            user_id,
            request.is_active
        )

        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )

        return result

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# ADMIN TRIAGE HISTORY
# ============================================================

@app.get("/api/admin/triage-history")
def admin_triage_history(
    current_admin=Depends(require_admin)
):
    try:
        from database.database import get_all_triage_history

        history = get_all_triage_history()

        return {
            "success": True,
            "history": history
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# TRIAGE
# ============================================================

@app.post("/api/triage")
def perform_triage(
    request: TriageRequest,
    current_user=Depends(get_current_user)
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "success": False,
            "error": "GEMINI_API_KEY not found in environment."
        }

    patient_name = (
        request.name.strip()
        if request.name and request.name.strip()
        else current_user.get("full_name", "Patient")
    )

    safety_warnings = check_vital_signs(
        temperature=request.temperature,
        spo2=request.spo2,
        heart_rate=request.heart_rate,
        respiratory_rate=request.respiratory_rate,
        systolic_bp=request.systolic_bp,
        diastolic_bp=request.diastolic_bp
    )

    try:
        result = analyze_patient(
            api_key=api_key,
            name=patient_name,
            age=request.age,
            gender=request.gender,
            symptoms=request.symptoms,
            temperature=request.temperature,
            spo2=request.spo2,
            heart_rate=request.heart_rate,
            respiratory_rate=request.respiratory_rate,
            systolic_bp=request.systolic_bp,
            diastolic_bp=request.diastolic_bp,
            safety_warnings=safety_warnings,
            report=request.report_data,
            image=request.image_data,
            audio=request.audio_data,
            conversation=request.conversation,
            language=request.language,
            final_assessment=request.final_assessment
        )

        try:
            save_triage_result(
                patient_name=patient_name,
                age=request.age,
                gender=request.gender,
                symptoms=request.symptoms,
                triage_result=result,
                user_id=current_user.get("id")
            )
        except Exception as database_error:
            print("Database warning saving triage result:", database_error)

        return {
            "success": True,
            "triage_result": result,
            "safety_warnings": safety_warnings
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
            "safety_warnings": safety_warnings
        }


# ============================================================
# USER TRIAGE HISTORY
# ============================================================

@app.get("/api/user/triage-history")
def user_triage_history(
    current_user=Depends(get_current_user)
):
    try:
        from database.database import get_user_triage_history

        history = get_user_triage_history(current_user["id"])

        return {
            "success": True,
            "history": history
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# TRIAGE SERVICE STATUS
# ============================================================

@app.get("/api/triage/status")
def triage_status():
    from ai.gemini_service import PRIMARY_MODEL

    api_key = os.getenv("GEMINI_API_KEY")

    return {
        "status": "online",
        "has_api_key": bool(api_key),
        "primary_model": PRIMARY_MODEL
    }


# ============================================================
# HEALTH MONITORING ENDPOINTS (PHASE 2)
# ============================================================

@app.get("/api/health/monitoring")
def health_monitoring_overview(
    current_user=Depends(get_current_user)
):
    """
    Returns latest vital readings, cards, recent timeline measurements,
    and clinical reference limits for the authenticated user.
    """
    try:
        data = get_patient_monitoring_overview(current_user["id"])
        return {
            "success": True,
            "user_id": current_user["id"],
            **data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Unable to load health monitoring data."
        )


@app.post("/api/health/measurements")
def log_health_measurements(
    request: MeasurementLogRequest,
    current_user=Depends(get_current_user)
):
    """
    Records single vital sign or batch of vitals with optional symptoms,
    notes, and daily wellness status for the authenticated user.
    """
    try:
        # Check if single specific measurement was provided
        if request.measurement_type and request.value is not None:
            res = record_patient_measurement(
                user_id=current_user["id"],
                measurement_type=request.measurement_type,
                value=request.value,
                unit=request.unit,
                source=request.source,
                notes=request.notes,
                symptoms=request.symptoms,
                wellness_status=request.wellness_status
            )
            if not res["success"]:
                raise HTTPException(status_code=400, detail=res["error"])
            return res

        # Check for multi-vital batch submission
        vitals_dict = {}
        if request.heart_rate is not None:
            vitals_dict["heart_rate"] = request.heart_rate
        if request.spo2 is not None:
            vitals_dict["spo2"] = request.spo2
        if request.temperature is not None:
            vitals_dict["temperature"] = request.temperature
        if request.systolic_bp is not None:
            vitals_dict["blood_pressure_systolic"] = request.systolic_bp
        if request.diastolic_bp is not None:
            vitals_dict["blood_pressure_diastolic"] = request.diastolic_bp
        if request.respiratory_rate is not None:
            vitals_dict["respiratory_rate"] = request.respiratory_rate
        if request.weight is not None:
            vitals_dict["weight"] = request.weight

        if not vitals_dict:
            raise HTTPException(
                status_code=400,
                detail="Please provide at least one vital sign measurement."
            )

        res = record_vital_batch(
            user_id=current_user["id"],
            vitals_data=vitals_dict,
            source=request.source,
            notes=request.notes,
            symptoms=request.symptoms,
            wellness_status=request.wellness_status
        )
        return res

    except HTTPException:
        raise
    except Exception as e:
        print("[Health API] Log error:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to record measurement. Please check input values."
        )


@app.get("/api/health/trends")
def health_trends(
    range: str = Query("7d", pattern="^(today|7d|30d|3m)$"),
    type: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """
    Returns time-series trend data and statistical analysis
    across Today, 7 days, 30 days, or 3 months.
    """
    try:
        trends = get_patient_vital_trends(
            user_id=current_user["id"],
            time_range=range,
            measurement_type=type
        )
        return {
            "success": True,
            **trends
        }
    except Exception as e:
        print("[Health API] Trends error:", e)
        raise HTTPException(
            status_code=500,
            detail="Unable to calculate health trends."
        )


@app.delete("/api/health/measurements/{measurement_id}")
def remove_measurement(
    measurement_id: int,
    current_user=Depends(get_current_user)
):
    """
    Removes a health measurement, strictly enforcing user ownership.
    """
    try:
        deleted = delete_health_measurement(
            user_id=current_user["id"],
            measurement_id=measurement_id
        )
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Measurement not found or access denied."
            )
        return {
            "success": True,
            "message": "Measurement deleted successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete measurement."
        )


# ============================================================
# AI HEALTH RISK SCORE ENDPOINTS (PHASE 3)
# ============================================================

@app.post("/api/health-risk/analyze")
def evaluate_health_risk(
    request: HealthRiskAnalyzeRequest,
    current_user=Depends(get_current_user)
):
    """
    Evaluates multi-factor AI Triage Risk Indicator (Deterministic + AI)
    based on vital signs, symptoms, medical history, and clinical documentation.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")

        # Resolve vitals: if vitals not explicitly passed, fallback to latest logged vitals
        vitals_data = request.vitals
        if not vitals_data:
            latest_vitals_dict = get_user_latest_vitals(current_user["id"])
            if latest_vitals_dict:
                vitals_data = {
                    "heart_rate": latest_vitals_dict.get("heart_rate", {}).get("value"),
                    "spo2": latest_vitals_dict.get("spo2", {}).get("value"),
                    "temperature": latest_vitals_dict.get("temperature", {}).get("value"),
                    "systolic_bp": latest_vitals_dict.get("blood_pressure_systolic", {}).get("value"),
                    "diastolic_bp": latest_vitals_dict.get("blood_pressure_diastolic", {}).get("value"),
                    "respiratory_rate": latest_vitals_dict.get("respiratory_rate", {}).get("value"),
                }
            else:
                vitals_data = {}

        # Fetch recent historical health measurements for context
        recent_measurements = get_user_health_measurements(current_user["id"], limit=10)

        # Analyze health risk
        result = analyze_health_risk(
            api_key=api_key,
            symptoms=request.symptoms or "",
            vitals=vitals_data,
            recent_history=recent_measurements,
            report_findings=request.report_findings,
            conversation_context=request.conversation_context
        )

        # Save to database if requested
        if request.save_result:
            try:
                save_health_risk_assessment(
                    user_id=current_user["id"],
                    risk_level=result["risk_level"],
                    risk_score=result["risk_score"],
                    factors=result["factors"],
                    explanation=result["explanation"],
                    recommended_action=result["recommended_action"]
                )
            except Exception as save_err:
                print("[Health Risk API] Database save warning:", save_err)

        return {
            "success": True,
            **result
        }
    except Exception as e:
        print("[Health Risk API] Analysis error:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Unable to complete health risk analysis: {str(e)}"
        )


@app.get("/api/health-risk/latest")
def get_latest_risk(
    current_user=Depends(get_current_user)
):
    """
    Returns the most recent AI Triage Risk assessment for the authenticated user.
    """
    try:
        latest = get_latest_health_risk_assessment(current_user["id"])
        return {
            "success": True,
            "assessment": latest
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve latest health risk assessment."
        )


@app.get("/api/health-risk/history")
def get_risk_history(
    limit: int = Query(15, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Returns historical AI Triage Risk assessments for the authenticated user.
    """
    try:
        history = get_user_health_risk_history(current_user["id"], limit=limit)
        return {
            "success": True,
            "history": history
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve health risk history."
        )


# ============================================================
# SMART MEDICAL REPORT ANALYZER ENDPOINTS (PHASE 4)
# ============================================================

@app.post("/api/reports/analyze")
def analyze_report(
    request: ReportAnalyzeRequest,
    current_user=Depends(get_current_user)
):
    """
    Ingests and analyzes an uploaded PDF or image medical report.
    Extracts parameters, flags abnormal values, generates plain-language explanations,
    correlates findings with reported symptoms, and produces questions for the doctor.
    """
    try:
        result = process_patient_report(
            user_id=current_user["id"],
            file_data=request.file_data,
            file_name=request.file_name,
            mime_type=request.mime_type,
            symptoms=request.symptoms or "",
            save_report=request.save_report
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to process medical report.")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print("[Reports API] Analysis error:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Unable to analyze medical report: {str(e)}"
        )


@app.get("/api/reports")
def list_reports(
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Retrieves all analyzed medical reports for the authenticated user.
    """
    try:
        reports = get_user_medical_reports(current_user["id"], limit=limit)
        return {
            "success": True,
            "reports": reports
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve medical reports."
        )


@app.get("/api/reports/{report_id}")
def get_report(
    report_id: int,
    current_user=Depends(get_current_user)
):
    """
    Retrieves a single analyzed medical report by ID with user ownership check.
    """
    try:
        report = get_medical_report_by_id(current_user["id"], report_id)
        if not report:
            raise HTTPException(
                status_code=404,
                detail="Medical report not found or access denied."
            )
        return {
            "success": True,
            "report": report
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve medical report."
        )


@app.delete("/api/reports/{report_id}")
def remove_report(
    report_id: int,
    current_user=Depends(get_current_user)
):
    """
    Deletes an analyzed medical report with strict user ownership enforcement.
    """
    try:
        deleted = delete_medical_report(current_user["id"], report_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Medical report not found or access denied."
            )
        return {
            "success": True,
            "message": "Medical report deleted successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete medical report."
        )


# ============================================================
# MEDICATION GUIDANCE ENDPOINTS (PHASE 5)
# ============================================================

@app.get("/api/medications")
@app.get("/api/medications/overview")
def list_medications(
    current_user=Depends(get_current_user)
):
    """
    Returns patient's active medication list, live drug-drug conflict scan,
    and food & lifestyle interaction alerts.
    """
    try:
        overview = get_patient_medication_overview(current_user["id"])
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load medications: {str(e)}"
        )


@app.post("/api/medications")
def create_medication(
    request: MedicationAddRequest,
    current_user=Depends(get_current_user)
):
    """
    Add a medication with dosage, frequency, timing, and food warnings to patient regimen.
    """
    try:
        med_id = add_user_medication(
            user_id=current_user["id"],
            name=request.name,
            dosage=request.dosage,
            frequency=request.frequency,
            time_of_day=request.time_of_day,
            instructions=request.instructions,
            food_warnings=request.food_warnings
        )
        if not med_id:
            raise HTTPException(status_code=400, detail="Failed to add medication.")

        return {
            "success": True,
            "message": "Medication added successfully.",
            "medication_id": med_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/medications/{medication_id}")
def update_medication_endpoint(
    medication_id: int,
    request: MedicationUpdateRequest,
    current_user=Depends(get_current_user)
):
    """
    Update medication details or deactivate from active regimen.
    """
    try:
        ok = update_user_medication(
            user_id=current_user["id"],
            medication_id=medication_id,
            name=request.name,
            dosage=request.dosage,
            frequency=request.frequency,
            time_of_day=request.time_of_day,
            instructions=request.instructions,
            food_warnings=request.food_warnings,
            is_active=request.is_active
        )
        if not ok:
            raise HTTPException(status_code=404, detail="Medication not found or access denied.")

        return {
            "success": True,
            "message": "Medication updated successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/medications/{medication_id}")
def remove_medication(
    medication_id: int,
    current_user=Depends(get_current_user)
):
    """
    Delete a medication from the user's regimen.
    """
    try:
        ok = delete_user_medication(current_user["id"], medication_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Medication not found or access denied.")

        return {
            "success": True,
            "message": "Medication deleted successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/medications/check-interactions")
def check_interactions(
    request: InteractionCheckRequest,
    current_user=Depends(get_current_user)
):
    """
    Evaluates drug-drug conflicts across supplied medications or user's active regimen.
    Categorizes severity (Minor / Moderate / Severe) and generates food/lifestyle warnings.
    """
    try:
        med_names = request.medications
        if not med_names:
            meds = get_user_medications(current_user["id"], active_only=True)
            med_names = [m["name"] for m in meds]

        api_key = os.getenv("GEMINI_API_KEY")
        interactions = check_drug_interactions(med_names, api_key=api_key)
        food_warnings = get_food_and_lifestyle_warnings(med_names)

        return {
            "success": True,
            "medications_checked": med_names,
            **interactions,
            "food_warnings": food_warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/medications/schedule")
def get_daily_schedule(
    date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    current_user=Depends(get_current_user)
):
    """
    Visual daily medication schedule (Morning, Afternoon, Evening, Night) with taken/missed statuses.
    """
    try:
        schedule = get_patient_daily_schedule(current_user["id"], scheduled_date=date)
        return schedule
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/medications/log")
def log_dose(
    request: MedicationLogDoseRequest,
    current_user=Depends(get_current_user)
):
    """
    Record dose status: taken, missed, or pending for a specific date and time slot.
    """
    try:
        result = record_patient_dose(
            user_id=current_user["id"],
            medication_id=request.medication_id,
            scheduled_date=request.scheduled_date,
            time_of_day=request.time_of_day,
            status=request.status
        )
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to log dose."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/medications/missed-dose")
def missed_dose_advice(
    request: MissedDoseRequest,
    current_user=Depends(get_current_user)
):
    """
    Safe non-prescriptive guidance on what to do when a dose is missed.
    """
    try:
        guidance = get_missed_dose_guidance(request.medication_name)
        return {
            "success": True,
            **guidance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/medications/scan-prescription")
def scan_prescription(
    request: PrescriptionScanRequest,
    current_user=Depends(get_current_user)
):
    """
    Prescription Reader: Uses multimodal AI to transcribe prescription image/PDF,
    extract medication names, dosages, and instructions, and check interactions.
    """
    try:
        result = scan_patient_prescription(
            user_id=current_user["id"],
            file_data=request.file_data,
            mime_type=request.mime_type,
            file_name=request.file_name
        )
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Prescription scan failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# NATURAL & SELF-CARE GUIDANCE ENDPOINTS (PHASE 6)
# ============================================================

class SelfCareRemedyRequest(BaseModel):
    symptom: str
    severity: Optional[str] = "mild"
    duration_days: Optional[int] = 1


class WellnessCheckinRequest(BaseModel):
    checkin_date: Optional[str] = None
    water_glasses: Optional[int] = 0
    sleep_hours: Optional[float] = 0.0
    mood: Optional[str] = "Neutral"
    energy_level: Optional[str] = "Medium"
    notes: Optional[str] = None


@app.post("/api/self-care/remedies")
def get_self_care_remedies_endpoint(
    request: SelfCareRemedyRequest,
    current_user=Depends(get_current_user)
):
    """
    Returns evidence-based natural comfort measures, red-flag contraindications,
    and when-to-see-doctor timelines personalized to patient vitals and active medications.
    """
    try:
        if not request.symptom or not request.symptom.strip():
            raise HTTPException(status_code=400, detail="Symptom description is required.")

        guidance = get_remedies_for_patient(
            user_id=current_user["id"],
            symptom=request.symptom.strip(),
            severity=request.severity or "mild",
            duration_days=request.duration_days or 1
        )
        return {
            "success": True,
            **guidance
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/self-care/wellness-checkin")
def save_wellness_checkin_endpoint(
    request: WellnessCheckinRequest,
    current_user=Depends(get_current_user)
):
    """
    Log or update daily hydration, sleep hours, mood, energy level, and notes.
    """
    try:
        result = record_patient_wellness_checkin(
            user_id=current_user["id"],
            checkin_date=request.checkin_date,
            water_glasses=request.water_glasses or 0,
            sleep_hours=request.sleep_hours or 0.0,
            mood=request.mood or "Neutral",
            energy_level=request.energy_level or "Medium",
            notes=request.notes
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/self-care/wellness-history")
def get_wellness_history_endpoint(
    days: int = Query(14, ge=1, le=90),
    current_user=Depends(get_current_user)
):
    """
    Retrieve historical wellness check-in entries along with computed lifestyle trend analytics.
    """
    try:
        data = get_patient_wellness_history(user_id=current_user["id"], days=days)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/self-care/library")
def get_remedy_library_endpoint(
    current_user=Depends(get_current_user)
):
    """
    Browse full evidence-based home remedies library for common minor symptoms.
    """
    try:
        return {
            "success": True,
            "categories": EVIDENCE_BASED_REMEDIES,
            "disclaimer": SELF_CARE_DISCLAIMER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# NEARBY HEALTHCARE FINDER ENDPOINTS (PHASE 7)
# ============================================================

class EmergencyNearestRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None


class SaveFacilityRequest(BaseModel):
    facility_id: int
    notes: Optional[str] = None


@app.get("/api/facilities/nearby")
def get_nearby_facilities_endpoint(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    city: Optional[str] = Query(None),
    radius_km: float = Query(35.0, ge=1.0, le=500.0),
    facility_type: Optional[str] = Query(None),
    emergency_only: bool = Query(False),
    open_24x7: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Search and discover nearby medical facilities (Hospitals, Trauma Centers, Pharmacies, Labs)
    with accurate Haversine distance, travel times, and emergency service indicators.
    """
    try:
        results = find_nearby_healthcare_facilities(
            user_lat=lat,
            user_lng=lng,
            city=city,
            radius_km=radius_km,
            facility_type=facility_type,
            emergency_only=emergency_only,
            open_24x7=open_24x7,
            search_query=search,
            limit=limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facilities/emergency-nearest")
def get_emergency_nearest_endpoint(
    request: EmergencyNearestRequest,
    current_user=Depends(get_current_user)
):
    """
    Emergency response routing: Rapidly identifies the closest 24/7 Level-1/2 Trauma
    and Emergency Hospital with direct phone hotline and turn-by-turn navigation.
    """
    try:
        nearest = get_nearest_emergency_trauma_facility(
            user_lat=request.latitude,
            user_lng=request.longitude,
            city=request.city
        )
        return nearest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facilities/cities")
def get_supported_cities_endpoint():
    """Returns list of pre-configured city centers for instant geolocation selection."""
    return {
        "success": True,
        "cities": [{"key": k, "name": v["name"], "lat": v["lat"], "lng": v["lng"]} for k, v in CITY_COORDINATES.items()]
    }


@app.get("/api/facilities/{facility_id}")
def get_facility_detail_endpoint(
    facility_id: int,
    current_user=Depends(get_current_user)
):
    """Retrieve full details of a specific healthcare facility."""
    try:
        from database.database import get_facility_by_id
        facility = get_facility_by_id(facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Healthcare facility not found.")
        return {"success": True, "facility": facility}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facilities/saved")
def save_favorite_facility_endpoint(
    request: SaveFacilityRequest,
    current_user=Depends(get_current_user)
):
    """Bookmark facility to patient's personal emergency/favorites list."""
    try:
        res = save_patient_favorite_facility(
            user_id=current_user["id"],
            facility_id=request.facility_id,
            notes=request.notes
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facilities/saved/list")
def get_saved_facilities_endpoint(
    current_user=Depends(get_current_user)
):
    """Retrieve patient's saved healthcare facilities."""
    try:
        res = get_patient_favorite_facilities(user_id=current_user["id"])
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/facilities/saved/{facility_id}")
def delete_saved_facility_endpoint(
    facility_id: int,
    current_user=Depends(get_current_user)
):
    """Remove facility from saved favorites."""
    try:
        res = remove_patient_favorite_facility(user_id=current_user["id"], facility_id=facility_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================
# SANA VOICE HEALTHCARE AGENT ENDPOINTS
# ============================================================

class SanaChatRequest(BaseModel):
    user_message: str
    conversation: list[dict] = []
    language: str = "auto"
    vitals: dict = {}
    image_data: str | None = None
    report_data: str | None = None
    generate_audio: bool = True
    patient_name: str | None = None
    user_lat: float | None = None
    user_lng: float | None = None
    city: str | None = None
    patient_age: int | None = None


class SanaTTSRequest(BaseModel):
    text: str
    language: str = "en"


@app.post("/api/sana/chat")
def sana_chat(
    request: SanaChatRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    SANA (Smart AI Nursing & Assessment Assistant) Voice & Healthcare Agent Turn (Phase 8).
    Combines verbal vital extraction, conversational clinical understanding,
    independent rule-based risk checks, multimodal interpretation, longitudinal
    patient profile enrichment (vitals, risk score, medications, medical reports),
    automatic nearest trauma center routing for emergencies, evidence-based self-care,
    and active medication interaction checks.
    """
    from ai.sana_agent import process_sana_turn
    from services.voice_service import text_to_speech_base64

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in the environment."
        )

    # Resolve patient identity and longitudinal context
    user_id = current_user.get("id") if current_user else None
    patient_name = request.patient_name or (current_user.get("full_name") if current_user else None) or "Patient"

    patient_profile = None
    effective_vitals = dict(request.vitals or {})

    if user_id:
        try:
            latest_vitals = get_user_latest_vitals(user_id)
            latest_risk = get_latest_health_risk_assessment(user_id)
            active_meds = get_user_medications(user_id, active_only=True)
            recent_reports = get_user_medical_reports(user_id, limit=3)
            wellness_hist = get_patient_wellness_history(user_id, days=7)

            wellness_desc = None
            if wellness_hist and wellness_hist.get("checkins"):
                c0 = wellness_hist["checkins"][0]
                wellness_desc = f"Energy: {c0.get('energy_level', 5)}/10, Stress: {c0.get('stress_level', 3)}/10, Sleep: {c0.get('sleep_hours', 7)}h, Mood: {c0.get('mood', 'Normal')}"

            active_plan = get_active_treatment_plan_for_patient(user_id)

            patient_profile = {
                "baseline_vitals": latest_vitals,
                "risk_assessment": latest_risk,
                "active_medications": active_meds,
                "recent_reports": recent_reports,
                "wellness_status": wellness_desc,
                "treatment_plan": active_plan,
                "user_role": current_user.get("role", "PATIENT") if current_user else "PATIENT"
            }

            # Pre-populate vitals from baseline if not explicitly passed by current voice turn
            if latest_vitals:
                if not effective_vitals.get("heart_rate") and "heart_rate" in latest_vitals:
                    effective_vitals["heart_rate"] = latest_vitals["heart_rate"].get("value")
                if not effective_vitals.get("spo2") and "spo2" in latest_vitals:
                    effective_vitals["spo2"] = latest_vitals["spo2"].get("value")
                if not effective_vitals.get("temperature") and "temperature" in latest_vitals:
                    effective_vitals["temperature"] = latest_vitals["temperature"].get("value")
                if not effective_vitals.get("systolic_bp") and "blood_pressure_systolic" in latest_vitals:
                    effective_vitals["systolic_bp"] = latest_vitals["blood_pressure_systolic"].get("value")
                if not effective_vitals.get("diastolic_bp") and "blood_pressure_diastolic" in latest_vitals:
                    effective_vitals["diastolic_bp"] = latest_vitals["blood_pressure_diastolic"].get("value")

        except Exception as profile_err:
            print("[SANA API] Notice assembling patient profile:", profile_err)

    try:
        result = process_sana_turn(
            api_key=api_key,
            user_message=request.user_message,
            conversation=request.conversation,
            language=request.language,
            vitals=effective_vitals,
            image_data=request.image_data,
            report_data=request.report_data,
            user_name=patient_name,
            patient_profile=patient_profile,
            user_lat=request.user_lat,
            user_lng=request.user_lng,
            city=request.city,
            patient_age=request.patient_age or effective_vitals.get("age"),
            user_id=user_id
        )

        audio_base64 = None
        if request.generate_audio and result.get("spoken_response"):
            try:
                audio_base64 = text_to_speech_base64(
                    text=result["spoken_response"],
                    lang=result.get("language", "en")
                )
            except Exception as audio_err:
                print(f"[SANA API] TTS generation notice: {audio_err}")

        # Save triage assessment to database with user_id linkage
        session_id = None
        structured_note = None
        markdown_note = None

        try:
            summary_content = (
                f"{result['spoken_response']}\n\n"
                f"Triage Level: {result['triage_level']}\n"
                f"{result['screen_summary']}"
            )
            save_triage_result(
                patient_name=patient_name,
                age=request.patient_age or effective_vitals.get("age"),
                gender=effective_vitals.get("gender", ""),
                symptoms=request.user_message,
                triage_result=summary_content,
                user_id=user_id
            )
        except Exception as db_err:
            print("[SANA API] Database save deferred:", db_err)

        # Generate Structured Triage Note & route to Smart Healthcare Queue
        try:
            import uuid
            from services.evidence_fusion_service import EvidenceFusionService
            from database.database import create_triage_session_and_note

            fusion = EvidenceFusionService.fuse_multimodal_evidence(
                patient_name=patient_name,
                age=request.patient_age or effective_vitals.get("age"),
                gender=effective_vitals.get("gender", ""),
                symptoms=request.user_message,
                vitals=result.get("updated_vitals"),
                ai_assessment=result,
                safety_warnings=result.get("safety_warnings"),
                conversation_context=request.conversation,
                language=result.get("language", "en")
            )
            structured_note = fusion
            markdown_note = fusion.get("markdown_note")

            session_uuid = f"SES-{uuid.uuid4().hex[:12].upper()}"
            session_id = create_triage_session_and_note(
                session_uuid=session_uuid,
                user_id=user_id,
                patient_name=patient_name,
                patient_age=request.patient_age or effective_vitals.get("age"),
                patient_gender=effective_vitals.get("gender", ""),
                facility_type="GOVERNMENT_HOSPITAL",
                language=result.get("language", "en"),
                status="PENDING_REVIEW",
                triage_level=result["triage_level"],
                is_emergency=result.get("is_emergency", False),
                source_channel="SANA_VOICE_ASSISTANT",
                chief_complaint=request.user_message,
                patient_reported=fusion.get("patient_reported"),
                ai_extracted={"vitals": fusion.get("extracted_vitals"), "reports": fusion.get("report_extracted")},
                ai_summary=fusion.get("ai_summary"),
                safety_flags=fusion.get("safety_flags"),
                vitals_snapshot=fusion.get("extracted_vitals"),
                report_findings=fusion.get("report_extracted"),
                image_obs=fusion.get("image_observations"),
                missing_info=fusion.get("ai_summary", {}).get("missing_information"),
                suggested_questions=fusion.get("ai_summary", {}).get("suggested_questions"),
                referral_considerations=fusion.get("ai_summary", {}).get("referral_considerations")
            )
        except Exception as session_err:
            print("[SANA API] Triage session creation notice:", session_err)

        return {
            "success": True,
            "session_id": session_id,
            "spoken_response": result["spoken_response"],
            "triage_level": result["triage_level"],
            "triage_badge": result["triage_badge"],
            "is_emergency": result["is_emergency"],
            "screen_summary": result["screen_summary"],
            "key_observations": result["key_observations"],
            "recommended_next_steps": result["recommended_next_steps"],
            "follow_up_question": result["follow_up_question"],
            "safety_disclaimer": result["safety_disclaimer"],
            "safety_warnings": result["safety_warnings"],
            "extracted_vitals": result["extracted_vitals"],
            "updated_vitals": result["updated_vitals"],
            "language": result["language"],
            "audio_base64": audio_base64,
            "nearest_emergency_facility": result.get("nearest_emergency_facility"),
            "emergency_contacts": result.get("emergency_contacts", []),
            "self_care_guidance": result.get("self_care_guidance"),
            "medication_cautions": result.get("medication_cautions", []),
            "patient_profile_applied": result.get("patient_profile_applied", False),
            "structured_note": structured_note,
            "markdown_note": markdown_note
        }

    except Exception as error:
        print("[SANA API] Error processing turn:", error)
        raise HTTPException(
            status_code=500,
            detail=f"SANA encountered an error: {str(error)}"
        )


@app.post("/api/sana/tts")
def sana_tts(request: SanaTTSRequest):
    """Generate TTS audio for SANA spoken responses with graceful fallback."""
    from services.voice_service import text_to_speech_base64

    try:
        audio = text_to_speech_base64(request.text, request.language)
        if not audio:
            return {
                "success": False,
                "audio_base64": None,
                "fallback_to_browser": True,
                "message": "Server TTS unavailable, client browser synthesis should be used."
            }
        return {"success": True, "audio_base64": audio, "fallback_to_browser": False}
    except Exception as e:
        return {
            "success": False,
            "audio_base64": None,
            "fallback_to_browser": True,
            "message": str(e)
        }


@app.get("/api/sana/config")
def sana_config():
    """Returns SANA metadata, languages, and emergency info."""
    from language_service import SUPPORTED_LANGUAGES

    # Support all 6 primary Indian languages
    primary_langs = ["en", "hi", "or", "bn", "te", "ta"]
    languages = [
        {
            "code": code,
            "name": SUPPORTED_LANGUAGES[code]["name"],
            "native_name": SUPPORTED_LANGUAGES[code]["native_name"],
            "flag": SUPPORTED_LANGUAGES[code]["flag"],
            "stt_code": SUPPORTED_LANGUAGES[code]["stt_code"],
            "tts_code": SUPPORTED_LANGUAGES[code]["tts_code"],
        }
        for code in primary_langs
        if code in SUPPORTED_LANGUAGES
    ]

    return {
        "agent": {
            "name": "SANA",
            "full_name": "Smart AI Nursing & Assessment Assistant",
            "tagline": "I'm here when you need me.",
            "personality": "Calm, caring, intelligent and sharp.",
            "role": "Healthcare voice AI triage companion",
            "inspiration": "Futuristic JARVIS-style clinical assistant",
            "disclaimer": "I am an AI triage assistant, not your treating doctor. If you experience severe pain, difficulty breathing, or sudden numbness, seek emergency care immediately."
        },
        "languages": languages,
        "emergency": {
            "title": "Emergency Contacts",
            "numbers": [
                {"name": "National Emergency Helpline", "number": "112"},
                {"name": "Medical / Ambulance", "number": "108"},
                {"name": "US / International Emergency", "number": "911"}
            ],
            "alert_message": "Immediate medical attention may be needed. Please call emergency services immediately."
        },
        "disclaimer": "I am an AI triage assistant, not your treating doctor. If you experience severe pain, difficulty breathing, or sudden numbness, seek emergency care immediately."
    }


# ============================================================
# SMART HEALTHCARE QUEUE & HUMAN REVIEW ENDPOINTS
# ============================================================

@app.get("/api/queue/cases")
def get_queue_cases_endpoint(
    filter_type: str = Query("all", description="Filter by: all, emergency, urgent, routine, review_needed"),
    facility_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    current_staff=Depends(require_clinical_staff)
):
    """Retrieves clinical triage cases for healthcare workers, nurses, and doctors."""
    from services.triage_queue_service import TriageQueueService
    return TriageQueueService.get_queue_cases(
        filter_type=filter_type,
        facility_id=facility_id,
        search=search,
        limit=limit,
        offset=offset
    )


@app.get("/api/queue/case/{session_id}")
def get_queue_case_detail_endpoint(
    session_id: int,
    current_staff=Depends(require_clinical_staff)
):
    """Retrieves complete case details with multimodal evidence and reviewer audit trail."""
    from services.triage_queue_service import TriageQueueService
    res = TriageQueueService.get_case(session_id, current_user=current_staff)
    if not res["success"]:
        raise HTTPException(status_code=404, detail=res["message"])
    return res


@app.post("/api/queue/case/{session_id}/assign")
def assign_case_endpoint(
    session_id: int,
    request: CaseAssignRequest,
    current_staff=Depends(require_clinical_staff)
):
    """Assigns case to a qualified clinical staff member."""
    from services.triage_queue_service import TriageQueueService
    res = TriageQueueService.assign_case_to_reviewer(
        session_id=session_id,
        reviewer_id=request.reviewer_id,
        current_user=current_staff
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res


@app.post("/api/queue/case/{session_id}/review")
def review_case_endpoint(
    session_id: int,
    request: CaseReviewRequest,
    current_reviewer=Depends(require_reviewer)
):
    """
    Submits qualified clinical review decision:
    APPROVED / MODIFIED / REQUEST_INFO / ESCALATED / REFERRED
    """
    from services.triage_queue_service import TriageQueueService
    res = TriageQueueService.submit_review_decision(
        session_id=session_id,
        reviewer_id=current_reviewer["id"],
        decision=request.decision,
        reviewer_notes=request.reviewer_notes,
        new_status=request.new_status or "APPROVED",
        new_triage_level=request.new_triage_level,
        current_user=current_reviewer
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res


# ============================================================
# REFERRAL NOTE GENERATOR & EXPORT ENDPOINTS
# ============================================================

@app.post("/api/referrals/prepare")
def prepare_referral_endpoint(
    request: ReferralPrepareRequest,
    current_staff=Depends(require_clinical_staff)
):
    """Generates structured referral draft from triage session data."""
    from services.referral_service import ReferralService
    res = ReferralService.prepare_referral_draft(
        session_id=request.session_id,
        receiving_facility=request.receiving_facility,
        specialty_required=request.specialty_required,
        priority=request.priority or "URGENT",
        transport_mode=request.transport_mode or "STANDARD",
        referring_facility=request.referring_facility,
        author_notes=request.author_notes,
        created_by=current_staff["id"]
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res


@app.post("/api/referrals/{referral_id}/approve")
def approve_referral_endpoint(
    referral_id: int,
    current_reviewer=Depends(require_reviewer)
):
    """Approves and seals clinical referral note."""
    from services.referral_service import ReferralService
    res = ReferralService.approve_referral(referral_id, current_user=current_reviewer)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res


@app.get("/api/referrals/{referral_id}")
def get_referral_endpoint(
    referral_id: int,
    current_user=Depends(get_current_user)
):
    """Retrieves referral details."""
    from database.database import get_referral_record
    ref = get_referral_record(referral_id)
    if not ref:
        raise HTTPException(status_code=404, detail="Referral record not found.")
    return {"success": True, "referral": ref}


@app.get("/api/referrals/{referral_id}/print", response_class=HTMLResponse)
def print_referral_endpoint(
    referral_id: int,
    current_user=Depends(get_current_user)
):
    """Returns clean, professional printable HTML referral slip."""
    from services.referral_service import ReferralService
    return ReferralService.get_printable_html(referral_id)


@app.get("/api/referrals")
def list_referrals_endpoint(
    current_user=Depends(get_current_user)
):
    """Lists referrals for patient or facility staff."""
    from database.database import get_all_referrals
    patient_id = current_user["id"] if current_user["role"] in ["USER", "PATIENT"] else None
    refs = get_all_referrals(patient_id=patient_id)
    return {"success": True, "referrals": refs}


# ============================================================
# DOCTOR VISIT COPILOT ENDPOINTS
# ============================================================

@app.post("/api/copilot/doctor-visit-summary")
def get_doctor_visit_copilot_endpoint(
    request: DoctorVisitBriefRequest,
    current_user=Depends(get_current_user)
):
    """Generates pre-consultation briefing with vital trends and doctor questions."""
    from services.copilot_service import DoctorVisitCopilotService
    res = DoctorVisitCopilotService.generate_consultation_brief(
        user_id=current_user["id"],
        patient_name=current_user.get("full_name", "Patient"),
        current_concern=request.current_concern
    )
    return res


@app.get("/api/copilot/doctor-visit-summary/print", response_class=HTMLResponse)
def print_doctor_visit_copilot_endpoint(
    concern: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    """Generates printable 1-page consultation briefing for doctor visit."""
    from services.copilot_service import DoctorVisitCopilotService
    brief = DoctorVisitCopilotService.generate_consultation_brief(
        user_id=current_user["id"],
        patient_name=current_user.get("full_name", "Patient"),
        current_concern=concern
    )
    return DoctorVisitCopilotService.get_printable_copilot_html(brief)


# ============================================================
# FOLLOW-UPS & REMINDERS ENDPOINTS
# ============================================================

@app.post("/api/followups/schedule")
def schedule_followup_endpoint(
    request: FollowupScheduleRequest,
    current_staff=Depends(require_clinical_staff)
):
    """Schedules clinical check-in, chronic check, or maternal reminder."""
    from database.database import create_followup_record
    fid = create_followup_record(
        session_id=request.session_id,
        patient_id=request.patient_id,
        followup_type=request.followup_type,
        scheduled_date=request.scheduled_date,
        reminder_channel=request.reminder_channel,
        clinical_objective=request.clinical_objective,
        notes=request.notes
    )
    if not fid:
        raise HTTPException(status_code=400, detail="Failed to schedule follow-up.")
    return {"success": True, "followup_id": fid, "message": "Follow-up scheduled successfully."}


@app.get("/api/followups/my-reminders")
def get_my_followups_endpoint(
    current_user=Depends(get_current_user)
):
    """Retrieves patient's scheduled follow-up reminders."""
    from database.database import get_user_followups
    followups = get_user_followups(current_user["id"])
    return {"success": True, "followups": followups}


# ============================================================
# FACILITY MODES & INTELLIGENCE ENDPOINTS
# ============================================================

@app.get("/api/facility/modes")
def get_facility_modes_endpoint():
    """Returns supported facility modes and workflow definitions."""
    from services.facility_analytics_service import FacilityAnalyticsService
    return FacilityAnalyticsService.get_facility_modes_info()


@app.get("/api/facility/profiles")
def get_facility_profiles_endpoint():
    """Lists registered government hospitals, PHCs, CHCs, and health units."""
    from database.database import get_all_facility_profiles
    profiles = get_all_facility_profiles()
    return {"success": True, "facilities": profiles}


@app.get("/api/facility/analytics")
def get_facility_analytics_endpoint(
    days: int = Query(30),
    facility_id: Optional[int] = Query(None),
    current_admin=Depends(require_facility_admin)
):
    """Provides facility workload KPIs, triage distributions, and queue metrics."""
    from services.facility_analytics_service import FacilityAnalyticsService
    return FacilityAnalyticsService.get_facility_admin_kpis(facility_id=facility_id, days=days)


@app.put("/api/facility/{facility_id}/mode")
def update_facility_mode_endpoint(
    facility_id: int,
    request: FacilityModeUpdateRequest,
    current_admin=Depends(require_facility_admin)
):
    """Switches active workflow mode for a facility."""
    from database.database import update_facility_active_mode
    success = update_facility_active_mode(facility_id, request.active_mode)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update facility mode.")
    return {"success": True, "message": f"Facility mode switched to {request.active_mode}."}


# ============================================================
# GOVERNMENT & PUBLIC HEALTH SURVEILLANCE ENDPOINTS
# ============================================================

@app.get("/api/public-health/surveillance")
def get_public_health_surveillance_endpoint(
    days: int = Query(30),
    district: Optional[str] = Query(None),
    current_officer=Depends(require_public_health)
):
    """
    100% De-identified regional symptom surveillance and anomaly detection.
    Guarantees privacy preservation with zero patient identity exposure.
    """
    from services.facility_analytics_service import FacilityAnalyticsService
    return FacilityAnalyticsService.get_public_health_intelligence(days=days, district=district)


# ============================================================
# AUDIT TRAIL & COMPLIANCE ENDPOINTS
# ============================================================

@app.get("/api/audit/logs")
def get_audit_logs_endpoint(
    limit: int = Query(100),
    action: Optional[str] = Query(None),
    current_admin=Depends(require_admin)
):
    """Retrieves security, clinical access, and system audit logs."""
    from database.database import fetch_audit_logs
    logs = fetch_audit_logs(limit=limit, action=action)
    return {"success": True, "logs": logs}


# ============================================================
# DEMO SCENARIOS ENDPOINTS
# ============================================================

@app.get("/api/demo/scenarios")
def get_demo_scenarios_endpoint():
    """Provides 10 safe synthetic demo clinical scenarios."""
    from services.demo_service import DemoScenarioService
    return {"success": True, "scenarios": DemoScenarioService.get_all_scenarios()}


@app.get("/api/demo/scenarios/{scenario_id}")
def get_demo_scenario_detail_endpoint(scenario_id: str):
    """Retrieves a single synthetic demo scenario."""
    from services.demo_service import DemoScenarioService
    sc = DemoScenarioService.get_scenario_by_id(scenario_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Demo scenario not found.")
    return {"success": True, "scenario": sc}


# ============================================================
# COMPREHENSIVE DISEASE & MEDICATION INTELLIGENCE MODULE ENDPOINTS
# ============================================================

class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    duration: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    vitals: Optional[dict] = {}
    medical_history: Optional[list[str]] = []
    active_medications: Optional[list[str]] = []


class BestMedicineRequest(BaseModel):
    condition_name: str


class PrescriptionScheduleRequest(BaseModel):
    medication_name: str
    dosage: str
    frequency: str = "Once daily"
    time_of_day: str = "Morning"
    food_relation: str = "After food"
    duration_days: Optional[int] = None
    instructions: Optional[str] = None


class InteractionCheckRequest(BaseModel):
    medications: list[str]
    allergies: Optional[list[str]] = []
    kidney_function_egfr: Optional[float] = None
    is_pregnant: bool = False


class LogDoseRequest(BaseModel):
    medication_id: int
    status: str = "taken"
    time_of_day: str = "Morning"
    date_str: Optional[str] = None


@app.get("/api/intelligence/diseases")
def list_diseases_endpoint(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Retrieves and searches verified clinical condition knowledge base across 22 categories."""
    from ai.disease_knowledge_base import search_disease_knowledge, get_all_disease_categories
    results = search_disease_knowledge(query=search or "", category=category)
    return {
        "success": True,
        "categories": get_all_disease_categories(),
        "total_results": len(results),
        "diseases": results
    }


@app.get("/api/intelligence/diseases/{disease_id}")
def get_disease_detail_endpoint(disease_id: str):
    """Retrieves full clinical profile for a specific disease."""
    from ai.disease_knowledge_base import get_disease_by_id
    cond = get_disease_by_id(disease_id)
    if not cond:
        raise HTTPException(status_code=404, detail="Medical condition not found.")
    return {"success": True, "condition": cond}


@app.post("/api/intelligence/analyze-symptoms")
def analyze_symptoms_endpoint(
    request: SymptomAnalysisRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Analyzes patient symptoms against verified medical knowledge, returns ranked
    possibilities with uncertainty grading and determination of Best Next Step.
    """
    from services.disease_intelligence_service import DiseaseIntelligenceService
    res = DiseaseIntelligenceService.analyze_patient_symptoms(
        symptoms=request.symptoms,
        duration=request.duration,
        age=request.age,
        gender=request.gender,
        vitals=request.vitals,
        medical_history=request.medical_history,
        active_medications=request.active_medications
    )
    return res


@app.post("/api/intelligence/best-medicine-info")
def get_best_medicine_info_endpoint(request: BestMedicineRequest):
    """
    Explains common medication classes and clinical selection factors for a condition
    while enforcing the Best Medicine Safety Control (no autonomous prescribing).
    """
    from services.disease_intelligence_service import DiseaseIntelligenceService
    return DiseaseIntelligenceService.get_best_medicine_guidance(condition_name=request.condition_name)


@app.get("/api/intelligence/medications")
def list_medications_endpoint(
    search: Optional[str] = Query(None),
    med_class: Optional[str] = Query(None)
):
    """Searches verified pharmacopeia knowledge base."""
    from ai.medication_knowledge_base import search_medication_knowledge
    results = search_medication_knowledge(query=search or "", med_class=med_class)
    return {
        "success": True,
        "total_results": len(results),
        "medications": results
    }


@app.get("/api/intelligence/medications/{med_id}")
def get_medication_detail_endpoint(med_id: str):
    """Retrieves comprehensive pharmacology profile for a medication."""
    from ai.medication_knowledge_base import get_medication_by_id
    med = get_medication_by_id(med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    return {"success": True, "medication": med}


@app.post("/api/intelligence/check-interactions")
def check_interactions_endpoint(request: InteractionCheckRequest):
    """
    Checks multi-drug combinations, food cautions, allergies, and organ precautions.
    """
    from services.medication_schedule_service import MedicationScheduleService
    return MedicationScheduleService.check_comprehensive_safety(
        medication_list=request.medications,
        allergies=request.allergies,
        kidney_function_egfr=request.kidney_function_egfr,
        is_pregnant=request.is_pregnant
    )


@app.get("/api/intelligence/reports/compare-all")
def compare_all_reports_endpoint(current_user=Depends(get_current_user)):
    """
    'Compare All My Reports' — Longitudinal analysis of authorized reports.
    """
    from services.report_comparison_service import ReportComparisonService
    return ReportComparisonService.compare_all_reports(user_id=current_user["id"])


@app.get("/api/intelligence/reports/what-changed")
def what_changed_endpoint(current_user=Depends(get_current_user)):
    """
    'What Changed?' — Delta detector with status badges and doctor questions.
    """
    from services.report_comparison_service import ReportComparisonService
    return ReportComparisonService.get_what_changed_summary(user_id=current_user["id"])


@app.post("/api/intelligence/schedule/create-from-prescription")
def create_schedule_from_prescription_endpoint(
    request: PrescriptionScheduleRequest,
    current_user=Depends(get_current_user)
):
    """Converts approved prescription into patient timetable entry."""
    from services.medication_schedule_service import MedicationScheduleService
    return MedicationScheduleService.create_timetable_from_prescription(
        user_id=current_user["id"],
        medication_name=request.medication_name,
        dosage=request.dosage,
        frequency=request.frequency,
        time_of_day=request.time_of_day,
        food_relation=request.food_relation,
        duration_days=request.duration_days,
        instructions=request.instructions
    )


@app.get("/api/intelligence/schedule/daily")
def get_daily_schedule_endpoint(
    date_str: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    """Retrieves visual daily medication timetable by Morning, Afternoon, Evening, Night."""
    from services.medication_schedule_service import MedicationScheduleService
    return MedicationScheduleService.get_structured_daily_timetable(
        user_id=current_user["id"],
        target_date=date_str
    )


@app.post("/api/intelligence/schedule/log-dose")
def log_dose_endpoint(
    request: LogDoseRequest,
    current_user=Depends(get_current_user)
):
    """Logs taken, skipped, or remind-later status for a scheduled dose."""
    from database.database import log_medication_dose
    from datetime import date
    target_date = request.date_str or date.today().isoformat()
    success = log_medication_dose(
        user_id=current_user["id"],
        medication_id=request.medication_id,
        scheduled_date=target_date,
        status=request.status,
        time_of_day=request.time_of_day
    )
    return {"success": bool(success), "message": f"Dose marked as {request.status}."}


@app.get("/api/intelligence/health-review")
def get_health_review_endpoint(current_user=Depends(get_current_user)):
    """
    SANA Health Review Mode — 360° synthesis of history, vitals, reports, and medications.
    """
    from services.health_review_service import HealthReviewService
    return HealthReviewService.generate_360_health_review(
        user_id=current_user["id"],
        patient_name=current_user.get("full_name", "Patient")
    )


# ============================================================
# CLINICIAN TREATMENT PLANS (SECTION 19 & 20)
# ============================================================

@app.post("/api/treatment-plans")
def create_treatment_plan_endpoint(
    request: CreateTreatmentPlanRequest,
    current_doc=Depends(require_doctor)
):
    """
    Doctor creates clinician-approved treatment plan.
    AI assists the doctor; doctor makes final clinical decision.
    """
    med_dicts = [m.model_dump() for m in (request.medications or [])]
    plan_id = create_treatment_plan(
        patient_id=request.patient_id,
        doctor_id=current_doc["id"],
        clinical_assessment=request.clinical_assessment,
        diagnosis_notes=request.diagnosis_notes,
        follow_up_date=request.follow_up_date,
        tests_recommended=request.tests_recommended,
        lifestyle_guidance=request.lifestyle_guidance,
        session_id=request.session_id,
        medications=med_dicts
    )

    if not plan_id:
        raise HTTPException(status_code=400, detail="Failed to create treatment plan.")

    # Automatically add prescribed medications to patient's active user_medications
    for med in med_dicts:
        try:
            add_user_medication(
                user_id=request.patient_id,
                name=med.get("medicine_name", "Medication"),
                dosage=med.get("dosage", "As directed"),
                frequency=med.get("frequency", "Once daily"),
                time_of_day=med.get("time_of_day", "Morning"),
                instructions=f"Prescribed by Dr. {current_doc.get('full_name', 'Doctor')}"
            )
        except Exception as e:
            print(f"Notice auto-adding medication to patient list: {e}")

    # If follow-up date is provided, auto-schedule follow-up
    if request.follow_up_date:
        try:
            from database.database import create_followup_record
            create_followup_record(
                session_id=request.session_id,
                patient_id=request.patient_id,
                followup_type="TREATMENT_REVIEW",
                scheduled_date=request.follow_up_date,
                reminder_channel="APP_NOTIFICATION",
                clinical_objective=f"Treatment plan review by Dr. {current_doc.get('full_name', 'Doctor')}",
                notes=request.clinical_assessment
            )
        except Exception as fe:
            print(f"Notice auto-scheduling follow-up: {fe}")

    return {
        "success": True,
        "plan_id": plan_id,
        "message": "Treatment plan successfully approved and sealed by clinician."
    }


@app.get("/api/treatment-plans/my-plan")
def get_my_active_treatment_plan_endpoint(
    current_user=Depends(get_current_user)
):
    """Retrieves active clinician-approved treatment plan for current patient."""
    plan = get_active_treatment_plan_for_patient(current_user["id"])
    return {
        "success": True,
        "has_active_plan": plan is not None,
        "plan": plan
    }


@app.get("/api/treatment-plans/patient/{patient_id}")
def get_patient_treatment_plans_endpoint(
    patient_id: int,
    current_user=Depends(get_current_user)
):
    """Retrieves all treatment plans for a patient with authorization check."""
    is_self = current_user["id"] == patient_id
    is_clinician = current_user.get("role") in [
        "DOCTOR", "NURSE", "MEDICAL_OFFICER", "HEALTH_WORKER",
        "FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"
    ]
    if not is_self and not is_clinician:
        raise HTTPException(status_code=403, detail="Unauthorized to view this patient's treatment plans.")

    plans = get_treatment_plans_for_patient(patient_id)
    return {
        "success": True,
        "total": len(plans),
        "plans": plans
    }


@app.put("/api/treatment-plans/{plan_id}/status")
def update_treatment_plan_status_endpoint(
    plan_id: int,
    request: TreatmentPlanStatusRequest,
    current_doc=Depends(require_doctor)
):
    """Updates treatment plan status (ACTIVE, COMPLETED, REVISED)."""
    success = update_treatment_plan_status(plan_id, request.status)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update treatment plan status.")
    return {"success": True, "message": f"Plan status updated to {request.status}."}


# ============================================================
# DOCTOR CLINICAL WORKSPACE & ASSESSMENTS (SECTION 8)
# ============================================================

@app.get("/api/doctor/workspace")
def get_doctor_workspace_endpoint(
    current_doc=Depends(require_doctor)
):
    """Returns Doctor Clinical Workspace summary, queue, pending reviews, and assigned patients."""
    from services.triage_queue_service import TriageQueueService

    queue_data = TriageQueueService.get_queue_cases(filter_type="all", limit=50)
    assigned_patients = get_assigned_patients(current_doc["id"])
    all_cases = queue_data.get("cases", [])
    counts = queue_data.get("counts", {})

    high_priority = [c for c in all_cases if c.get("triage_level") in ["EMERGENCY", "URGENT"] or c.get("is_emergency")]
    pending_reviews = [c for c in all_cases if not c.get("reviewer_decision")]

    return {
        "success": True,
        "doctor": {
            "id": current_doc["id"],
            "name": current_doc.get("full_name"),
            "email": current_doc.get("email"),
            "role": current_doc.get("role")
        },
        "counts": counts,
        "assigned_patients": assigned_patients,
        "high_priority_cases": high_priority[:10],
        "pending_reviews": pending_reviews[:15],
        "today_queue": all_cases[:25]
    }


@app.post("/api/doctor/assessments")
def create_doctor_assessment_endpoint(
    request: DoctorAssessmentCreateRequest,
    current_doc=Depends(require_doctor)
):
    """Records a clinical doctor assessment note."""
    assessment_id = create_doctor_assessment(
        doctor_id=current_doc["id"],
        patient_id=request.patient_id,
        clinical_findings=request.clinical_findings,
        chief_complaint=request.chief_complaint,
        differential_notes=request.differential_notes,
        severity_level=request.severity_level,
        session_id=request.session_id
    )
    if not assessment_id:
        raise HTTPException(status_code=400, detail="Failed to record clinical assessment.")
    return {"success": True, "assessment_id": assessment_id, "message": "Clinical assessment saved."}


@app.get("/api/doctor/assessments/patient/{patient_id}")
def get_patient_assessments_endpoint(
    patient_id: int,
    current_user=Depends(require_clinical_staff)
):
    """Retrieves clinical assessments for a patient."""
    assessments = get_doctor_assessments_for_patient(patient_id)
    return {"success": True, "assessments": assessments}


@app.post("/api/patients/assign")
def assign_patient_endpoint(
    request: PatientAssignmentRequest,
    current_staff=Depends(require_clinical_staff)
):
    """Assigns patient to staff member."""
    success = assign_patient_to_staff(
        patient_id=request.patient_id,
        staff_id=request.staff_id,
        role=request.role,
        facility_id=request.facility_id
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign patient.")
    return {"success": True, "message": "Patient successfully assigned."}


@app.get("/api/doctor/assigned-patients")
def get_my_assigned_patients_endpoint(
    current_user=Depends(require_clinical_staff)
):
    """Returns patients assigned to logged-in clinician."""
    patients = get_assigned_patients(current_user["id"])
    return {"success": True, "patients": patients}


# ============================================================
# NURSE DASHBOARD & INTAKE (SECTION 9)
# ============================================================

@app.get("/api/nurse/overview")
def get_nurse_overview_endpoint(
    current_nurse=Depends(require_nurse)
):
    """Nurse intake overview, patient queue, and monitoring."""
    from services.triage_queue_service import TriageQueueService
    queue_data = TriageQueueService.get_queue_cases(filter_type="all", limit=50)
    all_cases = queue_data.get("cases", [])
    counts = queue_data.get("counts", {})

    assigned = get_assigned_patients(current_nurse["id"])
    routine_cases = [c for c in all_cases if c.get("triage_level") == "ROUTINE"]
    urgent_cases = [c for c in all_cases if c.get("triage_level") == "URGENT"]
    emergency_cases = [c for c in all_cases if c.get("triage_level") == "EMERGENCY" or c.get("is_emergency")]

    return {
        "success": True,
        "nurse": {
            "id": current_nurse["id"],
            "name": current_nurse.get("full_name"),
            "role": current_nurse.get("role")
        },
        "counts": counts,
        "assigned_patients": assigned,
        "emergency_queue": emergency_cases,
        "urgent_queue": urgent_cases,
        "routine_queue": routine_cases,
        "all_cases": all_cases[:30]
    }


@app.post("/api/nurse/intake")
def nurse_intake_endpoint(
    request: NurseIntakeRequest,
    current_nurse=Depends(require_nurse)
):
    """
    Nurse records patient check-in, vitals, symptoms, and initial observations.
    Evaluates safety rules immediately.
    """
    from services.evidence_fusion_service import EvidenceFusionService

    vitals_dict = {
        "heart_rate": request.heart_rate,
        "spo2": request.spo2,
        "temperature": request.temperature,
        "respiratory_rate": request.respiratory_rate,
        "systolic_bp": request.systolic_bp,
        "diastolic_bp": request.diastolic_bp
    }
    safety_check = assess_triage_risk(
        heart_rate=request.heart_rate,
        spo2=request.spo2,
        temperature=request.temperature,
        respiratory_rate=request.respiratory_rate,
        systolic_bp=request.systolic_bp,
        diastolic_bp=request.diastolic_bp,
        symptoms=request.symptoms
    )

    triage_level = "ROUTINE"
    if safety_check.get("is_emergency") or request.escalate_to_doctor:
        triage_level = "EMERGENCY"
    elif safety_check.get("has_warnings"):
        triage_level = "URGENT"

    summary = f"Nurse Intake by {current_nurse.get('full_name', 'Nurse')}: {request.symptoms}. Obs: {request.observations or 'None'}"
    save_triage_result(
        patient_name=request.patient_name,
        age=request.age,
        gender=request.gender or "",
        symptoms=request.symptoms,
        triage_result=summary,
        user_id=None
    )

    session_id, note_id = EvidenceFusionService.fuse_and_save_session(
        user_id=None,
        patient_name=request.patient_name,
        age=request.age,
        gender=request.gender,
        symptoms=request.symptoms,
        vitals=vitals_dict,
        triage_level=triage_level,
        is_emergency=triage_level == "EMERGENCY",
        spoken_response=f"Intake completed by Nurse {current_nurse.get('full_name')}.",
        screen_summary=summary,
        safety_warnings=safety_check.get("warnings", []),
        language="en",
        intake_staff_id=current_nurse["id"],
        facility_mode="GOVERNMENT_HOSPITAL"
    )

    return {
        "success": True,
        "session_id": session_id,
        "triage_level": triage_level,
        "safety_warnings": safety_check.get("warnings", []),
        "is_emergency": triage_level == "EMERGENCY",
        "message": f"Patient intake recorded successfully. Triage level: {triage_level}."
    }


# ============================================================
# MEDICAL OFFICER DASHBOARD (SECTION 10)
# ============================================================

@app.get("/api/medical-officer/dashboard")
def get_medical_officer_dashboard_endpoint(
    facility_id: Optional[int] = Query(None),
    current_officer=Depends(require_public_health)
):
    """Medical officer facility overview, escalations, queue, and healthcare trends."""
    from services.triage_queue_service import TriageQueueService
    from services.facility_analytics_service import FacilityAnalyticsService
    from database.database import get_all_referrals

    queue_data = TriageQueueService.get_queue_cases(filter_type="all", limit=50)
    all_cases = queue_data.get("cases", [])
    counts = queue_data.get("counts", {})

    kpis = FacilityAnalyticsService.get_facility_admin_kpis(facility_id=facility_id, days=30)
    surveillance = FacilityAnalyticsService.get_public_health_intelligence(days=30)
    referrals = get_all_referrals()

    escalated_cases = [c for c in all_cases if c.get("reviewer_decision") == "ESCALATED" or c.get("status") == "ESCALATED" or c.get("is_emergency")]
    pending_doctor = [c for c in all_cases if not c.get("reviewer_decision")]

    return {
        "success": True,
        "officer": {
            "id": current_officer["id"],
            "name": current_officer.get("full_name"),
            "role": current_officer.get("role")
        },
        "counts": counts,
        "escalated_cases": escalated_cases[:10],
        "pending_doctor_reviews": pending_doctor[:15],
        "total_referrals": len(referrals),
        "recent_referrals": referrals[:10],
        "facility_kpis": kpis.get("kpis", {}),
        "cluster_trends": surveillance.get("symptom_clusters", {}),
        "anomalies": surveillance.get("anomalies_detected", [])
    }


# ============================================================
# HEALTH TIMELINE (SECTION 34)
# ============================================================

@app.get("/api/health-intelligence/timeline")
def get_health_timeline_endpoint(
    filter_category: str = Query("all", description="all, reports, vitals, medications, doctor_visits, triage, referrals"),
    patient_id: Optional[int] = Query(None),
    current_user=Depends(get_current_user)
):
    """
    Longitudinal Health Timeline combining:
    - Symptoms & Triage
    - Vital measurements
    - Diagnostic reports
    - Doctor visits & Clinical assessments
    - Prescribed medications & Treatment plans
    - Referrals & Follow-ups
    """
    target_user_id = current_user["id"]
    if patient_id and current_user.get("role") in ["DOCTOR", "NURSE", "MEDICAL_OFFICER", "FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"]:
        target_user_id = patient_id

    events = []

    # 1. Triage events
    if filter_category in ["all", "triage"]:
        try:
            from database.database import get_user_triage_history
            th = get_user_triage_history(target_user_id) or []
            for item in th:
                events.append({
                    "id": f"triage_{item['id']}",
                    "category": "triage",
                    "title": "Health Triage Assessment",
                    "date": item.get("created_at") or item.get("triage_date"),
                    "summary": (item.get("symptoms") or "")[:120],
                    "details": item.get("triage_result", ""),
                    "badge": "Triage",
                    "icon": "⚕"
                })
        except Exception as te:
            print(f"Timeline triage notice: {te}")

    # 2. Vitals events
    if filter_category in ["all", "vitals"]:
        try:
            measurements = get_user_health_measurements(target_user_id, limit=20) or []
            for m in measurements:
                v_parts = []
                if m.get("heart_rate"): v_parts.append(f"HR: {m['heart_rate']} bpm")
                if m.get("spo2"): v_parts.append(f"SpO2: {m['spo2']}%")
                if m.get("temperature"): v_parts.append(f"Temp: {m['temperature']}°")
                if m.get("systolic_bp"): v_parts.append(f"BP: {m['systolic_bp']}/{m.get('diastolic_bp')} mmHg")
                v_desc = ", ".join(v_parts) if v_parts else f"{m.get('measurement_type')}: {m.get('value')} {m.get('unit', '')}"
                events.append({
                    "id": f"vital_{m['id']}",
                    "category": "vitals",
                    "title": "Vital Signs Recorded",
                    "date": m.get("created_at"),
                    "summary": v_desc,
                    "details": m.get("notes") or m.get("symptoms") or "Clinical vitals logged.",
                    "badge": "Vitals",
                    "icon": "💓"
                })
        except Exception as ve:
            print(f"Timeline vitals notice: {ve}")

    # 3. Diagnostic reports
    if filter_category in ["all", "reports"]:
        try:
            reps = get_user_medical_reports(target_user_id, limit=15) or []
            for r in reps:
                events.append({
                    "id": f"report_{r['id']}",
                    "category": "reports",
                    "title": r.get("report_type") or "Diagnostic Report",
                    "date": r.get("report_date") or r.get("created_at"),
                    "summary": r.get("key_findings") or r.get("summary") or "Diagnostic report processed.",
                    "details": f"Parameters detected: {len(r.get('parameters', [])) if isinstance(r.get('parameters'), list) else 'N/A'}",
                    "badge": "Report",
                    "icon": "📄"
                })
        except Exception as re_err:
            print(f"Timeline reports notice: {re_err}")

    # 4. Clinician treatment plans & Doctor visits
    if filter_category in ["all", "doctor_visits", "medications"]:
        try:
            plans = get_treatment_plans_for_patient(target_user_id) or []
            for p in plans:
                med_names = [m.get("medicine_name") for m in p.get("medications", [])]
                med_summary = f"Prescriptions: {', '.join(med_names)}" if med_names else "Consultation completed."
                events.append({
                    "id": f"plan_{p['id']}",
                    "category": "doctor_visits",
                    "title": f"Clinician Treatment Plan — Dr. {p.get('doctor_name', 'Doctor')}",
                    "date": p.get("created_at"),
                    "summary": p.get("clinical_assessment", ""),
                    "details": f"{med_summary}. Follow-up: {p.get('follow_up_date') or 'None scheduled'}",
                    "badge": "Doctor Visit",
                    "icon": "👨‍⚕️"
                })
        except Exception as pe:
            print(f"Timeline treatment plans notice: {pe}")

    # 5. Referrals
    if filter_category in ["all", "referrals"]:
        try:
            from database.database import get_all_referrals
            refs = get_all_referrals(patient_id=target_user_id) or []
            for ref in refs:
                events.append({
                    "id": f"ref_{ref['id']}",
                    "category": "referrals",
                    "title": f"Referral to {ref.get('specialty_required', 'Specialist')}",
                    "date": ref.get("created_at"),
                    "summary": f"Receiving Facility: {ref.get('receiving_facility')}",
                    "details": f"Priority: {ref.get('priority')}. Transport: {ref.get('transport_mode')}. Reason: {ref.get('clinical_reason_summary', '')}",
                    "badge": "Referral",
                    "icon": "↗️"
                })
        except Exception as refe:
            print(f"Timeline referrals notice: {refe}")

    def parse_event_date(ev):
        d = ev.get("date")
        if not d:
            return ""
        return str(d)

    events.sort(key=parse_event_date, reverse=True)

    return {
        "success": True,
        "total_events": len(events),
        "filter": filter_category,
        "events": events
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=True)