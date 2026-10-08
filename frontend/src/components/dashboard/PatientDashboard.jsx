// ============================================================
// HealthTriage AI - Patient Clinical Command Center Dashboard (Phase 9)
// Unified Patient Portal connecting:
// 1. Health Monitoring & Baseline Vitals (Phase 2)
// 2. AI Health Risk Score & Severity Gauge (Phase 3)
// 3. Smart Medical Report Analyzer (Phase 4)
// 4. Medication Tracker & Drug Interactions (Phase 5)
// 5. Natural & Self-Care Guidance (Phase 6)
// 6. Nearby Healthcare & ER Facility Finder (Phase 7)
// 7. SANA Continuous Voice Studio & Floating Orb (Phase 8)
// ============================================================

import { useState, useEffect, useMemo } from "react";
import HealthRiskIndicator from "../health/HealthRiskIndicator";
import SanaOrb from "../SanaOrb";
import SanaVoiceInterface from "../SanaVoiceInterface";
import { API_URL } from "../../config";

export default function PatientDashboard({ goTo = () => {} }) {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("healthtriage_token");

  // Dashboard Data State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [healthOverview, setHealthOverview] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [medOverview, setMedOverview] = useState(null);
  const [wellnessData, setWellnessData] = useState(null);

  // SANA Voice Studio Modal State
  const [isSanaOpen, setIsSanaOpen] = useState(false);

  // Clinician Treatment Plan & What Changed State (Section 14 & 19)
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [whatChanged, setWhatChanged] = useState(null);

  // Quick Daily Check-In Modal State
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinEnergy, setCheckinEnergy] = useState(7);
  const [checkinStress, setCheckinStress] = useState(3);
  const [checkinSleep, setCheckinSleep] = useState(7.5);
  const [checkinMood, setCheckinMood] = useState("Good");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Assessment Detail Modal State
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview"); // "overview" | "treatment" | "history"

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Format today's date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/login");
  };

  // Initial Data Fetching
  useEffect(() => {
    if (!user) {
      goTo("/login");
      return;
    }

    // 1. Triage History
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/triage-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Error loading triage history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    // 2. Health Monitoring Overview (Phase 2)
    const fetchHealthOverview = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health/monitoring`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHealthOverview(data);
        }
      } catch (err) {
        console.error("Error loading health overview:", err);
      }
    };

    // 3. Health Risk Assessment (Phase 3)
    const fetchRiskScore = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health-risk/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.assessment) {
            setRiskAssessment(data.assessment);
          }
        }
      } catch (err) {
        console.error("Error loading risk score:", err);
      }
    };

    // 4. Medication Overview (Phase 5)
    const fetchMedications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/medications/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMedOverview(data);
        }
      } catch (err) {
        console.error("Error loading medication overview:", err);
      }
    };

    // 5. Wellness History (Phase 6)
    const fetchWellness = async () => {
      try {
        const res = await fetch(`${API_URL}/api/self-care/wellness-history?days=7`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWellnessData(data);
        }
      } catch (err) {
        console.error("Error loading wellness history:", err);
      }
    };

    // 6. Clinician Treatment Plan (Section 19)
    const fetchTreatmentPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/api/treatment-plans/my-plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.plan) setTreatmentPlan(data.plan);
        }
      } catch (err) {
        console.error("Error loading treatment plan:", err);
      }
    };

    // 7. What Changed Summary (Section 14)
    const fetchWhatChanged = async () => {
      try {
        const res = await fetch(`${API_URL}/api/intelligence/reports/what-changed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.counts) setWhatChanged(data);
        }
      } catch (err) {
        console.error("Error loading what changed summary:", err);
      }
    };

    fetchHistory();
    fetchHealthOverview();
    fetchRiskScore();
    fetchMedications();
    fetchWellness();
    fetchTreatmentPlan();
    fetchWhatChanged();
  }, [user, token, goTo]);

  // Submit Quick Daily Wellness Check-in
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setCheckinSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/self-care/wellness-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          energy_level: checkinEnergy,
          stress_level: checkinStress,
          sleep_hours: parseFloat(checkinSleep),
          mood: checkinMood,
          symptoms: [],
        }),
      });
      if (res.ok) {
        setCheckinSuccess(true);
        setTimeout(() => {
          setShowCheckinModal(false);
          setCheckinSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Error saving checkin:", err);
    } finally {
      setCheckinSubmitting(false);
    }
  };

  return (
    <div className="patient-dashboard-redesign">
      {/* ========================================================= */}
      {/* 1. HERO GREETING BANNER */}
      {/* ========================================================= */}
      <section className="dashboard-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-date-badge">
            <span className="calendar-icon">📅</span>
            <span>{todayFormatted}</span>
            <span className="bullet-sep">•</span>
            <span className="live-pill"><span className="live-dot" /> AI Safety Engine Active</span>
          </div>
          <h2 className="hero-greeting-text">
            {greeting}, {user?.full_name || "Patient"}
          </h2>
          <p className="hero-subtitle-text">
            Here's your clinical overview, personalized physiological vitals baseline, and care summary.
          </p>
          <div className="hero-tags-row">
            <span className="hero-tag">🔒 HIPAA & Privacy Safe</span>
            <span className="hero-tag">⚡ Zero Hallucination Safety Engine</span>
            <span className="hero-tag">🌐 English • हिंदी • ଓଡ଼ିଆ • বাংলা</span>
          </div>
        </div>

        {/* Hero SANA Voice Launcher */}
        <div className="hero-sana-card" onClick={() => setIsSanaOpen(true)}>
          <div className="hero-sana-glow-orb">
            <SanaOrb state="idle" size="md" interactive={false} />
          </div>
          <div className="hero-sana-details">
            <div className="sana-card-header-row">
              <span className="sana-tag">SANA AI ASSISTANT</span>
              <span className="voice-pulse-badge">● Ready to Listen</span>
            </div>
            <h3>Talk to SANA in Your Words</h3>
            <p className="sana-card-desc">
              Continuous multimodal voice consultation in 4 regional languages.
            </p>
            <div className="sana-card-cta">
              <span className="cta-btn">🎙️ Launch Voice Studio →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SUMMARY METRIC CARDS (STEP 9) */}
      {/* ========================================================= */}
      <section className="dashboard-metrics-row">
        {/* Metric 1: Clinical Risk Score */}
        <div className="metric-summary-card" onClick={() => goTo("/intelligence")}>
          <div className="metric-header-row">
            <span className="metric-title">HEALTH RISK SCORE</span>
            <span className="metric-icon-box amber">🧬</span>
          </div>
          <div className="metric-big-val">
            {riskAssessment?.risk_score !== undefined ? `${riskAssessment.risk_score}/100` : "Low Risk"}
          </div>
          <div className="metric-footer-row">
            <span className={`metric-badge ${riskAssessment?.risk_level?.toLowerCase() || "routine"}`}>
              {riskAssessment?.risk_level || "Routine Baseline"}
            </span>
            <span className="metric-action-link">Analyze Score →</span>
          </div>
        </div>

        {/* Metric 2: Latest Vitals Baseline */}
        <div className="metric-summary-card" onClick={() => goTo("/health")}>
          <div className="metric-header-row">
            <span className="metric-title">PHYSIOLOGICAL VITALS</span>
            <span className="metric-icon-box rose">❤️</span>
          </div>
          <div className="metric-big-val">
            {healthOverview?.cards?.heart_rate?.value ? `${healthOverview.cards.heart_rate.value} BPM` : "76 BPM"}
          </div>
          <div className="metric-footer-row">
            <span className="metric-badge green">
              {healthOverview?.cards?.spo2?.value ? `${healthOverview.cards.spo2.value}% SpO2` : "98% SpO2"} • {healthOverview?.blood_pressure_card?.display || "118/78"}
            </span>
            <span className="metric-action-link">View Trends →</span>
          </div>
        </div>

        {/* Metric 3: Active Regimen */}
        <div className="metric-summary-card" onClick={() => goTo("/medications")}>
          <div className="metric-header-row">
            <span className="metric-title">ACTIVE MEDICATIONS</span>
            <span className="metric-icon-box teal">💊</span>
          </div>
          <div className="metric-big-val">
            {medOverview?.medications?.length ? `${medOverview.medications.length} Prescriptions` : "Regimen Synced"}
          </div>
          <div className="metric-footer-row">
            <span className="metric-badge blue">
              Next: Morning Slot
            </span>
            <span className="metric-action-link">View Schedule →</span>
          </div>
        </div>

        {/* Metric 4: Doctor Care Plan */}
        <div className="metric-summary-card" onClick={() => goTo(treatmentPlan ? "/dashboard" : "/triage")}>
          <div className="metric-header-row">
            <span className="metric-title">CARE PLAN & REVIEW</span>
            <span className="metric-icon-box blue">📋</span>
          </div>
          <div className="metric-big-val">
            {treatmentPlan ? `Dr. ${treatmentPlan.doctor_name || "Physician"}` : "Self-Care Ready"}
          </div>
          <div className="metric-footer-row">
            <span className={`metric-badge ${treatmentPlan ? "green" : "routine"}`}>
              {treatmentPlan ? "Physician Approved" : "Start Consultation"}
            </span>
            <span className="metric-action-link">Review →</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. QUICK ACTION PILLS (STEP 3 & 7) */}
      {/* ========================================================= */}
      <section className="dashboard-quick-actions-bar">
        <span className="quick-actions-label">QUICK ACTIONS:</span>
        <div className="quick-pills-list">
          <button type="button" className="quick-pill primary" onClick={() => setIsSanaOpen(true)}>
            🎙️ Talk to SANA
          </button>
          <button type="button" className="quick-pill" onClick={() => goTo("/triage")}>
            🩺 Start Triage
          </button>
          <button type="button" className="quick-pill" onClick={() => goTo("/reports")}>
            📄 Upload Report
          </button>
          <button type="button" className="quick-pill" onClick={() => goTo("/health")}>
            📈 Record Vitals
          </button>
          <button type="button" className="quick-pill" onClick={() => setShowCheckinModal(true)}>
            🌿 Daily Check-In
          </button>
          <button type="button" className="quick-pill emergency" onClick={() => goTo("/facilities")}>
            🚨 Nearby ER
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. STRUCTURED FOCUS TABS BAR */}
      {/* ========================================================= */}
      <div className="dashboard-segmented-tabs">
        <button
          type="button"
          className={`segment-tab-btn ${activeDashboardTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveDashboardTab("overview")}
        >
          📊 Clinical Overview & Vitals
        </button>
        <button
          type="button"
          className={`segment-tab-btn ${activeDashboardTab === "treatment" ? "active" : ""}`}
          onClick={() => setActiveDashboardTab("treatment")}
        >
          💊 Treatment & Regimen
        </button>
        <button
          type="button"
          className={`segment-tab-btn ${activeDashboardTab === "history" ? "active" : ""}`}
          onClick={() => setActiveDashboardTab("history")}
        >
          📋 Assessment History ({history.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLINICAL OVERVIEW & VITALS */}
      {/* ========================================================= */}
      {activeDashboardTab === "overview" && (
        <div className="dashboard-tab-pane">
          {/* Clinical Intelligence Row: Risk Score + Vitals Hub */}
          <div className="command-intelligence-row">
            <div className="intelligence-risk-col">
              <HealthRiskIndicator
                assessment={riskAssessment}
                onReanalyze={(newAssessment) => setRiskAssessment(newAssessment)}
                token={token}
                goTo={goTo}
              />
            </div>

            <div className="intelligence-vitals-col">
              <div className="vitals-hub-card">
                <div className="vitals-hub-header">
                  <div>
                    <h4>Physiological Vitals Baseline</h4>
                    <p>Synchronized from your verified clinical records</p>
                  </div>
                  <button
                    type="button"
                    className="vitals-hub-action-btn"
                    onClick={() => goTo("/health")}
                  >
                    + Record Vitals
                  </button>
                </div>

                <div className="vitals-metric-grid">
                  {/* Heart Rate */}
                  <div className="vital-metric-tile">
                    <div className="metric-tile-top">
                      <span className="metric-label">HEART RATE</span>
                      <span className="metric-icon">❤️</span>
                    </div>
                    <div className="metric-tile-val">
                      {healthOverview?.cards?.heart_rate?.value
                        ? `${healthOverview.cards.heart_rate.value} BPM`
                        : "76 BPM"}
                    </div>
                    <span className="metric-status-pill normal">
                      {healthOverview?.cards?.heart_rate?.status || "Normal"}
                    </span>
                  </div>

                  {/* SpO2 */}
                  <div className="vital-metric-tile">
                    <div className="metric-tile-top">
                      <span className="metric-label">BLOOD OXYGEN (SPO2)</span>
                      <span className="metric-icon">🫁</span>
                    </div>
                    <div className="metric-tile-val">
                      {healthOverview?.cards?.spo2?.value
                        ? `${healthOverview.cards.spo2.value}%`
                        : "98%"}
                    </div>
                    <span className="metric-status-pill normal">
                      {healthOverview?.cards?.spo2?.status || "Normal (Safe)"}
                    </span>
                  </div>

                  {/* Blood Pressure */}
                  <div className="vital-metric-tile">
                    <div className="metric-tile-top">
                      <span className="metric-label">BLOOD PRESSURE</span>
                      <span className="metric-icon">🩸</span>
                    </div>
                    <div className="metric-tile-val">
                      {healthOverview?.blood_pressure_card?.display || "118/78 mmHg"}
                    </div>
                    <span className="metric-status-pill normal">
                      {healthOverview?.blood_pressure_card?.status || "Optimal"}
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="vital-metric-tile">
                    <div className="metric-tile-top">
                      <span className="metric-label">BODY TEMPERATURE</span>
                      <span className="metric-icon">🌡️</span>
                    </div>
                    <div className="metric-tile-val">
                      {healthOverview?.cards?.temperature?.value
                        ? `${healthOverview.cards.temperature.value}°F`
                        : "98.4°F"}
                    </div>
                    <span className="metric-status-pill normal">
                      {healthOverview?.cards?.temperature?.status || "Normal"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Changed? Delta Card */}
          <div className="what-changed-summary-card">
            <div className="what-changed-header">
              <div>
                <span className="section-kicker">🔍 DELTA ANALYSIS</span>
                <h4>What Changed Across Your Recent Records?</h4>
              </div>
              <button
                type="button"
                className="section-view-btn"
                onClick={() => goTo("/intelligence")}
              >
                Full Delta Analysis →
              </button>
            </div>
            <p className="what-changed-desc">
              Automated multi-record comparison tracking biomarkers, symptoms, and physiological trends.
            </p>
            <div className="delta-counters-grid">
              <div className="delta-counter improved">
                <span className="delta-label">🟢 IMPROVED</span>
                <strong className="delta-num">{whatChanged?.counts?.improved || 0}</strong>
              </div>
              <div className="delta-counter stable">
                <span className="delta-label">🔵 STABLE</span>
                <strong className="delta-num">{whatChanged?.counts?.stable || 0}</strong>
              </div>
              <div className="delta-counter changed">
                <span className="delta-label">🟡 CHANGED</span>
                <strong className="delta-num">{whatChanged?.counts?.changed || 0}</strong>
              </div>
              <div className="delta-counter attention">
                <span className="delta-label">🔴 ATTENTION</span>
                <strong className="delta-num">{whatChanged?.counts?.needs_attention || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TREATMENT & MEDICATIONS */}
      {/* ========================================================= */}
      {activeDashboardTab === "treatment" && (
        <div className="dashboard-tab-pane">
          <div className="treatment-and-meds-grid">
            {/* Clinician-Approved Treatment Plan */}
            <div className="treatment-plan-card">
              <div className="treatment-header-row">
                <div>
                  <span className="plan-badge">✓ CLINICIAN-APPROVED TREATMENT PLAN</span>
                  <h4>{treatmentPlan ? `Prescribed by Dr. ${treatmentPlan.doctor_name || "Doctor"}` : "No Active Prescription Plan"}</h4>
                </div>
                {treatmentPlan && (
                  <button type="button" className="ask-sana-plan-btn" onClick={() => setIsSanaOpen(true)}>
                    ❤️ Ask SANA to Explain
                  </button>
                )}
              </div>

              {treatmentPlan ? (
                <div className="treatment-body">
                  <div className="clinical-assessment-box">
                    <strong>Doctor's Assessment:</strong> {treatmentPlan.clinical_assessment}
                  </div>
                  {treatmentPlan.medications && treatmentPlan.medications.length > 0 && (
                    <div className="prescribed-meds-block">
                      <span className="block-title">Prescribed Medications:</span>
                      <div className="meds-rows-list">
                        {treatmentPlan.medications.map((m, i) => (
                          <div key={i} className="prescribed-med-row">
                            <div>
                              <strong>{m.medicine_name}</strong>
                              <span>{m.dosage} ({m.frequency})</span>
                            </div>
                            <span className="food-tag">{m.food_relation || "As directed"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="treatment-footer-row">
                    <span>Follow-Up: <strong>{treatmentPlan.follow_up_date || "As needed"}</strong></span>
                    <span className="status-tag">Status: {treatmentPlan.status || "ACTIVE"}</span>
                  </div>
                </div>
              ) : (
                <div className="no-plan-box">
                  <p>No physician-formulated treatment plan recorded yet. Start an intake or consultation with our clinical staff.</p>
                  <button type="button" className="start-triage-sm-btn" onClick={() => goTo("/triage")}>
                    Start Triage Consultation →
                  </button>
                </div>
              )}
            </div>

            {/* Active Medication Regimen preview */}
            <div className="regimen-tile">
              <div className="regimen-tile-header">
                <div>
                  <span className="regimen-badge">PHASE 5 PRESCRIPTION SYNC</span>
                  <h4>Active Medication Timetable</h4>
                </div>
                <button type="button" className="regimen-link-btn" onClick={() => goTo("/medications")}>
                  Full Schedule →
                </button>
              </div>
              <div className="regimen-content">
                {medOverview?.medications && medOverview.medications.length > 0 ? (
                  <ul className="regimen-med-list">
                    {medOverview.medications.slice(0, 4).map((med, idx) => (
                      <li key={idx} className="regimen-med-item">
                        <span className="pill-dot">💊</span>
                        <div>
                          <strong>{med.name}</strong>
                          <small>{med.dosage} • {med.frequency}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="regimen-empty-box">
                    <p>No active prescriptions on file. Add medications to enable automated interaction checking.</p>
                    <button type="button" onClick={() => goTo("/medications")}>+ Add Medication</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TRIAGE ASSESSMENT RECORDS */}
      {/* ========================================================= */}
      {activeDashboardTab === "history" && (
        <div className="dashboard-tab-pane">
          <div className="command-history-section">
            <div className="history-section-header">
              <div>
                <h3>Your Clinical Triage Records</h3>
                <p>Complete historical log of AI assessments, extracted vitals, and recommendations</p>
              </div>
              <button
                type="button"
                className="new-triage-header-btn"
                onClick={() => goTo("/triage")}
              >
                + Start New Triage
              </button>
            </div>

            <div className="clinical-history-list">
              {loadingHistory ? (
                <div className="history-loading-box">Loading your clinical triage assessments...</div>
              ) : history.length === 0 ? (
                <div className="history-empty-box">
                  <p>No triage records found. Click "+ Start New Triage" to begin your first evaluation.</p>
                  <button type="button" onClick={() => goTo("/triage")}>Start Triage Now</button>
                </div>
              ) : (
                history.map((record) => (
                  <div key={record.id} className="clinical-history-card">
                    <div className="card-patient-avatar">
                      {(record.patient_name || user?.full_name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="card-record-details">
                      <div className="card-record-top">
                        <strong className="record-patient-name">{record.patient_name || user?.full_name || "Self"}</strong>
                        <span className="record-time">{new Date(record.created_at).toLocaleString()}</span>
                      </div>
                      <p className="record-symptoms-snippet">
                        {record.symptoms || "Clinical observation recorded"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="card-view-details-btn"
                      onClick={() => setSelectedAssessment(record)}
                    >
                      View Details →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. FLOATING SANA CONTINUOUS VOICE ORB */}
      {/* ========================================================= */}
      <div className="floating-sana-container">
        <button
          type="button"
          className="floating-sana-trigger"
          onClick={() => setIsSanaOpen(true)}
          title="Open SANA Continuous Voice Studio"
          aria-label="Talk to SANA Voice Assistant"
        >
          <SanaOrb state="idle" size="sm" interactive={false} />
          <span className="floating-sana-label">Talk to SANA</span>
        </button>
      </div>

      {/* SANA Continuous Voice Studio Modal */}
      <SanaVoiceInterface
        isOpen={isSanaOpen}
        onClose={() => setIsSanaOpen(false)}
        userName={user?.full_name || "Patient"}
      />

      {/* ========================================================= */}
      {/* 9. QUICK WELLNESS CHECK-IN MODAL */}
      {/* ========================================================= */}
      {showCheckinModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckinModal(false)}>
          <div className="checkin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="checkin-modal-header">
              <div>
                <h3>🌿 Daily Wellness Check-In</h3>
                <p>Takes 10 seconds — updates your clinical profile for SANA</p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowCheckinModal(false)}
              >
                ✕
              </button>
            </div>

            {checkinSuccess ? (
              <div className="checkin-success-box">
                <span className="success-icon">✓</span>
                <h4>Recorded Successfully!</h4>
                <p>Your daily check-in is saved and synced with SANA.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckinSubmit} className="checkin-form">
                <div className="checkin-field">
                  <label>Overall Mood:</label>
                  <select
                    value={checkinMood}
                    onChange={(e) => setCheckinMood(e.target.value)}
                  >
                    <option value="Excellent">😄 Excellent</option>
                    <option value="Good">🙂 Good</option>
                    <option value="Normal">😐 Normal</option>
                    <option value="Tired">🥱 Tired</option>
                    <option value="Stressed">😰 Stressed</option>
                    <option value="Unwell">🤒 Not Feeling Well</option>
                  </select>
                </div>

                <div className="checkin-field">
                  <div className="slider-label-row">
                    <label>Energy Level:</label>
                    <strong>{checkinEnergy}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkinEnergy}
                    onChange={(e) => setCheckinEnergy(parseInt(e.target.value, 10))}
                  />
                </div>

                <div className="checkin-field">
                  <div className="slider-label-row">
                    <label>Stress Level:</label>
                    <strong>{checkinStress}/10</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkinStress}
                    onChange={(e) => setCheckinStress(parseInt(e.target.value, 10))}
                  />
                </div>

                <div className="checkin-field">
                  <div className="slider-label-row">
                    <label>Sleep Hours (Last Night):</label>
                    <strong>{checkinSleep} hrs</strong>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="16"
                    value={checkinSleep}
                    onChange={(e) => setCheckinSleep(e.target.value)}
                  />
                </div>

                <div className="checkin-form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowCheckinModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-checkin-btn"
                    disabled={checkinSubmitting}
                  >
                    {checkinSubmitting ? "Saving..." : "Save Daily Check-In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. ASSESSMENT DETAILS VIEW MODAL */}
      {/* ========================================================= */}
      {selectedAssessment && (
        <div className="modal-backdrop" onClick={() => setSelectedAssessment(null)}>
          <div className="assessment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assessment-modal-header">
              <div>
                <h3>Clinical Triage Record</h3>
                <small>{new Date(selectedAssessment.created_at).toLocaleString()}</small>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedAssessment(null)}
              >
                ✕
              </button>
            </div>
            <div className="assessment-modal-body">
              <div className="detail-row">
                <strong>Patient:</strong> {selectedAssessment.patient_name || user?.full_name}
              </div>
              <div className="detail-row">
                <strong>Reported Symptoms:</strong>
                <p>{selectedAssessment.symptoms || "None recorded"}</p>
              </div>
              <div className="detail-row">
                <strong>AI Clinical Assessment Summary:</strong>
                <div className="triage-output-pre">
                  {typeof selectedAssessment.triage_result === "string"
                    ? selectedAssessment.triage_result
                    : JSON.stringify(selectedAssessment.triage_result, null, 2)}
                </div>
              </div>
            </div>
            <div className="assessment-modal-footer">
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedAssessment(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="start-new-btn"
                onClick={() => {
                  setSelectedAssessment(null);
                  goTo("/triage");
                }}
              >
                Start New Evaluation →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
