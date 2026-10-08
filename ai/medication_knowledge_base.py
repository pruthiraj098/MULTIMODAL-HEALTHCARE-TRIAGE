# ============================================================
# HealthTriage AI - Comprehensive Medication Knowledge Base (Module 5)
# Verified Medical Pharmacology & Safety Reference
# Sources: WHO Model List of Essential Medicines, CDSCO, FDA, BNF
# ============================================================

from typing import Dict, Any, List, Optional

MEDICATION_KNOWLEDGE_VERSION = "2026.1"
MEDICATION_KNOWLEDGE_LAST_UPDATED = "2026-03-15"

MEDICATION_DATABASE: List[Dict[str, Any]] = [
    {
        "id": "MED-001",
        "generic_name": "Paracetamol (Acetaminophen)",
        "common_brand_names": ["Crocin", "Calpol", "Dolo 650", "Tylenol", "Panadol", "Pacimol"],
        "medication_class": "Analgesic and Antipyretic",
        "common_medical_uses": [
            "Mild to moderate pain relief (headache, toothache, muscle ache)",
            "Reduction of fever from viral or bacterial infections"
        ],
        "general_mechanism": "Centrally acting inhibitor of prostaglandin synthesis in the central nervous system and modulation of descending serotonergic inhibitory pathways.",
        "common_side_effects": [
            "Generally well-tolerated at therapeutic doses",
            "Mild nausea",
            "Rare mild rash"
        ],
        "important_warnings": [
            "Acute hepatotoxicity / liver injury with overdosing",
            "Maximum daily limit is 4,000 mg in healthy adults (often capped at 2,000 - 3,000 mg in frail elderly or liver risk)",
            "Check all combination cough/cold medications to avoid accidental duplicate dosing"
        ],
        "contraindications": [
            "Severe active hepatic impairment or severe acute liver failure",
            "Known hypersensitivity to paracetamol"
        ],
        "important_interactions": [
            {"interacting_agent": "Alcohol (chronic/heavy)", "severity": "Moderate", "effect": "Induces CYP2E1 enzymes, significantly increasing toxic NAPQI metabolite production."},
            {"interacting_agent": "Warfarin", "severity": "Moderate", "effect": "Prolonged regular high-dose paracetamol (>2g/day) may enhance anticoagulant effect and increase bleeding risk."}
        ],
        "food_related_considerations": "Can be taken with or without food. Taking with water on an empty stomach may result in slightly faster absorption.",
        "alcohol_precautions": "Avoid heavy or regular alcohol consumption while taking paracetamol due to compounded liver injury danger.",
        "storage_info": "Store at room temperature (15°C - 25°C), away from excessive heat, moisture, and direct light. Keep out of reach of children.",
        "general_administration_info": "Take orally with a full glass of water. Maintain at least 4 to 6 hours between doses. Do not exceed the maximum prescribed daily dose.",
        "missed_dose_safety": "Take the missed dose as soon as you remember. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. NEVER take two doses at the same time or double up.",
        "when_medical_help_sought": [
            "Suspected accidental overdose (seek immediate emergency care even if asymptomatic in the first 24 hours)",
            "Fever not reducing after 3 days of use",
            "New unexplained jaundice (yellowing of skin or eyes), dark urine, or severe right upper abdominal pain"
        ],
        "evidence_source": "WHO Essential Medicines List & British National Formulary (BNF)",
        "last_updated": "2026-02-10",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-002",
        "generic_name": "Metformin Hydrochloride",
        "common_brand_names": ["Glycomet", "Glucophage", "Obimet", "Riomet", "Fortamet"],
        "medication_class": "Biguanide Antidiabetic Agent",
        "common_medical_uses": [
            "First-line oral pharmacotherapy for Type 2 Diabetes Mellitus",
            "Management of Polycystic Ovary Syndrome (PCOS) under specialist guidance",
            "Prevention of diabetes progression in high-risk prediabetes"
        ],
        "general_mechanism": "Decreases hepatic glucose production (gluconeogenesis), decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.",
        "common_side_effects": [
            "Gastrointestinal upset (diarrhea, nausea, vomiting, flatulence, abdominal bloating)",
            "Metallic taste in mouth",
            "Decreased Vitamin B12 absorption with long-term use"
        ],
        "important_warnings": [
            "Lactic Acidosis (rare but serious metabolic complication with high mortality; risk elevated in renal impairment, hypoxia, sepsis)",
            "Must be temporarily withheld prior to and for 48 hours after iodinated radiocontrast procedures in patients with eGFR <60"
        ],
        "contraindications": [
            "Severe renal impairment (eGFR <30 mL/min/1.73m²)",
            "Acute or chronic metabolic acidosis (including diabetic ketoacidosis)",
            "Severe heart failure, shock, or acute severe hepatic failure"
        ],
        "important_interactions": [
            {"interacting_agent": "Excessive Alcohol", "severity": "Severe", "effect": "Potentiates metformin's effect on lactate metabolism, sharply elevating lactic acidosis risk."},
            {"interacting_agent": "Iodinated Radiocontrast", "severity": "Severe", "effect": "Contrast-induced nephropathy can cause acute metformin accumulation and lactic acidosis."}
        ],
        "food_related_considerations": "Must be taken with or immediately after meals to minimize gastrointestinal discomfort and diarrhea.",
        "alcohol_precautions": "Avoid excessive alcohol (acute binge or chronic) while taking metformin due to compounded lactic acidosis danger.",
        "storage_info": "Store at 20°C - 25°C in a dry place. Protect from light and moisture.",
        "general_administration_info": "Swallow extended-release tablets whole; do not crush, chew, or split them. Typically titrated gradually over several weeks to build GI tolerance.",
        "missed_dose_safety": "Take the missed dose with food as soon as remembered. If it is close to the next meal/dose, skip it. NEVER take a double dose to make up for a missed tablet.",
        "when_medical_help_sought": [
            "Symptoms of lactic acidosis: severe fatigue, muscle aches, difficulty breathing, unexplained stomach pain, feeling cold, dizziness",
            "Persistent severe diarrhea leading to dehydration",
            "Planned surgical procedures or CT scans requiring IV contrast"
        ],
        "evidence_source": "American Diabetes Association (ADA) Guidelines & FDA Prescribing Information",
        "last_updated": "2026-02-15",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-003",
        "generic_name": "Amlodipine Besylate",
        "common_brand_names": ["Norvasc", "Stamlo", "Amlong", "Amlopres", "Amvaz"],
        "medication_class": "Dihydropyridine Calcium Channel Blocker (CCB)",
        "common_medical_uses": [
            "Treatment of Essential Hypertension (monotherapy or combination)",
            "Chronic stable angina pectoris",
            "Vasospastic (Prinzmetal's) angina"
        ],
        "general_mechanism": "Inhibits transmembrane influx of extracellular calcium ions into vascular smooth muscle and cardiac muscle cells, causing peripheral arterial vasodilation and reduced systemic vascular resistance.",
        "common_side_effects": [
            "Peripheral edema (bilateral ankle/foot swelling due to precapillary vasodilation)",
            "Flushing and warmth sensation",
            "Dizziness and lightheadedness upon standing",
            "Headache, palpitations, fatigue"
        ],
        "important_warnings": [
            "Dose titration should be gradual in frail elderly or severe hepatic impairment",
            "Excessive vasodilation can cause symptomatic hypotension in volume-depleted patients"
        ],
        "contraindications": [
            "Severe hypotension (systolic BP <90 mmHg)",
            "Cardiogenic shock",
            "Severe aortic stenosis",
            "Hypersensitivity to dihydropyridines"
        ],
        "important_interactions": [
            {"interacting_agent": "Simvastatin", "severity": "Moderate", "effect": "Amlodipine increases simvastatin exposure; limit simvastatin dose to maximum 20 mg daily when combined."},
            {"interacting_agent": "CYP3A4 Inhibitors (Clarithromycin, Ketoconazole)", "severity": "Moderate", "effect": "Increases amlodipine plasma levels, elevating hypotension and edema risk."}
        ],
        "food_related_considerations": "Can be taken with or without food. Grapefruit juice may mildly increase amlodipine bioavailability, but generally less pronounced than with felodipine.",
        "alcohol_precautions": "Alcohol can accentuate the blood-pressure lowering effect, increasing risk of dizziness and fainting.",
        "storage_info": "Store at room temperature (15°C - 30°C) away from moisture and light.",
        "general_administration_info": "Take once daily at the same time each day (morning or evening as instructed by clinician).",
        "missed_dose_safety": "Take the missed dose as soon as remembered on the same day. If more than 12 hours have passed, skip the missed dose and resume normal schedule. DO NOT double up doses.",
        "when_medical_help_sought": [
            "Severe lightheadedness or syncope (fainting)",
            "Significant sudden worsening of shortness of breath",
            "Marked, painful, or progressive swelling of lower legs"
        ],
        "evidence_source": "WHO Guidelines for Pharmacological Treatment of Hypertension & FDA Label",
        "last_updated": "2026-01-22",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-004",
        "generic_name": "Atorvastatin Calcium",
        "common_brand_names": ["Lipitor", "Atorva", "Storvas", "Atocor", "Tonact"],
        "medication_class": "HMG-CoA Reductase Inhibitor (Statin)",
        "common_medical_uses": [
            "Primary and secondary prevention of atherosclerotic cardiovascular disease (ASCVD)",
            "Reduction of elevated LDL-cholesterol, Total Cholesterol, and Triglycerides in hypercholesterolemia",
            "Stabilization of vulnerable atherosclerotic plaques post-myocardial infarction"
        ],
        "general_mechanism": "Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, the rate-limiting enzyme in cholesterol biosynthesis, up-regulating hepatic LDL receptors and increasing LDL clearance.",
        "common_side_effects": [
            "Myalgia (mild muscle aches, stiffness, or weakness)",
            "Gastrointestinal symptoms (diarrhea, dyspepsia, constipation)",
            "Mild transient elevation in liver enzymes (ALT/AST)",
            "Mildly increased risk of elevated blood glucose / HbA1c"
        ],
        "important_warnings": [
            "Rhabdomyolysis (rare, severe muscle breakdown accompanied by dark brown tea-colored urine and acute kidney failure)",
            "Increased risk of myopathy when co-administered with strong CYP3A4 inhibitors, fibrates, or colchicine"
        ],
        "contraindications": [
            "Active liver disease or unexplained persistent elevation of serum transaminases (>3x upper limit of normal)",
            "Pregnancy and lactation (statins are strictly contraindicated in pregnancy due to fetal risk)",
            "Known hypersensitivity"
        ],
        "important_interactions": [
            {"interacting_agent": "Grapefruit Juice (large amounts)", "severity": "Moderate", "effect": "Inhibits intestinal CYP3A4, markedly increasing statin blood concentration and myopathy risk."},
            {"interacting_agent": "Clarithromycin / Erythromycin", "severity": "Severe", "effect": "Strong CYP3A4 inhibition causes high statin accumulation; suspend atorvastatin temporarily during antibiotic course."},
            {"interacting_agent": "Gemfibrozil", "severity": "Severe", "effect": "Inhibits statin glucuronidation, sharply raising rhabdomyolysis danger."}
        ],
        "food_related_considerations": "Can be taken with or without food. Avoid large amounts (>1 quart daily) of grapefruit juice.",
        "alcohol_precautions": "Moderate to high alcohol consumption should be avoided due to additive liver strain.",
        "storage_info": "Store at 20°C - 25°C away from moisture and light.",
        "general_administration_info": "Take once daily, at any time of day, but consistently at the same time. Many patients take it in the evening.",
        "missed_dose_safety": "If missed, take it as soon as remembered. If it has been more than 12 hours since your scheduled dose, skip it and take the next dose at regular time. NEVER take two doses together.",
        "when_medical_help_sought": [
            "Unexplained muscle pain, tenderness, or weakness, especially if accompanied by fever or dark, cola-colored urine",
            "Signs of liver injury: jaundice (yellow eyes/skin), severe right-sided abdominal pain, unusual fatigue, dark urine"
        ],
        "evidence_source": "ACC/AHA Cholesterol Guidelines & European Atherosclerosis Society (EAS)",
        "last_updated": "2026-02-04",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-005",
        "generic_name": "Pantoprazole Sodium",
        "common_brand_names": ["Pan 40", "Pantocid", "Protonix", "Pantodac", "Penta"],
        "medication_class": "Proton Pump Inhibitor (PPI)",
        "common_medical_uses": [
            "Treatment of Gastroesophageal Reflux Disease (GERD) and erosive esophagitis",
            "Healing and prevention of Gastric and Duodenal Ulcers",
            "Gastroprotection in patients taking long-term NSAIDs",
            "Component of H. pylori eradication therapy"
        ],
        "general_mechanism": "Irreversibly binds to and inhibits the H+/K+ ATPase enzyme system (proton pump) on the gastric parietal cell secretory surface, profoundly suppressing both basal and stimulated gastric acid secretion.",
        "common_side_effects": [
            "Headache",
            "Diarrhea or constipation",
            "Abdominal pain and flatulence",
            "Nausea"
        ],
        "important_warnings": [
            "Long-term use (>1 year) associated with hypomagnesemia, Vitamin B12 deficiency, and reduced bone mineral density (osteoporotic fracture risk)",
            "Increased susceptibility to enteric infections including Clostridioides difficile diarrhea",
            "Acute interstitial nephritis (rare idiosyncratic renal hypersensitivity)"
        ],
        "contraindications": [
            "Known hypersensitivity to pantoprazole or substituted benzimidazoles",
            "Concurrent use with rilpivirine-containing antiretroviral regimens"
        ],
        "important_interactions": [
            {"interacting_agent": "Methotrexate (high-dose)", "severity": "Severe", "effect": "PPIs may inhibit renal clearance of methotrexate, causing severe toxicity."},
            {"interacting_agent": "Clopidogrel", "severity": "Minor to Moderate", "effect": "Pantoprazole has minimal CYP2C19 inhibition compared to omeprazole, making it the preferred PPI with clopidogrel."},
            {"interacting_agent": "Iron and Vitamin B12 Supplements", "severity": "Moderate", "effect": "Gastric acid suppression reduces optimal absorption of non-heme iron and protein-bound B12."}
        ],
        "food_related_considerations": "Must be taken 30 to 60 minutes before a meal (typically before breakfast) because the proton pumps are most active during eating.",
        "alcohol_precautions": "Alcohol directly irritates the stomach lining and increases acid production, counteracting the therapeutic goal.",
        "storage_info": "Store at 20°C - 25°C. Protect from moisture.",
        "general_administration_info": "Swallow enteric-coated tablets whole with water. Do NOT split, crush, or chew tablets, as gastric acid will destroy the unprotected drug.",
        "missed_dose_safety": "Take the missed tablet 30 minutes before your next meal. If it is already time for the next day's dose, skip the missed one. DO NOT double dose.",
        "when_medical_help_sought": [
            "Severe, watery diarrhea that does not stop, accompanied by fever or abdominal pain (possible C. difficile)",
            "Joint pain accompanied by a red scaly rash on cheeks and arms (subacute cutaneous lupus erythematosus)",
            "Decreased urine output, blood in urine, or swelling (acute interstitial nephritis)"
        ],
        "evidence_source": "American Gastroenterological Association (AGA) Guidelines & BNF",
        "last_updated": "2026-01-28",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-006",
        "generic_name": "Salbutamol (Albuterol)",
        "common_brand_names": ["Asthalin", "Ventolin", "ProAir", "Aerolin", "Salamol"],
        "medication_class": "Short-Acting Beta2-Adrenergic Receptor Agonist (SABA)",
        "common_medical_uses": [
            "Rapid relief (rescue) of acute bronchospasm in Asthma, COPD, and bronchitis",
            "Prevention of exercise-induced bronchoconstriction"
        ],
        "general_mechanism": "Selectively stimulates beta2-adrenergic receptors on bronchial smooth muscle, activating adenylate cyclase, increasing intracellular cAMP, and causing rapid relaxation of airway smooth muscle.",
        "common_side_effects": [
            "Fine skeletal muscle tremor (especially hands)",
            "Tachycardia and palpitations",
            "Nervousness, anxiety, or restlessness",
            "Headache and throat irritation"
        ],
        "important_warnings": [
            "Over-reliance on SABA (>2 canisters/year or using >2 times/week) indicates poorly controlled asthma requiring inhaled corticosteroid (ICS) controller therapy",
            "Excessive doses can cause hypokalemia, cardiac arrhythmias, and paradoxical bronchospasm"
        ],
        "contraindications": [
            "Hypersensitivity to salbutamol",
            "Not for use in tocolysis (oral/inhalation forms)"
        ],
        "important_interactions": [
            {"interacting_agent": "Non-selective Beta-blockers (Propranolol, Carvedilol)", "severity": "Severe", "effect": "Antagonize the bronchodilator effect and can trigger catastrophic acute bronchospasm in asthma."},
            {"interacting_agent": "Loop or Thiazide Diuretics", "severity": "Moderate", "effect": "Concomitant use may potentiate hypokalemia (potassium depletion)."}
        ],
        "food_related_considerations": "Food has no significant impact on inhaled salbutamol. Use a spacer device for optimal pulmonary deposition.",
        "alcohol_precautions": "No direct pharmacokinetic interaction, but avoid smoke and alcohol-induced airway irritants.",
        "storage_info": "Store below 30°C. Do not freeze or expose pressurized canister to temperatures >50°C.",
        "general_administration_info": "Shake well before use. Exhale fully, place mouthpiece in mouth, press canister while inhaling deeply and slowly, and hold breath for 5-10 seconds. Wait 1 minute between puffs.",
        "missed_dose_safety": "Inhaled salbutamol is taken on an as-needed basis for acute symptoms or 15 mins before exercise. If on a scheduled regimen, take as soon as remembered; do not double inhalations.",
        "when_medical_help_sought": [
            "Rescue inhaler is not providing relief or relief lasts less than 3 hours",
            "Requiring more than 8 puffs in a 24-hour period",
            "Struggling to speak full sentences, chest retractions, or bluish fingernails/lips (EMERGENCY)"
        ],
        "evidence_source": "Global Initiative for Asthma (GINA) & British Thoracic Society (BTS)",
        "last_updated": "2026-02-14",
        "version": MEDICATION_KNOWLEDGE_VERSION
    },
    {
        "id": "MED-007",
        "generic_name": "Levothyroxine Sodium",
        "common_brand_names": ["Eltroxin", "Thyronorm", "Synthroid", "Levoxyl", "Euthyrox"],
        "medication_class": "Synthetic Thyroid Hormone (T4)",
        "common_medical_uses": [
            "Replacement therapy in primary, secondary, and tertiary hypothyroidism",
            "Pituitary TSH suppression in thyroid cancer management",
            "Euthyroid goiter management"
        ],
        "general_mechanism": "Converted in peripheral tissues to the active hormone Triiodothyronine (T3), which binds to nuclear thyroid receptors and regulates gene expression for metabolic homeostasis, growth, and development.",
        "common_side_effects": [
            "Generally none when properly titrated to euthyroid state",
            "Symptoms of iatrogenic hyperthyroidism if over-dosed: palpitations, weight loss, tremor, heat intolerance, insomnia, anxiety"
        ],
        "important_warnings": [
            "Narrow therapeutic index drug; requires precise individualized titration",
            "BLACK BOX WARNING: Not to be used for the treatment of obesity or weight loss",
            "Use extreme caution and low starting doses in elderly patients or those with coronary artery disease to prevent angina or arrhythmias"
        ],
        "contraindications": [
            "Uncorrected adrenal insufficiency (must replace cortisol before thyroid hormone to prevent addisonian crisis)",
            "Acute myocardial infarction / untreated thyrotoxicosis"
        ],
        "important_interactions": [
            {"interacting_agent": "Calcium & Iron Supplements", "severity": "Moderate", "effect": "Bind levothyroxine in the gut, severely decreasing absorption. Separate by at least 4 hours."},
            {"interacting_agent": "Proton Pump Inhibitors & Antacids", "severity": "Moderate", "effect": "Reduce gastric acidity required for dissolution; take levothyroxine first on empty stomach."},
            {"interacting_agent": "Warfarin", "severity": "Moderate", "effect": "Thyroid hormone enhances clotting factor catabolism, potentiating warfarin's anticoagulant effect."}
        ],
        "food_related_considerations": "STRICT RULE: Must be taken on an empty stomach with a full glass of water, 30 to 60 minutes before breakfast. Coffee, tea, soy, and high-fiber foods significantly impair absorption.",
        "alcohol_precautions": "No direct interaction, but alcohol can disrupt gastrointestinal motility and compliance.",
        "storage_info": "Store at 15°C - 30°C away from heat, light, and moisture. Do not store in warm, humid bathrooms.",
        "general_administration_info": "Take once daily in the morning immediately upon waking, with plain water only. Do not take with milk or juice.",
        "missed_dose_safety": "Take the missed dose as soon as remembered on that day, provided your stomach is empty. If it is already the next day, take that day's scheduled dose. NEVER take two full doses simultaneously without doctor instructions.",
        "when_medical_help_sought": [
            "Symptoms of over-replacement: racing heart, irregular pulse, chest pain, profuse sweating, extreme restlessness",
            "Women on levothyroxine who become pregnant (dose requirement typically increases by 20-30% in early pregnancy and requires prompt clinician review)"
        ],
        "evidence_source": "American Thyroid Association (ATA) & Endocrine Society Clinical Guidelines",
        "last_updated": "2026-02-18",
        "version": MEDICATION_KNOWLEDGE_VERSION
    }
]

def search_medication_knowledge(
    query: str = "",
    med_class: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Searches the verified medication database by generic name, brand, or class."""
    results = []
    q = query.lower().strip()

    for med in MEDICATION_DATABASE:
        if med_class and med_class.lower() != "all" and med_class.lower() not in med["medication_class"].lower():
            continue

        if not q:
            results.append(med)
            continue

        score = 0
        if q in med["generic_name"].lower():
            score += 10
        if any(q in b.lower() for b in med["common_brand_names"]):
            score += 8
        if q in med["medication_class"].lower():
            score += 5
        if any(q in u.lower() for u in med["common_medical_uses"]):
            score += 4

        if score > 0:
            results.append({**med, "_search_score": score})

    results.sort(key=lambda x: x.get("_search_score", 0), reverse=True)
    return results

def get_medication_by_id(med_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full medication record by ID."""
    for med in MEDICATION_DATABASE:
        if med["id"].lower() == med_id.lower():
            return med
    return None
