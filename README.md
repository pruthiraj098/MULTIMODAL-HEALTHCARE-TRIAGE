# HealthTriage AI — Multimodal Healthcare Triage & Facility Intelligence Platform

**AI-Assisted Multimodal Human-in-the-Loop Healthcare Triage and Facility Intelligence Platform**  
Designed for Government Hospitals, Primary Health Centres (PHCs), Community Facilities, Public Health Screening Camps, Campus Health Units, and Occupational Medical Units.

---

## 🌟 Key Highlights & Core Capabilities

- **SANA (Smart AI Nursing & Assessment Assistant)**: Empathetic, conversational clinical assistant supporting voice, text, physiological vitals, scanned PDF lab reports, and visible image observations.
- **Multilingual Healthcare**: Native speech-to-text (STT) and text-to-speech (TTS) across 6 Indian languages: English, Hindi (हिन्दी), Odia (ଓଡ଼ିଆ), Bengali (বাংলা), Telugu (తెలుగు), and Tamil (தமிழ்).
- **Multimodal Evidence Fusion**: Fuses patient complaints, vitals, report OCR, and image observations into an immutable 5-section Structured Triage Note with clear provenance tags (`SOURCE: PATIENT`, `SOURCE: MEASURED VITALS`, `SOURCE: OCR`, `SOURCE: AI OBSERVATION`, `SOURCE: CLINICAL DECISION`).
- **Safety-First Deterministic Engine**: Deterministic rules strictly override generative AI responses. Critical indicators (severe dyspnea, chest pain, SpO2 <90%, HR >130) trigger instant triage escalation and national emergency helpline routing (`112` and `108`).
- **Human-in-the-Loop (HITL) Queue & Review**: AI assists but never makes final clinical decisions or prescriptions. Nurses, doctors, and medical officers review, approve, modify, or escalate cases through a smart clinical queue.
- **Inter-Facility Referral Generator**: Automated preparation and authorization of formal clinical transfer notes with printable transfer slips.
- **Doctor Visit Copilot**: One-page pre-consultation briefings organizing symptoms, vital trends, and personalized questions to ask the doctor.
- **Facility Workflow Modes**: 6 configurable operating modes (Government District Hospital, PHC, Public Health Camp, Campus Health Centre, Occupational Health, Community Clinic).
- **Government & Public Health Intelligence**: 100% de-identified regional symptom surveillance, statistical cluster tracking, early-warning anomaly indicators, and resource demand intelligence.
- **10 Synthetic Demonstration Scenarios**: Instant one-click clinical scenario switcher and role emulator for evaluations and live demonstrations.
- **Offline & Low-Internet Resilience**: Automatic fallback to deterministic rules when generative AI or connectivity is unavailable.

---

## 🏛️ Master System Architecture

```
                    HEALTH TRIAGE AI
                           │
                          SANA
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
       TEXT              VOICE           MULTIMODAL
                                              │
                                   ┌──────────┼──────────┐
                                   │          │          │
                                 REPORT     IMAGE      VITALS
                                   │
                                  OCR
                                   │
                                   └──────────┼──────────┘
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
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                  QUEUE                   REFERRAL                  FOLLOW-UP
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                     FACILITY DASHBOARD
                                              │
                                    AGGREGATED ANALYTICS
                                              │
                                   PUBLIC HEALTH INSIGHTS
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (with virtualenv)
- Node.js 18+ & npm
- MySQL Server 8.0+

### 2. Environment Setup (`.env`)
Ensure `.env` in the project root is configured:
```env
# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Database Configuration
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="healthtriage"

# Security & JWT
SECRET_KEY="your-random-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Start Backend
Run the backend starter script:
```powershell
.\run_backend.bat
```
*Or directly via virtual environment:*
```powershell
venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
```
Backend API will be accessible at `http://127.0.0.1:8000`. Swagger API docs: `http://127.0.0.1:8000/docs`.

### 4. Start Frontend
Run the frontend starter script:
```powershell
.\run_frontend.bat
```
*Or directly via npm:*
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Comprehensive Verification & Tests

To execute the complete 86-test clinical verification suite:
```powershell
venv\Scripts\python.exe -m unittest discover tests
```
*Output: `Ran 86 tests in 16.328s. OK`*

To test production frontend bundle compilation:
```powershell
cd frontend
npm run build
```

---

## 📚 Complete Platform Documentation

- [ARCHITECTURE.md](file:///c:/PROJECTS/MULTIMODAL-HEALTHCARE-TRIAGE/ARCHITECTURE.md) — Master architecture, safety hierarchy, fusion pipeline, and facility mode specifications.
- [SECURITY.md](file:///c:/PROJECTS/MULTIMODAL-HEALTHCARE-TRIAGE/SECURITY.md) — RBAC authentication, IDOR defenses, upload protections, and de-identification standards.
- [API_DOCUMENTATION.md](file:///c:/PROJECTS/MULTIMODAL-HEALTHCARE-TRIAGE/API_DOCUMENTATION.md) — Full REST API reference for SANA, Queue, Referrals, Copilot, Facility, and Public Health endpoints.
- [DEMO_GUIDE.md](file:///c:/PROJECTS/MULTIMODAL-HEALTHCARE-TRIAGE/DEMO_GUIDE.md) — Demonstration walkthrough for the 10 synthetic test scenarios and role emulator.
