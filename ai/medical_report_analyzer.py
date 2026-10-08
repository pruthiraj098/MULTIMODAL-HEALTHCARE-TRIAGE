# ============================================================
# HealthTriage AI - Smart Medical Report Analyzer (Phase 4)
# Multimodal Extraction, Biomarker Analysis & Clinical Correlator
# ============================================================

import io
import re
import json
import base64
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from ai.gemini_service import PRIMARY_MODEL

REPORT_ANALYZER_DISCLAIMER = (
    "Laboratory findings must be interpreted by your ordering physician within the context "
    "of your overall clinical history. Results marked outside normal ranges warrant clinical consultation. "
    "This AI summary is an educational and communication aid to prepare for your consultation."
)

# Reference physiological adult ranges for common laboratory biomarkers
BIOMARKER_STANDARDS = {
    "hemoglobin": {
        "canonical": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "min": 12.0,
        "max": 16.5,
        "critical_low": 7.0,
        "critical_high": 20.0,
        "role": "Carries oxygen from lungs to body tissues.",
        "low_meaning": "Lower than normal; may correlate with fatigue, pale skin, or anemia.",
        "high_meaning": "Higher than normal; may indicate dehydration or secondary polycythemia."
    },
    "wbc": {
        "canonical": "White Blood Cell Count (WBC)",
        "unit": "x10^3/µL",
        "min": 4.0,
        "max": 11.0,
        "critical_low": 2.0,
        "critical_high": 30.0,
        "role": "Immune system defense cells fighting infections.",
        "low_meaning": "Low white blood cells; immune defense may be temporarily reduced.",
        "high_meaning": "Elevated white blood cells; frequently indicates active infection, inflammation, or physical stress."
    },
    "platelets": {
        "canonical": "Platelet Count",
        "unit": "x10^3/µL",
        "min": 150.0,
        "max": 450.0,
        "critical_low": 50.0,
        "critical_high": 1000.0,
        "role": "Essential for blood clotting and stopping bleeding.",
        "low_meaning": "Low platelet count (thrombocytopenia); may increase tendency to bruise or bleed.",
        "high_meaning": "Elevated platelets (thrombocytosis); can be reactive to inflammation or iron deficiency."
    },
    "fasting_glucose": {
        "canonical": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "min": 70.0,
        "max": 99.0,
        "critical_low": 54.0,
        "critical_high": 300.0,
        "role": "Primary energy sugar fuel in blood circulation.",
        "low_meaning": "Hypoglycemia; may cause shakiness, sweating, or lightheadedness.",
        "high_meaning": "Elevated fasting blood sugar; values between 100-125 suggest impaired fasting glucose, and >=126 warrant diabetes screening."
    },
    "hba1c": {
        "canonical": "Glycated Hemoglobin (HbA1c)",
        "unit": "%",
        "min": 4.0,
        "max": 5.6,
        "critical_low": None,
        "critical_high": 10.0,
        "role": "Reflects average blood sugar control over the past 2 to 3 months.",
        "low_meaning": "Low reading; generally within normal variations.",
        "high_meaning": "5.7% to 6.4% indicates prediabetes range; >= 6.5% indicates diabetes threshold."
    },
    "creatinine": {
        "canonical": "Serum Creatinine",
        "unit": "mg/dL",
        "min": 0.6,
        "max": 1.2,
        "critical_low": None,
        "critical_high": 3.0,
        "role": "Waste product filtered out of blood by kidneys.",
        "low_meaning": "Low reading; typically relates to low muscle mass and is usually benign.",
        "high_meaning": "Elevated level; suggests kidneys may not be filtering waste at full efficiency."
    },
    "potassium": {
        "canonical": "Serum Potassium (K+)",
        "unit": "mEq/L",
        "min": 3.5,
        "max": 5.0,
        "critical_low": 2.8,
        "critical_high": 6.0,
        "role": "Crucial electrolyte for nerve signaling and heart muscle rhythm.",
        "low_meaning": "Hypokalemia; can lead to muscle cramps or heart rhythm disturbances.",
        "high_meaning": "Hyperkalemia; significantly high levels present serious cardiac rhythm risks requiring prompt evaluation."
    },
    "alt": {
        "canonical": "Alanine Aminotransferase (ALT / SGPT)",
        "unit": "U/L",
        "min": 7.0,
        "max": 56.0,
        "critical_low": None,
        "critical_high": 300.0,
        "role": "Enzyme primarily located in liver cells.",
        "low_meaning": "Normal physiological baseline.",
        "high_meaning": "Elevated liver enzyme; indicates liver cell stress, irritation, or medication effects."
    },
    "cholesterol_total": {
        "canonical": "Total Cholesterol",
        "unit": "mg/dL",
        "min": 100.0,
        "max": 199.0,
        "critical_low": None,
        "critical_high": 300.0,
        "role": "Lipid molecule essential for cell membranes and hormone synthesis.",
        "low_meaning": "Generally optimal for cardiovascular risk profile.",
        "high_meaning": "Desirable level is below 200 mg/dL; higher values can increase long-term cardiovascular plaque risk."
    },
    "tsh": {
        "canonical": "Thyroid Stimulating Hormone (TSH)",
        "unit": "mIU/L",
        "min": 0.4,
        "max": 4.0,
        "critical_low": 0.1,
        "critical_high": 15.0,
        "role": "Pituitary hormone regulating metabolic activity of the thyroid gland.",
        "low_meaning": "Low TSH; suggests thyroid gland may be overactive (hyperthyroidism).",
        "high_meaning": "Elevated TSH; suggests thyroid gland may be underactive (hypothyroidism)."
    }
}


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF document using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                extracted.append(f"--- Page {idx + 1} ---\n{text}")
        return "\n\n".join(extracted)
    except Exception as e:
        print("[Medical Report Analyzer] PDF text extraction notice:", e)
        return ""


