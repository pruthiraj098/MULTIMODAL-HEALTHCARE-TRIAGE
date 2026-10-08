# ============================================================
# HealthTriage AI - Medical Report Service (Phase 4)
# Ingestion, validation, multimodal analysis, and persistence
# ============================================================

import os
import base64
from typing import Dict, Any, Optional, List
from services.pdf_service import validate_pdf_bytes, extract_text_from_pdf
from services.image_service import validate_image_bytes
from ai.medical_report_analyzer import analyze_medical_report
from database.database import (
    save_medical_report,
    get_user_medical_reports,
    get_medical_report_by_id,
    delete_medical_report,
    get_user_latest_vitals
)


def inspect_report_payload(raw_data: str, mime_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Inspects base64 or data URL payload and returns structured metadata and binary bytes.
    """
    clean_mime = mime_type or "application/octet-stream"
    binary_data = b""

    if raw_data.startswith("data:") and ";base64," in raw_data:
        header, encoded = raw_data.split(";base64,", 1)
        clean_mime = header.replace("data:", "")
        binary_data = base64.b64decode(encoded)
    else:
        try:
            binary_data = base64.b64decode(raw_data)
        except Exception:
            binary_data = raw_data.encode("utf-8")
            clean_mime = "text/plain"

    is_valid = True
    error_msg = None
    extracted_text = ""

    if clean_mime == "application/pdf":
        is_valid, error_msg = validate_pdf_bytes(binary_data)
        if is_valid:
            extracted_text = extract_text_from_pdf(binary_data)
    elif clean_mime.startswith("image/"):
        is_valid, error_msg = validate_image_bytes(binary_data)

    return {
        "is_valid": is_valid,
        "error": error_msg,
        "mime_type": clean_mime,
        "size_bytes": len(binary_data),
        "binary_data": binary_data,
        "extracted_text": extracted_text,
    }


def process_patient_report(
    user_id: int,
    file_data: str,
    file_name: str,
    mime_type: Optional[str] = None,
    symptoms: str = "",
    save_report: bool = True
) -> Dict[str, Any]:
    """
    Process, extract, and clinically analyze an uploaded medical or lab report.
    Scopes report analysis to authenticated user and records findings.
    """
    payload_info = inspect_report_payload(file_data, mime_type)
    if not payload_info["is_valid"]:
        return {
            "success": False,
            "error": payload_info["error"] or "Invalid file format or corrupted file."
        }

    binary_bytes = payload_info["binary_data"]
    resolved_mime = payload_info["mime_type"]

    # Retrieve patient's latest logged vitals for clinical context
    patient_vitals = None
    try:
        latest_vitals = get_user_latest_vitals(user_id)
        if latest_vitals:
            patient_vitals = {k: v.get("value") for k, v in latest_vitals.items() if isinstance(v, dict)}
    except Exception as e:
        print("[Report Service] Vitals context notice:", e)

    api_key = os.getenv("GEMINI_API_KEY")

    # Run Smart Medical Report Analyzer
    analysis = analyze_medical_report(
        api_key=api_key,
        file_bytes=binary_bytes,
        file_name=file_name,
        mime_type=resolved_mime,
        patient_symptoms=symptoms,
        patient_vitals=patient_vitals
    )

    report_id = None
    if save_report:
        try:
            report_id = save_medical_report(
                user_id=user_id,
                file_name=file_name,
                file_type=resolved_mime,
                report_type=analysis.get("report_type", "Laboratory Blood Panel"),
                report_date=analysis.get("report_date"),
                extracted_parameters=analysis.get("parameters", []),
                abnormal_count=analysis.get("abnormal_count", 0),
                summary=analysis.get("summary", ""),
                plain_language_explanation=analysis.get("plain_language_explanation", ""),
                doctor_questions=analysis.get("doctor_questions", []),
                symptom_correlations=analysis.get("symptom_correlations", ""),
                overall_urgency=analysis.get("overall_urgency", "ROUTINE")
            )
        except Exception as db_err:
            print("[Report Service] Database save warning:", db_err)

    return {
        "success": True,
        "report_id": report_id,
        "file_name": file_name,
        "file_type": resolved_mime,
        **analysis
    }
