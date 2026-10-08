# ============================================================
# HealthTriage AI - Medication Guidance Engine (Phase 5)
# Interactions, Food Warnings, Missed Dose & Prescription OCR
# ============================================================

import os
import re
import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from ai.gemini_service import PRIMARY_MODEL

MEDICATION_EDUCATIONAL_DISCLAIMER = (
    "This guidance is solely for informational purposes and does not constitute a prescription, "
    "dosage recommendation, or clinical recommendation. Always verify with your pharmacist or prescribing doctor."
)

# Deterministic Clinical Drug-Drug Interactions Matrix
KNOWN_DRUG_INTERACTIONS = [
    # Severe interactions
    {
        "drugs": ["warfarin", "aspirin"],
        "severity": "Severe",
        "effect": "Markedly increased risk of major gastrointestinal and systemic bleeding.",
        "recommendation": "Avoid concurrent use unless explicitly prescribed by a cardiologist with frequent INR monitoring."
    },
    {
        "drugs": ["warfarin", "ibuprofen"],
        "severity": "Severe",
        "effect": "NSAIDs inhibit platelet aggregation and injure gastric mucosa, compounding anticoagulation bleeding risks.",
        "recommendation": "Avoid concurrent use. Use alternative pain relievers like acetaminophen under clinical guidance."
    },
    {
        "drugs": ["sildenafil", "nitroglycerin"],
        "severity": "Severe",
        "effect": "Synergistic vasodilation producing catastrophic, potentially fatal hypotension.",
        "recommendation": "Strictly contraindicated. Do NOT take phosphodiesterase-5 inhibitors with any form of nitrates."
    },
    {
        "drugs": ["tadalafil", "nitroglycerin"],
        "severity": "Severe",
        "effect": "Profound, life-threatening blood pressure collapse.",
        "recommendation": "Strictly contraindicated. Concomitant administration is hazardous."
    },
    {
        "drugs": ["lisinopril", "spironolactone"],
        "severity": "Severe",
        "effect": "Combined potassium-sparing mechanisms cause acute severe hyperkalemia, risking cardiac arrest.",
        "recommendation": "Requires close physician supervision with baseline and regular serum potassium and renal monitoring."
    },
    {
        "drugs": ["atorvastatin", "clarithromycin"],
        "severity": "Severe",
        "effect": "Clarithromycin strongly inhibits CYP3A4, causing massive statin accumulation, myopathy, and rhabdomyolysis.",
        "recommendation": "Temporarily suspend atorvastatin during the antibiotic course, or select an alternative antibiotic."
    },
    {
        "drugs": ["fluoxetine", "tramadol"],
        "severity": "Severe",
        "effect": "Dual enhancement of central serotonin transmission dramatically elevates risk of serotonin syndrome and seizures.",
        "recommendation": "Avoid combination. Monitor for agitation, hyperthermia, tremor, and tachycardia if co-administered."
    },
    {
        "drugs": ["methotrexate", "ibuprofen"],
        "severity": "Severe",
        "effect": "NSAIDs reduce renal methotrexate clearance, causing severe bone marrow and gastrointestinal toxicity.",
        "recommendation": "Avoid concurrent high-dose NSAIDs. Consult rheumatologist or oncologist."
    },

    # Moderate interactions
    {
        "drugs": ["lisinopril", "ibuprofen"],
        "severity": "Moderate",
        "effect": "NSAIDs blunt the antihypertensive effect of ACE inhibitors and increase acute renal impairment risk.",
        "recommendation": "Limit NSAID duration, monitor blood pressure, and maintain adequate hydration."
    },
    {
        "drugs": ["metformin", "alcohol"],
        "severity": "Moderate",
        "effect": "Alcohol potentiates the effect of metformin on lactate metabolism, elevating lactic acidosis risk.",
        "recommendation": "Avoid excessive or binge alcohol consumption while on metformin."
    },
    {
        "drugs": ["levothyroxine", "calcium"],
        "severity": "Moderate",
        "effect": "Calcium compounds bind levothyroxine in the gut, severely reducing thyroid hormone absorption.",
        "recommendation": "Administer levothyroxine at least 4 hours apart from calcium, iron, or multivitamin supplements."
    },
    {
        "drugs": ["ciprofloxacin", "antacid"],
        "severity": "Moderate",
        "effect": "Polyvalent cations in antacids form insoluble chelates with ciprofloxacin, blunting antibacterial effect.",
        "recommendation": "Take ciprofloxacin 2 hours before or 6 hours after magnesium/aluminum antacids."
    },
    {
        "drugs": ["digoxin", "furosemide"],
        "severity": "Moderate",
        "effect": "Loop diuretics induce hypokalemia, which sharply sensitizes the myocardium to digoxin toxicity.",
        "recommendation": "Monitor serum potassium and digoxin levels; potassium supplementation is often required."
    },
    {
        "drugs": ["omeprazole", "clopidogrel"],
        "severity": "Moderate",
        "effect": "Omeprazole inhibits CYP2C19 bioactivation of clopidogrel, reducing antiplatelet protection.",
        "recommendation": "Consider alternative acid suppressants like pantoprazole under cardiologist advice."
    },

    # Minor interactions
    {
        "drugs": ["acetaminophen", "alcohol"],
        "severity": "Minor",
        "effect": "Chronic alcohol intake induces CYP2E1, elevating toxic NAPQI metabolite formation from acetaminophen.",
        "recommendation": "Keep acetaminophen dose below 2,000 mg/day if alcohol is consumed regularly."
    },
    {
        "drugs": ["cetirizine", "alcohol"],
        "severity": "Minor",
        "effect": "Additive central nervous system depression.",
        "recommendation": "Avoid alcohol or activities requiring high alertness like driving."
    }
]

