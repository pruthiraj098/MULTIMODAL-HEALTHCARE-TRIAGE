# ============================================================
# HealthTriage AI - Disease Intelligence Service (Modules 1, 2, 3, 4, 6, 12)
# Symptom Correlation, Ranked Possibilities, Best Next Step,
# Disease Treatment Approaches & Best Medicine Safety Control
# ============================================================

import os
import json
from typing import Dict, Any, List, Optional
from google import genai

from ai.gemini_service import PRIMARY_MODEL
from ai.disease_knowledge_base import DISEASE_DATABASE, search_disease_knowledge, get_disease_by_id
from ai.ai_safety_guard import AISafetyGuard

# Mandatory Educational and Uncertainty Disclaimers
DISEASE_ANALYSIS_DISCLAIMER = (
    "Your symptoms may be associated with several conditions. Based on the information you provided, "
    "these are possibilities to discuss with a healthcare professional. This is an educational triage "
    "and decision-support assessment, not a confirmed clinical diagnosis."
)

BEST_MEDICINE_DISCLAIMER = (
    "The best medication choice must be confirmed by your treating doctor or pharmacist based on your "
    "complete medical history, current medicines, allergies, kidney and liver function, pregnancy status, "
    "and diagnostic test results. HealthTriage AI does not autonomously prescribe or select personalized medicines."
)

