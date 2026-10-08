# ============================================================
# HealthTriage AI - Natural & Self-Care Guidance Engine
# Conservative comfort measures and symptomatic home care
# ============================================================

import os
import re
import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from ai.gemini_service import PRIMARY_MODEL

SELF_CARE_DISCLAIMER = (
    "Comfort measures and supportive home care do not replace medical evaluation or treatment. "
    "If symptoms escalate, persist, or include red-flag warning signs, seek immediate medical care."
)

# ------------------------------------------------------------
# EVIDENCE-BASED HOME REMEDIES KNOWLEDGE BASE
# ------------------------------------------------------------
EVIDENCE_BASED_REMEDIES = {
    "cough": {
        "title": "Cough & Upper Airway Discomfort",
        "category": "Respiratory",
        "evidence_remedies": [
            {
                "name": "Warm Water with Honey & Lemon",
                "evidence_strength": "High (Pediatric & Adult Clinical Trials)",
                "instructions": "Mix 1-2 teaspoons of pure honey with warm water and fresh lemon juice. Sip slowly 2-3 times daily.",
                "rationale": "Honey forms a soothing protective coating over inflamed pharyngeal mucosa and has mild antimicrobial properties.",
                "precautions": "CRITICAL: Do NOT give honey to infants under 12 months due to risk of infant botulism."
            },
            {
                "name": "Steam Inhalation",
                "evidence_strength": "Moderate",
                "instructions": "Inhale warm steam from a bowl of hot water or hot shower for 10-15 minutes, draped with a light towel.",
                "rationale": "Moist heat helps hydrate dry respiratory passages and loosens tenacious secretions.",
                "precautions": "Keep face at least 12 inches away to prevent thermal facial burns. Supervise children."
            },
            {
                "name": "Elevate Head During Sleep",
                "evidence_strength": "Moderate",
                "instructions": "Use 1-2 extra pillows or a wedge pillow to elevate head and chest by 15-30 degrees.",
                "rationale": "Reduces post-nasal drip pooling in the hypopharynx which frequently triggers nocturnal coughing paroxysms."
            },
            {
                "name": "Hydration with Warm Broths or Herbal Teas",
                "evidence_strength": "High",
                "instructions": "Drink 2-3 liters of fluids daily, emphasizing warm herbal teas (chamomile, peppermint, or tulsi).",
                "rationale": "Maintains mucosal moisture and prevents mucus viscosity from increasing."
            }
        ],
        "contraindications": [
            "Coughing up blood or pink frothy sputum (hemoptysis)",
            "Audible wheezing, stridor, or severe shortness of breath",
            "Cough persisting greater than 3 weeks",
            "Chest pain or heaviness during coughing"
        ],
        "when_to_see_doctor": [
            "Fever above 101°F (38.3°C) lasting more than 3 days",
            "Unexplained weight loss or night sweats",
            "Shortness of breath or difficulty breathing lying flat",
            "Symptoms worsen progressively despite 7 days of home care"
        ]
    },
    "sore_throat": {
        "title": "Sore Throat & Pharyngeal Irritation",
        "category": "ENT",
        "evidence_remedies": [
            {
                "name": "Warm Salt Water Gargle",
                "evidence_strength": "High (Gold Standard Supportive)",
                "instructions": "Dissolve 1/2 teaspoon of table salt in 1 cup of warm water. Gargle for 30 seconds and spit out; repeat 3-4 times daily.",
                "rationale": "Hypertonic saline draws excess fluid from swollen pharyngeal tissues by osmosis, soothing inflammation and clearing debris.",
                "precautions": "Do not swallow the saltwater solution."
            },
            {
                "name": "Turmeric & Ginger Infusion (Haldi / Adrak)",
                "evidence_strength": "Moderate",
                "instructions": "Simmer a pinch of ground turmeric and fresh grated ginger in warm milk or water. Sip slowly before bed.",
                "rationale": "Curcumin in turmeric and gingerols provide mild anti-inflammatory and soothing effects on mucous membranes."
            },
            {
                "name": "Demulcent Lozenges or Hard Candies",
                "evidence_strength": "Moderate",
                "instructions": "Dissolve pectin or glycerin lozenges slowly in mouth as needed.",
                "rationale": "Stimulates saliva production which continuously bathes and lubricates sensitive irritated throat lining."
            }
        ],
        "contraindications": [
            "Inability to swallow fluids or saliva (drooling)",
            "Difficulty breathing or muffled 'hot potato' voice",
            "Inability to fully open the mouth (trismus)",
            "Asymmetric swelling of one tonsil or uvula deviation"
        ],
        "when_to_see_doctor": [
            "Severe throat pain with no cough and high fever (suspected Streptococcal pharyngitis)",
            "Sore throat lasting more than 5-7 days",
            "Associated skin rash or joint swelling",
            "Tender, noticeably enlarged lymph nodes in the neck"
        ]
    },
    "congestion": {
        "title": "Nasal Congestion & Sinus Pressure",
        "category": "ENT",
        "evidence_remedies": [
            {
                "name": "Isotonic / Hypertonic Saline Nasal Rinse",
                "evidence_strength": "High (Clinical ENT Guideline Recommended)",
                "instructions": "Use sterile saline nasal spray or a squeeze bottle sinus rinse with distilled/boiled cooled water 1-2 times daily.",
                "rationale": "Gently washes out accumulated mucus, allergens, and crusted secretions without pharmaceutical rebound effects.",
                "precautions": "CRITICAL: NEVER use unboiled tap water in nasal irrigation devices to avoid amoebic infection."
            },
            {
                "name": "Warm Facial Compresses",
                "evidence_strength": "Moderate",
                "instructions": "Apply a warm, damp washcloth over eyes, nose, and cheeks for 5-10 minutes.",
                "rationale": "Improves local blood circulation and relieves painful pressure over frontal and maxillary sinuses."
            },
            {
                "name": "Room Humidifier or Vaporizer",
                "evidence_strength": "Moderate",
                "instructions": "Run a cool-mist humidifier in the bedroom during sleep.",
                "rationale": "Moist air prevents drying of nasal membranes and reduces nocturnal congestion."
            }
        ],
        "contraindications": [
            "Severe headache localized behind eyes with high fever and stiff neck",
            "Swelling, redness, or vision changes around either eye",
            "Clear watery fluid draining continuously from only one nostril following head impact"
        ],
        "when_to_see_doctor": [
            "Symptoms lasting longer than 10-14 days without improvement (possible bacterial sinusitis)",
            "Double sickening: getting better then suddenly worsening with high fever",
            "Severe facial pain unresponsive to mild analgesics"
        ]
    },
    "headache": {
        "title": "Mild Tension Headache & Fatigue",
        "category": "Neurological",
        "evidence_remedies": [
            {
                "name": "Quiet Dark Room Rest",
                "evidence_strength": "High",
                "instructions": "Rest lying down in a cool, quiet, darkened room with eyes closed for 20-40 minutes.",
                "rationale": "Reduces sensory overload, decreases autonomic nervous system arousal, and relieves muscle guarding."
            },
            {
                "name": "Cool or Warm Compress Application",
                "evidence_strength": "Moderate",
                "instructions": "Place a cold gel pack or cool cloth across forehead and temples, or warm compress on back of neck for 15 minutes.",
                "rationale": "Cold constricts local dilated blood vessels; heat relaxes contracted paraspinal cervical and trapezius muscles."
            },
            {
                "name": "Adequate Water & Electrolyte Hydration",
                "evidence_strength": "High",
                "instructions": "Drink 500 mL of water immediately, then continue regular hydration.",
                "rationale": "Subclinical dehydration is one of the most frequent precipitants of tension-type and migraine headaches."
            },
            {
                "name": "Gentle Cervical Spine & Neck Stretching",
                "evidence_strength": "Moderate",
                "instructions": "Slowly tilt head side-to-side and chin to chest, holding each stretch for 15-20 seconds without jerking.",
                "rationale": "Alleviates myofascial trigger points in suboccipital and levator scapulae musculature."
            }
        ],
        "contraindications": [
            "Sudden, instantaneous 'worst headache of life' peaking in seconds (thunderclap - emergency)",
            "Headache accompanied by stiff neck, confusion, high fever, or altered consciousness",
            "Headache accompanied by unilateral weakness, numbness, or slurred speech",
            "Headache following recent head trauma or blow"
        ],
        "when_to_see_doctor": [
            "New type of headache starting after age 50",
            "Headaches progressively increasing in frequency or severity over weeks",
            "Headache waking you from sound sleep regularly",
            "Associated with unexplained nausea and visual aura changes"
        ]
    },
    "nausea": {
        "title": "Mild Nausea & Queasiness",
        "category": "Gastrointestinal",
        "evidence_remedies": [
            {
                "name": "Ginger Infusion / Ginger Candies",
                "evidence_strength": "High (Recognized by Cochrane Systematic Reviews)",
                "instructions": "Sip fresh ginger tea made with steeped peeled ginger root or consume ginger lozenges.",
                "rationale": "Active gingerols and shogaols accelerate gastric emptying and possess peripheral antiemetic properties in the GI tract."
            },
            {
                "name": "BRAT Diet Progression",
                "evidence_strength": "Moderate",
                "instructions": "When nausea settles, eat small portions of Bananas, Rice, Applesauce, and plain Toast or crackers.",
                "rationale": "Easily digestible, bland carbohydrates with low dietary fat that exert minimal gastrointestinal motility demand."
            },
            {
                "name": "Sip Clear Electrolyte Fluids",
                "evidence_strength": "High",
                "instructions": "Take very small, frequent sips (1 tablespoon every 5 minutes) of cool water, oral rehydration solution, or coconut water.",
                "rationale": "Prevents gastric distension which triggers emetic reflexes while defending hydration volume."
            }
        ],
        "contraindications": [
            "Vomiting blood or coffee-ground dark material (hematemesis)",
            "Severe localized abdominal pain or tenderness to light touch",
            "Signs of severe dehydration: unable to urinate for 8+ hours, severe dizziness standing",
            "Severe confusion or extreme lethargy"
        ],
        "when_to_see_doctor": [
            "Inability to keep liquids down for more than 12-24 hours",
            "Nausea and vomiting lasting more than 48 hours",
            "Accompanied by high fever or yellowing of eyes/skin (jaundice)"
        ]
    },
    "acidity": {
        "title": "Mild Heartburn & Acid Indigestion",
        "category": "Gastrointestinal",
        "evidence_remedies": [
            {
                "name": "Elevate Head of Bed by 6-8 Inches",
                "evidence_strength": "High (Gastroenterology Society Recommended)",
                "instructions": "Use bed risers under headboard legs or a firm foam wedge pillow to elevate torso from the waist up.",
                "rationale": "Gravity mechanically prevents acidic gastric contents from refluxing up into the distal esophagus during recumbency."
            },
            {
                "name": "Avoid Eating Within 3 Hours of Sleep",
                "evidence_strength": "High",
                "instructions": "Complete your last meal or snack at least 2.5 to 3 hours prior to lying down.",
                "rationale": "Allows gastric emptying time, significantly lowering peak nocturnal intragastric volume."
            },
            {
                "name": "Small Frequent Meals & Trigger Elimination",
                "evidence_strength": "High",
                "instructions": "Divide large meals into smaller portions. Limit spicy dishes, chocolate, citrus, mint, and carbonated sodas.",
                "rationale": "Prevents excessive stomach distension and relaxes lower esophageal sphincter (LES) less frequently."
            },
            {
                "name": "Chamomile or Fennel (Saunf) Tea",
                "evidence_strength": "Moderate",
                "instructions": "Sip a cup of warm brewed fennel seed or chamomile tea after dinner.",
                "rationale": "Mildly antispasmodic; helps alleviate postprandial fullness and bloating sensation."
            }
        ],
        "contraindications": [
            "Chest pain, pressure, fullness, or squeezing radiating to left arm, neck, jaw, or back",
            "Difficulty swallowing food or pills (dysphagia) or feeling of food sticking",
            "Unintended significant weight loss",
            "Black, tarry stools (melena)"
        ],
        "when_to_see_doctor": [
            "Heartburn occurring more than 2-3 times weekly for more than a month",
            "Over-the-counter antacids provide little or no relief",
            "Chronic hoarseness or persistent dry cough at night"
        ]
    },
    "muscle_ache": {
        "title": "Mild Muscle Soreness & Strain",
        "category": "Musculoskeletal",
        "evidence_remedies": [
            {
                "name": "R.I.C.E. Protocol (First 48 Hours)",
                "evidence_strength": "High (Sports Medicine Standard)",
                "instructions": "Rest injured area; apply Ice wrapped in a towel for 15-20 min every 2-3 hours; apply light Compression wrap; Elevate limb above heart level.",
                "rationale": "Limits acute interstitial edema, controls inflammatory exudate, and numbs pain receptors.",
                "precautions": "Never place bare ice directly on skin to prevent cryotherapy burn."
            },
            {
                "name": "Epsom Salt (Magnesium Sulfate) Warm Soak",
                "evidence_strength": "Moderate",
                "instructions": "Dissolve 1-2 cups of Epsom salts in a warm bath. Soak for 15-20 minutes after the acute 48-hour window.",
                "rationale": "Warmth promotes capillary vasodilation, increases tissue compliance, and eases tense fascia."
            },
            {
                "name": "Gentle Active Range-of-Motion",
                "evidence_strength": "Moderate",
                "instructions": "Perform slow, pain-free active movement without resistance to maintain joint mobility.",
                "rationale": "Prevents joint stiffness and aids lymphatic drainage without stressing recovering muscle fibers."
            }
        ],
        "contraindications": [
            "Complete inability to bear weight on a leg or joint",
            "Visible joint deformity, abnormal angle, or bone irregularity",
            "Sudden numbness, pins and needles, or pale, cold extremity",
            "Severe pain accompanied by high fever or expanding warm redness"
        ],
        "when_to_see_doctor": [
            "No functional improvement after 5-7 days of conservative care",
            "Joint instability or feeling that knee/ankle 'gives way'",
            "Severe localized point tenderness directly over bone"
        ]
    },
    "constipation": {
        "title": "Occasional Mild Constipation",
        "category": "Gastrointestinal",
        "evidence_remedies": [
            {
                "name": "Gradual Soluble & Insoluble Fiber Increase",
                "evidence_strength": "High",
                "instructions": "Incorporate prunes, pears, oats, lentils, chia seeds, and leafy greens. Aim for 25-30g dietary fiber daily.",
                "rationale": "Increases stool water content and bulk, stimulating natural peristaltic colonic contractions."
            },
            {
                "name": "Increased Daily Water Intake",
                "evidence_strength": "High",
                "instructions": "Consume 8-10 glasses (2-2.5 liters) of water daily, especially a glass of warm water first thing in the morning.",
                "rationale": "Stool consistency is directly correlated with colonic hydration. Fiber requires water to prevent fecal impaction."
            },
            {
                "name": "Regular Daily Physical Movement",
                "evidence_strength": "Moderate",
                "instructions": "Engage in 20-30 minutes of brisk walking or light exercise daily.",
                "rationale": "Physical activity stimulates abdominal wall muscles and accelerates intestinal transit time."
            }
        ],
        "contraindications": [
            "Severe, unrelenting abdominal pain or marked abdominal distension",
            "Vomiting along with inability to pass gas or stool (potential bowel obstruction)",
            "Rectal bleeding or blood mixed in stool",
            "Unexplained change in bowel habits lasting over 2 weeks in individuals over 50"
        ],
        "when_to_see_doctor": [
            "No bowel movement for more than 5-7 days despite dietary changes",
            "Severe cramping pain before or during defecation",
            "Unexplained weight loss"
        ]
    },
    "insomnia": {
        "title": "Occasional Sleep Difficulty & Restlessness",
        "category": "Neurological / Lifestyle",
        "evidence_remedies": [
            {
                "name": "Screen-Free Wind-Down Protocol",
                "evidence_strength": "High (Sleep Hygiene Standard)",
                "instructions": "Cease smartphones, laptops, and TV screens 60 minutes before bedtime. Keep lighting dim.",
                "rationale": "Blue spectrum light suppresses pineal melatonin secretion, impairing circadian sleep onset."
            },
            {
                "name": "4-7-8 Parasympathetic Breathing Exercise",
                "evidence_strength": "Moderate",
                "instructions": "Inhale quietly through nose for 4 seconds, hold breath for 7 seconds, exhale audibly through mouth for 8 seconds. Repeat 4 cycles.",
                "rationale": "Prolonged exhalation activates vagal nerve tone, lowering heart rate and facilitating transition into sleep."
            },
            {
                "name": "Warm Herbal Infusion (Chamomile / Passionflower)",
                "evidence_strength": "Moderate",
                "instructions": "Sip 1 cup of caffeine-free chamomile or passionflower tea 45 minutes before sleep.",
                "rationale": "Chamomile contains apigenin, an antioxidant that binds to GABA receptors in the brain, promoting mild sedation."
            },
            {
                "name": "Consistent Wake-Sleep Rhythm",
                "evidence_strength": "High",
                "instructions": "Wake up at the exact same time every morning, including weekends. Get 15 minutes of natural sunlight on waking.",
                "rationale": "Anchors the suprachiasmatic nucleus circadian clock, reinforcing sleep drive."
            }
        ],
        "contraindications": [
            "Severe daytime somnolence causing sudden sleep attacks while driving or operating machinery",
            "Waking up gasping or choking for breath (signs of obstructive sleep apnea)",
            "Accompanying severe depressive symptoms or despair"
        ],
        "when_to_see_doctor": [
            "Sleep difficulties persisting more than 3 nights a week for over 1 month",
            "Loud, irregular snoring with observed breathing pauses",
            "Restless legs causing an uncontrollable urge to move legs at night"
        ]
    }
}

