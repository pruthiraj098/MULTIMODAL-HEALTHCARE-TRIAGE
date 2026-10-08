# HealthTriage AI — Master System Architecture

**Multimodal AI-Assisted Human-in-the-Loop Healthcare Triage and Facility Intelligence Platform**  
Designed for Government Hospitals, Primary Health Centres (PHCs), Community Facilities, Campus Units, and Occupational Health Centres.

---

## 1. Master System Topology

```
                                    HEALTH TRIAGE AI
                                           │
                                         SANA
                     (Smart AI Nursing & Assessment Assistant)
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                   TEXT                  VOICE               MULTIMODAL
                                                                 │
                                                   ┌─────────────┼─────────────┐
                                                   │             │             │
                                                REPORT         IMAGE         VITALS
                                                   │
                                                  OCR
                                                   │
                                                   └─────────────┼─────────────┘
                                                                 │
                                                     MULTIMODAL EVIDENCE FUSION
                                                                 │
                                                       SAFETY / RISK ENGINE
                                                                 │
                                                          AI SAFETY GUARD
                                                                 │
                                                      STRUCTURED TRIAGE NOTE
                                                                 │
                                                          HUMAN REVIEWER
                                                                 │
                                 ┌───────────────────────────────┼───────────────────────────────┐
                                 │                               │                               │
                               QUEUE                         REFERRAL                        FOLLOW-UP
                                 │                               │                               │
                                 └───────────────────────────────┼───────────────────────────────┘
                                                                 │
                                                        FACILITY DASHBOARD
                                                                 │
                                                       AGGREGATED ANALYTICS
                                                                 │
                                                      PUBLIC HEALTH INSIGHTS
```

---

## 2. Core Safety Hierarchy

In strict alignment with clinical safety and medical ethics:

```
    DETERMINISTIC SAFETY RULES  (Heart Rate >130, SpO2 <90%, Chest Pain, Severe Dyspnea)
                ▼
      HUMAN HEALTHCARE REVIEW   (Nurses, Doctors, Medical Officers approve/modify/escalate)
                ▼
          AI SAFETY GUARD       (Sanitizes diagnostic claims, removes prescription advice)
                ▼
      GENERATIVE AI RESPONSE    (Empathetic conversational guidance, adaptive questions)
```

1. **Deterministic Priority**: Under no circumstances can Google Gemini or any LLM override deterministic emergency rules.
2. **Human-in-the-Loop (HITL)**: AI never makes final clinical decisions or prescriptions. Every triage session generates a structured note queued for human review.
3. **No Autonomous Prescribing**: Educational medication safety notes only; no personalized dosages or antibiotic prescriptions.
4. **Offline / Low-Internet Fallback**: If Gemini or network connectivity fails, the platform automatically switches to offline deterministic risk categorization and continues nurse queue intake.

---

## 3. Multimodal Evidence Fusion (`EvidenceFusionService`)

Consolidates patient-reported complaints, voice transcripts, clinical vitals, OCR report findings, and visible image observations into an immutable 5-section Structured Triage Note:

- **Section 1: Patient-Reported Information** (`SOURCE: PATIENT`)
  - Chief complaint, symptoms, duration, raw transcript in original regional language.
- **Section 2: AI-Extracted Information** (`SOURCE: MEASURED VITALS & OCR`)
  - Physiological vitals (HR, SpO2, BP, Temp, RR) and lab analyte comparisons against report-specific reference ranges.
- **Section 3: AI Triage Summary** (`SOURCE: DECISION SUPPORT`)
  - Triage category, contributing factors, missing information, suggested follow-up questions, and specialist referral recommendations.
- **Section 4: Safety Flags & Deterministic Alerts** (`SOURCE: SAFETY ENGINE`)
  - Acute red-flag alerts, emergency contact routing (112 / 108 / local ER).
- **Section 5: Qualified Healthcare Worker Review** (`SOURCE: CLINICAL DECISION`)
  - Review action (`APPROVED`, `MODIFIED`, `REQUEST_INFO`, `ESCALATED`, `REFERRED`), final triage priority, reviewer notes, and timestamped audit trail.

---

## 4. Role-Based Access Control (RBAC)

Derives identity exclusively from authenticated JWT payloads (never trusting frontend-supplied `user_id`):

| Role | Scope & Permissions |
|---|---|
| `PATIENT` / `USER` | Personal dashboard, SANA voice triage, vital tracker, reports, medication education, doctor copilot. |
| `HEALTH_WORKER` | Outreach screening camp entry, vitals input, triage queue view, referral prep. |
| `NURSE` | Queue triage review, vital updates, note approval, follow-up scheduling. |
| `DOCTOR` | Clinical modification, complex escalation, emergency interventions, referral authorization. |
| `MEDICAL_OFFICER` | Facility queue management, transfer approvals, public health anomaly monitoring. |
| `FACILITY_ADMIN` | Workload analytics, staff overview, audit trail inspection, facility mode configuration. |
| `SYSTEM_ADMIN` | Full administrative control, system settings, user lifecycle management. |

---

## 5. Facility Workflow Modes (`facility_profiles`)

Configurable workflows tailored to specific clinical operating environments:

1. **Government Hospital**: High-volume emergency intake, smart triage queues, rapid physician escalation, and bed-side handovers.
2. **Primary Health Centre (PHC)**: Rural first-contact facility, community nurse review, low-bandwidth vitals screening, higher-center transfers.
3. **Public Health Camp**: Rapid batch intake mode for outreach screening camps, mobile vitals screening, quick referral slips.
4. **Campus Health Centre**: University students and faculty, fever/respiratory clusters, dorm isolation guidance.
5. **Industrial / Occupational Health**: Workplace injury logging, toxic/heat exposure assessment, shift clearance, ergonomic strain.
6. **Community Clinic**: Outpatient appointment triage, chronic check-ins, medication adherence, lifestyle self-care.

---

## 6. Public Health Surveillance & Anomaly Detection

1. **Zero-PII Aggregation**: Individual patient names, contact numbers, and conversational transcripts are strictly filtered out of public health views.
2. **Statistical Cluster Tracking**: Aggregates symptom categories (Respiratory, Febrile, Gastrointestinal, Cardiovascular, Trauma).
3. **Decision-Support Early Warning**: Flags unusual increases relative to baseline using safe wording: *"Unusual respiratory symptom activity detected compared with baseline. Public-health review recommended."* (Never declares an autonomous "Outbreak").
4. **Government Resource Intelligence**: Translates cluster activity into logistical decision support for ambulance (108 fleet) demand, primary care nurse staffing, and essential drug buffers.
