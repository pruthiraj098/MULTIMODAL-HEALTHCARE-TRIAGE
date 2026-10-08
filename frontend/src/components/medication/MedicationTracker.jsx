import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config";

export default function MedicationTracker({ goTo, embedded = false }) {
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "medications" | "interactions" | "prescription"
  const [medications, setMedications] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    schedule: { Morning: [], Afternoon: [], Evening: [], Night: [] },
    summary: { total_doses: 0, taken: 0, missed: 0, pending: 0 }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [interactions, setInteractions] = useState([]);
  const [foodWarnings, setFoodWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  // Add medication modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    time_of_day: "Morning",
    instructions: "",
    food_warnings: ""
  });

  // Missed dose state
  const [selectedMissedMed, setSelectedMissedMed] = useState("");
  const [missedGuidance, setMissedGuidance] = useState(null);

  // Prescription scan state
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const prescriptionInputRef = useRef(null);

  // Custom interaction check input
  const [customMedInput, setCustomMedInput] = useState("");
  const [checkingCustom, setCheckingCustom] = useState(false);
  const [customInteractions, setCustomInteractions] = useState(null);

  const token = localStorage.getItem("healthtriage_token");

  // Load medications & schedule
  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");

      // Fetch medications & active interactions
      const medRes = await fetch(`${API_URL}/api/medications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedications(medData.medications || []);
        setInteractions(medData.interactions || []);
        setFoodWarnings(medData.food_warnings || []);
      }

      // Fetch schedule for current date
      const schedRes = await fetch(`${API_URL}/api/medications/schedule?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setScheduleData(schedData);
      }
    } catch (err) {
      console.error("Error loading medication data:", err);
      setError("Unable to load medication schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleLogDose = async (medId, timeOfDay, status) => {
    try {
      const res = await fetch(`${API_URL}/api/medications/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medication_id: medId,
          scheduled_date: selectedDate,
          time_of_day: timeOfDay,
          status: status
        })
      });

      if (res.ok) {
        setActionMessage(`Dose marked as ${status}!`);
        setTimeout(() => setActionMessage(""), 2500);
        // Refresh schedule
        const schedRes = await fetch(`${API_URL}/api/medications/schedule?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (schedRes.ok) {
          const updated = await schedRes.json();
          setScheduleData(updated);
        }
      }
    } catch (err) {
      console.error("Error logging dose:", err);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim() || !medForm.dosage.trim()) {
      setError("Please provide at least a medication name and dosage.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: medForm.name.trim(),
          dosage: medForm.dosage.trim(),
          frequency: medForm.frequency,
          time_of_day: medForm.time_of_day,
          instructions: medForm.instructions.trim(),
          food_warnings: medForm.food_warnings.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to add medication.");
      }

      setModalOpen(false);
      setMedForm({
        name: "",
        dosage: "",
        frequency: "Once daily",
        time_of_day: "Morning",
        instructions: "",
        food_warnings: ""
      });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to add medication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMedication = async (medId) => {
    if (!confirm("Are you sure you want to remove this medication from your schedule?")) return;
    try {
      const res = await fetch(`${API_URL}/api/medications/${medId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error deleting medication:", err);
    }
  };

  const handleMissedDoseCheck = async (medName) => {
    if (!medName) return;
    setSelectedMissedMed(medName);
    try {
      const res = await fetch(`${API_URL}/api/medications/missed-dose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ medication_name: medName })
      });
      if (res.ok) {
        const data = await res.json();
        setMissedGuidance(data);
      }
    } catch (err) {
      console.error("Error fetching missed dose guidance:", err);
    }
  };

  const handleCustomInteractionCheck = async (e) => {
    e.preventDefault();
    if (!customMedInput.trim()) return;

    setCheckingCustom(true);
    try {
      const medList = customMedInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/api/medications/check-interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ medications: medList })
      });
      if (res.ok) {
        const data = await res.json();
        setCustomInteractions(data);
      }
    } catch (err) {
      console.error("Error checking custom interactions:", err);
    } finally {
      setCheckingCustom(false);
    }
  };

  const handlePrescriptionFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setScanPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setScanPreview(null);
    }
  };

  const handleScanPrescription = async (e) => {
    e.preventDefault();
    if (!scanFile) return;

    setScanning(true);
    setError("");

    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(scanFile);
      });

      const res = await fetch(`${API_URL}/api/medications/scan-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          file_data: base64Data,
          mime_type: scanFile.type,
          file_name: scanFile.name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to scan prescription.");
      }

      setScannedResult(data);
    } catch (err) {
      setError(err.message || "Failed to process prescription.");
    } finally {
      setScanning(false);
    }
  };

  const handleAddScannedMed = async (med) => {
    try {
      const res = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "Once daily",
          time_of_day: med.time_of_day || "Morning",
          instructions: med.instructions || "",
          food_warnings: med.food_warnings || ""
        })
      });
      if (res.ok) {
        setActionMessage(`Added ${med.name} to schedule!`);
        setTimeout(() => setActionMessage(""), 2500);
        loadData();
      }
    } catch (err) {
      console.error("Error adding scanned med:", err);
    }
  };

  const getSeverityStyle = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case "severe":
        return { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "SEVERE INTERACTION", icon: "🔴" };
      case "moderate":
        return { bg: "#fffbeb", border: "#fde68a", text: "#b45309", label: "MODERATE INTERACTION", icon: "🟡" };
      default:
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", label: "MINOR INTERACTION", icon: "🟢" };
    }
  };

  return (
    <div className="medication-guidance-page" style={{ maxWidth: embedded ? "100%" : "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      {!embedded && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "24px" }}>💊</span>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              Medication Guidance & Tracker
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#f3e8ff",
                color: "#7e22ce",
                padding: "3px 10px",
                borderRadius: "9999px"
              }}
            >
              Drug Interactions & Schedule
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            Track daily doses, check drug-drug conflicts, review food/alcohol warnings, get missed dose safe protocols, and scan doctor prescriptions.
          </p>
        </div>
      )}

      {/* Action Notice Banner */}
      {actionMessage && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#047857",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "16px"
          }}
        >
          ✓ {actionMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
          marginBottom: "24px",
          flexWrap: "wrap"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          style={{
            background: activeTab === "schedule" ? "#2563eb" : "#f8fafc",
            color: activeTab === "schedule" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>📅 Daily Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("medications")}
          style={{
            background: activeTab === "medications" ? "#2563eb" : "#f8fafc",
            color: activeTab === "medications" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>💊 My Medications ({medications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interactions")}
          style={{
            background: activeTab === "interactions" ? "#2563eb" : "#f8fafc",
            color: activeTab === "interactions" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>⚡ Interaction Checker</span>
          {interactions.some((i) => i.severity === "Severe") && (
            <span style={{ background: "#dc2626", color: "#ffffff", borderRadius: "50%", padding: "2px 6px", fontSize: "10px" }}>!</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prescription")}
          style={{
            background: activeTab === "prescription" ? "#2563eb" : "#f8fafc",
            color: activeTab === "prescription" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>📷 Prescription Reader</span>
        </button>
      </div>

      {/* TAB 1: DAILY VISUAL SCHEDULE & TRACKER */}
      {activeTab === "schedule" && (
        <div>
          {/* Date Selector & Daily Adherence Bar */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Active Date
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: "700"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Adherence Summary Counter */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>TAKEN</span>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#047857" }}>
                  {scheduleData.summary?.taken || 0}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>MISSED</span>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#dc2626" }}>
                  {scheduleData.summary?.missed || 0}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>PENDING</span>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#f59e0b" }}>
                  {scheduleData.summary?.pending || 0}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              + Add Medication
            </button>
          </div>

          {/* 4 Visual Time Slots */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { slot: "Morning", icon: "🌅", desc: "Breakfast & Start of Day" },
              { slot: "Afternoon", icon: "☀️", desc: "Lunch & Midday" },
              { slot: "Evening", icon: "🌆", desc: "Dinner & Early Evening" },
              { slot: "Night", icon: "🌙", desc: "Bedtime" }
            ].map(({ slot, icon, desc }) => {
              const meds = scheduleData.schedule?.[slot] || [];

              return (
                <div
                  key={slot}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>{icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                          {slot}
                        </h3>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{desc}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                      {meds.length} Med{meds.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {meds.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                      No medications scheduled for {slot.toLowerCase()}.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {meds.map((med) => {
                        const isTaken = med.status === "taken";
                        const isMissed = med.status === "missed";

                        return (
                          <div
                            key={med.id}
                            style={{
                              background: isTaken ? "#f0fdf4" : isMissed ? "#fef2f2" : "#f8fafc",
                              borderRadius: "12px",
                              border: `1px solid ${isTaken ? "#bbf7d0" : isMissed ? "#fecaca" : "#e2e8f0"}`,
                              padding: "12px 14px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                {med.name}
                              </strong>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>
                                {med.dosage}
                              </span>
                            </div>

                            {med.instructions && (
                              <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b" }}>
                                ℹ️ {med.instructions}
                              </p>
                            )}

                            {med.food_warnings && (
                              <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#b45309", fontWeight: "600" }}>
                                ⚠️ {med.food_warnings}
                              </p>
                            )}

                            {/* Mark Buttons */}
                            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                              <button
                                type="button"
                                onClick={() => handleLogDose(med.id, slot, isTaken ? "pending" : "taken")}
                                style={{
                                  flex: 1,
                                  background: isTaken ? "#10b981" : "#ffffff",
                                  color: isTaken ? "#ffffff" : "#047857",
                                  border: `1px solid ${isTaken ? "#10b981" : "#a7f3d0"}`,
                                  borderRadius: "8px",
                                  padding: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer"
                                }}
                              >
                                {isTaken ? "✓ Taken" : "Mark Taken"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleLogDose(med.id, slot, isMissed ? "pending" : "missed")}
                                style={{
                                  background: isMissed ? "#dc2626" : "#ffffff",
                                  color: isMissed ? "#ffffff" : "#991b1b",
                                  border: `1px solid ${isMissed ? "#dc2626" : "#fca5a5"}`,
                                  borderRadius: "8px",
                                  padding: "6px 10px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer"
                                }}
                              >
                                {isMissed ? "✕ Missed" : "Missed"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY MEDICATIONS LIST & ADD */}
      {activeTab === "medications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                Active Medication Regimen
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Medications recorded in your profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              + Add Medication
            </button>
          </div>

          {medications.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>💊</div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800" }}>No Medications Added</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                Add your current prescription or OTC medications to monitor daily doses and detect drug conflicts.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Add First Medication
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {medications.map((med) => (
                <div
                  key={med.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                          {med.name}
                        </h4>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb" }}>
                          {med.dosage} • {med.frequency}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#f1f5f9",
                          color: "#475569"
                        }}
                      >
                        {med.time_of_day}
                      </span>
                    </div>

                    {med.instructions && (
                      <p style={{ margin: "6px 0", fontSize: "12px", color: "#475569" }}>
                        <strong>Directions:</strong> {med.instructions}
                      </p>
                    )}

                    {med.food_warnings && (
                      <p style={{ margin: "6px 0", fontSize: "12px", color: "#b45309" }}>
                        <strong>Food Warning:</strong> {med.food_warnings}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => handleMissedDoseCheck(med.name)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Missed Dose Info →
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedication(med.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missed Dose Guidance Modal / Drawer */}
          {missedGuidance && (
            <div
              style={{
                marginTop: "24px",
                background: "#f0fdf4",
                borderRadius: "16px",
                border: "1px solid #bbf7d0",
                padding: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#166534" }}>
                  🕒 Missed Dose Guidance: {missedGuidance.medication}
                </h4>
                <button
                  type="button"
                  onClick={() => setMissedGuidance(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#14532d", lineHeight: "1.5" }}>
                <strong>Specific Advice: </strong>
                {missedGuidance.specific_guidance}
              </p>

              <p style={{ margin: 0, fontSize: "12px", color: "#166534", fontStyle: "italic" }}>
                <strong>General Rule: </strong>
                {missedGuidance.general_safe_protocol}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DRUG-DRUG & FOOD INTERACTION CHECKER */}
      {activeTab === "interactions" && (
        <div>
          {/* Active Interactions Overview */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
              Active Regimen Interaction Analysis
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Continuous clinical monitoring of conflicts between your active medications
            </p>

            {interactions.length === 0 ? (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <span style={{ fontSize: "24px" }}>✅</span>
                <div>
                  <strong style={{ color: "#166534", fontSize: "14px" }}>
                    No Critical Drug-Drug Interactions Detected
                  </strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#14532d" }}>
                    None of your currently tracked medications have documented severe or contraindicated interactions.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {interactions.map((int, idx) => {
                  const badge = getSeverityStyle(int.severity);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: badge.bg,
                        borderRadius: "14px",
                        border: `1px solid ${badge.border}`,
                        padding: "18px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                          {int.drug_a} + {int.drug_b}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            background: badge.border,
                            color: badge.text
                          }}
                        >
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#334155" }}>
                        <strong>Mechanism: </strong> {int.clinical_effect}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#1e293b", fontWeight: "600" }}>
                        <strong>Clinical Recommendation: </strong> {int.recommendation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Food & Lifestyle Warnings Grid */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
              Food & Dietary Restrictions
            </h3>

            {foodWarnings.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                No specific food or lifestyle restrictions flagged for your current medications.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {foodWarnings.map((fw, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#fffbeb",
                      borderRadius: "12px",
                      border: "1px solid #fde68a",
                      padding: "16px"
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", textTransform: "uppercase" }}>
                      {fw.medication}
                    </span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#92400e", margin: "4px 0" }}>
                      Avoid: {fw.avoid}
                    </strong>
                    <p style={{ margin: 0, fontSize: "12px", color: "#78350f", lineHeight: "1.4" }}>
                      {fw.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Checker Tool */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px"
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
              Check New Medications Before Taking
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Enter any two or more medication names separated by commas (e.g. Warfarin, Aspirin, Metformin) to test for interactions:
            </p>

            <form onSubmit={handleCustomInteractionCheck} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={customMedInput}
                onChange={(e) => setCustomMedInput(e.target.value)}
                placeholder="e.g. Lisinopril, Ibuprofen, Atorvastatin"
                style={{
                  flex: 1,
                  minWidth: "260px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
              <button
                type="submit"
                disabled={checkingCustom}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: checkingCustom ? "not-allowed" : "pointer"
                }}
              >
                {checkingCustom ? "Checking..." : "Check Conflict"}
              </button>
            </form>

            {customInteractions && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                  {customInteractions.summary}
                </p>
                {customInteractions.interactions?.map((ci, idx) => {
                  const b = getSeverityStyle(ci.severity);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: b.bg,
                        borderRadius: "10px",
                        border: `1px solid ${b.border}`,
                        padding: "12px",
                        marginBottom: "8px"
                      }}
                    >
                      <strong style={{ fontSize: "13px", color: b.text }}>
                        {ci.drug_a} + {ci.drug_b} ({ci.severity})
                      </strong>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#334155" }}>
                        {ci.clinical_effect}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PRESCRIPTION OCR READER */}
      {activeTab === "prescription" && (
        <div style={{ display: "grid", gridTemplateColumns: scannedResult ? "1fr 1fr" : "1fr", gap: "24px" }}>
          {/* Upload Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "20px" }}>📷</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Prescription Photo Reader
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Upload a photo of your doctor's handwritten or printed prescription
                </span>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleScanPrescription}>
              <div
                onClick={() => prescriptionInputRef.current?.click()}
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "12px",
                  padding: "30px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: scanFile ? "#f8fafc" : "#fafafa",
                  marginBottom: "16px"
                }}
              >
                <input
                  type="file"
                  ref={prescriptionInputRef}
                  onChange={handlePrescriptionFile}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  style={{ display: "none" }}
                />

                {scanFile ? (
                  <div>
                    {scanPreview ? (
                      <img src={scanPreview} alt="Prescription" style={{ maxHeight: "120px", borderRadius: "8px", marginBottom: "8px" }} />
                    ) : (
                      <div style={{ fontSize: "36px" }}>📄</div>
                    )}
                    <strong style={{ display: "block", fontSize: "13px" }}>{scanFile.name}</strong>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Click to choose another photo</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📸</div>
                    <strong style={{ fontSize: "14px", color: "#2563eb", display: "block" }}>
                      Upload Prescription Photo
                    </strong>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Take a clear photo with good lighting
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={scanning || !scanFile}
                style={{
                  width: "100%",
                  background: scanning || !scanFile ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: scanning || !scanFile ? "not-allowed" : "pointer"
                }}
              >
                {scanning ? "Transcribing with AI..." : "Transcribe Prescription"}
              </button>
            </form>
          </div>

          {/* Scanned Results */}
          {scannedResult && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px"
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                Extracted Medications ({scannedResult.medications?.length || 0})
              </h3>

              {/* Interaction Warning if Any */}
              {scannedResult.potential_interactions?.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
                  <strong style={{ color: "#dc2626", fontSize: "13px", display: "block" }}>
                    ⚠️ Potential Conflict with Existing Medications:
                  </strong>
                  <span style={{ fontSize: "12px", color: "#991b1b" }}>
                    {scannedResult.potential_interactions[0].drug_a} + {scannedResult.potential_interactions[0].drug_b}:{" "}
                    {scannedResult.potential_interactions[0].clinical_effect}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scannedResult.medications?.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      padding: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                        {m.name} {m.dosage}
                      </strong>
                      <span style={{ display: "block", fontSize: "12px", color: "#64748b" }}>
                        {m.frequency} • {m.time_of_day} {m.instructions ? `• ${m.instructions}` : ""}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddScannedMed(m)}
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      + Add to Regimen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <div
        style={{
          marginTop: "32px",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f1f5f9",
          fontSize: "11px",
          color: "#64748b",
          lineHeight: "1.5"
        }}
      >
        <strong>⚠️ Clinical Medication Safety Notice: </strong>
        Always verify with your pharmacist or prescribing doctor before initiating, stopping, or altering any medication schedule. This guidance is educational and does not constitute medical advice or a prescription.
      </div>

      {/* Add Medication Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                ➕ Add Medication
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontWeight: "700" }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddMedication}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Medication Name:
                </label>
                <input
                  type="text"
                  required
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  placeholder="e.g. Metformin, Lisinopril, Atorvastatin"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Dosage:
                  </label>
                  <input
                    type="text"
                    required
                    value={medForm.dosage}
                    onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                    placeholder="e.g. 500 mg, 10 mg"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Frequency:
                  </label>
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed">As needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Time of Day:
                </label>
                <select
                  value={medForm.time_of_day}
                  onChange={(e) => setMedForm({ ...medForm, time_of_day: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="Morning">🌅 Morning</option>
                  <option value="Afternoon">☀️ Afternoon</option>
                  <option value="Evening">🌆 Evening</option>
                  <option value="Night">🌙 Night</option>
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Special Instructions (Optional):
                </label>
                <input
                  type="text"
                  value={medForm.instructions}
                  onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                  placeholder="e.g. Take with food, Take on empty stomach"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Food / Alcohol Warnings (Optional):
                </label>
                <input
                  type="text"
                  value={medForm.food_warnings}
                  onChange={(e) => setMedForm({ ...medForm, food_warnings: e.target.value })}
                  placeholder="e.g. Avoid grapefruit, Avoid alcohol"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? "Saving..." : "Save Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
