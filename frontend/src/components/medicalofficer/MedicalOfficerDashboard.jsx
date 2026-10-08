// ============================================================
// HealthTriage AI - Medical Officer Dashboard (Section 10)
// Facility Operational Oversight, Escalation Management, & Trend Surveillance
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "../../config";

export default function MedicalOfficerDashboard({
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

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "escalations" | "surveillance" | "referrals"

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/medical-officer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Unable to load medical officer overview.");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const counts = dashboardData?.counts || { all: 0, emergency: 0, urgent: 0, routine: 0, pending_review: 0 };
  const escalatedCases = dashboardData?.escalated_cases || [];
  const pendingReviews = dashboardData?.pending_doctor_reviews || [];
  const recentReferrals = dashboardData?.recent_referrals || [];
  const clusters = dashboardData?.cluster_trends || {};
  const anomalies = dashboardData?.anomalies || [];
  const kpis = dashboardData?.facility_kpis || {};

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "24px 30px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 10px 25px -5px rgba(15, 118, 110, 0.3)"
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.2)", color: "#ffffff", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
            <span>🏛️</span> CLINICAL LEADERSHIP &amp; PUBLIC HEALTH
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 4px 0" }}>
            Medical Officer Facility Dashboard
          </h1>
          <p style={{ fontSize: "13.5px", color: "#ccfbf1", margin: 0 }}>
            Facility operational oversight, emergency escalation clearance, workload distribution, and cluster trends.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.12)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)", textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
              {user?.full_name || "Medical Officer"}
            </div>
            <div style={{ fontSize: "11px", color: "#ccfbf1" }}>Medical Officer in Charge (MOIC)</div>
          </div>
          <button
            onClick={() => goTo("/public-health")}
            style={{
              background: "#ffffff",
              color: "#0f766e",
              border: "none",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Public Health View →
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 18px", borderLeft: "5px solid #dc2626" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Emergencies</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "2px" }}>{counts.emergency || 0}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Immediate care</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 18px", borderLeft: "5px solid #f59e0b" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Urgent Cases</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#f59e0b", marginTop: "2px" }}>{counts.urgent || 0}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Prioritized</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 18px", borderLeft: "5px solid #2563eb" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Pending Review</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{pendingReviews.length}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Awaiting doctor seal</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 18px", borderLeft: "5px solid #7c3aed" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Referrals</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginTop: "2px" }}>{dashboardData?.total_referrals || 0}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Higher centers</div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 18px", borderLeft: "5px solid #10b981" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Intake</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981", marginTop: "2px" }}>{counts.all || 0}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Facility census</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            background: activeTab === "overview" ? "#0f766e" : "#f1f5f9",
            color: activeTab === "overview" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          🏥 Facility Overview &amp; Escalations ({escalatedCases.length})
        </button>
        <button
          onClick={() => setActiveTab("surveillance")}
          style={{
            background: activeTab === "surveillance" ? "#0f766e" : "#f1f5f9",
            color: activeTab === "surveillance" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          📊 Cluster Trends &amp; Anomaly Warnings
        </button>
        <button
          onClick={() => setActiveTab("referrals")}
          style={{
            background: activeTab === "referrals" ? "#0f766e" : "#f1f5f9",
            color: activeTab === "referrals" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          📑 Outgoing Referrals ({recentReferrals.length})
        </button>
      </div>

      {/* TAB 1: FACILITY OVERVIEW & ESCALATED CASES */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
          {/* Left: Critical Escalations Requiring MO Review */}
          <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
              🚨 Critical Clinical Escalations
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Cases escalated by community health workers or nurses requiring senior physician review.
            </p>

            {escalatedCases.length === 0 ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "16px", borderRadius: "12px", fontSize: "13px" }}>
                ✓ No active clinical escalations pending. All facility triage streams are progressing normally.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {escalatedCases.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#fff5f5",
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ background: "#dc2626", color: "#ffffff", padding: "2px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: "800" }}>
                          ESCALATED
                        </span>
                        <strong style={{ fontSize: "14.5px", color: "#0f172a" }}>{c.patient_name || "Patient"}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Case #{c.id}</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#334155" }}>
                        <strong>Complaint:</strong> {c.symptoms}
                      </div>
                    </div>
                    <button
                      onClick={() => goTo("/queue")}
                      style={{
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Clear &amp; Direct →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Operational Workload Breakdown */}
          <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
              Facility Workload Distribution
            </h3>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Active Facility Mode</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                  Government Hospital / Sub-District Hospital
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Doctor Caseload Throughput</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                  {counts.all > 0 ? `${Math.round(((counts.all - pendingReviews.length) / counts.all) * 100)}% Reviewed` : "100% Up to date"}
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Emergency Referral Routing</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                  Designated District Trauma Care (108 Fleet Active)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLUSTER TRENDS & SURVEILLANCE */}
      {activeTab === "surveillance" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
            Regional Symptom Cluster Surveillance
          </h3>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 24px 0" }}>
            De-identified statistical symptom groupings (Zero PII). Early decision support for epidemiological vigilance.
          </p>

          {anomalies.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "700", marginBottom: "4px" }}>⚠️ Early Decision Support Notice:</div>
              <div style={{ fontSize: "13px" }}>
                "Unusual health activity detected relative to historical baseline — requires public-health review." (Deterministic rule: no autonomous outbreak declaration).
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {Object.entries(clusters).map(([cat, count]) => (
              <div key={cat} style={{ background: "#f8fafc", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700", textTransform: "capitalize" }}>
                  {cat} Cases
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f766e", marginTop: "4px" }}>
                  {count}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>30-day census</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OUTGOING REFERRALS */}
      {activeTab === "referrals" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
            Sealed Clinical Referral Notes
          </h3>
          {recentReferrals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              No higher-center referrals recorded for this reporting period.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {recentReferrals.map((ref) => (
                <div
                  key={ref.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ background: "#7c3aed", color: "#ffffff", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                        {ref.priority || "URGENT"}
                      </span>
                      <strong style={{ fontSize: "14.5px", color: "#0f172a" }}>
                        Specialty: {ref.specialty_required}
                      </strong>
                    </div>
                    <div style={{ fontSize: "13px", color: "#475569" }}>
                      Receiving Center: <strong>{ref.receiving_facility}</strong> • Transport: {ref.transport_mode}
                    </div>
                  </div>
                  <a
                    href={`${API_URL}/api/referrals/${ref.id}/print`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12.5px",
                      color: "#1e293b",
                      textDecoration: "none",
                      fontWeight: "600"
                    }}
                  >
                    🖨️ Print Referral Slip
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