class DiseaseIntelligenceService:
    @staticmethod
    def analyze_patient_symptoms(
        symptoms: str,
        duration: Optional[str] = None,
        age: Optional[int] = None,
        gender: Optional[str] = None,
        vitals: Optional[Dict[str, Any]] = None,
        lab_reports: Optional[List[Dict[str, Any]]] = None,
        medical_history: Optional[List[str]] = None,
        active_medications: Optional[List[str]] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Performs multi-factor symptom analysis against verified medical knowledge.
        Returns ranked possible explanations with uncertainty grading and Best Next Step.
        """
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        vitals = vitals or {}
        lab_reports = lab_reports or []
        medical_history = medical_history or []
        active_medications = active_medications or []

        # 1. Deterministic Knowledge Base Correlation
        matched_conditions = []
        sym_lower = symptoms.lower()

        for cond in DISEASE_DATABASE:
            score = 0
            matched_syms = []

            # Check common symptoms
            for cs in cond["common_symptoms"]:
                if cs.lower() in sym_lower or any(word in sym_lower for word in cs.lower().split() if len(word) > 4):
                    score += 15
                    matched_syms.append(cs)

            # Check warning signs
            matched_warnings = []
            for ws in cond.get("warning_signs", []):
                if any(w in sym_lower for w in ws.lower().split() if len(w) > 4):
                    score += 20
                    matched_warnings.append(ws)

            # Check emergency signs
            has_emerg = False
            for es in cond.get("emergency_warning_signs", []):
                if any(w in sym_lower for w in es.lower().split() if len(w) > 4):
                    score += 35
                    has_emerg = True

            # Factor in relevant vitals
            vital_risk = False
            if cond["id"] == "DIS-004" and (vitals.get("systolic_bp", 0) or 0) >= 140:
                score += 25
                vital_risk = True
            elif cond["id"] == "DIS-006" and (vitals.get("spo2", 100) or 100) < 95:
                score += 25
                vital_risk = True
            elif cond["id"] == "DIS-007" and (vitals.get("heart_rate", 0) or 0) > 100:
                score += 20
                vital_risk = True

            if score > 0:
                # Classify certainty level
                certainty = "Possible condition"
                if score >= 35 or (matched_syms and vital_risk):
                    certainty = "Suspected condition"

                matched_conditions.append({
                    "id": cond["id"],
                    "condition_name": cond["condition_name"],
                    "category": cond["category"],
                    "certainty_level": certainty,
                    "matched_symptoms": matched_syms,
                    "warning_signs_present": matched_warnings,
                    "is_emergency_concern": has_emerg,
                    "simple_explanation": cond["simple_explanation"],
                    "suggested_tests": cond["typical_investigations"],
                    "general_treatment_approaches": cond["general_treatment_approaches"],
                    "when_to_consult_doctor": cond["when_to_consult_doctor"],
                    "when_emergency_required": cond["when_emergency_required"],
                    "evidence_source": cond["evidence_source"],
                    "_match_score": score
                })

        matched_conditions.sort(key=lambda x: x["_match_score"], reverse=True)
        top_possibilities = matched_conditions[:4]

        # 2. Determine Best Next-Step
        best_next_step = DiseaseIntelligenceService.determine_best_next_step(
            symptoms=symptoms,
            vitals=vitals,
            top_possibilities=top_possibilities
        )

        # 3. AI Clinical Synthesis with Medical Safety Guard
        ai_summary = ""
        if api_key:
            try:
                client = genai.Client(api_key=api_key)
                prompt = f"""You are the Clinical Disease & Symptom Intelligence engine of HealthTriage AI.
Analyze the patient's presentation:
- Reported Symptoms: {symptoms}
- Symptom Duration: {duration or 'Not specified'}
- Patient Demographics: Age {age or 'N/A'}, Gender {gender or 'N/A'}
- Vital Signs: {json.dumps(vitals)}
- Past Medical History: {', '.join(medical_history) or 'None provided'}
- Active Medications: {', '.join(active_medications) or 'None provided'}
- Pre-matched verified conditions: {[c['condition_name'] for c in top_possibilities]}

TASK:
1. Provide a professional, compassionate 2-3 paragraph clinical explanation of what might be causing these symptoms.
2. Clearly explain that these are POSSIBILITIES to discuss with a doctor, NOT confirmed diagnoses.
3. Discuss typical investigations a doctor may consider.
4. Highlight specific warning signs that warrant immediate emergency attention.

MANDATORY SAFETY RULES:
- NEVER claim 'You definitely have...' or make a definitive diagnosis.
- NEVER prescribe personalized medication doses or tell the patient to start antibiotics.
- Use uncertainty phrasing: 'Your symptoms may be associated with...', 'A healthcare professional can evaluate...'
"""
                resp = client.models.generate_content(
                    model=PRIMARY_MODEL,
                    contents=prompt
                )
                raw_text = resp.text or ""
                ai_summary = AISafetyGuard.sanitize_ai_text(raw_text)
            except Exception as e:
                ai_summary = (
                    f"Based on your symptoms ({symptoms}), the identified possibilities should be evaluated "
                    f"by a qualified healthcare professional. Please review the suggested next steps below."
                )

        return {
            "success": True,
            "disclaimer": DISEASE_ANALYSIS_DISCLAIMER,
            "patient_context": {
                "symptoms": symptoms,
                "duration": duration,
                "age": age,
                "gender": gender,
                "vitals_applied": bool(vitals)
            },
            "ranked_possibilities": top_possibilities,
            "best_next_step": best_next_step,
            "clinical_summary": ai_summary,
            "safety_rule": "Final diagnosis must be confirmed by a licensed medical practitioner."
        }

    @staticmethod
    def determine_best_next_step(
        symptoms: str,
        vitals: Optional[Dict[str, Any]] = None,
        top_possibilities: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Determines the safest, most appropriate Best Next Step based on symptoms,
        vital signs, and disease severity markers.
        """
        vitals = vitals or {}
        top_possibilities = top_possibilities or []
        s_lower = symptoms.lower()

        # Check for Emergency Red Flags
        is_emergency = False
        emergency_reasons = []

        if any(w in s_lower for w in ["chest pain", "crushing chest", "heart attack", "radiating to arm"]):
            is_emergency = True
            emergency_reasons.append("Acute chest pain concerning for cardiac ischemia")
        if any(w in s_lower for w in ["difficulty breathing", "severe breathlessness", "gasping", "can't breathe"]):
            is_emergency = True
            emergency_reasons.append("Severe respiratory distress")
        if vitals.get("spo2") and vitals["spo2"] < 90:
            is_emergency = True
            emergency_reasons.append(f"Dangerously low blood oxygen saturation ({vitals['spo2']}%)")
        if vitals.get("heart_rate") and vitals["heart_rate"] > 140:
            is_emergency = True
            emergency_reasons.append(f"Severe tachycardia ({vitals['heart_rate']} bpm)")
        if vitals.get("systolic_bp") and vitals["systolic_bp"] >= 180:
            is_emergency = True
            emergency_reasons.append(f"Severe hypertensive blood pressure ({vitals['systolic_bp']} mmHg)")

        if is_emergency:
            return {
                "action_code": "EMERGENCY_CARE_NOW",
                "headline": "🚨 Seek Emergency Medical Care Immediately",
                "urgency_level": "CRITICAL EMERGENCY",
                "recommended_action": "Go immediately to the nearest Emergency Department (ER) or call National Emergency Services (112 or 108). Do not drive yourself.",
                "reasons": emergency_reasons,
                "timeframe": "Immediate (Within minutes)"
            }

        # Check for Urgent Care
        is_urgent = False
        urgent_reasons = []

        if any(w in s_lower for w in ["high fever", "fever >3 days", "vomiting blood", "severe abdominal pain", "blood in urine"]):
            is_urgent = True
            urgent_reasons.append("Acute symptoms requiring prompt physician evaluation")
        if vitals.get("spo2") and 90 <= vitals["spo2"] < 94:
            is_urgent = True
            urgent_reasons.append(f"Sub-optimal oxygen saturation ({vitals['spo2']}%)")
        if vitals.get("temperature") and vitals["temperature"] >= 102:
            is_urgent = True
            urgent_reasons.append(f"High fever ({vitals['temperature']}°)")

        if is_urgent:
            return {
                "action_code": "URGENT_EVALUATION",
                "headline": "🟠 Arrange an Urgent Doctor Consultation",
                "urgency_level": "URGENT",
                "recommended_action": "Visit an urgent care center or primary health clinic within 12 to 24 hours for examination and diagnostic testing.",
                "reasons": urgent_reasons,
                "timeframe": "Within 12 to 24 hours"
            }

        # Check for Specialist or Routine Primary Care
        if any(c.get("category") == "Cardiovascular Conditions" for c in top_possibilities):
            return {
                "action_code": "SPECIALIST_CONSULT",
                "headline": "🩺 Consult a Cardiologist or General Physician",
                "urgency_level": "MODERATE",
                "recommended_action": "Schedule an outpatient clinical appointment with a physician for baseline ECG, lipid testing, and cardiovascular review.",
                "reasons": ["Cardiovascular symptom indicators identified"],
                "timeframe": "Within 2 to 3 days"
            }

        if any(c.get("category") == "Endocrine and Metabolic Conditions" for c in top_possibilities):
            return {
                "action_code": "DIAGNOSTIC_EVALUATION",
                "headline": "🔬 Schedule Recommended Diagnostic Blood Tests",
                "urgency_level": "ROUTINE",
                "recommended_action": "Visit a local diagnostic laboratory or primary health centre to check Fasting Blood Glucose, HbA1c, or TSH as indicated.",
                "reasons": ["Metabolic/endocrine indicators present"],
                "timeframe": "This week"
            }

        # Default: Monitor at Home with Primary Care Follow-up
        return {
            "action_code": "MONITOR_AT_HOME",
            "headline": "🟢 Monitor Symptoms with Supportive Home Care",
            "urgency_level": "ROUTINE / SELF-CARE",
            "recommended_action": "Rest, maintain adequate hydration, log your symptoms and vitals twice daily. Consult a primary care doctor if symptoms do not improve within 3 to 5 days.",
            "reasons": ["Mild, non-emergency symptom pattern"],
            "timeframe": "Self-monitor for 3 to 5 days"
        }

    @staticmethod
    def get_best_medicine_guidance(
        condition_name: str,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Explains common medication classes and clinical selection factors for a disease,
        while strictly enforcing the Best Medicine Safety Control (NO autonomous prescribing).
        """
        api_key = api_key or os.getenv("GEMINI_API_KEY")

        # Search matching condition in knowledge base
        matches = search_disease_knowledge(condition_name)
        cond = matches[0] if matches else None

        standard_classes = cond.get("medication_classes_commonly_used", []) if cond else []
        general_treatments = cond.get("general_treatment_approaches", []) if cond else []

        ai_educational_text = ""
        if api_key:
            try:
                client = genai.Client(api_key=api_key)
                prompt = f"""You are the Clinical Pharmacology Information Assistant for HealthTriage AI.
A patient is asking: 'What is the best medicine for {condition_name}?'

TASK:
1. Explain the COMMON MEDICATION CLASSES typically considered by clinicians for this condition.
2. Explain the CLINICAL FACTORS doctors evaluate when choosing the right medicine for an individual patient (e.g. kidney/liver function, patient age, pregnancy status, other medications, allergies, disease severity).
3. Explain why there is NO single 'best medicine' for everyone and why personalized clinician evaluation is necessary.
4. Explain non-pharmacological lifestyle/supportive measures that accompany treatment.

CRITICAL SAFETY RULES:
- You must NOT prescribe a specific drug brand or dosage for this patient.
- Include the explicit statement:
  'The best medication choice must be confirmed by your doctor or pharmacist based on your medical history, current medicines, allergies, organ function, and test results.'
"""
                resp = client.models.generate_content(
                    model=PRIMARY_MODEL,
                    contents=prompt
                )
                ai_educational_text = AISafetyGuard.sanitize_ai_text(resp.text or "")
            except Exception:
                ai_educational_text = (
                    f"Clinicians treat {condition_name} using various medication classes depending on individual severity, "
                    f"tolerance, and medical history. Your treating physician will select the safest and most effective option."
                )

        return {
            "success": True,
            "condition_queried": condition_name,
            "disclaimer": BEST_MEDICINE_DISCLAIMER,
            "common_medication_classes": standard_classes or [
                "Targeted prescription pharmacotherapy determined by treating clinician",
                "Supportive symptomatic relief medications"
            ],
            "factors_doctors_consider": [
                "Renal (Kidney) and Hepatic (Liver) function profiles",
                "Current active prescription medications (Drug-Drug interaction avoidance)",
                "Documented drug allergies or hypersensitivities",
                "Patient age and pregnancy or lactation status",
                "Severity, duration, and underlying etiology of the condition"
            ],
            "general_treatment_approaches": general_treatments,
            "educational_explanation": ai_educational_text,
            "safety_notice": "HealthTriage AI does not generate prescriptions or select personalized drugs autonomously."
        }