def evaluate_parameter(name: str, value: float, unit: str = "") -> Dict[str, Any]:
    """Compare a numeric parameter against standard adult laboratory reference ranges."""
    normalized_name = name.lower()
    match_key = None

    for key in BIOMARKER_STANDARDS:
        if key in normalized_name or normalized_name in key:
            match_key = key
            break

    if not match_key:
        if "hb" in normalized_name or "haemoglobin" in normalized_name:
            match_key = "hemoglobin"
        elif "white blood" in normalized_name or "leukocyte" in normalized_name:
            match_key = "wbc"
        elif "platelet" in normalized_name:
            match_key = "platelets"
        elif "sugar" in normalized_name or "glucose" in normalized_name:
            match_key = "fasting_glucose"

    if match_key:
        ref = BIOMARKER_STANDARDS[match_key]
        canonical = ref["canonical"]
        ref_min = ref["min"]
        ref_max = ref["max"]
        ref_range_str = f"{ref_min} - {ref_max} {ref['unit']}"

        status = "normal"
        explanation = f"{canonical} is within standard adult reference intervals."

        if ref.get("critical_low") and value <= ref["critical_low"]:
            status = "critical_low"
            explanation = f"CRITICAL LOW: {ref['low_meaning']} Requires immediate medical attention."
        elif ref.get("critical_high") and value >= ref["critical_high"]:
            status = "critical_high"
            explanation = f"CRITICAL HIGH: {ref['high_meaning']} Requires immediate medical attention."
        elif value < ref_min:
            status = "low"
            explanation = ref["low_meaning"]
        elif value > ref_max:
            status = "high"
            explanation = ref["high_meaning"]

        return {
            "name": canonical,
            "value": str(value),
            "unit": unit or ref["unit"],
            "reference_range": ref_range_str,
            "status": status,
            "explanation": explanation,
            "is_abnormal": status != "normal",
            "is_critical": status in ["critical_low", "critical_high"]
        }

    return {
        "name": name,
        "value": str(value),
        "unit": unit,
        "reference_range": "Not specified",
        "status": "normal",
        "explanation": "Parameter recorded.",
        "is_abnormal": False,
        "is_critical": False
    }


