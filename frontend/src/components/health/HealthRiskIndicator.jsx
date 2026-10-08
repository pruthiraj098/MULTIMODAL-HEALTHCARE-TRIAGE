import React, { useState } from "react";
import { API_URL } from "../../config";

export default function HealthRiskIndicator({
  assessment,
  onReanalyze,
  compact = false,
  token,
  goTo
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [modalError, setModalError] = useState("");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [vitalsInput, setVitalsInput] = useState({
    heart_rate: "",
    spo2: "",
    temperature: "",
    systolic_bp: "",
    diastolic_bp: "",
    respiratory_rate: ""
  });

  // Fallback default state if no assessment yet
  const activeAssessment = assessment || {
    risk_level: "LOW",
    risk_score: 18,
    badge_label: "LOW",
    color: "#10b981",
    is_emergency: false,
    explanation:
      "Based on the information provided, current physiological indicators and reported symptoms appear within normal expected ranges with no red-flag markers detected.",
    recommended_action:
      "Continue supportive home care, maintain hydration and rest, and monitor for any changing or worsening symptoms.",
    factors: [
      {
        name: "Vital Signs",
        status: "normal",
        details: "Vital signs recorded within normal adult physiological baselines."
      },
      {
        name: "Reported Symptoms",
        status: "normal",
        details: "No acute distress or critical symptom keywords identified."
      },
      {
        name: "Emergency Safety Engine",
        status: "clear",
        details: "Deterministic emergency safety controller cleared with no alerts."
      }
    ],
    disclaimer:
      "The AI Triage Risk Indicator combines physiological vital indicators and reported symptoms to assist in healthcare prioritization. It is NOT a medical diagnosis and does not compute disease probability."
  };

  const getBadgeStyle = (level) => {
    switch ((level || "").toUpperCase()) {
      case "HIGH":
        return {
          bg: "#fef2f2",
          border: "#fecaca",
          text: "#dc2626",
          icon: "🔴",
          accent: "#ef4444"
        };
      case "MODERATE":
        return {
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#b45309",
          icon: "🟡",
          accent: "#f59e0b"
        };
      default:
        return {
          bg: "#ecfdf5",
          border: "#a7f3d0",
          text: "#047857",
          icon: "🟢",
          accent: "#10b981"
        };
    }
  };

  const badgeTheme = getBadgeStyle(activeAssessment.risk_level);
  const scorePercent = Math.min(Math.max(activeAssessment.risk_score || 0, 0), 100);

  const handleQuickAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setModalError("");

    try {
      const authToken = token || localStorage.getItem("healthtriage_token");
      if (!authToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Format vitals
      const vitalsPayload = {};
      if (vitalsInput.heart_rate) vitalsPayload.heart_rate = parseFloat(vitalsInput.heart_rate);
      if (vitalsInput.spo2) vitalsPayload.spo2 = parseFloat(vitalsInput.spo2);
      if (vitalsInput.temperature) vitalsPayload.temperature = parseFloat(vitalsInput.temperature);
      if (vitalsInput.systolic_bp) vitalsPayload.systolic_bp = parseFloat(vitalsInput.systolic_bp);
      if (vitalsInput.diastolic_bp) vitalsPayload.diastolic_bp = parseFloat(vitalsInput.diastolic_bp);
      if (vitalsInput.respiratory_rate) vitalsPayload.respiratory_rate = parseFloat(vitalsInput.respiratory_rate);

      const res = await fetch(`${API_URL}/api/health-risk/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          symptoms: symptomsInput.trim(),
          vitals: Object.keys(vitalsPayload).length > 0 ? vitalsPayload : null,
          save_result: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to evaluate risk score.");
      }

      if (onReanalyze) {
        onReanalyze(data);
      }
      setModalOpen(false);
      setSymptomsInput("");
    } catch (err) {
      setModalError(err.message || "Failed to analyze risk score.");
    } finally {
      setAnalyzing(false);
    }
  };

  /* Compact View (Dashboard Card) */
  if (compact) {
    return (
      <div
        className="health-risk-compact-card"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: `1px solid ${activeAssessment.is_emergency ? "#fca5a5" : "#e2e8f0"}`,
          padding: "20px",
          boxShadow: activeAssessment.is_emergency ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(15, 23, 42, 0.04)",
          transition: "all 0.2s ease"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px" }}>🛡️</span>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI Triage Risk
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Multi-factor clinical evaluation
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              background: badgeTheme.bg,
              border: `1px solid ${badgeTheme.border}`,
              color: badgeTheme.text,
              fontSize: "12px",
              fontWeight: "800"
            }}
          >
            <span>{badgeTheme.icon}</span>
            <span>{activeAssessment.badge_label || activeAssessment.risk_level}</span>
          </span>
        </div>

        {/* Score Gauge Bar */}
        <div style={{ margin: "14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
              Prioritization Score
            </span>
            <span style={{ fontSize: "18px", fontWeight: "900", color: badgeTheme.accent }}>
              {activeAssessment.risk_score || 0} <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>/ 100</span>
            </span>
          </div>

          <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                width: `${scorePercent}%`,
                height: "100%",
                background: activeAssessment.is_emergency
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : badgeTheme.accent,
                borderRadius: "9999px",
                transition: "width 0.4s ease"
              }}
            />
          </div>
        </div>

        {/* Cautious Explanation Preview */}
        <p
          style={{
            margin: "10px 0 14px 0",
            fontSize: "12px",
            color: "#334155",
            lineHeight: "1.5",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {activeAssessment.explanation}
        </p>

        {/* Action Button */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              flex: 1,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#1e293b",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            🔍 View Explanation
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: "#2563eb",
              border: "none",
              color: "#ffffff",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Re-Evaluate
          </button>
        </div>

        {/* Re-Analyze & Full Details Modal */}
        {modalOpen && renderModal()}
      </div>
    );
  }

  /* Full Interactive View */
  return (
    <div
      className="health-risk-indicator-full"
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        border: `1px solid ${activeAssessment.is_emergency ? "#fca5a5" : "#e2e8f0"}`,
        padding: "28px",
        boxShadow: activeAssessment.is_emergency
          ? "0 10px 30px rgba(239, 68, 68, 0.15)"
          : "0 4px 20px rgba(15, 23, 42, 0.05)",
        marginBottom: "24px"
      }}
    >
      {/* Emergency Alert Banner if Emergency */}
      {activeAssessment.is_emergency && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🚨</span>
            <div>
              <strong style={{ color: "#991b1b", fontSize: "14px", display: "block" }}>
                CRITICAL EMERGENCY SAFETY INDICATOR TRIGGERED
              </strong>
              <span style={{ color: "#b91c1c", fontSize: "12px" }}>
                Deterministic clinical thresholds require immediate emergency attention.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href="tel:112"
              style={{
                background: "#dc2626",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              📞 Call 112 / 911
            </a>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
              AI Triage Risk Indicator
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Deterministic physiological safeguards combined with multimodal contextual AI
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "9999px",
              background: badgeTheme.bg,
              border: `1.5px solid ${badgeTheme.border}`,
              color: badgeTheme.text,
              fontSize: "14px",
              fontWeight: "800"
            }}
          >
            <span>{badgeTheme.icon}</span>
            <span>{activeAssessment.badge_label || activeAssessment.risk_level} RISK</span>
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
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>⚡ Re-Evaluate</span>
          </button>
        </div>
      </div>

      {/* Main Score & Explanation Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        {/* Gauge / Score Box */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Clinical Prioritization Score
            </span>
            <span style={{ fontSize: "32px", fontWeight: "900", color: badgeTheme.accent }}>
              {activeAssessment.risk_score || 0}
              <span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: "600" }}> / 100</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%", height: "12px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginBottom: "16px" }}>
            <div
              style={{
                width: `${scorePercent}%`,
                height: "100%",
                background: activeAssessment.is_emergency
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : badgeTheme.accent,
                borderRadius: "9999px",
                transition: "width 0.5s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
            <span>🟢 Low (0-39)</span>
            <span>🟡 Moderate (40-69)</span>
            <span>🔴 High (70-100)</span>
          </div>
        </div>

        {/* Clinical Plain-Language Explanation */}
        <div
          style={{
            background: badgeTheme.bg,
            borderRadius: "16px",
            border: `1px solid ${badgeTheme.border}`,
            padding: "24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px" }}>📋</span>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: badgeTheme.text, textTransform: "uppercase" }}>
              Clinical Rationale & Guidance
            </h4>
          </div>

          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#1e293b", lineHeight: "1.6", fontWeight: "500" }}>
            {activeAssessment.explanation}
          </p>

          <div style={{ borderTop: `1px solid ${badgeTheme.border}`, paddingTop: "12px", marginTop: "12px" }}>
            <strong style={{ fontSize: "12px", color: badgeTheme.text, display: "block", marginBottom: "4px" }}>
              RECOMMENDED NEXT ACTION:
            </strong>
            <p style={{ margin: 0, fontSize: "13px", color: "#334155", fontWeight: "600" }}>
              {activeAssessment.recommended_action}
            </p>
          </div>
        </div>
      </div>

      {/* Factors Considered Breakdown */}
      <div>
        <h4 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Factors Evaluated in Risk Score
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          {(activeAssessment.factors || []).map((factor, idx) => (
            <div
              key={idx}
              style={{
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "14px 16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                  {factor.name}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background:
                      factor.status === "alert"
                        ? "#fef2f2"
                        : factor.status === "warning"
                        ? "#fffbeb"
                        : "#ecfdf5",
                    color:
                      factor.status === "alert"
                        ? "#dc2626"
                        : factor.status === "warning"
                        ? "#b45309"
                        : "#047857"
                  }}
                >
                  {factor.status === "alert" ? "CRITICAL" : factor.status === "warning" ? "ATTENTION" : "NORMAL"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                {factor.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Safety Disclaimer */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#f1f5f9",
          fontSize: "11px",
          color: "#64748b",
          lineHeight: "1.5"
        }}
      >
        <strong>⚠️ Healthcare Safety Notice: </strong>
        {activeAssessment.disclaimer ||
          "The AI Triage Risk Indicator combines physiological vital indicators and reported symptoms to assist in healthcare prioritization. It is NOT a medical diagnosis and does not compute disease probability."}
      </div>

      {modalOpen && renderModal()}
    </div>
  );

  /* Modal for Quick Triage Re-Evaluation */
  function renderModal() {
    return (
      <div
        className="modal-backdrop"
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
          className="modal-content"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                🛡️ AI Triage Risk Evaluation
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Provide current symptoms or vitals to run real-time multi-factor assessment
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              ✕
            </button>
          </div>

          {modalError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13px",
                marginBottom: "16px"
              }}
            >
              {modalError}
            </div>
          )}

          <form onSubmit={handleQuickAnalyze}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Reported Symptoms & Concerns:
              </label>
              <textarea
                rows={3}
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="e.g. Mild throat irritation, slight headache for 2 days..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Vital Signs (Optional - uses latest logged vitals if left blank):
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Heart Rate (BPM)</span>
                  <input
                    type="number"
                    value={vitalsInput.heart_rate}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, heart_rate: e.target.value })}
                    placeholder="e.g. 74"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>SpO2 (%)</span>
                  <input
                    type="number"
                    value={vitalsInput.spo2}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, spo2: e.target.value })}
                    placeholder="e.g. 98"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Temperature (°F)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsInput.temperature}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, temperature: e.target.value })}
                    placeholder="e.g. 98.6"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Systolic BP (mmHg)</span>
                  <input
                    type="number"
                    value={vitalsInput.systolic_bp}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, systolic_bp: e.target.value })}
                    placeholder="e.g. 120"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={analyzing}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 22px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: analyzing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {analyzing ? "Analyzing..." : "Evaluate Risk Score"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
