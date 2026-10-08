# ============================================================
# HealthTriage AI - Multimodal Evidence Fusion Service
# Integrates Patient Dialogue, Vitals, Lab Report OCR, & Visual Image Observations
# Produces Standardized Structured Triage Notes with Strict Source Demarcation
# ============================================================

import json
from typing import Dict, Any, List, Optional
from datetime import datetime

class EvidenceFusionService:
    """
    Fuses multimodal inputs into a consolidated, audit-ready clinical evidence bundle.
    Explicitly tags the provenance of every data point:
    - SOURCE: PATIENT
    - SOURCE: MEASURED VITAL
    - SOURCE: UPLOADED REPORT
    - SOURCE: AI OBSERVATION
    - SOURCE: CLINICAL REVIEWER
    """

    @staticmethod
    def fuse_multimodal_evidence(
        patient_name: str,
        age: Optional[int] = None,
        gender: Optional[str] = None,
        symptoms: str = "",
        vitals: Optional[Dict[str, Any]] = None,
        report_findings: Optional[Dict[str, Any]] = None,
        image_findings: Optional[Dict[str, Any]] = None,
        ai_assessment: Optional[Dict[str, Any]] = None,
        safety_warnings: Optional[List[str]] = None,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
        facility_type: str = "GOVERNMENT_HOSPITAL"
    ) -> Dict[str, Any]:
        """
        Builds the complete Multimodal Evidence Object and Structured Triage Note.
        """
        vitals = vitals or {}
        report_findings = report_findings or {}
        image_findings = image_findings or {}
        ai_assessment = ai_assessment or {}
        safety_warnings = safety_warnings or []
        conversation_context = conversation_context or []

        # 1. Format PATIENT-REPORTED INFORMATION
        patient_reported = {
            "source": "SOURCE: PATIENT",
            "patient_name": patient_name or "Anonymous Patient",
            "age": age,
            "gender": gender,
            "chief_complaint": symptoms or "General health intake",
            "original_language": language,
            "patient_statement_raw": symptoms,
            "conversation_turns_count": len(conversation_context),
            "reported_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # 2. Format AI-EXTRACTED INFORMATION
        # Vitals extraction & classification
        extracted_vitals = []
        if vitals.get("heart_rate") is not None:
            extracted_vitals.append({
                "source": "SOURCE: MEASURED VITAL",
                "parameter": "Heart Rate",
                "value": vitals.get("heart_rate"),
                "unit": "BPM",
                "reference_range": "60 - 100 BPM",
                "status": "ELEVATED" if float(vitals.get("heart_rate")) > 100 else ("LOW" if float(vitals.get("heart_rate")) < 60 else "NORMAL")
            })

        if vitals.get("spo2") is not None:
            val = float(vitals.get("spo2"))
            extracted_vitals.append({
                "source": "SOURCE: MEASURED VITAL",
                "parameter": "Oxygen Saturation (SpO2)",
                "value": val,
                "unit": "%",
                "reference_range": "95 - 100%",
                "status": "CRITICAL_LOW" if val < 90 else ("BORDERLINE_LOW" if val < 95 else "NORMAL")
            })

        if vitals.get("temperature") is not None:
            val = float(vitals.get("temperature"))
            extracted_vitals.append({
                "source": "SOURCE: MEASURED VITAL",
                "parameter": "Body Temperature",
                "value": val,
                "unit": "°F/°C",
                "reference_range": "97.0 - 99.0 °F (36.1 - 37.2 °C)",
                "status": "HIGH_FEVER" if val > 102.0 else ("FEVER" if val > 99.5 else "NORMAL")
            })

        if vitals.get("systolic_bp") is not None and vitals.get("diastolic_bp") is not None:
            sys_val = float(vitals.get("systolic_bp"))
            dia_val = float(vitals.get("diastolic_bp"))
            extracted_vitals.append({
                "source": "SOURCE: MEASURED VITAL",
                "parameter": "Blood Pressure",
                "value": f"{sys_val}/{dia_val}",
                "unit": "mmHg",
                "reference_range": "90-120 / 60-80 mmHg",
                "status": "CRITICAL_HYPERTENSION" if sys_val >= 180 or dia_val >= 120 else ("HYPERTENSION" if sys_val >= 140 or dia_val >= 90 else "NORMAL")
            })

        if vitals.get("respiratory_rate") is not None:
            val = float(vitals.get("respiratory_rate"))
            extracted_vitals.append({
                "source": "SOURCE: MEASURED VITAL",
                "parameter": "Respiratory Rate",
                "value": val,
                "unit": "breaths/min",
                "reference_range": "12 - 20 breaths/min",
                "status": "TACHYPNEA" if val > 24 else ("BRADYPNEA" if val < 10 else "NORMAL")
            })

        # Report OCR findings
        report_extracted = []
        if report_findings.get("parameters"):
            for p in report_findings["parameters"]:
                report_extracted.append({
                    "source": "SOURCE: UPLOADED REPORT",
                    "test_name": p.get("name"),
                    "result": p.get("value"),
                    "unit": p.get("unit"),
                    "reference_range": p.get("reference_range", "Report standard"),
                    "status": p.get("status", "NORMAL"),
                    "explanation": p.get("explanation", "Parameter extracted from patient laboratory document.")
                })

        # Image observations
        image_observations = []
        if image_findings:
            image_observations.append({
                "source": "SOURCE: AI OBSERVATION",
                "observation_type": image_findings.get("category", "Visible Clinical Feature"),
                "observation_summary": image_findings.get("description", "Visible clinical feature analyzed."),
                "quality_assessment": image_findings.get("quality", "Adequate for triage observation"),
                "disclaimer": "Visible observation only; not a histological or dermatological confirmation."
            })

        # 3. Format AI-GENERATED SUMMARY
        triage_level = ai_assessment.get("triage_level", "ROUTINE")
        ai_summary = {
            "source": "SOURCE: AI OBSERVATION (DECISION SUPPORT)",
            "risk_indicator": triage_level,
            "clinical_summary": ai_assessment.get("screen_summary") or ai_assessment.get("spoken_response") or "Clinical intake recorded.",
            "contributing_factors": ai_assessment.get("key_observations", []),
            "missing_information": ai_assessment.get("missing_info") or (
                "No measured vitals recorded" if not extracted_vitals else "None identified for primary triage"
            ),
            "suggested_questions": ai_assessment.get("follow_up_question") or "Have symptoms changed in intensity over the past 24 hours?",
            "referral_considerations": (
                "Immediate emergency room transfer indicated" if triage_level == "EMERGENCY"
                else ("Specialist outpatient evaluation recommended within 24-48 hours" if triage_level == "URGENT" else "Primary care / supportive home care sufficient")
            ),
            "facility_mode": facility_type
        }

        # 4. SAFETY FLAGS
        safety_flags_list = list(safety_warnings)
        if ai_assessment.get("is_emergency"):
            safety_flags_list.insert(0, "EMERGENCY RED-FLAG TRIGGERED: Immediate medical stabilization recommended.")

        safety_flags = {
            "source": "SOURCE: DETERMINISTIC SAFETY ENGINE",
            "is_emergency": ai_assessment.get("is_emergency", False),
            "alerts": safety_flags_list,
            "priority_code": "RED" if triage_level == "EMERGENCY" else ("YELLOW" if triage_level == "URGENT" else "GREEN")
        }

        # 5. HUMAN REVIEW (Empty placeholder awaiting qualified healthcare worker action)
        human_review = {
            "source": "SOURCE: HUMAN CLINICAL REVIEWER",
            "reviewer_status": "PENDING_REVIEW",
            "reviewer_id": None,
            "reviewer_name": None,
            "reviewer_role": None,
            "decision": None,
            "reviewer_notes": None,
            "reviewed_at": None
        }

        # Format full Structured Markdown Note for easy reading & printing
        markdown_note = EvidenceFusionService._generate_markdown_note(
            patient_reported=patient_reported,
            extracted_vitals=extracted_vitals,
            report_extracted=report_extracted,
            image_observations=image_observations,
            ai_summary=ai_summary,
            safety_flags=safety_flags
        )

        return {
            "patient_reported": patient_reported,
            "extracted_vitals": extracted_vitals,
            "report_extracted": report_extracted,
            "image_observations": image_observations,
            "ai_summary": ai_summary,
            "safety_flags": safety_flags,
            "human_review": human_review,
            "markdown_note": markdown_note,
            "triage_level": triage_level,
            "is_emergency": ai_assessment.get("is_emergency", False)
        }

    @staticmethod
    def _generate_markdown_note(
        patient_reported: Dict[str, Any],
        extracted_vitals: List[Dict[str, Any]],
        report_extracted: List[Dict[str, Any]],
        image_observations: List[Dict[str, Any]],
        ai_summary: Dict[str, Any],
        safety_flags: Dict[str, Any]
    ) -> str:
        """Constructs an immaculate 5-section Markdown clinical triage note."""
        lines = []

        lines.append("╔═══════════════════════════════════════════════════════════════╗")
        lines.append(f"║ HEALTHTRIAGE AI — STRUCTURED CLINICAL TRIAGE NOTE             ║")
        lines.append(f"║ Priority: {safety_flags.get('priority_code', 'GREEN'):<5} | Level: {ai_summary.get('risk_indicator', 'ROUTINE'):<18} | Mode: {ai_summary.get('facility_mode', 'HOSPITAL'):<14} ║")
        lines.append("╚═══════════════════════════════════════════════════════════════╝")
        lines.append("")

        # Section 1
        lines.append("### 1. PATIENT-REPORTED INFORMATION [SOURCE: PATIENT]")
        lines.append(f"- **Patient:** {patient_reported.get('patient_name')} ({patient_reported.get('age') or 'Age N/A'}, {patient_reported.get('gender') or 'Gender N/A'})")
        lines.append(f"- **Chief Complaint:** {patient_reported.get('chief_complaint')}")
        lines.append(f"- **Intake Language:** {patient_reported.get('original_language', 'en').upper()}")
        lines.append(f"- **Timestamp:** {patient_reported.get('reported_at')}")
        lines.append("")

        # Section 2
        lines.append("### 2. AI-EXTRACTED INFORMATION [SOURCE: MEASURED VITALS & DIAGNOSTICS]")
        if extracted_vitals:
            lines.append("#### Physiological Vital Signs:")
            for v in extracted_vitals:
                lines.append(f"- **{v['parameter']}:** {v['value']} {v['unit']} (Ref: {v['reference_range']}) → Status: `{v['status']}`")
        else:
            lines.append("- *Vital Signs:* None measured during intake (optional).")

        if report_extracted:
            lines.append("\n#### Uploaded Lab Report OCR Findings:")
            for r in report_extracted:
                lines.append(f"- **{r['test_name']}:** {r['result']} {r['unit']} (Ref: {r['reference_range']}) → `{r['status']}` | {r['explanation']}")

        if image_observations:
            lines.append("\n#### Visible Clinical Image Observations:")
            for img in image_observations:
                lines.append(f"- **Category:** {img['observation_type']} | **Observation:** {img['observation_summary']} *(Quality: {img['quality_assessment']})*")
        lines.append("")

        # Section 3
        lines.append("### 3. AI-GENERATED SUMMARY [SOURCE: DECISION SUPPORT]")
        lines.append(f"- **Triage Risk Category:** {ai_summary.get('risk_indicator')}")
        lines.append(f"- **Clinical Summary:** {ai_summary.get('clinical_summary')}")
        if ai_summary.get("contributing_factors"):
            lines.append("- **Key Contributing Factors:**")
            for f in ai_summary["contributing_factors"]:
                lines.append(f"  • {f}")
        lines.append(f"- **Missing Information:** {ai_summary.get('missing_information')}")
        lines.append(f"- **Suggested Follow-up Inquiry:** {ai_summary.get('suggested_questions')}")
        lines.append(f"- **Referral Considerations:** {ai_summary.get('referral_considerations')}")
        lines.append("")

        # Section 4
        lines.append("### 4. SAFETY FLAGS & CLINICAL ALERTS [SOURCE: SAFETY RISK ENGINE]")
        if safety_flags.get("alerts"):
            for alert in safety_flags["alerts"]:
                lines.append(f"- ⚠️ {alert}")
        else:
            lines.append("- 🟢 No acute vital sign or red-flag emergency violations detected.")
        lines.append("")

        # Section 5
        lines.append("### 5. HUMAN CLINICAL REVIEW [SOURCE: HEALTHCARE WORKER]")
        lines.append("- **Review Status:** PENDING CLINICAL REVIEW")
        lines.append("- **Reviewer Decision:** [Awaiting Nurse / Medical Officer Evaluation]")
        lines.append("- **Reviewer Clinical Notes:** [Unassigned]")
        lines.append("")
        lines.append("---")
        lines.append("*DISCLAIMER: AI-generated triage indicators provide clinical decision support and do not constitute a definitive medical diagnosis. Final triage priority and disposition must be approved by authorized healthcare personnel.*")

        return "\n".join(lines)
