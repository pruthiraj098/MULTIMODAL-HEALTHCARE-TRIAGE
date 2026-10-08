// ============================================================
// HealthTriage AI - Doctor Clinical Workspace (Section 8 & 19)
// Comprehensive Physician Decision Support & Treatment Planning
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../../config";

export default function DoctorWorkspace({
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

  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "assigned" | "patient_workspace" | "treatment_plans"

  // Selected Patient for Clinical Workspace
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [patientTimeline, setPatientTimeline] = useState([]);
  const [patientPlans, setPatientPlans] = useState([]);

  // Treatment Plan Formulation Form State
  const [assessmentText, setAssessmentText] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [testsRecommended, setTestsRecommended] = useState("");
  const [lifestyleGuidance, setLifestyleGuidance] = useState("");
  const [planMeds, setPlanMeds] = useState([
    {
      medicine_name: "",
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration_days: 5,
      food_relation: "After food",
      time_of_day: "Morning & Night",
      instructions: "Take with warm water"
    }
  ]);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");

  // Quick Prescriptions presets
  const prescriptionPresets = [
    {
      name: "Amoxicillin-Clavulanate 625mg",
      dosage: "625 mg",
      frequency: "Twice daily",
      duration: 5,
      food: "After food",
      time: "Morning & Night",
      instr: "Complete full course. Do not skip doses."
    },
    {
      name: "Paracetamol 650mg",
      dosage: "650 mg",
      frequency: "SOS / Max 3 times daily",
      duration: 3,
      food: "After food",
      time: "As needed",
      instr: "For fever >100°F or severe body ache."
    },
    {
      name: "Azithromycin 500mg",
      dosage: "500 mg",
      frequency: "Once daily",
      duration: 3,
      food: "1 hour before food",
      time: "Morning",
      instr: "Take at the exact same hour each day."
    },
    {
      name: "ORS Electrolyte Sachet",
      dosage: "1 sachet in 1L water",
      frequency: "Throughout day",
      duration: 3,
      food: "After loose stools",
      time: "Daytime",
      instr: "Maintain hydration. Discard solution after 24h."
    },
    {
      name: "Pantoprazole 40mg",
      dosage: "40 mg",
      frequency: "Once daily",
      duration: 14,
      food: "30 mins before breakfast",
      time: "Morning",
      instr: "Swallow whole, do not crush."
    }
  ];

  // Fetch Workspace Data
  const fetchWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/doctor/workspace`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceData(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Unable to load doctor workspace.");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  // Select a Case to open in Patient Clinical Workspace
  const handleSelectCase = async (session) => {
    setSelectedCase(session);
    setActiveTab("patient_workspace");
    setLoadingCase(true);
    setPlanSuccessMsg("");

    // Reset Treatment Plan Form
    setAssessmentText(
      session.clinical_summary ||
      session.symptoms ? `Clinical review of: ${session.symptoms}. Patient evaluated.` : ""
    );
    setDiagnosisNotes("");
    setFollowUpDate("");
    setTestsRecommended("");
    setLifestyleGuidance("Adequate hydration and rest. Monitor symptoms.");

    try {
      // 1. Fetch case detail
      const cRes = await fetch(`${API_URL}/api/queue/case/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.case) setSelectedCase(cData.case);
      }

      // 2. Fetch patient timeline if user_id exists
      const pId = session.user_id || session.patient_id;
      if (pId) {
        const tRes = await fetch(`${API_URL}/api/health-intelligence/timeline?patient_id=${pId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          setPatientTimeline(tData.events || []);
        }

        // 3. Fetch past treatment plans
        const plRes = await fetch(`${API_URL}/api/treatment-plans/patient/${pId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (plRes.ok) {
          const plData = await plRes.json();
          setPatientPlans(plData.plans || []);
        }
      }
    } catch (err) {
      console.error("Error loading patient clinical context:", err);
    } finally {
      setLoadingCase(false);
    }
  };

  // Add medication row to form
  const handleAddMedRow = () => {
    setPlanMeds([
      ...planMeds,
      {
        medicine_name: "",
        dosage: "1 tablet",
        frequency: "Once daily",
        duration_days: 5,
        food_relation: "After food",
        time_of_day: "Morning",
        instructions: ""
      }
    ]);
  };

  // Update medication row
  const handleMedChange = (index, field, value) => {
    const updated = [...planMeds];
    updated[index][field] = value;
    setPlanMeds(updated);
  };

  // Remove medication row
  const handleRemoveMedRow = (index) => {
    setPlanMeds(planMeds.filter((_, i) => i !== index));
  };

  // Apply a preset
  const handleApplyPreset = (preset) => {
    setPlanMeds([
      ...planMeds.filter((m) => m.medicine_name.trim() !== ""),
      {
        medicine_name: preset.name,
        dosage: preset.dosage,
        frequency: preset.frequency,
        duration_days: preset.duration,
        food_relation: preset.food,
        time_of_day: preset.time,
        instructions: preset.instr
      }
    ]);
  };

  // Submit Treatment Plan
  const handleSubmitTreatmentPlan = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    const patientId = selectedCase.user_id || selectedCase.patient_id;
    if (!patientId) {
      alert("Notice: This patient is in walk-in / triage session mode. Plan will be sealed against this clinical session.");
    }

    if (!assessmentText.trim()) {
      alert("Please enter a clinical assessment before finalizing the treatment plan.");
      return;
    }

    setSubmittingPlan(true);
    setPlanSuccessMsg("");

    try {
      const validMeds = planMeds.filter((m) => m.medicine_name.trim() !== "");

      const res = await fetch(`${API_URL}/api/treatment-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: patientId || 1, // Fallback to current patient slot if guest
          clinical_assessment: assessmentText.trim(),
          diagnosis_notes: diagnosisNotes.trim() || null,
          follow_up_date: followUpDate || null,
          tests_recommended: testsRecommended.trim() || null,
          lifestyle_guidance: lifestyleGuidance.trim() || null,
          session_id: selectedCase.id,
          medications: validMeds
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlanSuccessMsg("✓ Clinician Treatment Plan Approved & Sealed. Prescriptions synced with patient timetable.");
        fetchWorkspace();
      } else {
        alert(data.detail || data.message || "Failed to submit treatment plan.");
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const counts = workspaceData?.counts || { all: 0, emergency: 0, urgent: 0, routine: 0 };
  const allCases = workspaceData?.today_queue || [];
  const assignedPatients = workspaceData?.assigned_patients || [];
  const highPriority = workspaceData?.high_priority_cases || [];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Workspace Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "24px 30px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.25)"
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
            <span>👨‍⚕️</span> CLINICAL WORKSPACE
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 4px 0" }}>
            Doctor Clinical Workspace
          </h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: 0 }}>
            Physician decision support, patient longitudinal review, and clinician-approved treatment planning.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
              Dr. {user?.full_name || "Physician"}
            </div>
            <div style={{ fontSize: "11px", color: "#38bdf8" }}>Licensed Medical Practitioner</div>
          </div>
          <button
            onClick={() => goTo("/queue")}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Triage Queue
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #dc2626" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Critical Emergencies</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{counts.emergency || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Immediate clinical attention</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Urgent Queue</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#f59e0b", marginTop: "4px" }}>{counts.urgent || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Priority assessment needed</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #2563eb" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Assigned to Me</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{assignedPatients.length}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Active patient caseload</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", borderLeft: "5px solid #10b981" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Today Cases</div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>{counts.all || 0}</div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Facility triage volume</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("queue")}
          style={{
            background: activeTab === "queue" ? "#2563eb" : "#f1f5f9",
            color: activeTab === "queue" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          📋 Today's Queue &amp; High Priority ({allCases.length})
        </button>
        <button
          onClick={() => setActiveTab("assigned")}
          style={{
            background: activeTab === "assigned" ? "#2563eb" : "#f1f5f9",
            color: activeTab === "assigned" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          🧑‍⚕️ Assigned Patients ({assignedPatients.length})
        </button>
        {selectedCase && (
          <button
            onClick={() => setActiveTab("patient_workspace")}
            style={{
              background: activeTab === "patient_workspace" ? "#059669" : "#ecfdf5",
              color: activeTab === "patient_workspace" ? "#ffffff" : "#065f46",
              border: "none",
              borderRadius: "10px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            🔬 Patient Workspace: {selectedCase.patient_name || "Active Session"}
          </button>
        )}
      </div>

      {/* TAB 1: TODAY'S QUEUE & HIGH PRIORITY PATIENTS */}
      {activeTab === "queue" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
                Active Patient Queue
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Select any patient to launch the complete Clinical Workspace with Treatment Plan Creator.
              </p>
            </div>
            <button
              onClick={fetchWorkspace}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
            >
              🔄 Refresh Queue
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading cases...</div>
          ) : allCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No patients in current queue.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {allCases.map((c) => {
                const isEmergency = c.triage_level === "EMERGENCY" || c.is_emergency;
                const isUrgent = c.triage_level === "URGENT";
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    style={{
                      border: isEmergency ? "2px solid #ef4444" : isUrgent ? "1px solid #f59e0b" : "1px solid #e2e8f0",
                      background: isEmergency ? "#fff5f5" : "#ffffff",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
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
                        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                          Case #{c.id}
                        </span>
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#334155" }}>
                        <strong>Chief Complaint:</strong> {c.symptoms || "General clinical check-in"}
                      </div>
                      {c.safety_warnings && c.safety_warnings.length > 0 && (
                        <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                          ⚠️ {c.safety_warnings[0]}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          fontSize: "12.5px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Examine &amp; Prescribe →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNED PATIENTS */}
      {activeTab === "assigned" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
            Physician Assigned Patient Roster
          </h3>
          {assignedPatients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              No specific patients permanently assigned. You can review all cases from Today's Queue.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {assignedPatients.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 4px 0", color: "#0f172a" }}>
                      {p.full_name}
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                      Email: {p.email} • Assigned: {p.assigned_at ? new Date(p.assigned_at).toLocaleDateString() : "Active"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectCase({ id: p.id, patient_name: p.full_name, user_id: p.id, symptoms: "Assigned follow-up" })}
                    style={{
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Open Clinical Record →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETE PATIENT CLINICAL WORKSPACE & TREATMENT PLAN CREATOR */}
      {activeTab === "patient_workspace" && selectedCase && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px" }}>
          {/* Left Column: Patient Case Context & Timeline */}
          <div>
            {/* Patient Header Card */}
            <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: selectedCase.triage_level === "EMERGENCY" ? "#dc2626" : selectedCase.triage_level === "URGENT" ? "#d97706" : "#059669",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      {selectedCase.triage_level || "ROUTINE"}
                    </span>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                      {selectedCase.patient_name || "Patient"}
                    </h2>
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    Age: {selectedCase.age || "N/A"} • Gender: {selectedCase.gender || "N/A"} • Case ID: #{selectedCase.id}
                  </div>
                </div>

                <button
                  onClick={() => onOpenReferral(selectedCase)}
                  style={{
                    background: "#7c3aed",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ↗ Create Specialist Referral
                </button>
              </div>

              {/* Symptoms */}
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                  Chief Complaint &amp; Symptoms
                </div>
                <div style={{ fontSize: "14px", color: "#0f172a" }}>
                  {selectedCase.symptoms || "No chief complaint recorded."}
                </div>
              </div>

              {/* Recorded Vitals Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Heart Rate</div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: selectedCase.heart_rate > 100 ? "#dc2626" : "#0f172a" }}>
                    {selectedCase.heart_rate ? `${selectedCase.heart_rate} bpm` : "—"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>SpO2</div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: selectedCase.spo2 < 95 ? "#dc2626" : "#0f172a" }}>
                    {selectedCase.spo2 ? `${selectedCase.spo2}%` : "—"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Blood Pressure</div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    {selectedCase.systolic_bp ? `${selectedCase.systolic_bp}/${selectedCase.diastolic_bp || 80}` : "—"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Temperature</div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: selectedCase.temperature > 100 ? "#dc2626" : "#0f172a" }}>
                    {selectedCase.temperature ? `${selectedCase.temperature}°` : "—"}
                  </div>
                </div>
              </div>

              {/* AI Triage Synthesis Note */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", marginBottom: "6px" }}>
                  ✦ AI-Assisted Clinical Summary Note (For Decision Support)
                </div>
                <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                  {selectedCase.screen_summary || selectedCase.triage_result || "Triage evaluation completed without acute red flags."}
                </div>
              </div>
            </div>

            {/* Longitudinal Health Timeline for this Patient */}
            <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
                Longitudinal Patient Health Timeline
              </h3>
              {patientTimeline.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#64748b", padding: "10px 0" }}>
                  No prior longitudinal history on file for this patient.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {patientTimeline.slice(0, 6).map((ev) => (
                    <div key={ev.id} style={{ display: "flex", gap: "12px", padding: "10px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "18px" }}>{ev.icon}</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{ev.title}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{ev.summary}</div>
                        <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "2px" }}>{ev.date ? new Date(ev.date).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: CLINICIAN TREATMENT PLAN CREATOR */}
          <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                  FORMULATION DESK
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "4px 0 0 0" }}>
                  Clinician Treatment Plan
                </h3>
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                Final Decision: <strong>Physician</strong>
              </div>
            </div>

            {planSuccessMsg && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                {planSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitTreatmentPlan}>
              {/* Clinical Assessment */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Clinical Assessment &amp; Findings *
                </label>
                <textarea
                  rows={3}
                  value={assessmentText}
                  onChange={(e) => setAssessmentText(e.target.value)}
                  placeholder="e.g. Acute upper respiratory infection with mild tonsillar exudate. Stable vitals."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Diagnosis Notes */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Working Diagnosis / ICD-11 Reference
                </label>
                <input
                  type="text"
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  placeholder="e.g. CA40 (Viral pharyngitis) / Non-streptococcal"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                />
              </div>

              {/* Quick Prescribing Presets */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Quick Pharmacopeia Presets:
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {prescriptionPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        cursor: "pointer",
                        color: "#334155"
                      }}
                    >
                      + {p.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prescribed Medications Table */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155" }}>
                    Prescribed Medications ({planMeds.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    + Add Medicine
                  </button>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {planMeds.map((med, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr 24px",
                        gap: "8px",
                        alignItems: "center"
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Amoxicillin)"
                        value={med.medicine_name}
                        onChange={(e) => handleMedChange(idx, "medicine_name", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                      />
                      <input
                        type="text"
                        placeholder="Dose (e.g. 500mg)"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 1-0-1)"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedRow(idx)}
                        style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up & Lab Orders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Recommended Lab Tests
                  </label>
                  <input
                    type="text"
                    value={testsRecommended}
                    onChange={(e) => setTestsRecommended(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine"
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* Lifestyle / Diet Instructions */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Dietary &amp; Recovery Guidance (Explained to patient by SANA)
                </label>
                <input
                  type="text"
                  value={lifestyleGuidance}
                  onChange={(e) => setLifestyleGuidance(e.target.value)}
                  placeholder="e.g. Drink warm fluids, avoid heavy salt, rest for 48 hours"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingPlan}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "14.5px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)"
                }}
              >
                {submittingPlan ? "Sealing Treatment Plan..." : "✓ Approve & Seal Clinician Treatment Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
