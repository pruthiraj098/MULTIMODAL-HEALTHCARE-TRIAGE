// ============================================================
// HealthTriage AI - Referral Note Generator Modal
// Prepares, edits, approves, and prints official clinical referral slips
// ============================================================

import { useState } from "react";
import { API_URL } from "../../config";

export default function ReferralGeneratorModal({
  isOpen = false,
  onClose = () => {},
  caseDetail = null,
}) {
  if (!isOpen || !caseDetail) return null;

  const token = localStorage.getItem("healthtriage_token");
  const [receivingFacility, setReceivingFacility] = useState("Capital District Headquarters Hospital");
  const [specialty, setSpecialty] = useState("Internal Medicine");
  const [priority, setPriority] = useState(
    caseDetail.triage_level === "EMERGENCY" ? "EMERGENCY" : "URGENT"
  );
  const [transportMode, setTransportMode] = useState(
    caseDetail.triage_level === "EMERGENCY" ? "AMBULANCE_108" : "STANDARD"
  );
  const [authorNotes, setAuthorNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralResult, setReferralResult] = useState(null);
  const [error, setError] = useState("");

  const handleGenerateDraft = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/referrals/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: caseDetail.id,
          receiving_facility: receivingFacility,
          specialty_required: specialty,
          priority,
          transport_mode: transportMode,
          referring_facility: caseDetail.facility_type || "Primary Health Facility",
          author_notes: authorNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReferralResult(data);
      } else {
        setError(data.detail || data.message || "Failed to prepare referral.");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!referralResult?.referral_id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/referrals/${referralResult.referral_id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReferralResult((prev) => ({ ...prev, status: "APPROVED" }));
      }
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!referralResult?.referral_id) return;
    window.open(`${API_URL}/api/referrals/${referralResult.referral_id}/print`, "_blank");
  };

  return (
    <div className="modal-overlay">
      <div className="referral-modal-card">
        <div className="modal-header">
          <div>
            <h3>📄 Clinical Referral Note Generator</h3>
            <p className="subtitle">
              Patient: <strong>{caseDetail.patient_name}</strong> (Case #{caseDetail.id})
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {!referralResult ? (
            <div className="referral-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Receiving Facility / Hospital:</label>
                  <select
                    value={receivingFacility}
                    onChange={(e) => setReceivingFacility(e.target.value)}
                    className="form-select"
                  >
                    <option value="Capital District Headquarters Hospital">Capital District Hospital (Trauma & ED)</option>
                    <option value="AIIMS Apex Trauma Center">AIIMS Apex Trauma Center</option>
                    <option value="SCB Medical College & Hospital">SCB Medical College & Hospital</option>
                    <option value="Community Health Centre Khordha">Community Health Centre Khordha</option>
                    <option value="Regional Infectious Disease Hospital">Regional Infectious Disease Hospital</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Clinical Specialty Required:</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="form-select"
                  >
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology / Emergency Cardiac Care</option>
                    <option value="Pulmonology">Pulmonology / Respiratory Medicine</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics & Trauma</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Referral Priority:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="EMERGENCY">🔴 EMERGENCY (Immediate Transfer)</option>
                    <option value="URGENT">🟠 URGENT (Within 24 Hours)</option>
                    <option value="ROUTINE">🟢 ROUTINE Outpatient Consultation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Recommended Transport Mode:</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="form-select"
                  >
                    <option value="STANDARD">Standard Patient Transport</option>
                    <option value="AMBULANCE_108">108 Emergency Ambulance</option>
                    <option value="ALS_AMBULANCE">Advanced Life Support (ALS) Ambulance</option>
                    <option value="SELF_TRANSPORT">Self / Family Transport</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Referring Clinician Notes & Transfer Reason:</label>
                <textarea
                  rows={3}
                  value={authorNotes}
                  onChange={(e) => setAuthorNotes(e.target.value)}
                  placeholder="Specify immediate clinical justification, initial stabilization performed, or specific diagnostic inquiries..."
                  className="form-textarea"
                />
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="modal-footer">
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleGenerateDraft}
                  disabled={loading}
                >
                  {loading ? "Preparing Draft..." : "Prepare Referral Draft"}
                </button>
              </div>
            </div>
          ) : (
            <div className="referral-preview-box">
              <div className="referral-success-badge">
                ✓ Referral #{referralResult.referral_id} Prepared ({referralResult.status})
              </div>

              <div className="preview-details">
                <p>
                  <strong>Receiving Facility:</strong> {referralResult.receiving_facility}
                </p>
                <p>
                  <strong>Specialty:</strong> {referralResult.specialty_required} • <strong>Priority:</strong>{" "}
                  {referralResult.priority}
                </p>
                <div className="preview-summary-box">
                  <strong>Clinical Summary:</strong>
                  <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0 0", fontFamily: "inherit" }}>
                    {referralResult.clinical_summary}
                  </pre>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "20px" }}>
                <button className="btn-secondary" onClick={() => setReferralResult(null)}>
                  ← Edit Draft
                </button>
                {referralResult.status !== "APPROVED" && (
                  <button className="btn-success" onClick={handleApprove} disabled={loading}>
                    Approve & Seal Referral
                  </button>
                )}
                <button className="btn-print" onClick={handlePrint}>
                  🖨️ Print Transfer Slip (PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
