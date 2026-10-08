# HealthTriage AI — Master Demonstration & Evaluation Guide

**Platform Walkthrough for Government Health Officials, Institutional Directors, and Evaluators**

---

## 1. Quick Launch

1. **Start Backend**: Double-click `run_backend.bat` or run:
   ```powershell
   venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
   ```
2. **Start Frontend**: Double-click `run_frontend.bat` or run:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in any modern web browser.

---

## 2. Using the Built-In 1-Click Demo Suite

At any point on the platform, click the amber **"🚀 10 Demo Scenarios"** button in the top navigation bar or floating at the bottom right. This modal gives you:
- **Instant Role Switcher**: Click to switch between **Patient**, **Nurse/Reviewer**, **Facility Admin**, or **Public Health Officer** without re-logging in.
- **10 Synthetic Clinical Test Cases**: Load pre-configured scenarios directly into SANA or the triage queue.

---

## 3. The 10 Certified Demo Scenarios (Section 43)

| ID | Title | Category | Language | Key Feature Demonstrated |
|---|---|---|---|---|
| `DEMO-001` | Routine Mild Fever & Rhinitis | ROUTINE | EN | Conversational triage, self-care hydration advice, low risk gauge. |
| `DEMO-002` | Urgent Wheezing in Known Asthmatic | URGENT | EN | Vital integration (SpO2 93%), urgent queue routing, follow-up prompt. |
| `DEMO-003` | Emergency Acute Chest Pain | EMERGENCY | EN | Immediate deterministic override, 112/108 routing, question cessation. |
| `DEMO-004` | Abnormal Lab Report (Platelets 42k) | URGENT | EN | PDF/Image OCR, reference range comparison, safe non-diagnostic wording. |
| `DEMO-005` | Visible Skin Lesion & Cellulitis | URGENT | EN | Visible image understanding, qualified reviewer escalation. |
| `DEMO-006` | Multilingual Odia Regional Case | ROUTINE | ODIA (`or`) | Regional language voice recognition, English structured nurse note. |
| `DEMO-007` | University Campus Health Cluster | ROUTINE | EN | Campus mode workflow, dormitory isolation guidance, cluster log. |
| `DEMO-008` | Industrial Ergonomic & Toxic Exposure | URGENT | EN | Occupational health mode, workplace incident logging, safety clearance. |
| `DEMO-009` | Outreach Rural Screening Camp | ROUTINE | HINDI (`hi`) | Rapid batch entry, offline/low-internet fallback, mobile screening flow. |
| `DEMO-010` | Inter-Facility Clinical Referral | URGENT | EN | Referral generator, formal printable transfer slip, clinician seal. |

---

## 4. Key Workflows to Demonstrate to Evaluators

### Workflow A: The End-to-End Patient-to-Clinician Journey
1. Click **"🚀 10 Demo Scenarios"** → Select `DEMO-003: Emergency Acute Chest Pain` or type *"Severe squeezing chest pain radiating to left arm"*.
2. Note how SANA **instantly stops questioning**, displays the prominent **🔴 EMERGENCY** banner, and presents National Emergency numbers (`112` and `108`).
3. Click **"🩺 Clinical Queue"** in the top navigation bar.
4. Open the emergency case from the queue. Observe the **5-Part Structured Triage Note**:
   - Patient-reported statement
   - AI-extracted vitals
   - AI decision-support indicator
   - Deterministic safety alerts
   - Qualified healthcare worker review panel
5. Select **"🚨 Escalate to Senior Medical Officer / Resuscitation"**, enter clinical notes, and click **Commit Clinical Review Decision**.
6. Click **"📄 Generate Formal Referral Slip"**, specify receiving hospital, and generate a printable transfer slip.

### Workflow B: Multilingual Triage (Odia / Hindi / Bengali / Telugu / Tamil)
1. In SANA Triage, select **Odia (ଓଡ଼ିଆ)** or **Hindi (हिन्दी)** from the language selector.
2. SANA speaks and interacts in the selected regional language.
3. The clinical staff receives a clean, standardized English clinical triage note in the queue.

### Workflow C: Facility Operations & Workflow Modes
1. Click **"🏢 Facility Admin"** in the top navigation.
2. View real-time workload KPIs and triage distributions (Emergency vs Urgent vs Routine).
3. Switch to the **Facility Workflow Modes** tab. Switch between **Government Hospital**, **PHC**, **Campus Health**, and **Occupational Health**.
4. Inspect the **Audit Logs** tab to demonstrate full compliance tracking.

### Workflow D: 100% De-Identified Public Health Surveillance
1. Click **"🏛️ Public Health"** in the top navigation.
2. Note the strict privacy guarantee (Zero PII or patient transcripts).
3. Review regional symptom clusters (Respiratory, Febrile, Gastrointestinal, Cardiovascular).
4. View the **Early-Warning Anomaly Banner** (*"Unusual respiratory symptom activity detected compared with baseline. Public-health review recommended."*).
5. Review the **Government Resource Intelligence** indicators for ambulance transit demand and nurse staffing pressure.