# Food and Lifestyle Interactions Knowledge Base
FOOD_LIFESTYLE_RULES = {
    "atorvastatin": {
        "drug": "Atorvastatin / Statins",
        "avoid": "Grapefruit & Grapefruit Juice",
        "reason": "Grapefruit blocks CYP3A4 enzymes in the intestine, leading to abnormally high statin levels in the blood, increasing risk of muscle toxicity (rhabdomyolysis).",
        "severity": "Moderate"
    },
    "simvastatin": {
        "drug": "Simvastatin",
        "avoid": "Grapefruit & Grapefruit Juice",
        "reason": "Significantly amplifies statin blood concentration and side effect risks.",
        "severity": "Moderate"
    },
    "warfarin": {
        "drug": "Warfarin",
        "avoid": "Sudden changes in Vitamin K foods (Kale, Spinach, Broccoli) & Alcohol",
        "reason": "Vitamin K promotes clotting factors, counteracting warfarin's anticoagulant effect. Keep green leafy vegetable intake consistent week to week.",
        "severity": "Severe"
    },
    "lisinopril": {
        "drug": "Lisinopril / ACE Inhibitors",
        "avoid": "High-potassium salt substitutes & excessive potassium-rich foods",
        "reason": "Lisinopril decreases aldosterone, causing potassium retention. Excess potassium intake can cause dangerously high serum potassium.",
        "severity": "Moderate"
    },
    "metformin": {
        "drug": "Metformin",
        "avoid": "Excessive Alcohol Consumption",
        "reason": "Alcohol impairs hepatic lactate clearance, multiplying the danger of rare but life-threatening lactic acidosis. Always take with meals.",
        "severity": "Moderate"
    },
    "levothyroxine": {
        "drug": "Levothyroxine",
        "avoid": "Coffee, Soy, Calcium, Iron within 1 to 4 hours of dosing",
        "reason": "Food and minerals drastically impair absorption. Must be taken on an empty stomach with a full glass of water 30-60 min before breakfast.",
        "severity": "Moderate"
    },
    "ibuprofen": {
        "drug": "Ibuprofen / NSAIDs",
        "avoid": "Taking on an empty stomach & Alcohol",
        "reason": "Can cause gastric ulceration and stomach bleeding. Always take with meals or milk to protect the gastric mucosa.",
        "severity": "Moderate"
    },
    "doxycycline": {
        "drug": "Doxycycline / Tetracyclines",
        "avoid": "Dairy products (milk, cheese, yogurt) & Calcium supplements within 2 hours",
        "reason": "Calcium binds to the antibiotic in the stomach and prevents therapeutic absorption.",
        "severity": "Moderate"
    }
}


