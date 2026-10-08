// ============================================================
// HealthTriage AI - Doctor Visit Copilot (Section 20)
// Pre-consultation briefing generator, symptom timeline,
// vital trends, report findings, and questions for doctor.
// ============================================================

import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function DoctorVisitCopilot({ goTo = () => {} }) {
  const token = localStorage.getItem("healthtriage_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  const [concern, setConcern] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const fetchBrief = async (customConcern = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/copilot/doctor-visit-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_concern: customConcern || concern || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate consultation briefing.");
      }

      const data = await res.json();
      setBrief(data.brief);
    } catch (err) {
      setError(err.message || "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBrief();
    }
  }, []);

  const handlePrint = () => {
    const printUrl = `${API_URL}/api/copilot/doctor-visit-summary/print${
      concern ? `?concern=${encodeURIComponent(concern)}` : ""
    }`;
    window.open(printUrl, "_blank");
  };

  const toggleQuestion = (idx) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="copilot-container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      {/* Header Banner */}
      <div
        className="copilot-header"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "#ffffff",
          padding: "28px 32px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", marginBottom: "10px", letterSpacing: "0.5px" }}>
              <span>🩺</span> DOCTOR VISIT COPILOT
            </div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "700" }}>
              Pre-Consultation Clinical Briefing
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", maxWidth: "600px" }}>
              Prepare for your upcoming medical appointment. This concise one-page summary organizes your symptoms, vital sign trends, and questions to ask your doctor.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handlePrint}
              disabled={loading || !brief}
              style={{
                background: "#ffffff",
                color: "#1e3a8a",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🖨️</span> Print Consultation Slip
            </button>
          </div>
        </div>
      </div>

      {/* Primary Concern Input */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "20px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: "24px",
          border: "1px solid #e2e8f0",
        }}
      >
        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
          What is your primary reason or concern for this doctor visit?
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="e.g. Follow-up for high blood pressure, persistent dry cough, rash on arm..."
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchBrief(concern)}
          />
          <button
            onClick={() => fetchBrief(concern)}
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {loading ? "Updating..." : "Update Briefing"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", borderLeft: "4px solid #ef4444", padding: "14px 18px", borderRadius: "8px", color: "#991b1b", marginBottom: "20px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {loading && !brief && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <p>Compiling your health records and generating doctor visit briefing...</p>
        </div>
      )}

      {brief && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left Column: Summary & Vitals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Patient & Appointment Card */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👤</span> Patient Profile & Visit Details
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "12px", display: "block" }}>Patient Name</span>
                  <strong style={{ color: "#1e293b" }}>{brief.patient_name || user?.full_name || "Patient"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "12px", display: "block" }}>Date Prepared</span>
                  <span style={{ color: "#1e293b" }}>{new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#64748b", fontSize: "12px", display: "block" }}>Chief Complaint</span>
                  <span style={{ color: "#2563eb", fontWeight: "600" }}>{brief.chief_complaint || "Routine Clinical Assessment"}</span>
                </div>
              </div>
            </div>

            {/* Vital Sign Snapshot */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📊</span> Recent Vital Sign Trends
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Blood Pressure</span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginTop: "4px" }}>
                    {brief.vitals_summary?.blood_pressure || "Not recorded"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Heart Rate</span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginTop: "4px" }}>
                    {brief.vitals_summary?.heart_rate || "Not recorded"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Oxygen (SpO2)</span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginTop: "4px" }}>
                    {brief.vitals_summary?.spo2 || "Not recorded"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Temperature</span>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginTop: "4px" }}>
                    {brief.vitals_summary?.temperature || "Not recorded"}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Medications & Reports */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💊</span> Medications & Lab Reports
              </h3>
              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Current Medications</span>
                {brief.active_medications && brief.active_medications.length > 0 ? (
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "#1e293b" }}>
                    {brief.active_medications.map((m, i) => (
                      <li key={i}>{typeof m === "string" ? m : `${m.name || m.medication_name} (${m.dosage || "Standard"})`}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>No active medications recorded.</p>
                )}
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Uploaded Medical Reports</span>
                {brief.recent_reports && brief.recent_reports.length > 0 ? (
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "#1e293b" }}>
                    {brief.recent_reports.map((r, i) => (
                      <li key={i}>{typeof r === "string" ? r : `${r.test_name || r.title || "Report"} (${r.date || "Recent"})`}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>No recent lab reports uploaded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Questions & Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Suggested Questions to Ask Doctor */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>❓</span> Questions to Ask Your Doctor
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Select to remember</span>
              </div>
              <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#64748b" }}>
                Patients often forget questions during consultations. Use this checklist during your appointment:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(brief.questions_to_ask || [
                  "What could be causing these symptoms given my vitals?",
                  "Are there specific diagnostic tests or lab work you recommend?",
                  "Are my current medications still optimal or do they need adjustments?",
                  "What warning signs should prompt immediate emergency care?",
                  "When should I schedule a follow-up visit?",
                ]).map((q, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleQuestion(idx)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: checkedQuestions[idx] ? "#eff6ff" : "#f8fafc",
                      border: checkedQuestions[idx] ? "1px solid #bfdbfe" : "1px solid #f1f5f9",
                      cursor: "pointer",
                      fontSize: "13.5px",
                      color: checkedQuestions[idx] ? "#1d4ed8" : "#334155",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedQuestions[idx]}
                      onChange={() => {}}
                      style={{ marginTop: "3px" }}
                    />
                    <span>{q}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Symptom Progression & Context */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⏱️</span> Symptom Progression & Context
              </h3>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#334155", lineHeight: 1.6 }}>
                {brief.symptom_progression || (
                  <p style={{ margin: 0 }}>
                    Reported symptoms have been documented in recent triage check-ins. Bring this summary to your treating physician to review symptom onset, changes in intensity, and relevant life context.
                  </p>
                )}
              </div>
            </div>

            {/* Mandatory Safety Notice */}
            <div style={{ background: "#fef3c7", borderRadius: "14px", padding: "18px 20px", border: "1px solid #fde68a", color: "#92400e", fontSize: "13px", lineHeight: 1.5 }}>
              <strong>⚠️ Healthcare Copilot Notice:</strong> This pre-consultation briefing is generated to assist patient communication with their doctor. It is NOT a clinical diagnosis, medical record, or prescription. Always consult a qualified medical professional for treatment decisions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
