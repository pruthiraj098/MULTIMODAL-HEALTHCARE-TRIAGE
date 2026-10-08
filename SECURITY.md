# HealthTriage AI — Security & Privacy Architecture

## 1. Authentication & Session Security
- **JWT (JSON Web Tokens)**: Tokens are signed with HMAC-SHA256 (`HS256`) using a strong server-side secret (`SECRET_KEY`).
- **Token Expiry**: Strict expiration limits enforced (`ACCESS_TOKEN_EXPIRE_MINUTES`). Expired tokens immediately return HTTP 401.
- **Password Protection**: Passwords hashed using industry-standard `bcrypt` with unique salts. Raw passwords never hit persistence logs.
- **Account Disablement Check**: Inactive accounts (`is_active = FALSE`) are rejected during both login and subsequent token verification.

## 2. Authorization & IDOR Defense
- **Zero Frontend Trust**: Frontend-supplied `user_id` is never used for data queries or mutation authorization. All patient scopes are extracted from the authenticated JWT token payload.
- **Role-Based Guards**:
  - `require_clinical_staff`: Allows only `HEALTH_WORKER`, `NURSE`, `DOCTOR`, `MEDICAL_OFFICER`, and administrators to view triage queues.
  - `require_reviewer`: Restricted to `NURSE`, `DOCTOR`, `MEDICAL_OFFICER`, and admins for clinical decisions and referral approvals.
  - `require_facility_admin`: Restricts KPI analytics and workflow mode changes.
  - `require_public_health`: Restricts regional surveillance queries.
- **Data Isolation**: Patients can strictly view only their own triage notes, vitals, medical reports, and follow-ups. Cross-user record queries are rejected.

## 3. Upload & File Protection
- **Content Validation**: Uploaded PDF and image files are validated for permitted MIME types (`application/pdf`, `image/png`, `image/jpeg`).
- **Path Traversal Protection**: Files are assigned cryptographically random UUID basenames and stored in dedicated upload subdirectories. No user-supplied filenames are directly written to disk.
- **Size Limits**: Enforced 10 MB maximum payload limit to mitigate denial-of-service (DoS) via resource exhaustion.

## 4. Privacy & De-Identification Standards
- **HIPAA & Public Health Privacy**: Public health surveillance endpoints return strictly aggregated statistical clusters. Names, contact information, IP addresses, and patient chat logs are completely omitted.
- **Configurable Emergency Contacts**: Emergency dispatch is configured by facility/region (e.g., `112`, `108`, `local ER`) and not hardcoded to foreign services.

## 5. Audit Logging & Compliance
- **Immutable Audit Trail (`audit_logs`)**:
  - Access to patient triage cases
  - Healthcare reviewer decisions (`APPROVED`, `MODIFIED`, `REQUEST_INFO`, `ESCALATED`, `REFERRED`)
  - Referral slip creation and seal
  - User logins, role updates, and facility mode switches
- **Sensitive Data Redaction**: Database passwords, JWT signing keys, and patient identifiers are excluded from audit records.