def rule_based_report_parser(text: str, patient_symptoms: str = "") -> Dict[str, Any]:
    """
    Deterministic rule-based laboratory report parser.
    Extracts common biomarkers and values using regex patterns, evaluates
    reference ranges, correlates with reported symptoms, and formats doctor questions.
    """
    parameters = []
    text_lower = text.lower()

    # Regex patterns for common tests
    patterns = [
        ("Hemoglobin", r"(?:hemoglobin|haemoglobin|hb)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(g/dl|gm/dl)?"),
        ("White Blood Cell Count (WBC)", r"(?:wbc|white blood cells?|total leukocyte count|tlc)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(x10\^3/µl|/cumm|/µl)?"),
        ("Platelet Count", r"(?:platelet count|platelets?)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(x10\^3/µl|lakhs?/cumm|/cumm)?"),
        ("Fasting Blood Glucose", r"(?:fasting blood sugar|fasting glucose|fbs)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(mg/dl)?"),
        ("Serum Creatinine", r"(?:serum creatinine|creatinine)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(mg/dl)?"),
        ("Total Cholesterol", r"(?:total cholesterol|cholesterol)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(mg/dl)?"),
        ("Serum Potassium (K+)", r"(?:potassium|k\+)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(meq/l|mmol/l)?"),
        ("Alanine Aminotransferase (ALT / SGPT)", r"(?:alt|sgpt)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(u/l)?"),
        ("Thyroid Stimulating Hormone (TSH)", r"(?:tsh|thyroid stimulating hormone)\s*[:=-]?\s*([0-9]+\.?[0-9]*)\s*(miu/l|µiu/ml)?"),
    ]

    for name, pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val_str = m.group(1)
            unit_str = m.group(2) if len(m.groups()) > 1 and m.group(2) else ""
            try:
                val_num = float(val_str)
                # Handle platelet units in lakhs/cumm (e.g. 1.8 lakh = 180 x10^3)
                if "platelet" in name.lower() and val_num < 15:
                    val_num = val_num * 100
                param_eval = evaluate_parameter(name, val_num, unit_str)
                parameters.append(param_eval)
            except ValueError:
                pass

    abnormal_params = [p for p in parameters if p["is_abnormal"]]
    abnormal_count = len(abnormal_params)
    has_critical = any(p["is_critical"] for p in parameters)

    # Determine urgency
    if has_critical:
        urgency = "URGENT"
    elif abnormal_count > 0:
        urgency = "PROMPT_REVIEW"
    else:
        urgency = "ROUTINE"

    # Correlate with symptoms
    correlations = []
    if patient_symptoms:
        sym_lower = patient_symptoms.lower()
        for p in abnormal_params:
            p_name = p["name"].lower()
            if "hemoglobin" in p_name and ("fatigue" in sym_lower or "tired" in sym_lower or "dizzy" in sym_lower or "weak" in sym_lower):
                correlations.append(
                    f"Your reported fatigue or weakness correlates with your low hemoglobin level ({p['value']} {p['unit']})."
                )
            if "wbc" in p_name and p["status"] == "high" and ("fever" in sym_lower or "cough" in sym_lower or "pain" in sym_lower or "chills" in sym_lower):
                correlations.append(
                    f"Your elevated white blood cell count ({p['value']} {p['unit']}) aligns with reported symptoms of infection or inflammation."
                )
            if "glucose" in p_name and p["status"] == "high" and ("thirst" in sym_lower or "urination" in sym_lower or "tired" in sym_lower):
                correlations.append(
                    f"Your elevated glucose level ({p['value']} {p['unit']}) corresponds with reported symptoms of increased thirst or fatigue."
                )

    if not correlations:
        if abnormal_count > 0:
            correlations.append(
                f"Identified {abnormal_count} parameter(s) outside reference ranges. Discuss potential symptom linkages during your clinical visit."
            )
        else:
            correlations.append("Reported laboratory parameters are within normal standard adult reference intervals.")

    # Doctor questions
    doctor_questions = []
    for p in abnormal_params[:4]:
        doctor_questions.append(
            f"My {p['name']} was {p['value']} {p['unit']} (Standard: {p['reference_range']}). What factors could be contributing to this {p['status']} value?"
        )
    doctor_questions.append("Do any of these results require repeat testing or follow-up laboratory panels?")
    if abnormal_count > 0:
        doctor_questions.append("Are there specific dietary, lifestyle, or medical steps I should take based on these findings?")

    # Plain language explanation
    if abnormal_count == 0:
        explanation = (
            "Based on the information provided, the laboratory parameters extracted from this report are within "
            "standard adult reference intervals with no abnormal flags identified."
        )
    else:
        items_desc = ", ".join(f"{p['name']} ({p['value']} {p['unit']} - {p['status'].upper()})" for p in abnormal_params)
        explanation = (
            f"Based on the information provided, this report shows {abnormal_count} parameter(s) outside normal ranges: "
            f"{items_desc}. {abnormal_params[0]['explanation']}"
        )

    return {
        "report_type": "Laboratory Blood Panel",
        "report_date": None,
        "parameters": parameters,
        "abnormal_count": abnormal_count,
        "summary": f"Identified {len(parameters)} test parameter(s), with {abnormal_count} outside reference ranges.",
        "plain_language_explanation": explanation,
        "doctor_questions": doctor_questions,
        "symptom_correlations": "\n\n".join(correlations),
        "overall_urgency": urgency,
        "disclaimer": REPORT_ANALYZER_DISCLAIMER
    }


