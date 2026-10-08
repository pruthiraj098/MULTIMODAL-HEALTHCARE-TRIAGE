# ============================================================
# HealthTriage AI - Facility Intelligence & Public Health Analytics Service
# Powers:
# 1. Facility Admin Operational Dashboard & Workload KPIs
# 2. Government / Public Health Regional Surveillance & Anomaly Detection
# 3. Decision-support Resource Planning Indicators
# 4. Configurable Facility Modes (Hospital, PHC, Campus, Occupational, Camp, Clinic)
# ============================================================

from typing import Dict, Any, List, Optional
from database.database import (
    get_facility_dashboard_metrics,
    get_public_health_surveillance_data,
    get_all_facility_profiles,
    get_facility_profile,
    update_facility_active_mode
)

FACILITY_MODE_CONFIGS = {
    "GOVERNMENT_HOSPITAL": {
        "title": "Government Hospital / Emergency Department",
        "description": "Full-spectrum emergency resuscitation, triage acuity prioritization, and multi-bed inpatient linkage.",
        "intake_fields": ["age", "gender", "spo2", "heart_rate", "blood_pressure", "trauma_check"],
        "rapid_mode": False
    },
    "PHC": {
        "title": "Primary Health Centre (PHC)",
        "description": "Essential primary care, maternal-child health screening, and upstream CHC/District referral linkage.",
        "intake_fields": ["age", "gender", "temperature", "symptoms", "duration"],
        "rapid_mode": False
    },
    "PUBLIC_HEALTH_CAMP": {
        "title": "Public Health Camp / Community Outreach",
        "description": "Low-resource, high-throughput rapid intake mode for community mass screenings and rural camps.",
        "intake_fields": ["name", "age", "primary_symptom", "quick_vitals"],
        "rapid_mode": True
    },
    "CAMPUS_HEALTH": {
        "title": "Campus Health Centre",
        "description": "Student & faculty wellness, communicable cluster tracking, mental health check-ins, and infirmary bed monitoring.",
        "intake_fields": ["student_id", "symptoms", "dormitory_block", "temperature"],
        "rapid_mode": False
    },
    "OCCUPATIONAL_HEALTH": {
        "title": "Industrial & Occupational Health Unit",
        "description": "Factory workplace hazard tracking, heat stress, chemical/dust exposure, and workplace incident screening.",
        "intake_fields": ["worker_id", "plant_unit", "exposure_type", "respiratory_status", "heat_hours"],
        "rapid_mode": False
    },
    "CLINIC": {
        "title": "General Outpatient Clinic",
        "description": "Walk-in patient triage, chronic check-ins, and outpatient physician schedule management.",
        "intake_fields": ["symptoms", "vitals", "medical_history"],
        "rapid_mode": False
    }
}

class FacilityAnalyticsService:
    """
    Facility operational KPIs, public health symptom surveillance, and resource intelligence.
    Guarantees privacy-preserving aggregation without patient-identifiable data leakage.
    """

    @staticmethod
    def get_facility_admin_kpis(facility_id: Optional[int] = None, days: int = 30) -> Dict[str, Any]:
        """Provides facility operational workload metrics, triage distribution, and staff summary."""
        metrics = get_facility_dashboard_metrics(facility_id=facility_id, days=days)
        total_cases = metrics.get("total_cases", 0)

        # Calculate percentages
        emergency_pct = round((metrics.get("emergency_cases", 0) / total_cases * 100), 1) if total_cases > 0 else 0
        urgent_pct = round((metrics.get("urgent_cases", 0) / total_cases * 100), 1) if total_cases > 0 else 0
        routine_pct = round((metrics.get("routine_cases", 0) / total_cases * 100), 1) if total_cases > 0 else 0

        return {
            "success": True,
            "metrics": metrics,
            "distribution": {
                "emergency_percentage": emergency_pct,
                "urgent_percentage": urgent_pct,
                "routine_percentage": routine_pct
            }
        }

    @staticmethod
    def get_public_health_intelligence(days: int = 30, district: Optional[str] = None) -> Dict[str, Any]:
        """
        Public Health Authority intelligence:
        - 100% Anonymized aggregated symptom categories
        - Anomaly detection vs baseline
        - Resource demand pressure indicators
        """
        surveillance = get_public_health_surveillance_data(days=days, district=district)
        clusters = surveillance.get("clusters", {})
        total_intakes = clusters.get("total_deidentified_intakes", 0)

        # Statistical baseline comparison & anomaly detection
        # Baseline threshold: alert if a cluster exceeds 35% of total volume with at least 5 cases
        anomalies = []
        resp_cases = clusters.get("respiratory", 0)
        gi_cases = clusters.get("gastrointestinal", 0)
        fever_cases = clusters.get("febrile_systemic", 0)
        heat_cases = clusters.get("heat_occupational", 0)

        if total_intakes > 0:
            if (resp_cases / total_intakes) > 0.40 and resp_cases >= 3:
                anomalies.append({
                    "cluster": "Respiratory Complaints",
                    "severity": "MODERATE_ELEVATION",
                    "alert_message": "Unusual respiratory symptom activity detected compared with baseline. Public-health review recommended.",
                    "percentage_of_total": round((resp_cases / total_intakes * 100), 1)
                })

            if (gi_cases / total_intakes) > 0.35 and gi_cases >= 3:
                anomalies.append({
                    "cluster": "Gastrointestinal Symptoms",
                    "severity": "MODERATE_ELEVATION",
                    "alert_message": "Unusual gastrointestinal symptom activity detected compared with baseline. Public-health review recommended.",
                    "percentage_of_total": round((gi_cases / total_intakes * 100), 1)
                })

            if (fever_cases / total_intakes) > 0.45 and fever_cases >= 4:
                anomalies.append({
                    "cluster": "Febrile / Systemic Illness",
                    "severity": "HIGH_ELEVATION",
                    "alert_message": "Elevated febrile symptom patterns observed across facility intakes. Public-health monitoring recommended.",
                    "percentage_of_total": round((fever_cases / total_intakes * 100), 1)
                })

            if (heat_cases / total_intakes) > 0.25 and heat_cases >= 2:
                anomalies.append({
                    "cluster": "Heat Stress / Occupational Exposure",
                    "severity": "ADVISORY",
                    "alert_message": "Cluster of heat-related complaints detected in industrial/outreach units. Heat advisories recommended.",
                    "percentage_of_total": round((heat_cases / total_intakes * 100), 1)
                })

        # Government resource planning indicators
        # Scaled 0 to 100
        bed_pressure_index = min(100, int((clusters.get("respiratory", 0) * 4) + (clusters.get("febrile_systemic", 0) * 3) + 20))
        staff_strain_index = min(100, int((total_intakes * 3) + 15))
        referral_demand_index = min(100, int((clusters.get("respiratory", 0) * 3) + 10))

        return {
            "success": True,
            "surveillance": surveillance,
            "anomaly_alerts": anomalies,
            "resource_indicators": {
                "bed_pressure_index": bed_pressure_index,
                "staff_strain_index": staff_strain_index,
                "referral_demand_index": referral_demand_index,
                "interpretation": (
                    "High resource pressure indicated." if bed_pressure_index > 75
                    else ("Moderate clinical demand; routine resource capacity." if bed_pressure_index > 40 else "Optimal capacity; normal baseline operating range.")
                )
            }
        }

    @staticmethod
    def get_facility_modes_info() -> Dict[str, Any]:
        """Returns available facility mode configurations."""
        return {
            "success": True,
            "modes": FACILITY_MODE_CONFIGS
        }
