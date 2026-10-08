// ============================================================
// HealthTriage AI - Facility Admin Dashboard (Section 31 & 24)
// Workload KPIs, triage distribution, facility mode switcher,
// referral stats, audit logs, and operational intelligence.
// ============================================================

import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function FacilityAdminDashboard({ goTo = () => {} }) {
  const token = localStorage.getItem("healthtriage_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  const [analytics, setAnalytics] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [facilityModes, setFacilityModes] = useState({});
  const [activeMode, setActiveMode] = useState("GOVERNMENT_HOSPITAL");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingMode, setUpdatingMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "modes" | "audit"

  // Fetch all admin data
  const fetchData = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Facility profiles
      const profRes = await fetch(`${API_URL}/api/facility/profiles`, { headers });
      if (profRes.ok) {
        const pdata = await profRes.json();
        setFacilities(pdata.facilities || []);
        if (pdata.facilities && pdata.facilities.length > 0 && !selectedFacilityId) {
          setSelectedFacilityId(pdata.facilities[0].id);
          setActiveMode(pdata.facilities[0].active_mode || "GOVERNMENT_HOSPITAL");
        }
      }

      // 2. Modes info
      const modeRes = await fetch(`${API_URL}/api/facility/modes`, { headers });
      if (modeRes.ok) {
        const mdata = await modeRes.json();
        setFacilityModes(mdata.modes || {});
      }

      // 3. Analytics
      const qParam = selectedFacilityId ? `?facility_id=${selectedFacilityId}` : "";
      const analRes = await fetch(`${API_URL}/api/facility/analytics${qParam}`, { headers });
      if (analRes.ok) {
        const adata = await analRes.json();
        setAnalytics(adata);
      }

      // 4. Audit logs
      const auditRes = await fetch(`${API_URL}/api/audit/logs?limit=30`, { headers });
      if (auditRes.ok) {
        const logData = await auditRes.json();
        setAuditLogs(logData.logs || []);
      }
    } catch (err) {
      console.error("Facility admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFacilityId]);

  const handleModeSwitch = async (newMode) => {
    if (!selectedFacilityId) return;
    setUpdatingMode(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_URL}/api/facility/${selectedFacilityId}/mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active_mode: newMode }),
      });
      if (res.ok) {
        setActiveMode(newMode);
        setStatusMsg(`Workflow mode updated to ${newMode} successfully.`);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg(err.detail || "Failed to update facility workflow mode.");
      }
    } catch (err) {
      setStatusMsg("Server connection error.");
    } finally {
      setUpdatingMode(false);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          padding: "24px 32px",
          borderRadius: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
            <span>🏢</span> FACILITY INTELLIGENCE COMMAND
          </div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "700" }}>
            Facility Administration & Workflow Operations
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "13.5px" }}>
            Monitor operational workload, triage distribution, clinical referral rates, and configure facility workflows.
          </p>
        </div>

        {/* Facility Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <select
            value={selectedFacilityId}
            onChange={(e) => {
              setSelectedFacilityId(e.target.value);
              const found = facilities.find((f) => String(f.id) === String(e.target.value));
              if (found) setActiveMode(found.active_mode);
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#334155",
              color: "#ffffff",
              border: "1px solid #475569",
              fontSize: "13.5px",
              fontWeight: "600",
              outline: "none",
            }}
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.facility_type})
              </option>
            ))}
          </select>
          <button
            onClick={fetchData}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: "12px 18px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", marginBottom: "20px", fontSize: "13.5px" }}>
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            borderBottom: activeTab === "overview" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "overview" ? "#2563eb" : "#64748b",
          }}
        >
          📊 Workload & KPIs
        </button>
        <button
          onClick={() => setActiveTab("modes")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            borderBottom: activeTab === "modes" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "modes" ? "#2563eb" : "#64748b",
          }}
        >
          ⚙️ Facility Workflow Modes
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            borderBottom: activeTab === "audit" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "audit" ? "#2563eb" : "#64748b",
          }}
        >
          🛡️ Audit Logs & Security
        </button>
      </div>

      {loading && !analytics && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <p>Loading facility analytics and operational metrics...</p>
        </div>
      )}

      {/* TAB 1: Workload & KPIs */}
      {activeTab === "overview" && analytics && (
        <div>
          {/* Key Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginBottom: "24px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Triage Cases</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "6px" }}>
                {analytics.workload?.total_sessions || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px" }}>Last 30 days workload</div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", textTransform: "uppercase" }}>Emergency Triage</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#dc2626", marginTop: "6px" }}>
                {analytics.triage_distribution?.emergency || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Immediate clinical priority</div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "12px", color: "#d97706", fontWeight: "600", textTransform: "uppercase" }}>Urgent Cases</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#d97706", marginTop: "6px" }}>
                {analytics.triage_distribution?.urgent || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Assigned to queue</div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textTransform: "uppercase" }}>Pending Reviews</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#2563eb", marginTop: "6px" }}>
                {analytics.workload?.pending_reviews || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Awaiting clinician action</div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600", textTransform: "uppercase" }}>Referrals Generated</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#7c3aed", marginTop: "6px" }}>
                {analytics.referrals?.total_referrals || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Higher center transfers</div>
            </div>
          </div>

          {/* Grid: Triage Distribution & System Workload */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Triage Distribution Breakdown */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>
                🎯 Triage Severity Distribution
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "6px" }}>
                    <span style={{ color: "#dc2626", fontWeight: "600" }}>🔴 Emergency (Immediate)</span>
                    <strong>{analytics.triage_distribution?.emergency || 0}</strong>
                  </div>
                  <div style={{ background: "#fee2e2", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ background: "#ef4444", height: "100%", width: `${Math.min(100, (analytics.triage_distribution?.emergency || 0) * 10)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "6px" }}>
                    <span style={{ color: "#d97706", fontWeight: "600" }}>🟠 Urgent (Priority)</span>
                    <strong>{analytics.triage_distribution?.urgent || 0}</strong>
                  </div>
                  <div style={{ background: "#fef3c7", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ background: "#f59e0b", height: "100%", width: `${Math.min(100, (analytics.triage_distribution?.urgent || 0) * 10)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "6px" }}>
                    <span style={{ color: "#16a34a", fontWeight: "600" }}>🟢 Routine / Self-Care</span>
                    <strong>{analytics.triage_distribution?.routine || 0}</strong>
                  </div>
                  <div style={{ background: "#dcfce7", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ background: "#22c55e", height: "100%", width: `${Math.min(100, (analytics.triage_distribution?.routine || 0) * 10)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "6px" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>⚪ Insufficient Information</span>
                    <strong>{analytics.triage_distribution?.insufficient || 0}</strong>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ background: "#94a3b8", height: "100%", width: `${Math.min(100, (analytics.triage_distribution?.insufficient || 0) * 10)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Workload Metrics */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>
                🏥 Operational Workflow Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ color: "#475569" }}>Active Facility Mode</span>
                  <strong style={{ color: "#2563eb" }}>{analytics.facility?.active_mode || activeMode}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ color: "#475569" }}>Clinician Reviewed Cases</span>
                  <strong style={{ color: "#16a34a" }}>{analytics.workload?.reviewed_cases || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ color: "#475569" }}>Pending Review</span>
                  <strong style={{ color: "#ea580c" }}>{analytics.workload?.pending_reviews || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ color: "#475569" }}>Average Triage Time</span>
                  <strong style={{ color: "#0f172a" }}>~2.4 mins / case</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Facility Workflow Modes */}
      {activeTab === "modes" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "28px", border: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "#0f172a" }}>
              Configure Active Facility Workflow
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
              Tailor intake questions, triage protocols, and queues to match your facility's operational environment.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            {[
              {
                id: "GOVERNMENT_HOSPITAL",
                title: "Government District Hospital",
                icon: "🏥",
                desc: "High-volume emergency intake, smart triage queues, rapid physician escalation, and structured bed-side handover.",
              },
              {
                id: "PHC",
                title: "Primary Health Centre (PHC)",
                icon: "🩺",
                desc: "Rural and community first-contact facility. Low-resource vital checks, community nurse review, and higher-center referrals.",
              },
              {
                id: "PUBLIC_HEALTH_CAMP",
                title: "Public Health / Screening Camp",
                icon: "⛺",
                desc: "Rapid batch intake mode for outreach camps, mobile vitals screening, high-volume flow, and immediate referral slips.",
              },
              {
                id: "CAMPUS_HEALTH_CENTRE",
                title: "Campus / University Health Centre",
                icon: "🎓",
                desc: "Student and faculty health service. Focus on acute fever, respiratory clusters, mental wellbeing, and dorm isolation advice.",
              },
              {
                id: "OCCUPATIONAL_HEALTH",
                title: "Industrial & Occupational Unit",
                icon: "🏭",
                desc: "Workplace injury logging, toxic/heat exposure assessment, shift clearance, ergonomic strain, and statutory safety reporting.",
              },
              {
                id: "CLINIC",
                title: "General Community Clinic",
                icon: "👨‍⚕️",
                desc: "Outpatient appointment triage, chronic disease check-in, medication adherence tracking, and lifestyle self-care.",
              },
            ].map((mode) => {
              const isCurrent = activeMode === mode.id;
              return (
                <div
                  key={mode.id}
                  style={{
                    border: isCurrent ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    background: isCurrent ? "#eff6ff" : "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "24px" }}>{mode.icon}</span>
                      {isCurrent && (
                        <span style={{ background: "#2563eb", color: "#ffffff", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                          ACTIVE MODE
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>{mode.title}</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{mode.desc}</p>
                  </div>
                  <button
                    onClick={() => handleModeSwitch(mode.id)}
                    disabled={isCurrent || updatingMode}
                    style={{
                      background: isCurrent ? "#94a3b8" : "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: isCurrent ? "default" : "pointer",
                    }}
                  >
                    {isCurrent ? "Currently Active" : "Switch to this Mode"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs & Security */}
      {activeTab === "audit" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a" }}>
                Clinical & Security Audit Trail
              </h2>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
                Immutable log of patient triage access, reviewer decisions, and security events.
              </p>
            </div>
            <button
              onClick={fetchData}
              style={{
                background: "#f1f5f9",
                color: "#1e293b",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ↻ Refresh Logs
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Timestamp</th>
                  <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Action</th>
                  <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Target Type</th>
                  <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Target ID</th>
                  <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "-"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: "600", color: "#0f172a" }}>
                        <span
                          style={{
                            background: log.action.includes("REVIEW") ? "#eff6ff" : log.action.includes("LOGIN") ? "#f0fdf4" : "#f1f5f9",
                            color: log.action.includes("REVIEW") ? "#1d4ed8" : log.action.includes("LOGIN") ? "#15803d" : "#334155",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{log.target_type || "SYSTEM"}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{log.target_id || "-"}</td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{log.ip_address || "127.0.0.1"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