def analyze_medical_report(
    api_key: Optional[str],
    file_bytes: bytes,
    file_name: str,
    mime_type: str = "application/pdf",
    patient_symptoms: str = "",
    patient_vitals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Multimodal Smart Medical Report Analyzer (Phase 4).
    Accepts PDF or Image of medical/lab reports, extracts findings, highlights
    out-of-range values with clinical context, provides plain-language explanations,
    correlates with patient symptoms, and generates doctor questions.
    """
    extracted_text = ""
    is_pdf = "pdf" in mime_type.lower() or file_name.lower().endswith(".pdf")
    is_image = any(img_type in mime_type.lower() for img_type in ["image/jpeg", "image/png", "image/webp"]) or \
               any(file_name.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])

    # If it is a PDF, attempt fast local text extraction first for redundancy
    if is_pdf:
        extracted_text = extract_text_from_pdf(file_bytes)

    # 1. AI Multimodal Extraction & Analysis (Gemini)
    if api_key:
        try:
            client = genai.Client(api_key=api_key)

            vitals_summary = str(patient_vitals) if patient_vitals else "None provided"

            prompt = f"""You are the expert Smart Medical Report Analyzer module of HealthTriage AI.
Analyze the attached laboratory or medical diagnostic document.

PATIENT CONTEXT:
- Reported Symptoms: {patient_symptoms or 'None reported'}
- Recorded Vitals: {vitals_summary}

TASK:
1. Extract ALL test parameters and biomarkers shown in the report.
2. For each parameter:
   - Identify parameter name
   - Measured numeric or textual value
   - Measurement unit (e.g. g/dL, mg/dL, /µL, %)
   - Standard reference interval / normal range
   - Status: "normal", "low", "high", "critical_low", or "critical_high"
   - Plain-language explanation (1-2 clear, compassionate sentences explaining what this test measures and what this value means)
3. Count total abnormal parameters.
4. Highlight out-of-range findings with context (e.g. "Hemoglobin: 9.2 g/dL (Normal: 12-16) - Low").
5. Explicitly correlate findings with the patient's reported symptoms.
6. Generate 3 to 5 clear, intelligent questions the patient can ask their doctor about this report.
7. Assess overall urgency: "ROUTINE", "PROMPT_REVIEW", or "URGENT".

MANDATORY CLINICAL SAFETY RULES:
- Never provide a definitive disease diagnosis (Do NOT say "You have diabetes").
- Never calculate a percentage probability of disease.
- Always begin the plain language explanation with: "Based on the information provided...".
- If any life-threatening biomarker is detected (e.g. Potassium > 6.0 mEq/L or < 2.8 mEq/L, Platelets < 50,000 /µL, Hemoglobin < 7.0 g/dL), mark urgency as "URGENT" and recommend immediate medical attention.

Return ONLY a valid JSON object matching this schema:
{{
  "report_type": "Complete Blood Count / Lipid Panel / etc.",
  "report_date": "YYYY-MM-DD or null",
  "parameters": [
    {{
      "name": "Hemoglobin",
      "value": "9.2",
      "unit": "g/dL",
      "reference_range": "12.0 - 16.0",
      "status": "low",
      "explanation": "Hemoglobin carries oxygen in red blood cells. A value of 9.2 g/dL is lower than normal, which may be associated with fatigue or anemia."
    }}
  ],
  "abnormal_count": 1,
  "summary": "Plain-language 2-sentence summary of the report.",
  "plain_language_explanation": "Based on the information provided...",
  "symptom_correlations": "Correlation between report findings and reported symptoms...",
  "doctor_questions": [
    "Question 1...",
    "Question 2..."
  ],
  "overall_urgency": "PROMPT_REVIEW"
}}
"""

            # Build Gemini content parts
            content_parts = []
            if is_pdf:
                content_parts.append(types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"))
            elif is_image:
                resolved_mime = mime_type if "image" in mime_type else "image/jpeg"
                content_parts.append(types.Part.from_bytes(data=file_bytes, mime_type=resolved_mime))
            elif extracted_text:
                content_parts.append(f"EXTRACTED REPORT TEXT:\n{extracted_text}")

            content_parts.append(prompt)

            response = client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=content_parts
            )

            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                raw_text = re.sub(r"\n?```$", "", raw_text)

            ai_result = json.loads(raw_text)

            # Ensure mandatory safety constraints
            explanation = ai_result.get("plain_language_explanation", "")
            if not explanation.startswith("Based on the information provided"):
                ai_result["plain_language_explanation"] = f"Based on the information provided, {explanation}"

            # Calculate abnormal count accurately
            params = ai_result.get("parameters", [])
            for p in params:
                p["is_abnormal"] = p.get("status") in ["low", "high", "critical_low", "critical_high"]
                p["is_critical"] = p.get("status") in ["critical_low", "critical_high"]

            ai_result["abnormal_count"] = sum(1 for p in params if p.get("is_abnormal"))
            ai_result["disclaimer"] = REPORT_ANALYZER_DISCLAIMER
            return ai_result

        except Exception as e:
            print("[Medical Report Analyzer] Gemini AI analysis notice:", e)

    # 2. Rule-Based Fallback Parser
    text_to_parse = extracted_text
    if not text_to_parse:
        try:
            text_to_parse = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            text_to_parse = ""

    return rule_based_report_parser(text_to_parse, patient_symptoms=patient_symptoms)
