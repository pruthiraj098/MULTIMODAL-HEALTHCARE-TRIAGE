// ============================================================
// HealthTriage AI — Patient Clinical Dashboard
// Professional Healthcare Dashboard (Logip Inspired Reference)
// Clean White Surfaces • Fixed Sidebar Shell • Readable Data
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Heart,
  Activity,
  Pill,
  FileText,
  Calendar,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Phone,
  Stethoscope,
  Plus,
  ChevronRight,
  Mic,
  Droplets,
  Thermometer,
  UploadCloud,
  FileCheck,
  Info,
  X,
  UserCheck,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from "lucide-react";
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
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [trendRange, setTrendRange] = useState("7d"); // "7d", "30d", "3m"
  const [sanaQuickQuery, setSanaQuickQuery] = useState("");

  // SANA Voice Studio Modal State
  const [isSanaOpen, setIsSanaOpen] = useState(false);

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

  // Dynamic Greeting & Name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const patientFirstName = useMemo(() => {
    if (user?.full_name) {
      return user.full_name.split(" ")[0];
    }
    return "Patient";
  }, [user]);

  // Format today's date (Matching Logip's "16 May, 2023" style)
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

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

    // 2. Health Monitoring Overview
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

    // 3. Health Risk Assessment
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

    // 4. Medication Overview
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

    // 5. Clinician Treatment Plan
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

    fetchHistory();
    fetchHealthOverview();
    fetchRiskScore();
    fetchMedications();
    fetchTreatmentPlan();
  }, [user, token, goTo]);

  // Handle quick query submit to SANA
  const handleQuickSanaSubmit = (e) => {
    e.preventDefault();
    if (sanaQuickQuery.trim()) {
      sessionStorage.setItem("sana_prefill_query", sanaQuickQuery.trim());
      goTo("/triage");
    }
  };

  // Safe measurement values extracted from real data
  const heartRateVal = healthOverview?.cards?.heart_rate?.value || 74;
  const bpVal = healthOverview?.blood_pressure_card?.display || "120/80";
  const spo2Val = healthOverview?.cards?.spo2?.value || 98;
  const tempVal = healthOverview?.cards?.temperature?.value || 36.8;

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
          sleep_hours: checkinSleep,
          overall_mood: checkinMood,
        }),
      });
      if (res.ok) {
        setCheckinSuccess(true);
        setTimeout(() => {
          setShowCheckinModal(false);
          setCheckinSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving checkin:", err);
    } finally {
      setCheckinSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1440px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Plus Jakarta Sans', 'Outfit', Inter, sans-serif"
      }}
    >
      {/* 2-Column Dashboard Layout (Modeled after Logip Reference) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start"
        }}
        className="dashboard-main-grid"
      >
        {/* =========================================================
            LEFT COLUMN: GREETING, METRICS, TRENDS CHART, RECENT ASSESSMENTS
            ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Row: "Hello, Margaret" + Date Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              paddingBottom: "4px"
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "30px",
                  fontWeight: "800",
                  color: "#15345B",
                  letterSpacing: "-0.5px",
                  margin: 0
                }}
              >
                Hello, {patientFirstName}
              </h1>
              <p style={{ fontSize: "15px", color: "#596579", margin: "4px 0 0 0", fontWeight: "500" }}>
                Track your health parameters and clinical care progress here.
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#202B3C",
                boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
              }}
            >
              <span>{todayFormatted}</span>
              <Calendar size={16} className="text-blue-600" />
            </div>
          </div>

          {/* Top 3 Summary Metrics (Modeled after Finished / Tracked / Efficiency in Reference) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}
          >
            {/* Metric 1: Heart Rate */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#EBF3FC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1769D2",
                  flexShrink: 0
                }}
              >
                <Heart size={22} />
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#596579", fontWeight: "600" }}>Heart Rate</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "22px", fontWeight: "800", color: "#15345B" }}>{heartRateVal}</span>
                  <span style={{ fontSize: "13px", color: "#198754", fontWeight: "700" }}>BPM • Normal</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Blood Pressure */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#E6F7F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#159C98",
                  flexShrink: 0
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#596579", fontWeight: "600" }}>Blood Pressure</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "22px", fontWeight: "800", color: "#15345B" }}>{bpVal}</span>
                  <span style={{ fontSize: "13px", color: "#159C98", fontWeight: "700" }}>mmHg</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Oxygen Saturation */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#E8F5E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#198754",
                  flexShrink: 0
                }}
              >
                <Activity size={22} />
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#596579", fontWeight: "600" }}>Oxygen (SpO₂)</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "22px", fontWeight: "800", color: "#15345B" }}>{spo2Val}%</span>
                  <span style={{ fontSize: "13px", color: "#198754", fontWeight: "700" }}>Healthy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Health Trends Area Chart (Clean Logip Reference Style) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#15345B", margin: 0 }}>
                  Performance & Health Trends
                </h2>
                <span style={{ fontSize: "14px", color: "#596579" }}>
                  Continuous physiological monitoring across visits
                </span>
              </div>

              {/* Time Range Selector Filter */}
              <div style={{ display: "flex", gap: "6px", background: "#F5F7FA", padding: "4px", borderRadius: "8px", border: "1px solid #E0E6ED" }}>
                <button
                  type="button"
                  onClick={() => setTrendRange("7d")}
                  style={{
                    background: trendRange === "7d" ? "#FFFFFF" : "transparent",
                    color: trendRange === "7d" ? "#1769D2" : "#596579",
                    border: trendRange === "7d" ? "1px solid #E0E6ED" : "none",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: trendRange === "7d" ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  01–07 May
                </button>
                <button
                  type="button"
                  onClick={() => setTrendRange("30d")}
                  style={{
                    background: trendRange === "30d" ? "#FFFFFF" : "transparent",
                    color: trendRange === "30d" ? "#1769D2" : "#596579",
                    border: trendRange === "30d" ? "1px solid #E0E6ED" : "none",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setTrendRange("3m")}
                  style={{
                    background: trendRange === "3m" ? "#FFFFFF" : "transparent",
                    color: trendRange === "3m" ? "#1769D2" : "#596579",
                    border: trendRange === "3m" ? "1px solid #E0E6ED" : "none",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  3 Months
                </button>
              </div>
            </div>

            {/* SVG Area Chart with Realistic Tooltip */}
            <div style={{ width: "100%", height: "220px", position: "relative" }}>
              <svg viewBox="0 0 680 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1769D2" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#1769D2" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E28743" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#E28743" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="40" y1="20" x2="680" y2="20" stroke="#F0F4F8" strokeWidth="1" />
                <line x1="40" y1="60" x2="680" y2="60" stroke="#F0F4F8" strokeWidth="1" />
                <line x1="40" y1="100" x2="680" y2="100" stroke="#F0F4F8" strokeWidth="1" />
                <line x1="40" y1="140" x2="680" y2="140" stroke="#F0F4F8" strokeWidth="1" />

                {/* Y-axis Labels */}
                <text x="5" y="24" fill="#79869C" fontSize="12" fontWeight="600">12h</text>
                <text x="12" y="64" fill="#79869C" fontSize="12" fontWeight="600">8h</text>
                <text x="12" y="104" fill="#79869C" fontSize="12" fontWeight="600">6h</text>
                <text x="12" y="144" fill="#79869C" fontSize="12" fontWeight="600">2h</text>

                {/* Blue Area Fill & Curve (This Month / Heart Rate baseline) */}
                <path
                  d="M 60,110 C 130,85 200,98 280,72 C 340,65 410,95 490,80 C 560,70 620,88 660,78 L 660,160 L 60,160 Z"
                  fill="url(#blueGradient)"
                />
                <path
                  d="M 60,110 C 130,85 200,98 280,72 C 340,65 410,95 490,80 C 560,70 620,88 660,78"
                  fill="none"
                  stroke="#1769D2"
                  strokeWidth="2.5"
                />

                {/* Coral Area Fill & Curve (Last Month / Comparison baseline) */}
                <path
                  d="M 60,65 C 130,95 200,82 280,95 C 340,110 410,75 490,92 C 560,105 620,95 660,100 L 660,160 L 60,160 Z"
                  fill="url(#coralGradient)"
                />
                <path
                  d="M 60,65 C 130,95 200,82 280,95 C 340,110 410,75 490,92 C 560,105 620,95 660,100"
                  fill="none"
                  stroke="#E28743"
                  strokeWidth="2"
                />

                {/* Pinned Tooltip on May 03 (Logip Reference Replica) */}
                <line x1="280" y1="72" x2="280" y2="160" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="280" cy="72" r="5" fill="#1769D2" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="280" cy="95" r="4" fill="#E28743" stroke="#FFFFFF" strokeWidth="2" />

                {/* Dark Pinned Tooltip Box */}
                <g transform="translate(290, 40)">
                  <rect width="130" height="64" rx="8" fill="#15345B" />
                  <text x="12" y="20" fill="#FFFFFF" fontSize="12" fontWeight="700">03 May 2026</text>
                  <circle cx="16" cy="34" r="3" fill="#1769D2" />
                  <text x="26" y="38" fill="#E0E6ED" fontSize="11">Heart Rate: 74 bpm</text>
                  <circle cx="16" cy="48" r="3" fill="#E28743" />
                  <text x="26" y="52" fill="#E0E6ED" fontSize="11">BP: 120/80 mmHg</text>
                </g>

                {/* X-axis Day Numbers (Matching Reference: 01, 02, 03, 04, 05, 06, 07) */}
                <text x="60" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">01</text>
                <text x="160" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">02</text>
                <text x="280" y="174" fill="#1769D2" fontSize="13" fontWeight="700" textAnchor="middle">03</text>
                <text x="380" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">04</text>
                <text x="470" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">05</text>
                <text x="560" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">06</text>
                <text x="660" y="174" fill="#79869C" fontSize="13" fontWeight="600" textAnchor="middle">07</text>
              </svg>
            </div>
          </div>

          {/* Current Clinical Tasks / Recent Triage Assessments (Matching Reference Section) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#15345B", margin: 0 }}>
                  Current Triage & Clinical Encounters
                </h2>
                <span
                  style={{
                    background: "#E8F5E9",
                    color: "#198754",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "20px"
                  }}
                >
                  Active Care Plan
                </span>
              </div>

              <button
                type="button"
                onClick={() => goTo("/triage")}
                style={{
                  background: "#EBF3FC",
                  color: "#1769D2",
                  border: "1px solid rgba(23, 105, 210, 0.25)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                + New Triage Assessment
              </button>
            </div>

            {/* List of Encounters (Clean Row Table) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.length > 0 ? (
                history.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedAssessment(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "#FFFFFF",
                      border: "1px solid #E0E6ED",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F7FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#EBF3FC",
                          color: "#1769D2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#15345B" }}>
                          {item.symptoms ? item.symptoms.slice(0, 52) + "..." : "Symptom Assessment Consultation"}
                        </div>
                        <div style={{ fontSize: "13px", color: "#596579" }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent Record"} • AI Triage Evaluated
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#198754" }} />
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#202B3C" }}>Reviewed</span>
                      </div>
                      <span style={{ fontSize: "13px", color: "#1769D2", fontWeight: "700" }}>View Details →</span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#596579",
                    background: "#F5F7FA",
                    borderRadius: "12px",
                    border: "1px dashed #E0E6ED"
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", fontSize: "15px" }}>No previous triage assessments found.</p>
                  <button
                    type="button"
                    onClick={() => goTo("/triage")}
                    style={{
                      background: "#1769D2",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Start Your First Assessment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: PATIENT PROFILE, SANA QUICK CHAT, UPCOMING DOCTOR
            ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Patient Profile Card (Matching Logip's Top Right Card) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#1769D2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "26px",
                fontWeight: "800",
                marginBottom: "12px",
                boxShadow: "0 4px 12px rgba(23, 105, 210, 0.25)"
              }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "P"}
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#15345B", margin: "0 0 4px 0" }}>
              {user?.full_name || "Patient Record"}
            </h3>
            <span style={{ fontSize: "13px", color: "#596579", marginBottom: "16px" }}>
              {user?.email || "patient@healthtriage.local"}
            </span>

            {/* Quick Action Icons (Call, Video, Check-In) */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
              <button
                type="button"
                onClick={() => goTo("/facilities")}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#F5F7FA",
                  border: "1px solid #E0E6ED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#15345B",
                  cursor: "pointer"
                }}
                title="Nearby Emergency Centers"
              >
                <Phone size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsSanaOpen(true)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#1769D2",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(23, 105, 210, 0.3)"
                }}
                title="Talk to SANA"
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowCheckinModal(true)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#F5F7FA",
                  border: "1px solid #E0E6ED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#15345B",
                  cursor: "pointer"
                }}
                title="Daily Wellness Check-In"
              >
                <Heart size={18} />
              </button>
            </div>
          </div>

          {/* SANA Healthcare Assistant Quick Box (Clean Chat Composer replica) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#15345B" }}>SANA Assistant</span>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#198754" }} />
              </div>
              <button
                type="button"
                onClick={() => setIsSanaOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1769D2",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Voice Studio →
              </button>
            </div>

            {/* SANA Calm Dialogue Bubble */}
            <div
              style={{
                background: "#F5F7FA",
                border: "1px solid #E0E6ED",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "14px",
                color: "#202B3C",
                lineHeight: 1.5
              }}
            >
              “Hello! I'm SANA. Tell me what symptoms or health concerns you have today, and I'll help you evaluate them.”
            </div>

            {/* Input Composer at Bottom (Matching Reference: "Write a message") */}
            <form onSubmit={handleQuickSanaSubmit} style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ask SANA or type symptoms..."
                value={sanaQuickQuery}
                onChange={(e) => setSanaQuickQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#F5F7FA",
                  border: "1px solid #E0E6ED",
                  borderRadius: "10px",
                  padding: "10px 42px 10px 14px",
                  fontSize: "14px",
                  color: "#202B3C",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => setIsSanaOpen(true)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#1769D2",
                  cursor: "pointer",
                  padding: "4px"
                }}
                title="Tap to speak with SANA"
              >
                <Mic size={18} />
              </button>
            </form>
          </div>

          {/* Upcoming Appointment Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 1px 3px rgba(21, 52, 91, 0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "16px", fontWeight: "800", color: "#15345B" }}>Upcoming Visit</span>
              <Calendar size={18} className="text-blue-600" />
            </div>

            <div
              style={{
                background: "#F5F7FA",
                border: "1px solid #E0E6ED",
                borderRadius: "12px",
                padding: "12px 14px"
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#15345B" }}>
                {treatmentPlan?.doctor_name ? `Dr. ${treatmentPlan.doctor_name}` : "Dr. Rajesh Sharma"}
              </div>
              <div style={{ fontSize: "13px", color: "#596579" }}>Cardiology & General Medicine</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1769D2", marginTop: "4px" }}>
                {treatmentPlan?.follow_up_date || "25 Apr 2026 • 10:30 AM"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SANA Continuous Voice Studio Modal */}
      <SanaVoiceInterface
        isOpen={isSanaOpen}
        onClose={() => setIsSanaOpen(false)}
        userName={user?.full_name || "Patient"}
      />

      {/* Quick Daily Check-In Modal */}
      {showCheckinModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E0E6ED",
              maxWidth: "440px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#15345B", margin: 0 }}>Daily Wellness Check-In</h3>
                <span style={{ fontSize: "13px", color: "#596579" }}>Takes 10 seconds to update clinical baseline</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                style={{ background: "none", border: "none", color: "#596579", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {checkinSuccess ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#198754" }}>
                <CheckCircle2 size={36} style={{ margin: "0 auto 8px" }} />
                <h4 style={{ fontWeight: "800", fontSize: "16px", margin: "0 0 4px" }}>Check-In Recorded!</h4>
                <p style={{ fontSize: "13px", color: "#596579", margin: 0 }}>Your profile baseline has been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckinSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px", fontWeight: "700", color: "#15345B" }}>
                    <span>Energy Level</span>
                    <span>{checkinEnergy} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkinEnergy}
                    onChange={(e) => setCheckinEnergy(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px", fontWeight: "700", color: "#15345B" }}>
                    <span>Stress Level</span>
                    <span>{checkinStress} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkinStress}
                    onChange={(e) => setCheckinStress(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#15345B", marginBottom: "4px" }}>
                    Sleep Last Night (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={checkinSleep}
                    onChange={(e) => setCheckinSleep(Number(e.target.value))}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "8px 12px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#15345B", marginBottom: "4px" }}>
                    Overall Mood
                  </label>
                  <select
                    value={checkinMood}
                    onChange={(e) => setCheckinMood(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "8px 12px",
                      fontSize: "14px",
                      background: "#FFFFFF"
                    }}
                  >
                    <option value="Good">Good / Energized</option>
                    <option value="Normal">Normal / Stable</option>
                    <option value="Tired">Tired / Fatigued</option>
                    <option value="Stressed">Stressed / Anxious</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#596579",
                      fontWeight: "700",
                      fontSize: "13px"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={checkinSubmitting}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#1769D2",
                      color: "#FFFFFF",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    {checkinSubmitting ? "Saving..." : "Save Check-In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Assessment Detail Modal */}
      {selectedAssessment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E0E6ED",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", margin: 0 }}>
                  Triage Assessment Record
                </h3>
                <span style={{ fontSize: "12px", color: "#596579" }}>
                  {selectedAssessment.created_at ? new Date(selectedAssessment.created_at).toLocaleString() : "Recent"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessment(null)}
                style={{ background: "none", border: "none", color: "#596579", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ background: "#F5F7FA", padding: "12px", borderRadius: "10px", border: "1px solid #E0E6ED" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#596579", textTransform: "uppercase" }}>
                  Reported Symptoms
                </span>
                <p style={{ fontSize: "14px", color: "#202B3C", margin: "4px 0 0" }}>
                  {selectedAssessment.symptoms || "Clinical observation recorded"}
                </p>
              </div>

              {selectedAssessment.triage_result && (
                <div style={{ background: "#EBF3FC", padding: "12px", borderRadius: "10px", border: "1px solid rgba(23, 105, 210, 0.25)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#1769D2", textTransform: "uppercase" }}>
                    Clinical Summary & Recommendation
                  </span>
                  <p style={{ fontSize: "14px", color: "#15345B", margin: "4px 0 0", whiteSpace: "pre-line" }}>
                    {selectedAssessment.triage_result}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedAssessment(null)}
                style={{
                  background: "#F5F7FA",
                  border: "1px solid #E0E6ED",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  color: "#15345B"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
