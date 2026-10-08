// ============================================================
// HealthTriage AI - Comprehensive Disease & Medication Intelligence Hub
// Full Integration of Disease Knowledge, Symptom Analysis,
// Best Next-Step, Pharmacopeia, Interaction Checker,
// Prescription Schedule, "What Changed?", and SANA Health Review
// ============================================================

import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function HealthIntelligenceHub({ goTo = () => {} }) {
  const token = localStorage.getItem("healthtriage_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  const [activeTab, setActiveTab] = useState("symptoms"); // "symptoms" | "diseases" | "medications" | "interactions" | "reports" | "schedule" | "health_review"
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tab 1: Symptom Analysis State
  const [symptomText, setSymptomText] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  // Tab 1b: Best Medicine Query State
  const [bestMedicineQuery, setBestMedicineQuery] = useState("");
  const [bestMedicineResult, setBestMedicineResult] = useState(null);
  const [loadingBestMed, setLoadingBestMed] = useState(false);

  // Tab 2: Disease Knowledge Explorer State
  const [diseases, setDiseases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);

  // Tab 3: Medication Knowledge State
  const [medications, setMedications] = useState([]);
  const [medSearch, setMedSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);

  // Tab 3b: Interaction Checker State
  const [checkMedList, setCheckMedList] = useState("Aspirin, Warfarin");
  const [checkAllergies, setCheckAllergies] = useState("");
  const [checkEgfr, setCheckEgfr] = useState("");
  const [checkPregnant, setCheckPregnant] = useState(false);
  const [interactionResult, setInteractionResult] = useState(null);
  const [loadingInteraction, setLoadingInteraction] = useState(false);

  // Tab 4: Compare Reports & "What Changed?"
  const [whatChangedData, setWhatChangedData] = useState(null);
  const [compareAllData, setCompareAllData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Tab 5: Prescription Schedule State
  const [dailySchedule, setDailySchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedTime, setNewMedTime] = useState("Morning");
  const [newMedFood, setNewMedFood] = useState("After food");

  // Tab 6: SANA Health Review State
  const [healthReviewData, setHealthReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Fetch Diseases
  const fetchDiseases = async () => {
    try {
      const url = new URL(`${API_URL}/api/intelligence/diseases`);
      if (diseaseSearch.trim()) url.searchParams.append("search", diseaseSearch.trim());
      if (selectedCategory && selectedCategory !== "ALL") url.searchParams.append("category", selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDiseases(data.diseases || []);
        if (data.categories) setCategories(["ALL", ...data.categories]);
      }
    } catch (err) {
      console.error("Diseases fetch error:", err);
    }
  };

  // Fetch Medications
  const fetchMedications = async () => {
    try {
      const url = new URL(`${API_URL}/api/intelligence/medications`);
      if (medSearch.trim()) url.searchParams.append("search", medSearch.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error("Medications fetch error:", err);
    }
  };

  // Fetch Schedule
  const fetchSchedule = async () => {
    if (!token) return;
    setLoadingSchedule(true);
    try {
      const res = await fetch(`${API_URL}/api/intelligence/schedule/daily`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailySchedule(data);
      }
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Fetch Reports Comparison
  const fetchReportsComparison = async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const [chgRes, cmpRes] = await Promise.all([
        fetch(`${API_URL}/api/intelligence/reports/what-changed`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/intelligence/reports/compare-all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (chgRes.ok) setWhatChangedData(await chgRes.json());
      if (cmpRes.ok) setCompareAllData(await cmpRes.json());
    } catch (err) {
      console.error("Reports comparison error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch Health Review
  const fetchHealthReview = async () => {
    if (!token) return;
    setLoadingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/intelligence/health-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHealthReviewData(data);
      }
    } catch (err) {
      console.error("Health review error:", err);
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
    fetchMedications();
  }, [diseaseSearch, selectedCategory, medSearch]);

  useEffect(() => {
    if (activeTab === "schedule") fetchSchedule();
    if (activeTab === "reports") fetchReportsComparison();
    if (activeTab === "health_review") fetchHealthReview();
  }, [activeTab]);

  // Symptom Analysis Handler
  const handleAnalyzeSymptoms = async () => {
    if (!symptomText.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/api/intelligence/analyze-symptoms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          symptoms: symptomText.trim(),
          duration: symptomDuration.trim() || undefined,
          age: patientAge ? parseInt(patientAge) : undefined,
          gender: patientGender || undefined
        })
      });
      if (!res.ok) throw new Error("Failed to analyze symptoms.");
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setErrorMsg(err.message || "Error analyzing symptoms.");
    } finally {
      setLoading(false);
    }
  };

  // Best Medicine Query Handler
  const handleQueryBestMedicine = async () => {
    if (!bestMedicineQuery.trim()) return;
    setLoadingBestMed(true);
    try {
      const res = await fetch(`${API_URL}/api/intelligence/best-medicine-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition_name: bestMedicineQuery.trim() })
      });
      if (res.ok) {
        setBestMedicineResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBestMed(false);
    }
  };

  // Interaction Checker Handler
  const handleCheckInteractions = async () => {
    const list = checkMedList.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return;
    setLoadingInteraction(true);
    try {
      const res = await fetch(`${API_URL}/api/intelligence/check-interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: list,
          allergies: checkAllergies.split(",").map((s) => s.trim()).filter(Boolean),
          kidney_function_egfr: checkEgfr ? parseFloat(checkEgfr) : undefined,
          is_pregnant: checkPregnant
        })
      });
      if (res.ok) {
        setInteractionResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInteraction(false);
    }
  };

  // Log Dose Handler
  const handleLogDose = async (medId, status, timeSlot) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/intelligence/schedule/log-dose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medication_id: medId,
          status: status,
          time_of_day: timeSlot
        })
      });
      if (res.ok) {
        fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Prescription Handler
  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDose.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/intelligence/schedule/create-from-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medication_name: newMedName.trim(),
          dosage: newMedDose.trim(),
          time_of_day: newMedTime,
          food_relation: newMedFood
        })
      });
      if (res.ok) {
        setShowAddPrescription(false);
        setNewMedName("");
        setNewMedDose("");
        fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "#ffffff",
          padding: "26px 32px",
          borderRadius: "18px",
          boxShadow: "0 10px 25px -5px rgba(67, 56, 202, 0.35)",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
            <span>🧠</span> SANA HEALTH INTELLIGENCE MODULE
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700" }}>
            Comprehensive Disease & Medication Intelligence
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", maxWidth: "750px" }}>
            Verified clinical conditions, multi-factor symptom analysis, Best Next-Step engine, pharmacopeia knowledge, multi-drug safety checker, and longitudinal report tracking.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "24px",
          paddingBottom: "4px"
        }}
      >
        {[
          { id: "symptoms", label: "🔍 Symptom Analyzer", icon: "🩺" },
          { id: "diseases", label: "📚 Disease Explorer", icon: "📖" },
          { id: "medications", label: "💊 Pharmacopeia", icon: "🧪" },
          { id: "interactions", label: "🛡️ Safety & Interactions", icon: "⚡" },
          { id: "reports", label: "📊 What Changed?", icon: "📈" },
          { id: "schedule", label: "⏰ Prescription Timetable", icon: "🗓️" },
          { id: "health_review", label: "📋 SANA 360° Health Review", icon: "🌟" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                border: "none",
                background: isActive ? "#4338ca" : "transparent",
                color: isActive ? "#ffffff" : "#475569",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: isActive ? "700" : "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: SYMPTOM ANALYZER & BEST NEXT STEP
          ========================================================= */}
      {activeTab === "symptoms" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Input Form */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h2 style={{ margin: "0 0 14px 0", fontSize: "18px", color: "#0f172a" }}>
              What symptoms are you experiencing?
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#64748b" }}>
              Describe what you feel. SANA correlates symptoms with clinical databases to suggest ranked possibilities and the safest next step.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Symptoms Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Sudden high fever with severe pain behind eyes and body aches for 3 days, mild nausea..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 days"
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAnalyzeSymptoms}
                disabled={loading || !symptomText.trim()}
                style={{
                  background: "#4338ca",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "6px"
                }}
              >
                {loading ? "Analyzing Clinical Knowledge..." : "Analyze Symptoms & Best Next Step"}
              </button>
            </div>

            {/* Best Medicine Query Box */}
            <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "18px" }}>💊</span>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>Best Medicine Safety Control:</strong>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#64748b" }}>
                Ask: "What is the best medicine for [condition]?" SANA explains medication classes and doctor considerations without autonomous prescribing.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Dengue, GERD..."
                  value={bestMedicineQuery}
                  onChange={(e) => setBestMedicineQuery(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
                <button
                  onClick={handleQueryBestMedicine}
                  disabled={loadingBestMed || !bestMedicineQuery.trim()}
                  style={{ background: "#312e81", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                >
                  {loadingBestMed ? "Checking..." : "Explain Options"}
                </button>
              </div>

              {bestMedicineResult && (
                <div style={{ marginTop: "14px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", lineHeight: 1.5 }}>
                  <div style={{ color: "#312e81", fontWeight: "700", marginBottom: "6px" }}>
                    Medication Approaches for {bestMedicineResult.condition_queried}:
                  </div>
                  <ul style={{ margin: "0 0 8px 0", paddingLeft: "20px" }}>
                    {bestMedicineResult.common_medication_classes.map((cls, i) => (
                      <li key={i}>{cls}</li>
                    ))}
                  </ul>
                  <div style={{ background: "#fef3c7", borderLeft: "3px solid #f59e0b", padding: "8px 12px", borderRadius: "6px", color: "#92400e", fontSize: "12px", marginTop: "8px" }}>
                    <strong>⚠️ Pharmacist Rule:</strong> {bestMedicineResult.disclaimer}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Output */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {errorMsg && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "14px", borderRadius: "10px", fontSize: "13.5px" }}>
                {errorMsg}
              </div>
            )}

            {!analysisResult && !loading && (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "40px 24px", textAlign: "center", border: "1px solid #e2e8f0", color: "#94a3b8" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🩺</div>
                <h3 style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "16px" }}>Clinical Assessment Pending</h3>
                <p style={{ margin: 0, fontSize: "13px" }}>
                  Enter your symptoms on the left to receive evidence-based possibilities, urgency level, and Best Next Step.
                </p>
              </div>
            )}

            {analysisResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Best Next Step Box */}
                {analysisResult.best_next_step && (
                  <div
                    style={{
                      background: analysisResult.best_next_step.action_code === "EMERGENCY_CARE_NOW" ? "#fef2f2" : analysisResult.best_next_step.action_code === "URGENT_EVALUATION" ? "#fffbeb" : "#eff6ff",
                      border: analysisResult.best_next_step.action_code === "EMERGENCY_CARE_NOW" ? "2px solid #ef4444" : analysisResult.best_next_step.action_code === "URGENT_EVALUATION" ? "2px solid #f59e0b" : "2px solid #3b82f6",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: analysisResult.best_next_step.action_code === "EMERGENCY_CARE_NOW" ? "#dc2626" : "#2563eb" }}>
                      ★ SAFEST NEXT STEP RECOMMENDATION
                    </div>
                    <h3 style={{ margin: "4px 0 8px 0", fontSize: "18px", color: "#0f172a" }}>
                      {analysisResult.best_next_step.headline}
                    </h3>
                    <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", color: "#334155", lineHeight: 1.5 }}>
                      {analysisResult.best_next_step.recommended_action}
                    </p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                      <span><strong>Urgency:</strong> {analysisResult.best_next_step.urgency_level}</span>
                      <span><strong>Timeframe:</strong> {analysisResult.best_next_step.timeframe}</span>
                    </div>
                  </div>
                )}

                {/* Ranked Possibilities */}
                <div style={{ background: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#0f172a" }}>
                    Ranked Possible Clinical Explanations:
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {analysisResult.ranked_possibilities && analysisResult.ranked_possibilities.length > 0 ? (
                      analysisResult.ranked_possibilities.map((p, i) => (
                        <div key={i} style={{ border: "1px solid #f1f5f9", borderRadius: "10px", padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "14px", color: "#1e293b" }}>{p.condition_name}</strong>
                            <span style={{ background: p.certainty_level === "Suspected condition" ? "#fef3c7" : "#e0e7ff", color: p.certainty_level === "Suspected condition" ? "#92400e" : "#3730a3", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                              {p.certainty_level}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 6px 0", fontSize: "12.5px", color: "#475569" }}>
                            {p.simple_explanation}
                          </p>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            <strong>Suggested Tests:</strong> {p.suggested_tests?.slice(0, 2).join(", ")}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                        No specific high-confidence matches found in standard acute index. Routine clinical assessment recommended.
                      </p>
                    )}
                  </div>
                </div>

                {/* Mandatory Disclaimer */}
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                  <strong>🔒 Clinical Safety Notice:</strong> {analysisResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: DISEASE EXPLORER
          ========================================================= */}
      {activeTab === "diseases" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
          {/* Left: Search & Categories */}
          <div>
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search diseases or symptoms..."
                value={diseaseSearch}
                onChange={(e) => setDiseaseSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0", maxHeight: "500px", overflowY: "auto" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "10px" }}>
                Categories ({categories.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: selectedCategory === cat ? "#4338ca" : "transparent",
                      color: selectedCategory === cat ? "#ffffff" : "#334155",
                      fontSize: "12.5px",
                      fontWeight: selectedCategory === cat ? "700" : "500",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Disease List & Detail Card */}
          <div>
            {selectedDisease ? (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                      {selectedDisease.category}
                    </span>
                    <h2 style={{ margin: "8px 0 4px 0", fontSize: "22px", color: "#0f172a" }}>
                      {selectedDisease.condition_name}
                    </h2>
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
                      {selectedDisease.simple_explanation}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDisease(null)}
                    style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer" }}
                  >
                    ← Back to List
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "14px" }}>Common Symptoms</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                      {selectedDisease.common_symptoms?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "12px", border: "1px solid #fee2e2" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "14px" }}>🚨 Emergency Warning Signs</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#b91c1c" }}>
                      {selectedDisease.emergency_warning_signs?.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "14px" }}>Typical Investigations & Tests</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                      {selectedDisease.typical_investigations?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "14px" }}>Medication Classes Commonly Used</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#334155" }}>
                      {selectedDisease.medication_classes_commonly_used?.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: "20px", padding: "14px", background: "#f1f5f9", borderRadius: "10px", fontSize: "12px", color: "#64748b" }}>
                  <strong>Source Authority:</strong> {selectedDisease.evidence_source} (Updated: {selectedDisease.last_updated})
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {diseases.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDisease(d)}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "18px",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#4338ca", textTransform: "uppercase" }}>
                      {d.category}
                    </span>
                    <h3 style={{ margin: "6px 0 6px 0", fontSize: "15px", color: "#0f172a" }}>
                      {d.condition_name}
                    </h3>
                    <p style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#64748b", lineHeight: 1.4 }}>
                      {d.simple_explanation.substring(0, 100)}...
                    </p>
                    <span style={{ color: "#4338ca", fontSize: "12px", fontWeight: "600" }}>
                      View Clinical Profile →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: PHARMACOPEIA & MEDICATION SAFETY
          ========================================================= */}
      {activeTab === "medications" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
          {/* Search Column */}
          <div>
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search generic or brand name..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "12px", border: "1px solid #e2e8f0", maxHeight: "500px", overflowY: "auto" }}>
              {medications.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMed(m)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: selectedMed?.id === m.id ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>{m.generic_name}</strong>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>{m.medication_class}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medication Detail Card */}
          <div>
            {selectedMed ? (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0" }}>
                <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                  {selectedMed.medication_class}
                </span>
                <h2 style={{ margin: "8px 0 4px 0", fontSize: "22px", color: "#0f172a" }}>
                  {selectedMed.generic_name}
                </h2>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                  <strong>Common Brands:</strong> {selectedMed.common_brand_names?.join(", ")}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13.5px", color: "#1e293b" }}>Mechanism & Purpose</h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.5 }}>{selectedMed.general_mechanism}</p>
                  </div>

                  <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13.5px", color: "#92400e" }}>⏰ Missed-Dose Safety Rule</h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#78350f", lineHeight: 1.5 }}>{selectedMed.missed_dose_safety}</p>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13.5px", color: "#1e293b" }}>Common Side Effects</h4>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#475569" }}>
                      {selectedMed.common_side_effects?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13.5px", color: "#1e293b" }}>Food & Lifestyle Precautions</h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.5 }}>{selectedMed.food_related_considerations}</p>
                  </div>
                </div>

                <div style={{ marginTop: "18px", background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "12px 16px", borderRadius: "8px", fontSize: "12.5px", color: "#991b1b" }}>
                  <strong>Important Warnings:</strong> {selectedMed.important_warnings?.join("; ")}
                </div>
              </div>
            ) : (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "60px 24px", textAlign: "center", border: "1px solid #e2e8f0", color: "#94a3b8" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🧪</div>
                <h3 style={{ margin: 0, color: "#475569" }}>Select a medication on the left to inspect verified pharmacology</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3b: MULTI-DRUG INTERACTION CHECKER
          ========================================================= */}
      {activeTab === "interactions" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#0f172a" }}>
              Multi-Drug & Organ Safety Audit
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
              Check for drug-drug interactions, food warnings, duplicate statin/NSAID therapies, allergies, and renal precautions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Medications to Check (Comma separated) *
                </label>
                <input
                  type="text"
                  value={checkMedList}
                  onChange={(e) => setCheckMedList(e.target.value)}
                  placeholder="e.g. Warfarin, Aspirin, Atorvastatin"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Documented Allergies (Optional)
                </label>
                <input
                  type="text"
                  value={checkAllergies}
                  onChange={(e) => setCheckAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Kidney eGFR (mL/min)
                  </label>
                  <input
                    type="number"
                    value={checkEgfr}
                    onChange={(e) => setCheckEgfr(e.target.value)}
                    placeholder="e.g. 25"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", paddingTop: "24px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checkPregnant}
                      onChange={(e) => setCheckPregnant(e.target.checked)}
                    />
                    <span>Patient is pregnant</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleCheckInteractions}
                disabled={loadingInteraction || !checkMedList.trim()}
                style={{
                  background: "#4338ca",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "8px"
                }}
              >
                {loadingInteraction ? "Auditing Combinations..." : "Run Safety Check"}
              </button>
            </div>
          </div>

          {/* Results Output */}
          <div>
            {interactionResult ? (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <div
                  style={{
                    background: interactionResult.has_severe_issue ? "#fef2f2" : "#f0fdf4",
                    border: interactionResult.has_severe_issue ? "1px solid #fecaca" : "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "16px"
                  }}
                >
                  <strong style={{ color: interactionResult.has_severe_issue ? "#b91c1c" : "#166534", fontSize: "15px" }}>
                    {interactionResult.headline}
                  </strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#475569" }}>
                    {interactionResult.recommendation_summary}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {interactionResult.alerts?.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: a.severity === "Severe" ? "#fff5f5" : "#f8fafc",
                        border: a.severity === "Severe" ? "1px solid #fed7d7" : "1px solid #f1f5f9"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13.5px", color: a.severity === "Severe" ? "#c53030" : "#1e293b" }}>{a.title}</strong>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: a.severity === "Severe" ? "#e53e3e" : "#d69e2e" }}>{a.severity}</span>
                      </div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "12.5px", color: "#4a5568" }}>{a.description}</p>
                      <div style={{ fontSize: "12px", color: "#2b6cb0", fontStyle: "italic" }}>👉 {a.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "60px 24px", textAlign: "center", border: "1px solid #e2e8f0", color: "#94a3b8" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛡️</div>
                <h3 style={{ margin: 0, color: "#475569" }}>Enter medications to run the live interaction and organ safety scan</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: COMPARE ALL REPORTS & "WHAT CHANGED?"
          ========================================================= */}
      {activeTab === "reports" && (
        <div>
          {loadingReports ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
              <p>Analyzing chronological lab parameters and computing trajectory changes...</p>
            </div>
          ) : whatChangedData ? (
            <div>
              {/* Summary Counts Bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#16a34a" }}>🟢 IMPROVED</span>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                    {whatChangedData.counts?.improved || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Normalizing values</div>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb" }}>🔵 STABLE</span>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                    {whatChangedData.counts?.stable || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Consistent values</div>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#d97706" }}>🟡 MONITOR</span>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                    {whatChangedData.counts?.monitoring || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Minor trajectory shifts</div>
                </div>

                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#dc2626" }}>🔴 NEEDS ATTENTION</span>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "4px" }}>
                    {whatChangedData.counts?.needs_attention || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Warranting doctor review</div>
                </div>
              </div>

              {/* What Changed Table */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", color: "#0f172a" }}>
                  Longitudinal Lab Parameter Trajectory
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Parameter</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Previous Value</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Latest Value</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Reference Range</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Clinical Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatChangedData.changes?.map((chg, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>{chg.title}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: `${chg.badge.color}15`, color: chg.badge.color, padding: "3px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11.5px" }}>
                              {chg.badge.symbol} {chg.badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{chg.previous_value}</td>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#1e293b" }}>{chg.current_value}</td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{chg.reference_range}</td>
                          <td style={{ padding: "12px 14px", color: "#334155" }}>{chg.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Questions to Discuss with Doctor */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a" }}>
                  ❓ Recommended Questions for Your Doctor Based on These Changes:
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13.5px", color: "#334155", lineHeight: 1.6 }}>
                  {whatChangedData.doctor_questions?.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "60px 24px", textAlign: "center", border: "1px solid #e2e8f0", color: "#94a3b8" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📈</div>
              <h3 style={{ margin: 0, color: "#475569" }}>No reports found. Upload your diagnostic lab reports in the Reports portal to enable longitudinal tracking.</h3>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 5: PRESCRIPTION TIMETABLE
          ========================================================= */}
      {activeTab === "schedule" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a" }}>
                Daily Prescription Timetable
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Organized into time slots with before/after food directives and missed-dose safety.
              </p>
            </div>
            <button
              onClick={() => setShowAddPrescription(true)}
              style={{ background: "#4338ca", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
            >
              + Add Doctor Prescription
            </button>
          </div>

          {/* Missed-Dose Safety Banner */}
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "12px 18px", borderRadius: "10px", color: "#92400e", fontSize: "13px", marginBottom: "20px" }}>
            <strong>⚠️ Missed-Dose Safety Rule:</strong> If you miss a dose, take it as soon as you remember unless it is near your next scheduled dose. <strong>NEVER take two doses at once or double up.</strong>
          </div>

          {dailySchedule?.timetable && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {["Morning", "Afternoon", "Evening", "Night"].map((slot) => {
                const data = dailySchedule.timetable[slot];
                return (
                  <div key={slot} style={{ background: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>{slot}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>{data.time_window}</span>
                      </div>
                      <span style={{ fontSize: "20px" }}>{data.icon}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {data.items?.length === 0 ? (
                        <span style={{ fontSize: "12.5px", color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No medicines scheduled</span>
                      ) : (
                        data.items?.map((item) => (
                          <div key={item.id} style={{ border: "1px solid #f1f5f9", borderRadius: "10px", padding: "12px", background: item.status === "taken" ? "#f0fdf4" : item.status === "skipped" ? "#fef2f2" : "#f8fafc" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "13.5px", color: "#1e293b" }}>{item.name}</strong>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: item.status === "taken" ? "#16a34a" : item.status === "skipped" ? "#dc2626" : "#4338ca" }}>
                                {item.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{item.dosage} • {item.food_relation}</div>

                            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                              <button
                                onClick={() => handleLogDose(item.id, "taken", slot)}
                                style={{ flex: 1, background: item.status === "taken" ? "#16a34a" : "#e2e8f0", color: item.status === "taken" ? "#fff" : "#334155", border: "none", borderRadius: "6px", padding: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                ✓ Taken
                              </button>
                              <button
                                onClick={() => handleLogDose(item.id, "skipped", slot)}
                                style={{ flex: 1, background: item.status === "skipped" ? "#dc2626" : "#e2e8f0", color: item.status === "skipped" ? "#fff" : "#334155", border: "none", borderRadius: "6px", padding: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                ✕ Skipped
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Prescription Modal */}
          {showAddPrescription && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Add Doctor-Approved Prescription</h3>
                <form onSubmit={handleAddPrescription} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Medicine Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin 500mg"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Dosage *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 tablet"
                      value={newMedDose}
                      onChange={(e) => setNewMedDose(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12.5px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Time Slot</label>
                      <select value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12.5px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Food Relation</label>
                      <select value={newMedFood} onChange={(e) => setNewMedFood(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                        <option value="After food">After food</option>
                        <option value="Before food">Before food (empty stomach)</option>
                        <option value="With food">With meals</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button type="submit" style={{ flex: 1, background: "#4338ca", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "700" }}>
                      Save to Schedule
                    </button>
                    <button type="button" onClick={() => setShowAddPrescription(false)} style={{ background: "#e2e8f0", border: "none", borderRadius: "8px", padding: "10px 16px" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 6: SANA 360° HEALTH REVIEW
          ========================================================= */}
      {activeTab === "health_review" && (
        <div>
          {loadingReview ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌟</div>
              <p>Compiling your complete 360-degree health history review...</p>
            </div>
          ) : healthReviewData ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Spoken Review Synthesis */}
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#4338ca", textTransform: "uppercase" }}>
                    🎙️ SANA Verbal Clinical Briefing
                  </span>
                  <p style={{ margin: "8px 0 0 0", fontSize: "14.5px", color: "#1e293b", lineHeight: 1.6 }}>
                    "{healthReviewData.spoken_summary}"
                  </p>
                </div>

                {/* Vitals Snapshot */}
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#0f172a" }}>
                    Recorded Physiological Baseline
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {Object.entries(healthReviewData.vitals_snapshot || {}).map(([k, v]) => (
                      <div key={k} style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                        <span style={{ color: "#64748b", textTransform: "capitalize" }}>{k.replace("_", " ")}</span>
                        <div style={{ fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Active Prescriptions */}
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#0f172a" }}>
                    Active Prescriptions on File ({healthReviewData.active_medications?.length || 0})
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13.5px", color: "#334155" }}>
                    {healthReviewData.active_medications?.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* Questions for Doctor */}
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#0f172a" }}>
                    Questions Prepared for Doctor Consultation:
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13.5px", color: "#334155", lineHeight: 1.5 }}>
                    {healthReviewData.doctor_questions?.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "12px", color: "#64748b" }}>
                  {healthReviewData.disclaimer}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Unable to compile health review.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
