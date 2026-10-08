# ============================================================
# HealthTriage AI - Comprehensive Disease Knowledge Base (Module 1)
# Structured Medical Knowledge across 22 Clinical Categories
# Reliable Sources: WHO, MoHFW India, CDC, NHS, Harrison's Principles
# ============================================================

from typing import Dict, Any, List, Optional
from datetime import datetime

DISEASE_KNOWLEDGE_VERSION = "2026.1"
DISEASE_KNOWLEDGE_LAST_UPDATED = "2026-03-15"

# Structured Medical Condition Definitions
DISEASE_DATABASE: List[Dict[str, Any]] = [
    # 1. COMMON DISEASES
    {
        "id": "DIS-001",
        "condition_name": "Common Cold (Viral Upper Respiratory Tract Infection)",
        "category": "Common Diseases",
        "simple_explanation": "A mild viral infection of the nose, throat, and upper airways, typically self-limiting within 7 to 10 days.",
        "common_symptoms": ["Runny or stuffy nose", "Sore throat", "Sneezing", "Mild cough", "Low-grade fever", "Fatigue"],
        "less_common_symptoms": ["Mild headache", "Watery eyes", "Loss of taste or smell", "Mild muscle aches"],
        "warning_signs": ["Fever above 101.5°F (38.6°C) persisting >3 days", "Symptoms worsening after day 7", "Significant sinus pressure"],
        "emergency_warning_signs": ["Severe shortness of breath", "Stridor or wheezing", "Inability to swallow liquids", "Confusion"],
        "common_risk_factors": ["Exposure to infected individuals", "Crowded indoor settings", "Lack of sleep", "Weakened immunity"],
        "possible_causes": ["Rhinovirus (>50% cases)", "Coronavirus (non-SARS)", "Adenovirus", "Respiratory syncytial virus"],
        "related_conditions": ["Acute Sinusitis", "Allergic Rhinitis", "Streptococcal Pharyngitis", "Influenza"],
        "typical_investigations": ["Clinical examination", "Rapid antigen throat swab if strep suspected", "Chest X-ray if lower tract signs present"],
        "relevant_lab_markers": ["Usually normal CBC; mild elevated lymphocyte count occasionally"],
        "relevant_vital_signs": ["Temperature (mildly elevated)", "Respiratory rate (normal: 12-20)", "SpO2 (normal: ≥95%)"],
        "general_treatment_approaches": ["Supportive care", "Adequate hydration", "Rest", "Steam inhalation", "Saline nasal sprays"],
        "medication_classes_commonly_used": ["Analgesics/Antipyretics (Paracetamol)", "Decongestants (short-term)", "Antihistamines"],
        "general_lifestyle_measures": ["Warm fluids", "Humidified air", "Adequate rest", "Hand hygiene"],
        "prevention_measures": ["Regular hand washing with soap", "Avoiding touching face with unwashed hands", "Mask wearing in crowded areas"],
        "follow_up_considerations": ["Review if symptoms do not improve within 10 days or secondary bacterial infection signs appear"],
        "when_to_consult_doctor": ["Fever >3 days", "Severe ear pain", "Persistent productive cough", "Marked throat pain with exudates"],
        "when_emergency_required": ["Difficulty breathing", "Cyanosis (bluish lips)", "Chest tightness", "Severe lethargy"],
        "evidence_source": "WHO Clinical Guidelines & CDC Respiratory Infections Reference",
        "last_updated": "2026-01-10",
        "version": DISEASE_KNOWLEDGE_VERSION
    },
    {
        "id": "DIS-002",
        "condition_name": "Acute Gastroenteritis (Viral / Bacterial Stomach Flu)",
        "category": "Common Diseases",
        "simple_explanation": "Inflammation of the stomach and intestines causing acute watery diarrhea, nausea, vomiting, and abdominal cramps.",
        "common_symptoms": ["Watery diarrhea (≥3 loose stools/day)", "Nausea", "Vomiting", "Abdominal cramping", "Low-grade fever"],
        "less_common_symptoms": ["Headache", "Muscle aches", "Decreased appetite", "Dry mouth"],
        "warning_signs": ["Signs of moderate dehydration (sunken eyes, dry tongue, reduced urine output)", "High fever >102°F"],
        "emergency_warning_signs": ["Severe dehydration (lethargy, confusion, faintness)", "Bloody stools (dysentery)", "Intractable vomiting unable to keep fluids down"],
        "common_risk_factors": ["Contaminated food or water", "Poor hand hygiene", "Travel to endemic areas", "Daycare exposure"],
        "possible_causes": ["Rotavirus", "Norovirus", "E. coli", "Campylobacter", "Salmonella"],
        "related_conditions": ["Food Poisoning", "Irritable Bowel Syndrome", "Inflammatory Bowel Disease", "Cholera"],
        "typical_investigations": ["Clinical hydration assessment", "Stool microscopy & culture (if bloody or prolonged)", "Serum electrolytes & renal function"],
        "relevant_lab_markers": ["Stool occult blood", "Serum Creatinine / BUN (dehydration index)", "Serum Potassium & Sodium"],
        "relevant_vital_signs": ["Blood pressure (may drop in dehydration)", "Heart rate (tachycardia signs dehydration)", "Capillary refill time"],
        "general_treatment_approaches": ["Oral Rehydration Solution (ORS) priority", "Zinc supplementation (in children)", "Gradual reintroduction of bland diet"],
        "medication_classes_commonly_used": ["Oral Rehydration Salts (WHO formula)", "Antiemetics (clinician-prescribed if severe)", "Probiotics"],
        "general_lifestyle_measures": ["Frequent small sips of ORS", "BRAT diet (Banana, Rice, Applesauce, Toast)", "Strict hand washing"],
        "prevention_measures": ["Safe drinking water (boiled/filtered)", "Proper food hygiene", "Handwashing before meals"],
        "follow_up_considerations": ["Assess hydration status after 24 hours; monitor urine frequency and volume"],
        "when_to_consult_doctor": ["Diarrhea lasting >48 hours", "Inability to maintain oral hydration", "Persistent high fever"],
        "when_emergency_required": ["Anuria (no urine for >8 hours)", "Severe dizziness upon standing", "Blood in stool", "Altered mental status"],
        "evidence_source": "WHO Diarrhoeal Disease Guidelines & National Centre for Disease Control (NCDC)",
        "last_updated": "2026-02-01",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 2. CHRONIC DISEASES
    {
        "id": "DIS-003",
        "condition_name": "Type 2 Diabetes Mellitus",
        "category": "Chronic Diseases",
        "simple_explanation": "A metabolic disorder characterized by chronic hyperglycemia resulting from progressive insulin resistance and inadequate compensatory insulin secretion.",
        "common_symptoms": ["Increased thirst (polydipsia)", "Frequent urination (polyuria)", "Increased hunger (polyphagia)", "Unexplained weight loss", "Fatigue"],
        "less_common_symptoms": ["Blurred vision", "Slow-healing sores or cuts", "Frequent fungal or skin infections", "Tingling or numbness in feet (neuropathy)"],
        "warning_signs": ["Persistent fasting blood glucose >200 mg/dL", "Non-healing foot ulcer", "Recurrent urinary tract infections"],
        "emergency_warning_signs": ["Hyperosmolar Hyperglycemic State (HHS): Blood sugar >600 mg/dL, severe dehydration, confusion, coma", "Diabetic Ketoacidosis (DKA): Fruity breath, Kussmaul breathing, severe abdominal pain"],
        "common_risk_factors": ["Overweight/Obesity (BMI ≥23 in South Asians)", "Physical inactivity", "First-degree family history", "Age ≥35", "History of gestational diabetes"],
        "possible_causes": ["Genetic susceptibility coupled with sedentary lifestyle, visceral adiposity, and progressive beta-cell dysfunction"],
        "related_conditions": ["Metabolic Syndrome", "Hypertension", "Dyslipidemia", "Non-Alcoholic Fatty Liver Disease", "Cardiovascular Disease"],
        "typical_investigations": ["Fasting Plasma Glucose (FPG)", "Glycated Hemoglobin (HbA1c)", "Oral Glucose Tolerance Test (OGTT)", "Lipid Profile", "Urine Albumin-to-Creatinine Ratio (UACR)"],
        "relevant_lab_markers": ["HbA1c (Diagnostic ≥6.5%)", "Fasting Glucose (Diagnostic ≥126 mg/dL)", "eGFR / Serum Creatinine", "Serum Microalbumin"],
        "relevant_vital_signs": ["Blood pressure (target <130/80 mmHg)", "Body Weight & BMI", "Waist circumference"],
        "general_treatment_approaches": ["Medical nutrition therapy", "Structured aerobic & resistance exercise", "Self-monitoring of blood glucose (SMBG)", "Comprehensive cardiovascular risk reduction"],
        "medication_classes_commonly_used": ["Biguanides (Metformin)", "SGLT2 Inhibitors", "DPP-4 Inhibitors", "GLP-1 Receptor Agonists", "Sulfonylureas", "Insulin therapies"],
        "general_lifestyle_measures": ["Low glycemic-index balanced diet", "150 mins/week moderate exercise", "Daily foot inspection", "Smoking cessation"],
        "prevention_measures": ["5-7% weight reduction in prediabetes", "30 mins daily walking", "Screening annually for individuals at risk"],
        "follow_up_considerations": ["HbA1c testing every 3 months until stable, then every 6 months; annual dilated eye exam, podiatric exam, and urine microalbumin"],
        "when_to_consult_doctor": ["Fasting blood glucose consistently >140 mg/dL", "Frequent hypoglycemic episodes (<70 mg/dL)", "Numbness or burning in extremities"],
        "when_emergency_required": ["Blood glucose >400 mg/dL with confusion or vomiting", "Blood glucose <55 mg/dL unresponsive to oral glucose", "Severe shortness of breath"],
        "evidence_source": "American Diabetes Association (ADA) Standards of Care 2026 & ICMR Guidelines for Diabetes in India",
        "last_updated": "2026-02-15",
        "version": DISEASE_KNOWLEDGE_VERSION
    },
    {
        "id": "DIS-004",
        "condition_name": "Essential (Primary) Hypertension",
        "category": "Chronic Diseases",
        "simple_explanation": "Persistent systemic arterial blood pressure elevation (systolic ≥140 mmHg and/or diastolic ≥90 mmHg) without an identifiable secondary cause.",
        "common_symptoms": ["Often asymptomatic ('Silent Killer')", "Mild morning occipital headache", "Dizziness", "Facial flushing"],
        "less_common_symptoms": ["Epistaxis (nosebleeds)", "Tinnitus (ringing in ears)", "Palpitations", "Visual blurriness"],
        "warning_signs": ["Systolic BP 160-179 mmHg or Diastolic BP 100-109 mmHg on repeated checks", "Suboccipital throbbing headache"],
        "emergency_warning_signs": ["Hypertensive Emergency (BP >180/120 mmHg WITH acute organ damage: severe chest pain, shortness of breath, acute neurological deficits, papilledema)"],
        "common_risk_factors": ["High sodium diet (>5g salt/day)", "Physical inactivity", "Excessive alcohol consumption", "Obesity", "Family history", "Chronic psychological stress"],
        "possible_causes": ["Multifactorial: increased sympathetic tone, renin-angiotensin-aldosterone axis hyperactivation, vascular remodeling, renal sodium retention"],
        "related_conditions": ["Coronary Artery Disease", "Stroke / Transient Ischemic Attack", "Chronic Kidney Disease", "Heart Failure"],
        "typical_investigations": ["Automated office BP measurement (AOBP)", "24-hour Ambulatory BP Monitoring (ABPM)", "12-lead ECG", "Serum Electrolytes & Creatinine", "Urinalysis for proteinuria"],
        "relevant_lab_markers": ["Serum Creatinine & eGFR", "Serum Sodium & Potassium", "Fasting Lipid Profile", "Urine Albumin/Creatinine ratio"],
        "relevant_vital_signs": ["Systolic Blood Pressure", "Diastolic Blood Pressure", "Pulse Pressure", "Heart Rate"],
        "general_treatment_approaches": ["DASH diet (Dietary Approaches to Stop Hypertension)", "Sodium restriction (<2g sodium / <5g salt per day)", "Weight optimization", "Regular aerobic exercise"],
        "medication_classes_commonly_used": ["Angiotensin Receptor Blockers (ARBs: Telmisartan, Losartan)", "ACE Inhibitors (Lisinopril, Enalapril)", "Calcium Channel Blockers (Amlodipine)", "Thiazide-like Diuretics (Chlorthalidone)"],
        "general_lifestyle_measures": ["DASH dietary pattern rich in fruits, vegetables, and potassium", "Limiting alcohol", "Regular home BP monitoring log"],
        "prevention_measures": ["Maintaining healthy body mass index (18.5-22.9 kg/m² for Asian populations)", "Stress reduction", "Limiting processed salty foods"],
        "follow_up_considerations": ["Monthly BP evaluation until target (<130/80 mmHg) reached; check serum creatinine and electrolytes within 2-4 weeks of starting ACEi/ARB/diuretic"],
        "when_to_consult_doctor": ["BP readings repeatedly above 140/90 mmHg at home", "Persistent headaches", "New ankle swelling from medication"],
        "when_emergency_required": ["BP >180/120 mmHg accompanied by chest pain, severe breathlessness, numbness, weakness, or seizures"],
        "evidence_source": "WHO Hypertension Guidelines & Indian Guidelines on Hypertension (I-GH-IV)",
        "last_updated": "2026-01-20",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 3. INFECTIOUS DISEASES
    {
        "id": "DIS-005",
        "condition_name": "Dengue Fever",
        "category": "Infectious Diseases",
        "simple_explanation": "A mosquito-borne tropical viral disease transmitted by Aedes mosquitoes, causing sudden high fever, severe retro-orbital pain, and body aches ('breakbone fever').",
        "common_symptoms": ["Sudden high fever (104°F / 40°C)", "Severe headache & retro-orbital (behind eyes) pain", "Severe joint and muscle pain ('breakbone')", "Nausea & vomiting", "Maculopapular rash (days 3-5)"],
        "less_common_symptoms": ["Mild mucosal bleeding (epistaxis, bleeding gums)", "Flushed skin", "Enlarged lymph nodes"],
        "warning_signs": ["Severe abdominal pain or tenderness", "Persistent vomiting (≥3 times/24h)", "Mucosal bleed", "Lethargy/restlessness", "Fluid accumulation (ascites, pleural effusion)", "Rapid platelet drop with rising hematocrit"],
        "emergency_warning_signs": ["Severe Dengue / Dengue Shock Syndrome: Profound plasma leakage, cold clammy extremities, weak rapid pulse, severe bleeding, organ impairment"],
        "common_risk_factors": ["Residence or travel in tropical/subtropical regions", "Stagnant clean water storage near home", "Peak daytime mosquito biting activity (dawn and dusk)"],
        "possible_causes": ["Dengue Virus (DENV 1, 2, 3, 4 Flavivirus) transmitted by Aedes aegypti or Aedes albopictus"],
        "related_conditions": ["Chikungunya", "Malaria", "Zika Virus", "Typhoid Fever", "Leptospirosis"],
        "typical_investigations": ["Dengue NS1 Antigen (Days 1-5)", "Dengue IgM/IgG antibody (Day 5 onwards)", "Complete Blood Count (CBC) with serial Platelet count & Hematocrit"],
        "relevant_lab_markers": ["Platelet Count (<100,000/µL indicates thrombocytopenia; <20,000/µL high risk)", "Hematocrit (rising >20% indicates hemoconcentration/plasma leak)", "Leukopenia"],
        "relevant_vital_signs": ["Temperature", "Pulse pressure (narrowing <20 mmHg indicates shock)", "Blood pressure", "Heart rate"],
        "general_treatment_approaches": ["Supportive fluid management (oral rehydration or IV crystalloids based on hematocrit)", "Strict bed rest", "Fever control with Paracetamol ONLY", "AVOID NSAIDs (Ibuprofen, Aspirin) due to severe bleeding risks"],
        "medication_classes_commonly_used": ["Antipyretic: Paracetamol (Acetaminophen) exclusively", "WHO Oral Rehydration Salts", "NO antibiotics, NO NSAIDs, NO steroids"],
        "general_lifestyle_measures": ["Strict bed rest", "Drink at least 2-3 liters of fluids (ORS, coconut water, fresh fruit juices)", "Mosquito netting to prevent secondary transmission"],
        "prevention_measures": ["Eliminating domestic water containers (plant saucers, coolers, tyres)", "Mosquito repellent application", "Wearing protective full-sleeve clothing"],
        "follow_up_considerations": ["Daily CBC monitoring during the critical phase (days 3 to 7 when fever breaks, as shock occurs during defervescence)"],
        "when_to_consult_doctor": ["Fever with severe joint and retro-orbital pain in a dengue-prevalent area", "Platelet count dropping below 100,000"],
        "when_emergency_required": ["Persistent vomiting, severe abdominal pain, bleeding from gums/urine/stool, black tarry stools, sudden cold sweaty limbs"],
        "evidence_source": "WHO Comprehensive Dengue Guidelines & National Vector Borne Disease Control Programme (NVBDCP)",
        "last_updated": "2026-02-10",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 4. RESPIRATORY CONDITIONS
    {
        "id": "DIS-006",
        "condition_name": "Bronchial Asthma (Acute Exacerbation / Chronic)",
        "category": "Respiratory Conditions",
        "simple_explanation": "A chronic inflammatory disorder of the airways causing bronchial hyperresponsiveness, reversible airflow obstruction, and episodes of wheezing and breathlessness.",
        "common_symptoms": ["Expiratory wheezing", "Shortness of breath", "Chest tightness", "Dry or productive cough (worse at night or early morning)"],
        "less_common_symptoms": ["Nocturnal waking with cough", "Exercise-induced breathlessness", "Throat clearing", "Tachypnea"],
        "warning_signs": ["Need for quick-relief inhaler >2 times per week", "Peak expiratory flow (PEF) 50-79% of personal best", "Difficulty speaking full sentences in one breath"],
        "emergency_warning_signs": ["Silent chest (no breath sounds audible due to severe airflow obstruction)", "Cyanosis", "Accessory muscle use (suprasternal retractions)", "SpO2 <90%", "Confusion, drowsiness, exhaustion"],
        "common_risk_factors": ["Atopy / allergic rhinitis / eczema", "Family history of asthma", "Exposure to environmental tobacco smoke", "Air pollution, particulate matter PM2.5", "Occupational chemical vapors"],
        "possible_causes": ["Complex genetic and environmental interactions triggering chronic airway eosinophilic/neutrophilic inflammation"],
        "related_conditions": ["Chronic Obstructive Pulmonary Disease (COPD)", "Allergic Rhinitis", "Gastroesophageal Reflux Disease (GERD)", "Vocal Cord Dysfunction"],
        "typical_investigations": ["Spirometry with bronchodilator reversibility testing", "Peak Expiratory Flow Rate (PEFR)", "Pulse Oximetry", "Chest X-ray (to rule out pneumothorax or infection during exacerbations)"],
        "relevant_lab_markers": ["Absolute Eosinophil Count (AEC)", "Serum total IgE", "Fractional exhaled nitric oxide (FeNO)"],
        "relevant_vital_signs": ["Oxygen Saturation (SpO2)", "Respiratory Rate", "Heart Rate (tachycardia in acute attack)"],
        "general_treatment_approaches": ["Stepwise pharmacotherapy according to GINA guidelines", "Environmental trigger avoidance", "Written Asthma Action Plan", "Correct inhaler technique education"],
        "medication_classes_commonly_used": ["Inhaled Corticosteroids (ICS: Budesonide, Fluticasone)", "Long-Acting Beta2-Agonists (LABA: Formoterol, Salmeterol)", "Short-Acting Beta2-Agonists (SABA: Salbutamol/Albuterol)", "Leukotriene Receptor Antagonists (Montelukast)"],
        "general_lifestyle_measures": ["Use of spacer devices with metered-dose inhalers", "Avoiding known triggers (dust mites, pet dander, cold air, smoke)", "Rinsing mouth after steroid inhalers to prevent oral candidiasis"],
        "prevention_measures": ["Consistent adherence to daily maintenance inhaler even when asymptomatic", "Annual influenza and pneumococcal vaccination"],
        "follow_up_considerations": ["Review asthma control 1-3 months after starting treatment, then every 3-12 months; check inhaler technique at every visit"],
        "when_to_consult_doctor": ["Using rescue inhaler more than twice a week", "Waking up at night coughing or wheezing", "Asthma symptoms interfering with work or exercise"],
        "when_emergency_required": ["Severe breathlessness unresponsive to 4-6 puffs of rescue inhaler, struggling to speak, bluish nails/lips, SpO2 <90%"],
        "evidence_source": "Global Initiative for Asthma (GINA 2025/2026 Guidelines) & Ministry of Health and Family Welfare (MoHFW)",
        "last_updated": "2026-01-25",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 5. CARDIOVASCULAR CONDITIONS
    {
        "id": "DIS-007",
        "condition_name": "Acute Coronary Syndrome (Myocardial Infarction / Angina)",
        "category": "Cardiovascular Conditions",
        "simple_explanation": "A spectrum of life-threatening conditions involving sudden reduced blood flow to the heart muscle, usually caused by rupture of an atherosclerotic plaque in coronary arteries.",
        "common_symptoms": ["Retrosternal chest pressure, heaviness, squeezing, or crushing pain", "Radiation of pain to left arm, neck, jaw, shoulder, or epigastrium", "Shortness of breath", "Diaphoresis (cold profuse sweating)", "Nausea or lightheadedness"],
        "less_common_symptoms": ["Atypical presentation: isolated jaw or tooth pain, epigastric heartburn-like burning, unexplained fatigue, silent ischemia in elderly or diabetic females"],
        "warning_signs": ["Chest discomfort provoked by exertion and relieved by rest (stable angina warning of impending progression)"],
        "emergency_warning_signs": ["CRITICAL EMERGENCY: Persistent crushing chest pain >10 minutes, pain at rest, hypotension, fainting, severe dyspnea, gray pallor"],
        "common_risk_factors": ["Tobacco smoking / chewing", "Diabetes mellitus", "Dyslipidemia (high LDL)", "Hypertension", "Premature CAD family history", "Chronic stress", "Obesity"],
        "possible_causes": ["Coronary atherothrombosis", "Coronary artery spasm", "Coronary embolism", "Spontaneous coronary artery dissection (SCAD)"],
        "related_conditions": ["Gastroesophageal Reflux (GERD)", "Musculoskeletal Costochondritis", "Acute Pulmonary Embolism", "Aortic Dissection", "Panic Attack"],
        "typical_investigations": ["Emergency 12-lead ECG (within 10 minutes of arrival)", "Serial high-sensitivity Cardiac Troponin (hs-cTnI / hs-cTnT)", "Echocardiography", "Coronary Angiography"],
        "relevant_lab_markers": ["High-sensitivity Cardiac Troponin I / T", "CK-MB", "Lipid Profile", "Fasting Glucose / HbA1c", "Serum Creatinine"],
        "relevant_vital_signs": ["Blood pressure", "Heart rate & rhythm", "Oxygen saturation (SpO2)", "Respiratory rate"],
        "general_treatment_approaches": ["Immediate emergency medical care / Cath Lab primary percutaneous coronary intervention (PCI)", "Dual antiplatelet therapy", "Anticoagulation", "Revascularization", "Long-term secondary prevention"],
        "medication_classes_commonly_used": ["Antiplatelets (Aspirin, Clopidogrel, Ticagrelor)", "Statins (High-intensity Atorvastatin/Rosuvastatin)", "Beta-blockers (Metoprolol)", "ACE Inhibitors/ARBs", "Sublingual Nitroglycerin"],
        "general_lifestyle_measures": ["Strict cardiac rehabilitation", "Heart-healthy Mediterranean/DASH diet", "Absolute smoking cessation", "Gradual supervised physical activity"],
        "prevention_measures": ["Aggressive control of blood pressure, blood glucose, and LDL cholesterol (<55 mg/dL in high risk)", "Regular exercise", "Daily low-dose aspirin only when prescribed"],
        "follow_up_considerations": ["Cardiologist follow-up at 1, 3, and 6 months post-event; regular echocardiogram; adherence tracking for dual antiplatelets"],
        "when_to_consult_doctor": ["Any new or changing pattern of chest tightness, breathlessness on minor walking, or unexplained exertion fatigue"],
        "when_emergency_required": ["IMMEDIATE 112/108 CALL: Squeezing chest pressure lasting more than 5 minutes, pain radiating to arm/jaw, accompanied by sweating and breathlessness"],
        "evidence_source": "European Society of Cardiology (ESC) & American College of Cardiology (ACC/AHA) Guidelines",
        "last_updated": "2026-02-18",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 6. GASTROINTESTINAL CONDITIONS
    {
        "id": "DIS-008",
        "condition_name": "Gastroesophageal Reflux Disease (GERD)",
        "category": "Gastrointestinal Conditions",
        "simple_explanation": "A digestive condition where stomach acid frequently flows back into the esophagus, irritating the esophageal lining and causing heartburn and regurgitation.",
        "common_symptoms": ["Retrosternal heartburn (burning sensation behind breastbone, often after eating or lying down)", "Acid regurgitation / sour taste in mouth", "Epigastric discomfort"],
        "less_common_symptoms": ["Dysphagia (difficulty swallowing)", "Chronic dry cough (worse at night)", "Hoarseness / laryngitis", "Globus sensation (feeling of lump in throat)", "Dental enamel erosion"],
        "warning_signs": ["Painful swallowing (odynophagia)", "Unintentional weight loss", "Vomiting blood or dark coffee-ground emesis", "Black tarry stools"],
        "emergency_warning_signs": ["Severe chest pain that must first be differentiated from acute cardiac ischemia", "Choking episodes with stridor", "Persistent hematemesis"],
        "common_risk_factors": ["Obesity / increased abdominal pressure", "Hiatal hernia", "Pregnancy", "Smoking", "Heavy late-night meals", "Fatty, spicy, or fried foods", "Caffeine, chocolate, alcohol"],
        "possible_causes": ["Transient lower esophageal sphincter (LES) relaxations", "Hypotensive LES", "Impaired esophageal clearance", "Delayed gastric emptying"],
        "related_conditions": ["Peptic Ulcer Disease", "Esophageal Dysmotility", "Barrett's Esophagus", "Coronary Artery Disease"],
        "typical_investigations": ["Clinical evaluation / trial of PPI", "Upper GI Endoscopy (EGD) if red flags or age >45-50", "24-hour ambulatory esophageal pH-impedance monitoring", "Esophageal manometry"],
        "relevant_lab_markers": ["Complete Blood Count (for iron deficiency anemia from chronic occult bleeding)", "H. pylori testing (stool antigen or urea breath test)"],
        "relevant_vital_signs": ["Body Mass Index (BMI)", "Blood Pressure"],
        "general_treatment_approaches": ["Dietary & lifestyle modification first-line", "Acid suppression pharmacotherapy", "Weight loss", "Anti-reflux endoscopic or surgical procedures (Nissen fundoplication) in refractory cases"],
        "medication_classes_commonly_used": ["Proton Pump Inhibitors (PPIs: Pantoprazole, Omeprazole, Rabeprazole)", "H2 Receptor Antagonists (Famotidine)", "Antacids / Alginates (for rapid breakthrough relief)"],
        "general_lifestyle_measures": ["Elevating head of bed 6-8 inches", "Avoiding lying down for at least 3 hours after meals", "Smaller, more frequent meals", "Avoiding tight abdominal garments"],
        "prevention_measures": ["Weight reduction", "Avoiding trigger foods (mint, chocolate, raw onions, excess caffeine, alcohol)", "Smoking cessation"],
        "follow_up_considerations": ["Re-evaluate after 4-8 weeks of empirical PPI therapy; taper to lowest effective dose to minimize long-term PPI risks (calcium/B12 malabsorption)"],
        "when_to_consult_doctor": ["Heartburn occurring more than twice a week", "Over-the-counter antacids no longer providing relief", "Symptoms waking you up repeatedly at night"],
        "when_emergency_required": ["Difficulty or pain when swallowing food, vomiting blood, black stools, or severe crushing chest pain radiating to arm/jaw"],
        "evidence_source": "American College of Gastroenterology (ACG) & Indian Society of Gastroenterology (ISG)",
        "last_updated": "2026-01-18",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 7. NEUROLOGICAL CONDITIONS
    {
        "id": "DIS-009",
        "condition_name": "Migraine Headache (with or without Aura)",
        "category": "Neurological Conditions",
        "simple_explanation": "A neurovascular primary headache disorder characterized by recurrent, pulsating, unilateral moderate-to-severe headache attacks, often accompanied by sensory sensitivity.",
        "common_symptoms": ["Unilateral throbbing or pulsating headache", "Moderate to severe pain intensity aggravated by physical activity", "Photophobia (light sensitivity)", "Phonophobia (sound sensitivity)", "Nausea and vomiting"],
        "less_common_symptoms": ["Sensory aura (scintillating scotoma, zigzag lines, tingling in fingers/face)", "Osmophobia (smell sensitivity)", "Allodynia (scalp tenderness)", "Postdrome fatigue ('migraine hangover')"],
        "warning_signs": ["Headache frequency increasing to >15 days/month (chronic migraine)", "Medication overuse headache from frequent analgesics"],
        "emergency_warning_signs": ["'Thunderclap' headache reaching maximum intensity within 1 minute (rule out subarachnoid hemorrhage)", "Headache with fever and neck stiffness (meningitis)", "Headache with focal neurological weakness or speech arrest (stroke)"],
        "common_risk_factors": ["Female sex (3:1 ratio)", "Family history of migraine", "Hormonal fluctuations (menstrual cycle)", "Irregular sleep patterns", "Skipped meals", "Sensory overload"],
        "possible_causes": ["Trigeminovascular system activation, cortical spreading depression, release of neuroinflammatory peptides including CGRP"],
        "related_conditions": ["Tension-Type Headache", "Cluster Headache", "Sinus Headache (frequently misdiagnosed migraine)", "Temporomandibular Joint Disorder"],
        "typical_investigations": ["Clinical diagnosis using ICHD-3 criteria", "Brain MRI/CT indicated only if 'SNOOP' red flags present (systemic symptoms, neurological signs, sudden onset, older age of onset, pattern change)"],
        "relevant_lab_markers": ["ESR / CRP (to exclude temporal arteritis in age >50)", "Routine labs usually normal"],
        "relevant_vital_signs": ["Blood pressure", "Neurological examination (must be normal between and during uncomplicated attacks)"],
        "general_treatment_approaches": ["Acute abortive therapy taken early in the attack", "Preventive prophylaxis if ≥4 headache days/month or severe disability", "Trigger identification via headache diary", "Non-pharmacological relaxation techniques"],
        "medication_classes_commonly_used": ["Acute: Triptans (Sumatriptan, Rizatriptan), NSAIDs, CGRP antagonists (Gepants)", "Preventive: Beta-blockers (Propranolol), Anticonvulsants (Topiramate), CGRP monoclonal antibodies, Amitriptyline"],
        "general_lifestyle_measures": ["Resting in a dark, quiet room during attacks", "Cold compress on forehead or temples", "Maintaining consistent sleep and meal schedules", "Adequate daily hydration"],
        "prevention_measures": ["Identifying and avoiding dietary triggers (aged cheese, MSG, artificial sweeteners, nitrates)", "Limiting caffeine overuse and avoiding analgesic overuse (>10-15 days/month)"],
        "follow_up_considerations": ["Review headache diary after 2-3 months of preventive medication; check for analgesic overuse headache"],
        "when_to_consult_doctor": ["Headaches occurring more than 3-4 times a month", "Attacks causing missing work/school", "Abortive medicines losing effectiveness"],
        "when_emergency_required": ["Sudden explosive severe headache unlike any previous, headache with high fever, stiff neck, confusion, seizure, or arm/leg weakness"],
        "evidence_source": "International Headache Society (ICHD-3) & American Headache Society Guidelines",
        "last_updated": "2026-02-05",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 8. ENDOCRINE & METABOLIC CONDITIONS
    {
        "id": "DIS-010",
        "condition_name": "Hypothyroidism (Primary Thyroid Deficiency)",
        "category": "Endocrine and Metabolic Conditions",
        "simple_explanation": "A common endocrine condition where the thyroid gland produces insufficient thyroid hormones (T3 and T4), slowing down the body's metabolic processes.",
        "common_symptoms": ["Unexplained fatigue and lethargy", "Increased sensitivity to cold", "Unexplained weight gain despite normal diet", "Constipation", "Dry skin and brittle nails", "Puffy face"],
        "less_common_symptoms": ["Hoarseness of voice", "Muscle weakness and aches", "Heavy or irregular menstrual periods", "Thinning hair / loss of outer third of eyebrows", "Depression or memory impairment", "Slow heart rate (bradycardia)"],
        "warning_signs": ["Marked bradycardia (<50 bpm)", "Significant cognitive slowing", "Goiter (visible thyroid enlargement in neck)"],
        "emergency_warning_signs": ["Myxedema Coma (medical emergency): Severe hypothermia, altered mental status, hypoventilation, bradycardia, hypotension"],
        "common_risk_factors": ["Female sex (5-8 times more common)", "Family history of autoimmune thyroid disease", "Personal history of other autoimmune disorders (Type 1 Diabetes, Vitiligo, Celiac)", "Postpartum period", "History of neck radiation or thyroid surgery"],
        "possible_causes": ["Hashimoto's Thyroiditis (autoimmune destruction)", "Iodine deficiency (endemic areas) or excess", "Iatrogenic (radioactive iodine, thyroidectomy)", "Drug-induced (Lithium, Amiodarone)"],
        "related_conditions": ["Hashimoto's Thyroiditis", "Dyslipidemia (elevated LDL due to slowed clearance)", "Carpal Tunnel Syndrome", "Depression", "Subclinical Hypothyroidism"],
        "typical_investigations": ["Serum Thyroid Stimulating Hormone (TSH)", "Free Thyroxine (Free T4)", "Anti-Thyroid Peroxidase (Anti-TPO) antibodies", "Thyroid Ultrasound (if nodule or goiter present)"],
        "relevant_lab_markers": ["TSH (Elevated >4.5 - 5.0 mIU/L in primary hypothyroidism)", "Free T4 (Low in overt, normal in subclinical)", "Anti-TPO Antibodies (positive in Hashimoto's)", "Serum Total Cholesterol / LDL (often elevated)"],
        "relevant_vital_signs": ["Heart rate (bradycardia)", "Body Weight & BMI", "Blood pressure (mild diastolic hypertension)"],
        "general_treatment_approaches": ["Hormone replacement monotherapy with synthetic Levothyroxine (T4)", "Dose titration based on serum TSH target (0.5-2.5 or 0.5-4.0 mIU/L depending on age)", "Lifelong adherence and routine periodic monitoring"],
        "medication_classes_commonly_used": ["Synthetic Thyroid Hormone: Levothyroxine Sodium (taken strictly on an empty stomach 30-60 min before breakfast with water)"],
        "general_lifestyle_measures": ["Taking Levothyroxine strictly fasted, separated by ≥4 hours from calcium, iron, or antacid supplements", "Balanced diet with adequate dietary iodine", "Regular moderate exercise to combat fatigue and weight gain"],
        "prevention_measures": ["Universal salt iodization", "Periodic TSH screening in high-risk individuals (women >50, pregnancy planning, postpartum)"],
        "follow_up_considerations": ["Repeat TSH 6 to 8 weeks after starting Levothyroxine or changing dose; once stabilized, monitor TSH every 6 to 12 months"],
        "when_to_consult_doctor": ["Persistent unexplained fatigue, cold intolerance, weight gain, or swelling in neck; women planning pregnancy with abnormal TSH"],
        "when_emergency_required": ["Extreme lethargy, profound confusion, hypothermia (body temp <95°F / 35°C), shallow slow breathing"],
        "evidence_source": "American Thyroid Association (ATA) & Indian Thyroid Society (ITS) Guidelines",
        "last_updated": "2026-02-12",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 9. KIDNEY & URINARY CONDITIONS
    {
        "id": "DIS-011",
        "condition_name": "Urinary Tract Infection (Acute Cystitis / Pyelonephritis)",
        "category": "Kidney and Urinary Conditions",
        "simple_explanation": "An infection of the urinary system (bladder or kidneys) most commonly caused by uropathogenic bacteria entering through the urethra.",
        "common_symptoms": ["Dysuria (painful, burning sensation during urination)", "Urinary urgency (sudden compelling urge to void)", "Urinary frequency (voiding small amounts often)", "Suprapubic lower abdominal discomfort", "Cloudy or foul-smelling urine"],
        "less_common_symptoms": ["Hematuria (pink, red, or cola-colored urine)", "Pelvic pressure", "Low-grade fever"],
        "warning_signs": ["Fever >100.4°F (38°C)", "Flank or lower back pain (unilateral or bilateral)", "Nausea and vomiting (indicating upper UTI / Pyelonephritis)"],
        "emergency_warning_signs": ["Urosepsis: High fever, shaking chills (rigors), tachycardia, hypotension, confusion, flank tenderness"],
        "common_risk_factors": ["Female anatomy (shorter urethra)", "Sexual activity", "Use of diaphragms/spermicides", "Urinary catheterization", "Diabetes mellitus", "Enlarged prostate (BPH) or urinary obstruction in males", "Postmenopausal estrogen deficiency"],
        "possible_causes": ["Uropathogenic Escherichia coli (UPEC, ~80% of cases)", "Klebsiella pneumoniae", "Staphylococcus saprophyticus", "Proteus mirabilis", "Enterococcus faecalis"],
        "related_conditions": ["Acute Pyelonephritis", "Interstitual Cystitis", "Urethritis (STI-related)", "Nephrolithiasis (Kidney Stone)", "Prostatitis"],
        "typical_investigations": ["Urinalysis (dipstick / microscopy)", "Urine Culture & Sensitivity (clean-catch midstream)", "Renal Ultrasound (if pyelonephritis, recurrent UTI, or male UTI)"],
        "relevant_lab_markers": ["Urine Leukocyte Esterase & Nitrite (positive on dipstick)", "Urine WBC count (>5-10 WBC/HPF)", "Urine Culture (≥10⁵ CFU/mL significant)", "Serum Creatinine / CBC with differential in pyelonephritis"],
        "relevant_vital_signs": ["Body Temperature", "Blood Pressure (monitor for sepsis hypotension)", "Heart Rate"],
        "general_treatment_approaches": ["Targeted antibiotic therapy according to local antibiogram and culture results", "Adequate fluid hydration", "Urinary analgesia (short-term) for severe dysuria", "Correction of predisposing anatomical factors"],
        "medication_classes_commonly_used": ["Antibiotics (Nitrofurantoin, Fosfomycin, Trimethoprim-Sulfamethoxazole, Ciprofloxacin if pyelonephritis)", "Urinary analgesic (Phenazopyridine, short-term)"],
        "general_lifestyle_measures": ["Drinking plenty of water (2-3 liters/day) to flush urinary tract", "Wiping from front to back after bowel movements", "Urinating promptly after sexual intercourse", "Avoiding harsh feminine hygiene sprays or douches"],
        "prevention_measures": ["Adequate daily hydration", "Never delaying urination when the urge arises", "Cranberry extract may help reduce recurrence in some women", "Topical vaginal estrogen in postmenopausal women with recurrent UTIs"],
        "follow_up_considerations": ["Symptoms should improve within 48-72 hours of appropriate antibiotic; contact clinician if symptoms fail to resolve or recur within 2 weeks"],
        "when_to_consult_doctor": ["Burning or pain on urination", "Urgent frequent urination", "Visible blood in urine", "All UTIs in men, pregnant women, or children need formal clinician review"],
        "when_emergency_required": ["High fever with shaking chills, severe pain in side/back below ribs, persistent vomiting unable to take medicine, confusion, or dizziness"],
        "evidence_source": "Infectious Diseases Society of America (IDSA) & European Association of Urology (EAU) Guidelines",
        "last_updated": "2026-02-14",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 10. SKIN CONDITIONS
    {
        "id": "DIS-012",
        "condition_name": "Eczema (Atopic Dermatitis) / Contact Dermatitis",
        "category": "Skin Conditions",
        "simple_explanation": "A chronic inflammatory skin condition causing itchy, dry, cracked, and red or hyperpigmented patches on the skin, often associated with a personal or family history of allergies.",
        "common_symptoms": ["Intense pruritus (itching, often severe at night)", "Dry, sensitive, flaky skin", "Erythematous (red on fair skin) or purplish/gray/brown (on dark skin) patches", "Cracking or scaling of skin", "Raw, swollen skin from scratching"],
        "less_common_symptoms": ["Lichenification (thickened, leathery skin from chronic rubbing)", "Small, raised bumps that leak fluid and crust over when scratched", "Darkening of skin around eyes (infraorbital folds)"],
        "warning_signs": ["Yellow honey-colored crusting or oozing pus (secondary bacterial infection, e.g. impetigo / Staph aureus)", "Sudden rapid outbreak of painful blisters (Eczema herpeticum)"],
        "emergency_warning_signs": ["Eczema Herpeticum (HSV infection on eczema): High fever, widespread painful punched-out blisters, severe lethargy", "Erythroderma: Generalized skin redness covering >90% of body with shivering/hypothermia"],
        "common_risk_factors": ["Atopic triad history (asthma, allergic rhinitis, eczema)", "Filaggrin gene mutations causing skin barrier defect", "Cold dry climate or sudden temperature changes", "Frequent hot showers with harsh soaps", "Psychological stress"],
        "possible_causes": ["Immune dysregulation with Th2 pathway activation and epidermal barrier dysfunction"],
        "related_conditions": ["Allergic Contact Dermatitis", "Seborrheic Dermatitis", "Psoriasis", "Scabies", "Cutaneous Fungal Infection (Tinea)"],
        "typical_investigations": ["Clinical dermatological examination", "Skin patch testing (if contact allergy suspected)", "Bacterial swab / viral PCR (if secondary infection suspected)", "Skin biopsy (rarely needed)"],
        "relevant_lab_markers": ["Serum total IgE (often elevated)", "Peripheral blood eosinophil count (mildly elevated)", "Bacterial culture swab"],
        "relevant_vital_signs": ["Temperature (fever indicates secondary infection)"],
        "general_treatment_approaches": ["Skin barrier restoration with frequent emollient application", "Topical anti-inflammatory therapy for acute flare-ups", "Gentle skincare routine and trigger avoidance", "Phototherapy or systemic biologics (Dupilumab) for moderate-to-severe disease"],
        "medication_classes_commonly_used": ["Emollients / Moisturizers (fragrance-free creams/ointments)", "Topical Corticosteroids (Hydrocortisone, Mometasone, Betamethasone)", "Topical Calcineurin Inhibitors (Tacrolimus, Pimecrolimus)", "Oral Antihistamines (for nighttime itch)"],
        "general_lifestyle_measures": ["Moisturize skin within 3 minutes of bathing ('soak and seal')", "Take short (5-10 min) lukewarm showers", "Use mild, soap-free cleansers", "Wear soft, breathable cotton clothing and avoid wool"],
        "prevention_measures": ["Daily emollient maintenance even when skin looks clear", "Keep fingernails trimmed short to prevent scratching injury", "Use cool-mist humidifiers in dry winter air"],
        "follow_up_considerations": ["Review after 2 weeks of topical steroid flare treatment to step down to maintenance or intermittent weekend therapy; monitor for skin thinning if potent steroids used"],
        "when_to_consult_doctor": ["Rash causing severe sleep disruption or interfering with daily activities", "Skin not improving after 1 week of over-the-counter hydrocortisone", "Signs of skin infection (pus, crusts, red streaks)"],
        "when_emergency_required": ["Fever with sudden cluster of painful blisters, rapidly spreading warmth/swelling, or generalized skin peeling covering the body"],
        "evidence_source": "American Academy of Dermatology (AAD) & Indian Association of Dermatologists (IADVL)",
        "last_updated": "2026-01-30",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 11. NUTRITIONAL DEFICIENCIES
    {
        "id": "DIS-013",
        "condition_name": "Iron Deficiency Anemia (IDA)",
        "category": "Nutritional Deficiencies",
        "simple_explanation": "A condition in which the blood lacks adequate healthy red blood cells due to insufficient iron, resulting in decreased oxygen delivery to tissues.",
        "common_symptoms": ["Extreme fatigue and generalized weakness", "Pale skin and mucous membranes (pallor)", "Shortness of breath on exertion", "Cold hands and feet", "Dizziness or lightheadedness", "Headaches"],
        "less_common_symptoms": ["Brittle spoon-shaped nails (koilonychia)", "Craving non-nutritive substances like ice, dirt, or starch (pica)", "Sore, smooth tongue (atrophic glossitis)", "Cracks at corners of mouth (angular cheilitis)", "Restless legs syndrome"],
        "warning_signs": ["Exertional chest tightness or palpitations", "Resting heart rate >100 bpm", "Hemoglobin <8 g/dL"],
        "emergency_warning_signs": ["Severe symptomatic anemia: Hemoglobin <6-7 g/dL with severe orthostatic hypotension, syncope, angina, or congestive heart failure signs"],
        "common_risk_factors": ["Heavy menstrual bleeding (menorrhagia)", "Pregnancy and lactation", "Strict vegetarian or vegan diets without adequate iron sources", "Gastrointestinal bleeding (peptic ulcer, hemorrhoids, colon polyp)", "Malabsorption (Celiac disease, post-bariatric surgery)"],
        "possible_causes": ["Blood loss (most common cause in adults)", "Insufficient dietary intake", "Impaired intestinal iron absorption", "Increased physiological demand (growth, pregnancy)"],
        "related_conditions": ["Thalassemia Minor / Trait", "Anemia of Chronic Disease", "Vitamin B12 Deficiency Anemia", "Folate Deficiency Anemia"],
        "typical_investigations": ["Complete Blood Count (CBC) with red cell indices", "Serum Ferritin (most sensitive marker of total body iron stores)", "Serum Iron, Total Iron Binding Capacity (TIBC), and Transferrin Saturation", "Peripheral Blood Smear (microcytic hypochromic RBCs)", "Stool occult blood / endoscopy to find bleeding source in men and postmenopausal women"],
        "relevant_lab_markers": ["Hemoglobin (Low: <12 g/dL females, <13 g/dL males)", "Serum Ferritin (Low: <30 ng/mL strongly diagnostic, <15 ng/mL depleted)", "MCV (Low: <80 fL microcytic)", "Transferrin Saturation (Low: <20%)"],
        "relevant_vital_signs": ["Heart rate (tachycardia)", "Blood pressure (orthostatic drop)", "Conjunctival and palmar pallor"],
        "general_treatment_approaches": ["Oral iron replacement therapy (Ferrous sulfate/ascorbate/fumarate)", "Investigating and treating the underlying cause of iron loss", "Dietary counseling to enhance iron intake and absorption", "Intravenous iron infusions for severe malabsorption, pregnancy (third trimester), or oral intolerance"],
        "medication_classes_commonly_used": ["Oral Iron Supplements (Ferrous Ascorbate, Ferrous Sulfate, Ferrous Fumarate)", "Vitamin C (co-administered to enhance intestinal non-heme iron absorption)", "IV Iron Formulations (Ferric Carboxymaltose) when indicated"],
        "general_lifestyle_measures": ["Take oral iron on an empty stomach or with a source of Vitamin C (orange juice) for optimal absorption", "Avoid taking iron with tea, coffee, milk, or calcium supplements (block absorption)", "Increase dietary iron: green leafy vegetables, lentils, beans, jaggery, eggs, lean meats"],
        "prevention_measures": ["Routine screening during pregnancy and in adolescent girls", "Deworming in endemic areas", "Iron-folic acid supplementation programs (National Anemia Mukt Bharat)"],
        "follow_up_considerations": ["Repeat Hemoglobin at 4 weeks to verify response (expect ~1-2 g/dL increase); continue iron for 3-6 months after Hb normalizes to replenish marrow ferritin stores"],
        "when_to_consult_doctor": ["Chronic unexplained fatigue, pale skin, shortness of breath climbing stairs, or heavy menstrual cycles"],
        "when_emergency_required": ["Chest pain on exertion, fainting or near-fainting when standing up, coughing up blood, or passing black tarry stools"],
        "evidence_source": "WHO Nutritional Anemias Guidelines & Ministry of Health and Family Welfare (Anemia Mukt Bharat)",
        "last_updated": "2026-02-08",
        "version": DISEASE_KNOWLEDGE_VERSION
    },

    # 12. OCCUPATIONAL HEALTH CONDITIONS
    {
        "id": "DIS-014",
        "condition_name": "Heat Exhaustion & Heat Stroke",
        "category": "Occupational-health Conditions",
        "simple_explanation": "A spectrum of heat-related illnesses occurring when the body overheats due to prolonged exposure to high ambient temperatures or strenuous physical exertion in hot environments.",
        "common_symptoms": ["Heavy sweating", "Cool, pale, clammy skin", "Fast, weak pulse", "Dizziness, lightheadedness", "Muscle cramps", "Headache", "Nausea or mild vomiting", "Extreme fatigue"],
        "less_common_symptoms": ["Irritability", "Paresthesias", "Orthostatic presyncope", "Mild hyperventilation"],
        "warning_signs": ["Body temperature rising above 101-102°F (38.3-38.9°C)", "Sweating starts decreasing despite high heat", "Inability to drink fluids"],
        "emergency_warning_signs": ["HEAT STROKE (LIFE-THREATENING EMERGENCY): Core body temperature >104°F (40°C), hot, red, dry or damp skin, altered mental status, confusion, slurred speech, seizures, loss of consciousness"],
        "common_risk_factors": ["Outdoor occupational workers (construction, agriculture, brick kilns, foundries)", "High ambient temperature with high relative humidity", "Inadequate water/electrolyte hydration", "Wearing non-breathable protective gear", "Dehydration, alcohol use, chronic cardiovascular illness"],
        "possible_causes": ["Thermoregulatory failure where metabolic heat production and environmental heat absorption outstrip heat dissipation capacity"],
        "related_conditions": ["Heat Cramps", "Dehydration", "Heat Syncope", "Rhabdomyolysis", "Heat Stroke"],
        "typical_investigations": ["Core body temperature measurement (rectal is clinical gold standard in acute heat stroke)", "Serum electrolytes & BUN/Creatinine (assess dehydration and acute kidney injury)", "Serum Creatine Kinase (CK, check for rhabdomyolysis)", "Urinalysis for myoglobinuria"],
        "relevant_lab_markers": ["Serum Sodium & Potassium", "BUN / Serum Creatinine", "Serum Creatine Kinase (CK)", "Liver transaminases (elevated in heat stroke)"],
        "relevant_vital_signs": ["Core Body Temperature", "Heart Rate (tachycardia)", "Blood Pressure", "Respiratory Rate"],
        "general_treatment_approaches": ["Heat Exhaustion: Move immediately to cool/shaded area, loosen clothing, sip cool water or electrolyte solution, apply cool wet towels", "Heat Stroke: CALL 112/108 IMMEDIATELY; active rapid whole-body cooling (cold water immersion, ice packs to neck/axillae/groin, misting and fanning) until core temp drops <102°F"],
        "medication_classes_commonly_used": ["Oral rehydration salts / electrolyte solutions", "IV normal saline crystalloids (in clinical setting)", "DO NOT GIVE Paracetamol or Aspirin (ineffective for environmental hyperthermia and can exacerbate hepatic/renal toxicity)"],
        "general_lifestyle_measures": ["Scheduled mandatory rest breaks in shaded areas during peak sun hours (11 AM - 3 PM)", "Consuming 250-500 mL water every 20-30 minutes during heavy outdoor work", "Wearing loose, light-colored, breathable cotton clothing"],
        "prevention_measures": ["Acclimatization program (gradual increase of workload over 7-14 days for new workers)", "Buddy system in industrial work units to watch for early confusion", "Wet Bulb Globe Temperature (WBGT) monitoring at worksites"],
        "follow_up_considerations": ["Workers recovering from heat exhaustion should rest for at least 24-48 hours before resuming hot environmental work; renal function must be checked if severe"],
        "when_to_consult_doctor": ["Heat exhaustion symptoms not improving after 30 minutes of rest and cool fluids, persistent vomiting, or muscle cramps lasting >1 hour"],
        "when_emergency_required": ["CALL 112/108: Confusion, delirium, seizures, unconsciousness, hot dry skin, or body temperature >103-104°F"],
        "evidence_source": "National Institute for Occupational Safety and Health (NIOSH) & National Disaster Management Authority (NDMA India Heat Guidelines)",
        "last_updated": "2026-02-20",
        "version": DISEASE_KNOWLEDGE_VERSION
    }
]

# Helper query utilities
def get_all_disease_categories() -> List[str]:
    """Returns unique list of clinical categories in the knowledge base."""
    cats = sorted(list(set(d["category"] for d in DISEASE_DATABASE)))
    return cats

def search_disease_knowledge(
    query: str = "",
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Searches the disease knowledge base by name, symptoms, or category.
    """
    results = []
    q = query.lower().strip()

    for item in DISEASE_DATABASE:
        if category and category.lower() != "all" and item["category"].lower() != category.lower():
            continue

        if not q:
            results.append(item)
            continue

        # Search across name, symptoms, causes, and explanation
        match_score = 0
        if q in item["condition_name"].lower():
            match_score += 10
        if q in item["simple_explanation"].lower():
            match_score += 5
        if any(q in s.lower() for s in item["common_symptoms"]):
            match_score += 8
        if any(q in s.lower() for s in item.get("less_common_symptoms", [])):
            match_score += 3
        if any(q in c.lower() for c in item.get("possible_causes", [])):
            match_score += 4
        if any(q in r.lower() for r in item.get("related_conditions", [])):
            match_score += 4

        if match_score > 0:
            results.append({**item, "_search_score": match_score})

    results.sort(key=lambda x: x.get("_search_score", 0), reverse=True)
    return results

def get_disease_by_id(disease_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full clinical condition record by its ID."""
    for item in DISEASE_DATABASE:
        if item["id"].lower() == disease_id.lower():
            return item
    return None
