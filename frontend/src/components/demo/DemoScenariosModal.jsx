// ============================================================
// HealthTriage AI - 10 Synthetic Demo Scenarios Modal (Section 43)
// One-click scenario loader and role-switcher for evaluation and demos
// ============================================================

import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function DemoScenariosModal({ isOpen, onClose, onSelectScenario, onSwitchRole }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchScenarios = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/demo/scenarios`);
        if (res.ok) {
          const data = await res.json();
          setScenarios(data.scenarios || []);
        }
      } catch (err) {
        console.error("Demo scenarios fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScenarios();
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["ALL", "EMERGENCY", "URGENT", "ROUTINE", "MULTILINGUAL", "MULTIMODAL", "FACILITY"];

  const filteredScenarios = scenarios.filter((sc) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "EMERGENCY") return sc.expected_triage === "EMERGENCY";
    if (activeCategory === "URGENT") return sc.expected_triage === "URGENT";
    if (activeCategory === "ROUTINE") return sc.expected_triage === "ROUTINE";
    if (activeCategory === "MULTILINGUAL") return ["or", "hi", "bn", "te", "ta"].includes(sc.language);
    if (activeCategory === "MULTIMODAL") return !!sc.report_findings || !!sc.image_findings;
    if (activeCategory === "FACILITY") return sc.facility_mode && sc.facility_mode !== "GOVERNMENT_HOSPITAL";
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#ffffff",
            padding: "20px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
              <span>🚀</span> EVALUATION SUITE
            </div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
              10 Safe Synthetic Clinical Demo Scenarios
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.8 }}>
              Certified synthetic patient profiles for live demonstration, testing, and government pilot evaluations.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#ffffff",
              fontSize: "20px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Role Switcher Bar */}
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 28px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569" }}>
            🎭 Quick Role Switcher (For Demo):
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { label: "👤 Patient", role: "PATIENT", path: "/dashboard", bg: "#eff6ff", color: "#1d4ed8" },
              { label: "👩‍⚕️ Nurse", role: "NURSE", path: "/nurse", bg: "#fef3c7", color: "#b45309" },
              { label: "👨‍⚕️ Doctor", role: "DOCTOR", path: "/doctor", bg: "#f0fdf4", color: "#15803d" },
              { label: "🛡️ Med Officer", role: "MEDICAL_OFFICER", path: "/medical-officer", bg: "#ecfdf5", color: "#047857" },
              { label: "🏢 Facility Admin", role: "FACILITY_ADMIN", path: "/facility-admin", bg: "#f3e8ff", color: "#7e22ce" },
              { label: "🏛️ Public Health", role: "SYSTEM_ADMIN", path: "/public-health", bg: "#f1f5f9", color: "#334155" },
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => {
                  if (onSwitchRole) onSwitchRole(r.role, r.path);
                  onClose();
                }}
                style={{
                  background: r.bg,
                  color: r.color,
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            padding: "12px 28px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? "#2563eb" : "#f1f5f9",
                color: activeCategory === cat ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenario List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {loading ? (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "40px", color: "#64748b" }}>
              Loading synthetic scenarios...
            </div>
          ) : (
            filteredScenarios.map((sc) => {
              const badgeBg =
                sc.expected_triage === "EMERGENCY" ? "#fee2e2" : sc.expected_triage === "URGENT" ? "#fef3c7" : "#dcfce7";
              const badgeColor =
                sc.expected_triage === "EMERGENCY" ? "#dc2626" : sc.expected_triage === "URGENT" ? "#d97706" : "#16a34a";

              return (
                <div
                  key={sc.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                        #{sc.id} • {sc.category}
                      </span>
                      <span
                        style={{
                          background: badgeBg,
                          color: badgeColor,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {sc.expected_triage}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a", fontWeight: "700" }}>
                      {sc.title}
                    </h3>

                    <p style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#475569", lineHeight: 1.4 }}>
                      {sc.description}
                    </p>

                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#334155", marginBottom: "12px" }}>
                      <div><strong>Patient:</strong> {sc.patient_name || "Synthetic Patient"}, {sc.age || "40"}y ({sc.gender || "M"})</div>
                      <div><strong>Language:</strong> {sc.language ? sc.language.toUpperCase() : "EN"}</div>
                      <div style={{ marginTop: "4px", fontStyle: "italic", color: "#64748b" }}>
                        "{sc.prompt_message.substring(0, 90)}..."
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectScenario) onSelectScenario(sc);
                      onClose();
                    }}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    ▶ Load & Demonstrate Scenario
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: "#f8fafc",
            padding: "14px 28px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <span>🔒 Synthetic Data Guard: All scenarios strictly adhere to HIPAA de-identification standards.</span>
          <button
            onClick={onClose}
            style={{
              background: "#e2e8f0",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