# ------------------------------------------------------------
# STRICT RED-FLAG PATTERNS (EMERGENCY OVERRIDE)
# ------------------------------------------------------------
ACUTE_RED_FLAGS = [
    r"\b(chest\s*pain|chest\s*pressure|tightness\s*in\s*chest|radiat.*arm|radiat.*jaw)\b",
    r"\b(shortness\s*of\s*breath|dyspnea|can'?t\s*breathe|struggling\s*for\s*breath|stridor|gasping)\b",
    r"\b(worst\s*headache|thunderclap|sudden\s*severe\s*headache)\b",
    r"\b(coughing\s*up\s*blood|vomiting\s*blood|black\s*tarry\s*stool|hematemesis|hemoptysis)\b",
    r"\b(stiff\s*neck|cannot\s*bend\s*neck|neck\s*rigidity)\b",
    r"\b(slurred\s*speech|face\s*droop|arm\s*weakness|sudden\s*paralysis|vision\s*loss|confusion)\b",
    r"\b(high\s*fever|fever\s*over\s*104|fever\s*>\s*103|fever\s*>\s*39\.5)\b",
    r"\b(anaphylaxis|swollen\s*tongue|swollen\s*throat|throat\s*closing)\b",
    r"\b(severe\s*burn|third\s*degree|deep\s*wound|uncontrolled\s*bleeding)\b"
]


