// ============================================================
// HealthTriage AI - Nurse Dashboard & Intake Workspace (Section 9)
// Rapid Patient Intake, Vitals Monitoring, Triage Priority & Escalation
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../../config";

export default function NurseDashboard({
  goTo = () => {},
  onOpenReferral = () => {}
}) {
  const token = localStorage.getItem("healthtriage_token");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [nurseData, setNurseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "intake_form" | "monitoring"

  // Patient Intake Form State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Female");
  const [symptoms, setSymptoms] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [systolicBp, setSystolicBp] = useState("");
  const [diastolicBp, setDiastolicBp] = useState("");
  const [observations, setObservations] = useState("");
  const [escalateToDoctor, setEscalateToDoctor] = useState(false);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeSuccess, setIntakeSuccess] = useState(null);

  // Quick vital flag computation
  const vitalWarnings = useMemo(() => {
    const list = [];
    const hr = parseFloat(heartRate);
    const sp = parseFloat(spo2);
    const temp = parseFloat(temperature);
    const sys = parseFloat(systolicBp);

    if (hr > 130) list.push("🔴 Critical Tachycardia (HR > 130 bpm)");
    else if (hr > 100) list.push("🟡 Elevated Pulse (HR > 100 bpm)");
    else if (hr < 50) list.push("🔴 Bradycardia (HR < 50 bpm)");

    if (sp < 90) list.push("🔴 Severe Hypoxia (SpO2 < 90%) — Immediate O2 required");
    else if (sp < 95) list.push("🟡 Borderline Hypoxemia (SpO2 < 95%)");

    if (temp > 102) list.push("🔴 High Grade Pyrexia (Temp > 102°F)");
    else if (temp > 100) list.push("🟡 Febrile (Temp > 100°F)");

    if (sys > 180) list.push("🔴 Hypertensive Crisis (Systolic > 180 mmHg)");
    else if (sys < 90) list.push("🔴 Hypotension (Systolic < 90 mmHg)");

    return list;
  }, [heartRate, spo2, temperature, systolicBp]);

  // Fetch Nurse Overview
  const fetchNurseOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/nurse/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNurseData(data);
      }
    } catch (err) {
      console.error("Nurse overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurseOverview();
  }, []);

  // Submit Patient Intake
  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !symptoms.trim()) {
      alert("Patient name and primary symptoms are required.");
      return;
    }

    setSubmittingIntake(true);
    setIntakeSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/nurse/intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          age: patientAge ? parseInt(patientAge) : null,
          gender: patientGender,
          symptoms: symptoms.trim(),
          heart_rate: heartRate ? parseFloat(heartRate) : null,
          spo2: spo2 ? parseFloat(spo2) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          respiratory_rate: respiratoryRate ? parseFloat(respiratoryRate) : null,
          systolic_bp: systolicBp ? parseFloat(systolicBp) : null,
          diastolic_bp: diastolicBp ? parseFloat(diastolicBp) : null,
          observations: observations.trim() || null,
          escalate_to_doctor: escalateToDoctor || vitalWarnings.some((w) => w.startsWith("🔴"))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIntakeSuccess(data);
        // Reset form
        setPatientName("");
        setPatientAge("");
        setSymptoms("");
        setHeartRate("");
        setSpo2("");
        setTemperature("");
        setRespiratoryRate("");
        setSystolicBp("");
        setDiastolicBp("");
        setObservations("");
        setEscalateToDoctor(false);
        fetchNurseOverview();
      } else {
        alert(data.detail || data.message || "Failed to submit patient intake.");
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmittingIntake(false);
    }
  };

  const counts = nurseData?.counts || { all: 0, emergency: 0, urgent: 0, routine: 0 };
  const allCases = nurseData?.all_cases || [];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Top Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "24px 30px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 10px 25px -5px rgba(6, 95, 70, 0.3)"
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.2)", color: "#ffffff", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
            <span>👩‍⚕️</span> NURSING &amp; TRIAGE INTAKE
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 4px 0" }}>
            Nurse Dashboard &amp; Intake Desk
          </h1>
          <p style={{ fontSize: "13.5px", color: "#a7f3d0", margin: 0 }}>
            First-contact patient check-in, vitals monitoring, priority classification, and doctor escalation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.12)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)", textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
              Nurse {user?.full_name || "Clinical Nurse"}
            </div>
            <div style={{ fontSize: "11px", color: "#a7f3d0" }}>Nursing Officer • On Duty</div>
          </div>
          <button
            onClick={() => setActiveTab("intake_form")}
            style={{
              background: "#ffffff",
              color: "#065f46",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            }}
          >
            + New Patient Check-In
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #dc2626" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Emergency Triage</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{counts.emergency || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Immediate resuscitation / doctor alert</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Urgent Cases</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#f59e0b", marginTop: "4px" }}>{counts.urgent || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Priority nurse observation</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #10b981" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Routine OPD Intake</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>{counts.routine || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Stable outpatient queue</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #2563eb" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Intake Today</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{counts.all || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Total processed intake slips</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("queue")}
          style={{
            background: activeTab === "queue" ? "#065f46" : "#f1f5f9",
            color: activeTab === "queue" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          📋 Live Triage Queue ({allCases.length})
        </button>
        <button
          onClick={() => setActiveTab("intake_form")}
          style={{
            background: activeTab === "intake_form" ? "#065f46" : "#f1f5f9",
            color: activeTab === "intake_form" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          📝 Rapid Patient Intake &amp; Vitals Recording
        </button>
      </div>

      {/* TAB 1: LIVE TRIAGE QUEUE */}
      {activeTab === "queue" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
                Active Nursing Triage Queue
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Patients waiting for physician consultation or vital updates.
              </p>
            </div>
            <button
              onClick={fetchNurseOverview}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
            >
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading queue...</div>
          ) : allCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No patients in current nursing queue.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {allCases.map((c) => {
                const isEmergency = c.triage_level === "EMERGENCY" || c.is_emergency;
                const isUrgent = c.triage_level === "URGENT";
                return (
                  <div
                    key={c.id}
                    style={{
                      border: isEmergency ? "2px solid #ef4444" : isUrgent ? "1px solid #f59e0b" : "1px solid #e2e8f0",
                      background: isEmergency ? "#fff5f5" : "#ffffff",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span
                          style={{
                            background: isEmergency ? "#dc2626" : isUrgent ? "#d97706" : "#059669",
                            color: "#ffffff",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                          }}
                        >
                          {c.triage_level || "ROUTINE"}
                        </span>
                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                          {c.patient_name || "Patient"}
                        </strong>
                        <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                          {c.age ? `${c.age} yrs` : ""} {c.gender ? `• ${c.gender}` : ""}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Queue ID #{c.id}
                        </span>
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#334155" }}>
                        <strong>Symptoms:</strong> {c.symptoms}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => goTo("/queue")}
                        style={{
                          background: "#065f46",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Clinical Details &amp; Actions →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RAPID INTAKE & VITALS RECORDING FORM */}
      {activeTab === "intake_form" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
          {/* Intake Form */}
          <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "26px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
              Patient Intake &amp; Vital Signs Registration
            </h3>

            {intakeSuccess && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "14px", borderRadius: "12px", marginBottom: "20px" }}>
                <div style={{ fontWeight: "700", marginBottom: "4px" }}>✓ {intakeSuccess.message}</div>
                <div style={{ fontSize: "12.5px" }}>
                  Assigned Triage Priority: <strong>{intakeSuccess.triage_level}</strong> • Session ID: #{intakeSuccess.session_id}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitIntake}>
              {/* Patient Basic Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Full Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 42"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Symptoms */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Patient-Reported Symptoms &amp; Chief Complaint *
                </label>
                <textarea
                  rows={2}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. High fever for 3 days, dry cough, weakness, breathing difficulty on stairs."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit" }}
                />
              </div>

              {/* Vitals Recording Grid */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#065f46", textTransform: "uppercase", marginBottom: "10px" }}>
                  Clinical Vital Signs (Optional — Missing vitals will NOT block intake)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="e.g. 88"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="e.g. 96"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="e.g. 98.6"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      placeholder="e.g. 120"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      placeholder="e.g. 80"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Respiration Rate</label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="e.g. 18"
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Nurse Observations */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Nurse Observations / Physical Appearance
                </label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="e.g. Pallor visible, conscious and oriented, ambulatory without support."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Emergency Escalation Checkbox */}
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="escalateCheck"
                  checked={escalateToDoctor}
                  onChange={(e) => setEscalateToDoctor(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="escalateCheck" style={{ fontSize: "13px", color: "#b91c1c", fontWeight: "700" }}>
                  Escalate Immediately to Doctor (Forces Emergency Status)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingIntake}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "14.5px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(6, 95, 70, 0.3)"
                }}
              >
                {submittingIntake ? "Registering & Running Triage..." : "Save Patient Intake & Assign Triage Priority"}
              </button>
            </form>
          </div>

          {/* Right Column: Live Physiological Safety Gauge */}
          <div>
            <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
                Real-Time Physiological Risk Monitor
              </h4>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px 0" }}>
                Deterministic safety bounds evaluate vital numbers dynamically as you type.
              </p>

              {vitalWarnings.length === 0 ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "14px", borderRadius: "10px", fontSize: "13px", fontWeight: "600" }}>
                  ✓ All entered physiological values are within safe outpatient limits.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  {vitalWarnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        background: w.startsWith("🔴") ? "#fef2f2" : "#fffbeb",
                        border: w.startsWith("🔴") ? "1px solid #fecaca" : "1px solid #fde68a",
                        color: w.startsWith("🔴") ? "#991b1b" : "#92400e",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700"
                      }}
                    >
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                Nursing Intake Workflow Rules
              </h4>
              <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "#64748b", lineHeight: 1.65, margin: 0 }}>
                <li>Vital signs are optional — never deny or delay intake if a vitals instrument is unavailable.</li>
                <li>Red-flag physiological warnings will automatically bump the case to <strong>🔴 Emergency</strong> priority.</li>
                <li>Intake immediately syncs into the Doctor Clinical Workspace queue.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
