// ============================================================
// HealthTriage AI - Medical Officer Dashboard
// Facility Operational Oversight, Escalation Management, & Trend Surveillance
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Users,
  Building2,
  TrendingUp,
  Printer,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

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
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "surveillance" | "referrals"

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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563FF] to-[#53D8F5] flex items-center justify-center text-white shrink-0 shadow-[0_8px_20px_rgba(37,99,255,0.3)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Clinical Leadership
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#2563FF] border border-sky-200">
                Facility MOIC Desk
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10245A] tracking-tight">
              Medical Officer Facility Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#687797]">
              Facility operational oversight, emergency escalation clearance, workload distribution, and cluster trends.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-right backdrop-blur-sm">
            <div className="text-xs font-extrabold text-[#10245A]">
              {user?.full_name || "Medical Officer"}
            </div>
            <div className="text-[10px] text-teal-600 font-bold">Medical Officer in Charge (MOIC)</div>
          </div>
          <button
            onClick={() => goTo("/public-health")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#7657FF] hover:opacity-95 text-white font-extrabold text-xs shadow-[0_8px_20px_rgba(37,99,255,0.3)] transition flex items-center gap-1.5"
          >
            Public Health View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-rose-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Emergencies</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{counts.emergency || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Immediate care</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-amber-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Urgent Cases</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.urgent || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Prioritized review</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-sky-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-black text-[#2563FF] mt-1">{pendingReviews.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Awaiting doctor seal</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-purple-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Referrals</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{dashboardData?.total_referrals || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Higher centers</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-emerald-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)] col-span-2 sm:col-span-1">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Total Intake</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{counts.all || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Facility census</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          Facility Overview & Escalations ({escalatedCases.length})
        </button>
        <button
          onClick={() => setActiveTab("surveillance")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "surveillance"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          Cluster Trends & Surveillance
        </button>
        <button
          onClick={() => setActiveTab("referrals")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "referrals"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          Outgoing Referrals ({recentReferrals.length})
        </button>
      </div>

      {/* TAB 1: FACILITY OVERVIEW & ESCALATED CASES */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Critical Escalations */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                Critical Clinical Escalations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cases escalated by community health workers or nurses requiring senior physician review.
              </p>
            </div>

            {escalatedCases.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                No active clinical escalations pending. All facility triage streams are progressing normally.
              </div>
            ) : (
              <div className="space-y-3">
                {escalatedCases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                          ESCALATED
                        </span>
                        <strong className="text-sm font-bold text-slate-900">{c.patient_name || "Patient"}</strong>
                        <span className="text-xs text-slate-500">Case #{c.id}</span>
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong>Complaint:</strong> {c.symptoms}
                      </div>
                    </div>
                    <button
                      onClick={() => goTo("/queue")}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition self-start sm:self-auto shrink-0"
                    >
                      Clear & Direct →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Operational Workload Breakdown */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Facility Workload Distribution
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Active Facility Mode</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  Government Hospital / Sub-District Hospital
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Doctor Caseload Throughput</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {counts.all > 0 ? `${Math.round(((counts.all - pendingReviews.length) / counts.all) * 100)}% Reviewed` : "100% Up to date"}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block">Emergency Referral Routing</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  Designated District Trauma Care (108 Fleet Active)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLUSTER TRENDS & SURVEILLANCE */}
      {activeTab === "surveillance" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Regional Symptom Cluster Surveillance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              De-identified statistical symptom groupings (Zero PII). Early decision support for epidemiological vigilance.
            </p>
          </div>

          {anomalies.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Early Decision Support Notice:
              </div>
              <div className="text-amber-800">
                "Unusual health activity detected relative to historical baseline — requires public-health review." (Deterministic rule: no autonomous outbreak declaration).
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(clusters).map(([cat, count]) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                <span className="text-xs font-bold text-slate-600 capitalize block">
                  {cat} Cases
                </span>
                <span className="text-2xl font-black text-teal-700 block mt-1">
                  {count}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">30-day census</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OUTGOING REFERRALS */}
      {activeTab === "referrals" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Sealed Clinical Referral Notes
          </h3>
          {recentReferrals.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No higher-center referrals recorded"
              description="No specialist transfers have been initiated during this reporting period."
            />
          ) : (
            <div className="space-y-3">
              {recentReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {ref.priority || "URGENT"}
                      </span>
                      <strong className="text-sm font-bold text-slate-900">
                        Specialty: {ref.specialty_required}
                      </strong>
                    </div>
                    <div className="text-xs text-slate-600">
                      Receiving Center: <strong>{ref.receiving_facility}</strong> • Transport: {ref.transport_mode}
                    </div>
                  </div>
                  <a
                    href={`${API_URL}/api/referrals/${ref.id}/print`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Referral Slip
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