def detect_emergency_red_flags(query_text: str) -> List[str]:
    """Scan input text against emergency contraindication patterns."""
    matched = []
    text_lower = query_text.lower()
    for pattern in ACUTE_RED_FLAGS:
        if re.search(pattern, text_lower):
            matched.append(pattern)
    return matched


def evaluate_symptom_safety(
    symptom: str,
    severity: str = "mild",
    duration_days: int = 1,
    user_vitals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates whether a symptom is clinically safe for supportive home remedies,
    or if it mandates immediate medical escalation.
    """
    red_flag_matches = detect_emergency_red_flags(symptom)
    is_safe = True
    alert_level = "ROUTINE"
    escalation_reason = []

    if red_flag_matches:
        is_safe = False
        alert_level = "EMERGENCY"
        escalation_reason.append("Emergency symptoms detected. Home remedies are strictly unsafe.")

    if severity.lower() in ["severe", "critical", "unbearable"]:
        is_safe = False
        if alert_level != "EMERGENCY":
            alert_level = "HIGH_PRIORITY"
        escalation_reason.append(f"Severity reported as '{severity}'. Severe conditions require professional physician evaluation.")

    if duration_days > 14:
        is_safe = False
        if alert_level != "EMERGENCY":
            alert_level = "MODERATE"
        escalation_reason.append(f"Symptoms have persisted for {duration_days} days. Chronic or subacute symptoms warrant formal clinical diagnosis.")

    # Check vitals if available
    if user_vitals:
        temp = user_vitals.get("body_temperature")
        if temp and float(temp.get("value", 0)) >= 39.4:  # >= 103 F
            is_safe = False
            if alert_level != "EMERGENCY":
                alert_level = "HIGH_PRIORITY"
            escalation_reason.append(f"Recorded body temperature is {temp.get('value')}°C (>= 103°F). Urgent medical care recommended.")

        spo2 = user_vitals.get("oxygen_saturation")
        if spo2 and float(spo2.get("value", 100)) < 92:
            is_safe = False
            alert_level = "EMERGENCY"
            escalation_reason.append(f"Recorded SpO2 is {spo2.get('value')}% (< 92%). Requires prompt clinical/emergency evaluation.")

        sys_bp = user_vitals.get("blood_pressure_systolic")
        if sys_bp and (float(sys_bp.get("value", 120)) >= 180 or float(sys_bp.get("value", 120)) < 85):
            is_safe = False
            alert_level = "EMERGENCY"
            escalation_reason.append(f"Recorded systolic BP is {sys_bp.get('value')} mmHg (crisis range). Requires emergency medical care.")

    return {
        "is_safe_for_home_care": is_safe,
        "alert_level": alert_level,
        "emergency_escalation": alert_level == "EMERGENCY",
        "reasons": escalation_reason
    }


def find_matching_remedy_category(symptom_text: str) -> Optional[str]:
    """Map user query to known evidence-based remedy category."""
    text = symptom_text.lower()
    
    if any(k in text for k in ["cough", "khansi", "phlegm", "sputum", "bronch"]):
        return "cough"
    if any(k in text for k in ["sore throat", "gala", "throat", "pharyngitis", "tonsil"]):
        return "sore_throat"
    if any(k in text for k in ["congestion", "stuffy nose", "sinus", "cold", "runny nose", "rhinitis"]):
        return "congestion"
    if any(k in text for k in ["headache", "sir dard", "head pain", "tension headache", "migraine"]):
        return "headache"
    if any(k in text for k in ["nausea", "vomit", "queasy", "motion sickness", "morning sickness", "ulti"]):
        return "nausea"
    if any(k in text for k in ["acid", "heartburn", "reflux", "gerd", "gas", "indigestion", "jalon"]):
        return "acidity"
    if any(k in text for k in ["muscle", "sprain", "strain", "soreness", "cramp", "backache", "neck pain"]):
        return "muscle_ache"
    if any(k in text for k in ["constipat", "bowel", "stool hard", "kabz"]):
        return "constipation"
    if any(k in text for k in ["insomnia", "sleep", "cant sleep", "sleepless", "restless"]):
        return "insomnia"

    return None


def get_evidence_based_remedies(
    symptom: str,
    severity: str = "mild",
    duration_days: int = 1,
    user_vitals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main function to produce structured evidence-based self-care guidance.
    Integrates clinical safety screening, contraindications, and when-to-see-doctor guidelines.
    """
    safety_check = evaluate_symptom_safety(symptom, severity, duration_days, user_vitals)

    # If severe or emergency, return strict escalation without home remedy suggestions
    if not safety_check["is_safe_for_home_care"] and safety_check["emergency_escalation"]:
        return {
            "symptom": symptom,
            "status": "EMERGENCY_ESCALATION",
            "is_safe_for_home_care": False,
            "alert_level": safety_check["alert_level"],
            "disclaimer": SELF_CARE_DISCLAIMER,
            "warning": (
                "EMERGENCY WARNING: Your reported symptoms or vital signs suggest a potentially acute or serious condition. "
                "Do NOT rely on home remedies. Please contact emergency services (112 / 108 / 911) or visit the nearest emergency room immediately."
            ),
            "safety_reasons": safety_check["reasons"],
            "remedies": [],
            "when_to_see_doctor": [
                "Seek immediate emergency medical attention now.",
                "Do not drive yourself if experiencing chest pain, dizziness, or confusion."
            ]
        }

    category_key = find_matching_remedy_category(symptom)

    if category_key and category_key in EVIDENCE_BASED_REMEDIES:
        category_data = EVIDENCE_BASED_REMEDIES[category_key]
        return {
            "symptom": symptom,
            "status": "SAFE_SUPPORTIVE_CARE",
            "matched_category": category_data["title"],
            "category_type": category_data["category"],
            "is_safe_for_home_care": safety_check["is_safe_for_home_care"],
            "alert_level": safety_check["alert_level"],
            "safety_warnings": safety_check["reasons"],
            "disclaimer": SELF_CARE_DISCLAIMER,
            "remedies": category_data["evidence_remedies"],
            "contraindications": category_data["contraindications"],
            "when_to_see_doctor": category_data["when_to_see_doctor"],
            "general_lifestyle": [
                "Hydration: Drink at least 2 to 2.5 liters of clean water and warm fluids daily.",
                "Rest: Ensure 7-9 hours of restorative sleep to facilitate immune recovery.",
                "Nutrition: Prefer easily digestible, nutrient-dense home-cooked meals.",
                "Monitoring: Track symptoms twice daily; if symptoms intensify, consult a doctor."
            ]
        }

    # For unmatched mild symptoms, provide general safe supportive wellness guidance
    return {
        "symptom": symptom,
        "status": "GENERAL_SUPPORTIVE_CARE",
        "matched_category": "General Mild Discomfort",
        "category_type": "Supportive Care",
        "is_safe_for_home_care": safety_check["is_safe_for_home_care"],
        "alert_level": safety_check["alert_level"],
        "safety_warnings": safety_check["reasons"],
        "disclaimer": SELF_CARE_DISCLAIMER,
        "remedies": [
            {
                "name": "Adequate Rest & Recuperation",
                "evidence_strength": "High",
                "instructions": "Allow your body sufficient downtime; avoid strenuous physical exertion until recovery.",
                "rationale": "Conserves metabolic energy required for cellular repair and immune defense."
            },
            {
                "name": "Optimized Oral Hydration",
                "evidence_strength": "High",
                "instructions": "Drink warm water, herbal teas, or broths throughout the day.",
                "rationale": "Prevents dehydration and helps maintain mucosal and cellular homeostasis."
            },
            {
                "name": "Balanced Light Nutrition",
                "evidence_strength": "Moderate",
                "instructions": "Consume fresh fruits, vegetables, soups, and easily digestible whole grains.",
                "rationale": "Provides essential micronutrients without placing excess burden on digestion."
            }
        ],
        "contraindications": [
            "Severe pain not relieved by rest",
            "High fever, shortness of breath, or chest heaviness",
            "Sudden loss of neurological function, speech, or vision"
        ],
        "when_to_see_doctor": [
            "Symptoms worsen progressively over 48 to 72 hours",
            "Development of fever or unexpected skin rashes",
            "Whenever in doubt regarding your symptoms' origin"
        ],
        "general_lifestyle": [
            "Monitor your symptoms daily.",
            "Avoid alcohol and tobacco products while recovering.",
            "Maintain moderate room ventilation and clean surroundings."
        ]
    }


def generate_personalized_self_care_gemini(
    symptom: str,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Augment standard evidence-based self-care guidance with Gemini AI
    while enforcing strict clinical boundaries (no prescriptions, no diagnosis, emergency override).
    """
    base_result = get_evidence_based_remedies(
        symptom=symptom,
        severity=context.get("severity", "mild"),
        duration_days=context.get("duration_days", 1),
        user_vitals=context.get("vitals")
    )

    # Never ask AI if emergency escalation is active
    if base_result.get("status") == "EMERGENCY_ESCALATION":
        return base_result

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return base_result

    try:
        client = genai.Client(api_key=api_key)
        system_instruction = (
            "You are a conservative, evidence-based healthcare triage self-care specialist. "
            "STRICT RULES:\n"
            "1. NEVER prescribe prescription medications or tell the user to take antibiotics or specific pharmaceutical dosages.\n"
            "2. NEVER diagnose diseases or provide diagnostic probability percentages.\n"
            "3. Only suggest safe, evidence-based natural comfort measures, hydration, rest, and dietary adjustments.\n"
            "4. Always include red-flag warning signs and explicit criteria for when to seek professional medical evaluation.\n"
            "5. If there is any risk of acute illness (e.g. chest pain, shortness of breath, high fever), immediately instruct to call emergency services.\n"
            "6. Output must be valid JSON matching the format: {\"comfort_summary\": string, \"practical_tips\": [string], \"precautions\": [string], \"when_to_seek_care\": [string]}."
        )

        model_name = os.getenv("GEMINI_MODEL", PRIMARY_MODEL)
        prompt = (
            f"Patient is experiencing mild/moderate symptom: '{symptom}'.\n"
            f"Reported Duration: {context.get('duration_days', 1)} days.\n"
            f"Reported Severity: {context.get('severity', 'mild')}.\n"
            f"Provide compassionate, evidence-based comfort measures in the requested JSON format."
        )

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        text = response.text.strip()
        parsed = json.loads(text)
        base_result["ai_comfort_summary"] = parsed.get("comfort_summary", "")
        base_result["ai_practical_tips"] = parsed.get("practical_tips", [])
        if parsed.get("when_to_seek_care"):
            base_result["when_to_see_doctor"].extend([
                item for item in parsed["when_to_seek_care"]
                if item not in base_result["when_to_see_doctor"]
            ])

    except Exception as e:
        print(f"Notice: Gemini self-care augmentation fallback: {e}")

    return base_result


def analyze_wellness_trends(logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate wellness habits (water intake, sleep averages, mood consistency)
    from historical wellness check-in entries.
    """
    if not logs:
        return {
            "total_checkins": 0,
            "average_water_glasses": 0,
            "average_sleep_hours": 0.0,
            "hydration_goal_met_days": 0,
            "dominant_mood": "Neutral",
            "dominant_energy": "Medium",
            "lifestyle_insights": [
                "Start logging daily wellness check-ins to track your hydration, sleep, and energy levels."
            ]
        }

    total = len(logs)
    total_water = sum(int(l.get("water_glasses", 0)) for l in logs)
    total_sleep = sum(float(l.get("sleep_hours", 0.0)) for l in logs)
    hydration_met = sum(1 for l in logs if int(l.get("water_glasses", 0)) >= 8)

    avg_water = round(total_water / total, 1)
    avg_sleep = round(total_sleep / total, 1)

    # Mood breakdown
    moods = [l.get("mood", "Neutral") for l in logs if l.get("mood")]
    dominant_mood = max(set(moods), key=moods.count) if moods else "Neutral"

    energies = [l.get("energy_level", "Medium") for l in logs if l.get("energy_level")]
    dominant_energy = max(set(energies), key=energies.count) if energies else "Medium"

    insights = []
    if avg_water < 6:
        insights.append(f"Average water intake ({avg_water} glasses/day) is below recommended 8 glasses. Consider keeping a filled water bottle nearby.")
    elif avg_water >= 8:
        insights.append(f"Great hydration! You are averaging {avg_water} glasses of water per day, meeting clinical hydration benchmarks.")

    if avg_sleep < 6.5:
        insights.append(f"Average sleep ({avg_sleep} hrs/night) is below optimal 7-9 hours. Target 30 minutes earlier bedtime to support cellular repair.")
    elif 7.0 <= avg_sleep <= 9.0:
        insights.append(f"Solid restorative sleep routine! You are averaging {avg_sleep} hours per night.")

    if dominant_mood in ["Stressed", "Anxious", "Fatigued"]:
        insights.append("Frequent stress or fatigue noted. Consider short daily outdoor walks and evening deep-breathing exercises.")

    return {
        "total_checkins": total,
        "average_water_glasses": avg_water,
        "average_sleep_hours": avg_sleep,
        "hydration_goal_met_days": hydration_met,
        "dominant_mood": dominant_mood,
        "dominant_energy": dominant_energy,
        "lifestyle_insights": insights
    }
