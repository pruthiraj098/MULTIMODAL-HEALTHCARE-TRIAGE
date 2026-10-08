# HealthTriage AI — Master API Documentation

## Base URL
Default Local Server: `http://127.0.0.1:8000`

---

## 1. Authentication & User Management
- `POST /api/auth/register` — Register a new patient or staff account.
- `POST /api/auth/login` — Authenticate and receive signed JWT access token.
- `GET /api/auth/me` — Retrieve current authenticated profile.
- `POST /api/auth/forgot-password` — Initiate password recovery.
- `POST /api/auth/reset-password` — Complete password recovery.

---

## 2. SANA Multimodal Healthcare Assistant
- `POST /api/sana/chat` — Conversational multimodal triage turn.
  - **Inputs**: `user_message`, `conversation`, `language` (en, hi, or, bn, te, ta), `vitals` (optional dict), `image_data` (base64 optional), `report_data` (base64 optional).
  - **Outputs**: `spoken_response`, `triage_level`, `triage_badge`, `is_emergency`, `structured_note`, `markdown_note`, `audio_base64`, `nearest_emergency_facility`.
  - Automatically synthesizes a 5-part Structured Triage Note and routes it to the Smart Healthcare Queue.
- `POST /api/sana/tts` — Spoken audio synthesis (TTS) with client browser fallback.
- `GET /api/sana/config` — Retrieves metadata, supported Indian languages, and emergency helpline configurations.

---

## 3. Smart Healthcare Queue & Human-in-the-Loop Review
- `GET /api/queue/cases` — Retrieve queued triage cases.
  - **Query Params**: `filter_type` (`all`, `emergency`, `urgent`, `routine`, `review_needed`), `facility_id`, `search`, `limit`, `offset`.
  - **Auth**: Requires Clinical Staff (`HEALTH_WORKER`, `NURSE`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).
- `GET /api/queue/case/{session_id}` — Retrieve full clinical case details, multimodal evidence provenance, and reviewer audit history.
- `POST /api/queue/case/{session_id}/assign` — Assign a case to a specific reviewer.
- `POST /api/queue/case/{session_id}/review` — Commit clinical review decision.
  - **Body**: `{ decision: "APPROVED"|"MODIFIED"|"REQUEST_INFO"|"ESCALATED"|"REFERRED", reviewer_notes: "...", new_triage_level: "..." }`.
  - **Auth**: Requires Reviewer (`NURSE`, `DOCTOR`, `MEDICAL_OFFICER`, `ADMIN`).

---

## 4. Clinical Referral Generator
- `POST /api/referrals/prepare` — Generates a formal clinical transfer slip draft from triage session.
- `POST /api/referrals/{referral_id}/approve` — Authorizes and seals the referral.
- `GET /api/referrals/{referral_id}` — Retrieves referral details.
- `GET /api/referrals/{referral_id}/print` — Returns clean, professional printable HTML referral transfer slip.
- `GET /api/referrals` — Lists patient or facility referrals.

---

## 5. Doctor Visit Copilot
- `POST /api/copilot/doctor-visit-summary` — Pre-consultation briefing combining vitals, reports, symptom timeline, and checklist questions.
- `GET /api/copilot/doctor-visit-summary/print` — Printable 1-page pre-consultation summary slip for the doctor's visit.

---

## 6. Follow-ups & Reminders
- `POST /api/followups/schedule` — Schedule maternal check-in, chronic check, or post-ER clinical follow-up.
- `GET /api/followups/my-reminders` — Retrieve authenticated patient's scheduled follow-ups.

---

## 7. Facility Intelligence & Modes
- `GET /api/facility/modes` — Returns supported facility workflow modes and descriptions.
- `GET /api/facility/profiles` — Lists registered hospitals, PHCs, campus units, and clinics.
- `GET /api/facility/analytics` — Workload KPIs, triage distribution, queue metrics, and referral rates.
- `PUT /api/facility/{facility_id}/mode` — Switch active facility workflow mode.

---

## 8. Public Health Surveillance
- `GET /api/public-health/surveillance` — 100% de-identified regional symptom surveillance, anomaly alerts, and government resource planning intelligence.

---

## 9. Security Audit & Compliance
- `GET /api/audit/logs` — Immutable audit trail of clinical case views, reviews, and admin events.

---

## 10. Demo Clinical Scenarios
- `GET /api/demo/scenarios` — Returns all 10 certified synthetic clinical demonstration scenarios.
- `GET /api/demo/scenarios/{scenario_id}` — Returns scenario details.
