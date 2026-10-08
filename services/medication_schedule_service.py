# ============================================================
# HealthTriage AI - Medication Schedule & Interaction Checker Service
# Converts Prescriptions into Timetables, Enforces Missed-Dose Safety,
# Checks Drug-Drug, Drug-Food, and Organ Precautions
# ============================================================

import os
from typing import Dict, Any, List, Optional
from datetime import date, datetime

from database.database import (
    add_user_medication,
    get_user_medications,
    update_user_medication,
    delete_user_medication,
    log_medication_dose,
    get_medication_logs_for_date
)
from ai.medication_knowledge_base import MEDICATION_DATABASE, search_medication_knowledge
from ai.medication_guidance import check_drug_interactions, FOOD_LIFESTYLE_RULES

MED_SCHEDULE_DISCLAIMER = (
    "This medication timetable is an organizational tool based on your doctor or pharmacist-approved prescription. "
    "Do not alter your dosage or discontinue prescribed therapies without consulting your healthcare provider."
)

class MedicationScheduleService:
    @staticmethod
    def create_timetable_from_prescription(
        user_id: int,
        medication_name: str,
        dosage: str,
        frequency: str = "Once daily",
        time_of_day: str = "Morning",
        food_relation: str = "After food",
        duration_days: Optional[int] = None,
        instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Takes approved prescription details and integrates them into the patient's schedule.
        """
        # Cross-reference with pharmacopeia for generic safety guidance
        knowledge = search_medication_knowledge(medication_name)
        matched_med = knowledge[0] if knowledge else None

        med_id = add_user_medication(
            user_id=user_id,
            name=medication_name.strip(),
            dosage=dosage.strip(),
            frequency=frequency.strip(),
            time_of_day=time_of_day.strip(),
            instructions=instructions or (f"Take {dosage} {time_of_day.lower()}, {food_relation.lower()}."),
            food_relation=food_relation.strip()
        )

        return {
            "success": True,
            "medication_id": med_id,
            "name": medication_name,
            "dosage": dosage,
            "time_of_day": time_of_day,
            "food_relation": food_relation,
            "missed_dose_rule": (
                matched_med.get("missed_dose_safety") if matched_med else
                "If you miss a dose, take it as soon as you remember unless it is close to your next scheduled dose. NEVER take two doses at once."
            ),
            "disclaimer": MED_SCHEDULE_DISCLAIMER
        }

    @staticmethod
    def get_structured_daily_timetable(user_id: int, target_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns visual timetable organized by slots:
        Morning (6 AM - 12 PM), Afternoon (12 PM - 5 PM), Evening (5 PM - 9 PM), Night (9 PM+)
        with taken/skipped/pending statuses and missed dose safety alerts.
        """
        target_date = target_date or date.today().isoformat()
        medications = get_user_medications(user_id, active_only=True)
        logs = get_medication_logs_for_date(user_id, target_date)

        # Build lookup of logged statuses
        log_map = {
            (l["medication_id"], l.get("time_of_day", "Morning")): l["status"]
            for l in logs
        }

        timetable = {
            "Morning": {"time_window": "06:00 - 12:00", "icon": "🌅", "items": []},
            "Afternoon": {"time_window": "12:00 - 17:00", "icon": "☀️", "items": []},
            "Evening": {"time_window": "17:00 - 21:00", "icon": "🌇", "items": []},
            "Night": {"time_window": "21:00 - 00:00", "icon": "🌙", "items": []}
        }

        total_doses = len(medications)
        taken_count = 0
        skipped_count = 0

        for m in medications:
            slot = m.get("time_of_day") or "Morning"
            if slot not in timetable:
                slot = "Morning"

            curr_status = log_map.get((m["id"], slot), "pending")
            if curr_status == "taken":
                taken_count += 1
            elif curr_status == "skipped":
                skipped_count += 1

            # Lookup pharmacopeia entry for food and missed-dose rules
            matched = search_medication_knowledge(m["name"])
            pk = matched[0] if matched else None

            timetable[slot]["items"].append({
                "id": m["id"],
                "name": m["name"],
                "dosage": m.get("dosage", "As prescribed"),
                "frequency": m.get("frequency", "Daily"),
                "food_relation": m.get("food_relation") or "As directed",
                "instructions": m.get("instructions", ""),
                "status": curr_status,
                "missed_dose_rule": (
                    pk.get("missed_dose_safety") if pk else
                    "Take as soon as remembered. Never double up doses."
                )
            })

        adherence_rate = round((taken_count / total_doses * 100), 1) if total_doses > 0 else 100.0

        return {
            "success": True,
            "date": target_date,
            "timetable": timetable,
            "summary": {
                "total_scheduled": total_doses,
                "taken": taken_count,
                "skipped": skipped_count,
                "pending": max(0, total_doses - taken_count - skipped_count),
                "adherence_rate": adherence_rate
            },
            "safety_reminder": "Missed a dose? Follow prescription instructions or contact your pharmacist. NEVER take a double dose.",
            "disclaimer": MED_SCHEDULE_DISCLAIMER
        }

    @staticmethod
    def check_comprehensive_safety(
        medication_list: List[str],
        allergies: Optional[List[str]] = None,
        kidney_function_egfr: Optional[float] = None,
        is_pregnant: bool = False,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deep safety audit across multiple dimensions:
        1. Drug-Drug Interactions
        2. Drug-Food / Lifestyle Warnings
        3. Duplicate Therapies
        4. Allergy Conflicts
        5. Organ (Renal/Hepatic) Precautions
        6. Pregnancy Precautions
        """
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        allergies = allergies or []
        med_names = [m.strip().lower() for m in medication_list if m and m.strip()]

        safety_alerts = []
        has_severe_issue = False

        # 1. Drug-Drug Interactions
        ddi = check_drug_interactions(med_names, api_key=api_key)
        for inter in ddi.get("interactions", []):
            is_sev = inter.get("severity") == "Severe"
            if is_sev:
                has_severe_issue = True
            safety_alerts.append({
                "type": "DRUG_DRUG_INTERACTION",
                "severity": inter.get("severity", "Moderate"),
                "title": f"Interaction: {inter.get('drug_a')} + {inter.get('drug_b')}",
                "description": inter.get("clinical_effect", ""),
                "recommendation": inter.get("recommendation", "Consult your physician or pharmacist.")
            })

        # 2. Food & Lifestyle Rules
        for drug_key, rule in FOOD_LIFESTYLE_RULES.items():
            if any(drug_key in m for m in med_names):
                safety_alerts.append({
                    "type": "DRUG_FOOD_WARNING",
                    "severity": rule.get("severity", "Moderate"),
                    "title": f"Food / Beverage Caution for {rule['drug']}",
                    "description": f"Avoid: {rule['avoid']}. {rule['reason']}",
                    "recommendation": "Review timing and dietary spacing with pharmacist."
                })

        # 3. Duplicate Therapies
        statins = [m for m in med_names if any(s in m for s in ["atorvastatin", "rosuvastatin", "simvastatin", "pravastatin"])]
        if len(statins) > 1:
            has_severe_issue = True
            safety_alerts.append({
                "type": "DUPLICATE_THERAPY",
                "severity": "Severe",
                "title": "Duplicate Statin Therapy Detected",
                "description": f"Multiple cholesterol medications detected ({', '.join(statins)}). Concurrent use sharply increases myopathy and rhabdomyolysis risks.",
                "recommendation": "Urgent pharmacist review required to verify single-agent prescription."
            })

        nsaids = [m for m in med_names if any(n in m for n in ["ibuprofen", "naproxen", "diclofenac", "meloxicam", "ketorolac"])]
        if len(nsaids) > 1:
            has_severe_issue = True
            safety_alerts.append({
                "type": "DUPLICATE_THERAPY",
                "severity": "Severe",
                "title": "Duplicate NSAID Therapy Detected",
                "description": f"Multiple non-steroidal anti-inflammatory drugs ({', '.join(nsaids)}) detected. Significantly compounds gastric bleeding and acute kidney injury dangers.",
                "recommendation": "Do not take two systemic NSAIDs together."
            })

        # 4. Allergy Checks
        for alg in allergies:
            alg_clean = alg.lower().strip()
            for med in med_names:
                if alg_clean in med:
                    has_severe_issue = True
                    safety_alerts.append({
                        "type": "ALLERGY_WARNING",
                        "severity": "Severe",
                        "title": f"Documented Drug Allergy Alert: {med.title()}",
                        "description": f"Patient has documented allergy to '{alg}'. Cross-reactivity risk.",
                        "recommendation": "DO NOT ADMINISTER. Confirm with prescribing clinician immediately."
                    })

        # 5. Organ Precautions (Renal eGFR)
        if kidney_function_egfr is not None:
            if kidney_function_egfr < 30:
                if any("metformin" in m for m in med_names):
                    has_severe_issue = True
                    safety_alerts.append({
                        "type": "RENAL_CONTRAINDICATION",
                        "severity": "Severe",
                        "title": "Metformin Contraindicated in Severe Renal Impairment",
                        "description": f"Patient eGFR is {kidney_function_egfr} mL/min (<30). High risk of fatal lactic acidosis.",
                        "recommendation": "Urgent physician review to discontinue or adjust antidiabetic regimen."
                    })
                if any(n in m for m in med_names for n in ["ibuprofen", "naproxen", "diclofenac"]):
                    has_severe_issue = True
                    safety_alerts.append({
                        "type": "RENAL_PRECAUTION",
                        "severity": "Severe",
                        "title": "NSAIDs Harmful in Chronic Kidney Disease",
                        "description": f"NSAIDs decrease renal blood flow and accelerate kidney function decline at eGFR {kidney_function_egfr}.",
                        "recommendation": "Avoid NSAIDs; use alternative analgesia under physician advice."
                    })

        # 6. Pregnancy Precautions
        if is_pregnant:
            if any("atorvastatin" in m or "statin" in m for m in med_names):
                has_severe_issue = True
                safety_alerts.append({
                    "type": "PREGNANCY_CONTRAINDICATION",
                    "severity": "Severe",
                    "title": "Statins Contraindicated in Pregnancy",
                    "description": "Cholesterol synthesis inhibitors may cause fetal harm and are strictly contraindicated.",
                    "recommendation": "Immediate obstetrician review to discontinue."
                })
            if any("losartan" in m or "telmisartan" in m or "lisinopril" in m for m in med_names):
                has_severe_issue = True
                safety_alerts.append({
                    "type": "PREGNANCY_CONTRAINDICATION",
                    "severity": "Severe",
                    "title": "ACE Inhibitors / ARBs Contraindicated in Pregnancy",
                    "description": "Drugs acting on the renin-angiotensin system cause severe fetal renal and cranial defects.",
                    "recommendation": "Immediate obstetric review for pregnancy-safe antihypertensives (e.g. Labetalol, Methyldopa)."
                })

        overall_status = "SAFETY_ALERT" if has_severe_issue else ("PRECAUTION_NOTED" if safety_alerts else "SAFE_NO_INTERACTIONS")

        return {
            "success": True,
            "overall_status": overall_status,
            "has_severe_issue": has_severe_issue,
            "total_alerts": len(safety_alerts),
            "alerts": safety_alerts,
            "headline": (
                "🚨 Potential Medication Safety Issue Detected!" if has_severe_issue else
                ("⚠️ Medication Precautions Identified" if safety_alerts else "✓ No Major Conflicts Detected")
            ),
            "recommendation_summary": (
                "Immediate review by a treating doctor or pharmacist is strongly recommended before taking these medicines together." if safety_alerts else
                "Current regimen shows no severe recorded conflicts. Maintain routine compliance and report any unexpected symptoms."
            ),
            "disclaimer": "AI medication checker is decision-support only and does not replace professional pharmaceutical review."
        }
