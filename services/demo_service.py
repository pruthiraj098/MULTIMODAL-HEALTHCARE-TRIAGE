# ============================================================
# HealthTriage AI - Synthetic Clinical Demo Scenarios Service
# Provides 10 standardized, safe synthetic clinical test cases for
# live presentations, clinician evaluations, and competition judging
# ============================================================

from typing import Dict, Any, List, Optional

SYNTHETIC_DEMO_SCENARIOS = [
    {
        "id": "scenario-1-routine-fever",
        "title": "1. Routine Fever & Mild Body Aches",
        "category": "ROUTINE",
        "badge_color": "green",
        "facility_type": "CLINIC",
        "patient": {
            "name": "Aarav Sharma",
            "age": 28,
            "gender": "Male",
            "language": "en"
        },
        "symptoms": "I've had a low-grade fever of 100.2 F and general body aches since yesterday morning. Mild sore throat, but drinking fluids and resting.",
        "vitals": {
            "temperature": 100.2,
            "heart_rate": 82,
            "spo2": 98.0,
            "respiratory_rate": 16,
            "systolic_bp": 118,
            "diastolic_bp": 76
        },
        "expected_triage": "ROUTINE",
        "description": "Standard self-limiting febrile illness safely categorized as routine with supportive self-care recommendations."
    },
    {
        "id": "scenario-2-urgent-respiratory",
        "title": "2. Urgent Respiratory Complaint",
        "category": "URGENT",
        "badge_color": "yellow",
        "facility_type": "PHC",
        "patient": {
            "name": "Sunita Mohanty",
            "age": 52,
            "gender": "Female",
            "language": "en"
        },
        "symptoms": "Persistent dry cough for 5 days, increasing breathlessness when climbing stairs, and mild chest tightness when inhaling deeply.",
        "vitals": {
            "temperature": 101.5,
            "heart_rate": 108,
            "spo2": 93.0,
            "respiratory_rate": 24,
            "systolic_bp": 136,
            "diastolic_bp": 88
        },
        "expected_triage": "URGENT",
        "description": "Sub-acute respiratory compromise with borderline oxygenation warranting in-person clinical assessment within 24 hours."
    },
    {
        "id": "scenario-3-emergency-redflag",
        "title": "3. Emergency Red-Flag Cardiac Event",
        "category": "EMERGENCY",
        "badge_color": "red",
        "facility_type": "GOVERNMENT_HOSPITAL",
        "patient": {
            "name": "Rajesh Kumar Verma",
            "age": 59,
            "gender": "Male",
            "language": "en"
        },
        "symptoms": "Crushing central chest pain radiating to left jaw and arm for past 30 minutes, cold sweating, and acute shortness of breath.",
        "vitals": {
            "temperature": 98.6,
            "heart_rate": 124,
            "spo2": 88.0,
            "respiratory_rate": 28,
            "systolic_bp": 185,
            "diastolic_bp": 115
        },
        "expected_triage": "EMERGENCY",
        "description": "Acute coronary syndrome presentation triggering immediate deterministic safety override, emergency contacts, and trauma routing."
    },
    {
        "id": "scenario-4-uploaded-lab-report",
        "title": "4. Uploaded Laboratory Diagnostic Report",
        "category": "URGENT",
        "badge_color": "yellow",
        "facility_type": "GOVERNMENT_HOSPITAL",
        "patient": {
            "name": "Kavita Reddy",
            "age": 34,
            "gender": "Female",
            "language": "en"
        },
        "symptoms": "Feeling unusually fatigued, pale, and dizzy for 2 weeks. Uploaded my recent complete blood count test report.",
        "vitals": {
            "heart_rate": 96,
            "spo2": 97.0,
            "temperature": 98.4
        },
        "report_findings": {
            "parameters": [
                {"name": "Hemoglobin", "value": "7.8", "unit": "g/dL", "reference_range": "12.0 - 15.5 g/dL", "status": "LOW", "explanation": "Markedly lower than normal reference range, consistent with moderate-to-severe anemia."},
                {"name": "Platelet Count", "value": "180", "unit": "x10^3/uL", "reference_range": "150 - 450 x10^3/uL", "status": "NORMAL", "explanation": "Within normal range."},
                {"name": "Serum Ferritin", "value": "9", "unit": "ng/mL", "reference_range": "15 - 150 ng/mL", "status": "LOW", "explanation": "Significantly depleted iron reserves."}
            ]
        },
        "expected_triage": "URGENT",
        "description": "Demonstrates multimodal OCR parameter extraction, reference range comparison, and safe uncertainty-aware phrasing without autonomous diagnosis."
    },
    {
        "id": "scenario-5-image-observation",
        "title": "5. Visible Clinical Image Observation",
        "category": "URGENT",
        "badge_color": "yellow",
        "facility_type": "CLINIC",
        "patient": {
            "name": "Devendra Patnaik",
            "age": 41,
            "gender": "Male",
            "language": "en"
        },
        "symptoms": "Developed an expanding erythematous skin rash with central vesicular lesions on forearm after gardening 3 days ago. Mild itching and local warmth.",
        "vitals": {
            "temperature": 99.1,
            "heart_rate": 78,
            "spo2": 99.0
        },
        "image_findings": {
            "category": "Dermatological Lesion",
            "description": "Circumscribed erythematous plaque with central papular eruption on left ventral forearm. No systemic purpura or necrotic borders.",
            "quality": "Adequate photographic lighting and resolution"
        },
        "expected_triage": "URGENT",
        "description": "Visible observation without diagnostic overconfidence; flags skin changes for in-person physician dermatological confirmation."
    },
    {
        "id": "scenario-6-multilingual-odia-hindi",
        "title": "6. Odia Regional Multilingual Consultation",
        "category": "ROUTINE",
        "badge_color": "green",
        "facility_type": "PHC",
        "patient": {
            "name": "Basanti Behera",
            "age": 48,
            "gender": "Female",
            "language": "or"
        },
        "symptoms": "ମୋତେ ଦୁଇ ଦିନ ହେବ ସାମାନ୍ୟ ମୁଣ୍ଡବିନ୍ଧା ଏବଂ ଥକାପଣ ଲାଗୁଛି। ଆଜି ଟିକେ ଥଣ୍ଡା ଲାଗୁଛି।",
        "vitals": {
            "temperature": 99.4,
            "heart_rate": 76,
            "spo2": 98.0
        },
        "expected_triage": "ROUTINE",
        "description": "Patient communicates fluently in native Odia, while the system generates audio TTS in Odia and a standardized clinical summary in English for facility staff."
    },
    {
        "id": "scenario-7-campus-health",
        "title": "7. Campus Health Center Consultation",
        "category": "ROUTINE",
        "badge_color": "green",
        "facility_type": "CAMPUS_HEALTH",
        "patient": {
            "name": "Ananya Sen (Student ID: UG23-CS-104)",
            "age": 20,
            "gender": "Female",
            "language": "en"
        },
        "symptoms": "Finals exam stress, irregular sleep for past week, tension headache across forehead, and mild stomach acidity.",
        "vitals": {
            "temperature": 98.4,
            "heart_rate": 84,
            "spo2": 99.0,
            "systolic_bp": 114,
            "diastolic_bp": 72
        },
        "expected_triage": "ROUTINE",
        "description": "Campus workflow logging student dormitory/ID metadata and generating supportive hydration and rest guidance."
    },
    {
        "id": "scenario-8-occupational-health",
        "title": "8. Industrial Occupational Health Screening",
        "category": "URGENT",
        "badge_color": "yellow",
        "facility_type": "OCCUPATIONAL_HEALTH",
        "patient": {
            "name": "Manoj Barik (Badge: UNIT-3-FDY)",
            "age": 36,
            "gender": "Male",
            "language": "en"
        },
        "symptoms": "Worked 6 hours in furnace foundry section. Experiencing severe muscle cramps in calves, heavy sweating followed by lightheadedness, and nausea.",
        "vitals": {
            "temperature": 101.8,
            "heart_rate": 116,
            "spo2": 96.0,
            "systolic_bp": 102,
            "diastolic_bp": 64
        },
        "expected_triage": "URGENT",
        "description": "Occupational heat exhaustion screening linking plant workplace unit metadata and rapid oral/IV electrolyte resuscitation protocol."
    },
    {
        "id": "scenario-9-public-health-camp",
        "title": "9. Rural Outreach Camp Rapid Intake",
        "category": "ROUTINE",
        "badge_color": "green",
        "facility_type": "PUBLIC_HEALTH_CAMP",
        "patient": {
            "name": "Bikash Pradhan",
            "age": 62,
            "gender": "Male",
            "language": "en"
        },
        "symptoms": "Known chronic hypertensive patient attending village health screening camp. Mild knee stiffness, no chest pain.",
        "vitals": {
            "systolic_bp": 142,
            "diastolic_bp": 88,
            "heart_rate": 72,
            "spo2": 97.0
        },
        "expected_triage": "ROUTINE",
        "description": "Rapid community screening mode designed for fast data capture and linkage to chronic medication refill review."
    },
    {
        "id": "scenario-10-referral-case",
        "title": "10. Inter-Facility Tertiary Referral Case",
        "category": "URGENT",
        "badge_color": "yellow",
        "facility_type": "PHC",
        "patient": {
            "name": "Manorama Das",
            "age": 45,
            "gender": "Female",
            "language": "en"
        },
        "symptoms": "Right upper quadrant abdominal pain worsening after fatty meals for 4 weeks. High post-prandial discomfort and ultrasound indicates cholelithiasis.",
        "vitals": {
            "temperature": 99.8,
            "heart_rate": 88,
            "spo2": 98.0,
            "systolic_bp": 128,
            "diastolic_bp": 82
        },
        "expected_triage": "URGENT",
        "description": "Demonstrates full end-to-end referral preparation: PHC medical officer prepares tertiary surgical transfer note with printable PDF slip."
    }
]

class DemoScenarioService:
    """Provides synthetic demo cases for interactive multi-role walk-throughs."""

    @staticmethod
    def get_all_scenarios() -> List[Dict[str, Any]]:
        return SYNTHETIC_DEMO_SCENARIOS

    @staticmethod
    def get_scenario_by_id(scenario_id: str) -> Optional[Dict[str, Any]]:
        for sc in SYNTHETIC_DEMO_SCENARIOS:
            if sc["id"] == scenario_id:
                return sc
        return None