def check_drug_interactions(
    medications: List[str],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates potential drug-drug conflicts across a list of medications.
    Combines deterministic clinical interaction tables with Gemini contextual AI.
    """
    clean_meds = [m.strip().lower() for m in medications if m and m.strip()]
    if len(clean_meds) < 2:
        return {
            "interactions": [],
            "has_severe": False,
            "has_moderate": False,
            "summary": "At least two medications are required to check for interactions.",
            "disclaimer": MEDICATION_EDUCATIONAL_DISCLAIMER
        }

    detected_interactions = []

    # 1. Deterministic Rule Matching
    for rule in KNOWN_DRUG_INTERACTIONS:
        rule_drugs = rule["drugs"]
        match_a = any(rule_drugs[0] in m for m in clean_meds)
        match_b = any(rule_drugs[1] in m for m in clean_meds)

        if match_a and match_b:
            detected_interactions.append({
                "drug_a": rule_drugs[0].capitalize(),
                "drug_b": rule_drugs[1].capitalize(),
                "severity": rule["severity"],
                "clinical_effect": rule["effect"],
                "recommendation": rule["recommendation"]
            })

    # 2. AI Contextual Expansion (if API key available)
    if api_key and len(clean_meds) >= 2:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are the clinical pharmacology interaction analyzer for HealthTriage AI.
Analyze the following patient medication list for drug-drug interactions:
{', '.join(clean_meds)}

TASK:
1. Identify all verified pharmacological drug-drug interactions.
2. For each conflict, specify:
   - drug_a
   - drug_b
   - severity: "Severe", "Moderate", or "Minor"
   - clinical_effect: brief physiological explanation
   - recommendation: safe clinical advice (e.g. adjust timing, clinical monitoring, alternative therapy)
3. Provide a clear 1-2 sentence overall interaction summary.

MANDATORY RULES:
- Never alter the doctor's prescription.
- Always include cautious clinical phrasing: "Always verify with your prescribing physician or pharmacist".
- Return ONLY valid JSON:
{{
  "interactions": [
    {{
      "drug_a": "...",
      "drug_b": "...",
      "severity": "Severe / Moderate / Minor",
      "clinical_effect": "...",
      "recommendation": "..."
    }}
  ],
  "summary": "..."
}}
"""
            response = client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=prompt
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            ai_data = json.loads(raw)
            ai_interactions = ai_data.get("interactions", [])

            # Merge interactions preventing duplicates
            for ai_int in ai_interactions:
                pair = {ai_int.get("drug_a", "").lower(), ai_int.get("drug_b", "").lower()}
                already_found = any(
                    {d["drug_a"].lower(), d["drug_b"].lower()} == pair
                    for d in detected_interactions
                )
                if not already_found and ai_int.get("drug_a") and ai_int.get("drug_b"):
                    detected_interactions.append(ai_int)

        except Exception as e:
            print("[Medication Guidance] AI interaction check notice:", e)

    has_severe = any(i.get("severity") == "Severe" for i in detected_interactions)
    has_moderate = any(i.get("severity") == "Moderate" for i in detected_interactions)

    if detected_interactions:
        summary = (
            f"Identified {len(detected_interactions)} potential medication interaction(s) "
            f"({sum(1 for i in detected_interactions if i.get('severity') == 'Severe')} Severe, "
            f"{sum(1 for i in detected_interactions if i.get('severity') == 'Moderate')} Moderate). "
            "Discuss these combinations with your doctor or pharmacist."
        )
    else:
        summary = "No major known drug-drug conflicts detected among the reviewed medications."

    return {
        "interactions": detected_interactions,
        "has_severe": has_severe,
        "has_moderate": has_moderate,
        "summary": summary,
        "disclaimer": MEDICATION_EDUCATIONAL_DISCLAIMER
    }


def get_food_and_lifestyle_warnings(medications: List[str]) -> List[Dict[str, Any]]:
    """
    Returns food, dietary, and lifestyle warnings for a list of medications.
    """
    clean_meds = [m.strip().lower() for m in medications if m and m.strip()]
    warnings = []

    for drug_key, rule in FOOD_LIFESTYLE_RULES.items():
        if any(drug_key in m for m in clean_meds):
            warnings.append({
                "medication": rule["drug"],
                "avoid": rule["avoid"],
                "reason": rule["reason"],
                "severity": rule["severity"]
            })

    return warnings


def get_missed_dose_guidance(medication_name: str) -> Dict[str, Any]:
    """
    Returns clinical safe protocol for missed doses for a given medication.
    """
    med_lower = medication_name.lower().strip()

    general_rule = (
        "Take the missed dose as soon as you remember. However, if it is almost time for your "
        "next scheduled dose, skip the missed dose and resume your regular dosing schedule. "
        "NEVER take a double dose or extra medication to make up for a missed dose."
    )

    specific_guidance = None

    if any(k in med_lower for k in ["insulin", "metformin", "glipizide", "januvia"]):
        specific_guidance = (
            "For diabetes medications: Check your blood glucose level immediately. If your sugar is within "
            "normal limits and meals are upcoming, follow your specific provider plan. Never take double insulin "
            "as this risks severe hypoglycemia. Contact your care team if blood sugars remain elevated."
        )
    elif any(k in med_lower for k in ["lisinopril", "losartan", "amlodipine", "metoprolol"]):
        specific_guidance = (
            "For blood pressure medications: If remembered within 6-8 hours of the scheduled time, take it. "
            "If it is late in the day or near the next dose, skip it and continue tomorrow. Check your blood pressure "
            "and do not take two tablets together."
        )
    elif any(k in med_lower for k in ["amoxicillin", "azithromycin", "ciprofloxacin", "augmentin", "doxycycline"]):
        specific_guidance = (
            "For antibiotics: Take the missed dose as soon as you remember to keep antibiotic levels steady. "
            "If it is nearly time for the next dose, adjust spacing slightly or consult your pharmacist. "
            "Always complete the full prescribed course even if feeling better."
        )
    elif any(k in med_lower for k in ["warfarin", "eliquis", "xarelto"]):
        specific_guidance = (
            "For anticoagulants (blood thinners): If remembered on the same day, take it as soon as possible. "
            "If you do not remember until the next day, skip the missed dose and take your normal dose. Do not take "
            "two doses at once. Record the missed dose in your medication diary."
        )
    elif any(k in med_lower for k in ["levothyroxine", "synthroid"]):
        specific_guidance = (
            "For thyroid hormone: Levothyroxine has a long half-life in the body. If you forget your morning dose, "
            "you can take it later in the day as long as your stomach is empty (at least 2 hours after food), or resume "
            "the next morning."
        )

    return {
        "medication": medication_name,
        "general_safe_protocol": general_rule,
        "specific_guidance": specific_guidance or general_rule,
        "disclaimer": "Always verify with your pharmacist or prescribing doctor before altering dosing schedules."
    }


def extract_prescription_details(
    api_key: Optional[str],
    file_bytes: bytes,
    mime_type: str = "image/jpeg",
    file_name: str = "prescription.jpg"
) -> Dict[str, Any]:
    """
    Prescription Reader: Uses multimodal Gemini vision to read handwritten
    or printed doctor prescriptions, extracting medications, dosages, frequency, and directions.
    """
    if not api_key:
        return {
            "success": False,
            "error": "GEMINI_API_KEY required for multimodal prescription OCR.",
            "medications": []
        }

    try:
        client = genai.Client(api_key=api_key)
        resolved_mime = mime_type if ("image" in mime_type or "pdf" in mime_type) else "image/jpeg"

        prompt = """You are the expert clinical prescription reader module of HealthTriage AI.
Inspect this doctor prescription image/document and accurately extract all prescribed medications.

For each medication:
1. Medication Name (Generic and Brand name if visible)
2. Dosage (e.g. 500 mg, 10 mg, 1 puff)
3. Frequency (e.g. Once daily, Twice daily, Every 8 hours, As needed)
4. Time of Day: "Morning", "Afternoon", "Evening", or "Night"
5. Special Instructions: e.g. "Take after food", "Take on empty stomach"
6. Food Warnings: e.g. "Avoid alcohol", "Avoid grapefruit", "Take with milk"

MANDATORY SAFETY RULES:
- Never invent or hallucinate medication dosages. If handwriting is illegible or unclear, note "Verification needed with pharmacist".
- Always include the clear clinical disclaimer: "Always verify with your pharmacist or prescribing doctor".

Return ONLY a valid JSON object matching this schema:
{
  "prescriber_name": "Doctor name or null",
  "prescription_date": "YYYY-MM-DD or null",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500 mg",
      "frequency": "Twice daily",
      "time_of_day": "Morning",
      "instructions": "Take with meals",
      "food_warnings": "Avoid excessive alcohol"
    }
  ],
  "special_notes": "...",
  "disclaimer": "Always verify with your pharmacist or prescribing doctor before initiating or changing any medication."
}
"""

        content_parts = [
            types.Part.from_bytes(data=file_bytes, mime_type=resolved_mime),
            prompt
        ]

        response = client.models.generate_content(
            model=PRIMARY_MODEL,
            contents=content_parts
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        extracted = json.loads(raw)
        extracted["success"] = True
        return extracted

    except Exception as e:
        print("[Prescription Reader] OCR extraction error:", e)
        return {
            "success": False,
            "error": f"Failed to transcribe prescription: {str(e)}",
            "medications": []
        }
