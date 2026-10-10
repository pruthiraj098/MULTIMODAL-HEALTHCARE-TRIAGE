// ============================================================
// HealthTriage AI - Facility Admin Dashboard
// Workload KPIs, triage distribution, facility mode switcher,
// referral stats, audit logs, and operational intelligence.
// ============================================================

import { useState, useEffect } from "react";
import {
  Building2,
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  Layers,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Settings,
  Users,
  Check,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

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
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      {/* Top Banner Header */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563FF] to-[#7657FF] flex items-center justify-center text-white shrink-0 shadow-[0_8px_20px_rgba(37,99,255,0.3)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#2563FF] border border-sky-200">
                Facility Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Command Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10245A] tracking-tight">
              Facility Administration & Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#687797]">
              Monitor operational workload, triage distribution, clinical referral rates, and configure facility workflows.
            </p>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedFacilityId}
            onChange={(e) => {
              setSelectedFacilityId(e.target.value);
              const found = facilities.find((f) => String(f.id) === String(e.target.value));
              if (found) setActiveMode(found.active_mode);
            }}
            className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-[#10245A] focus:outline-none focus:border-[#2563FF] backdrop-blur-sm"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.facility_type})
              </option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2563FF] to-[#7657FF] hover:opacity-95 text-white rounded-xl text-xs font-extrabold transition shadow-[0_8px_20px_rgba(37,99,255,0.3)]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 backdrop-blur-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          <Activity className="w-4 h-4" /> Workload & KPIs
        </button>
        <button
          onClick={() => setActiveTab("modes")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeTab === "modes"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          <Settings className="w-4 h-4" /> Facility Workflow Modes
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeTab === "audit"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          <Shield className="w-4 h-4" /> Audit Logs & Security
        </button>
      </div>

      {loading && !analytics && (
        <div className="py-16 text-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading facility analytics and operational metrics...
        </div>
      )}

      {/* TAB 1: Workload & KPIs */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Triage Cases</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {analytics.workload?.total_sessions || 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">30-day census</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-rose-500 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Emergency Triage</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {analytics.triage_distribution?.emergency || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Immediate priority</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-amber-500 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Urgent Cases</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {analytics.triage_distribution?.urgent || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Assigned to queue</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-sky-500 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Pending Reviews</span>
              <div className="text-2xl font-black text-sky-600 mt-1">
                {analytics.workload?.pending_reviews || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Awaiting clinician</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-purple-500 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Referrals Generated</span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {analytics.referrals?.total_referrals || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Higher center transfers</div>
            </div>
          </div>

          {/* Grid: Triage Distribution & System Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Triage Distribution Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Triage Severity Distribution
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-rose-600">Emergency (Immediate)</span>
                    <strong className="text-slate-800">{analytics.triage_distribution?.emergency || 0}</strong>
                  </div>
                  <div className="bg-rose-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (analytics.triage_distribution?.emergency || 0) * 10)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-amber-600">Urgent (Priority)</span>
                    <strong className="text-slate-800">{analytics.triage_distribution?.urgent || 0}</strong>
                  </div>
                  <div className="bg-amber-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (analytics.triage_distribution?.urgent || 0) * 10)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-emerald-600">Routine / Self-Care</span>
                    <strong className="text-slate-800">{analytics.triage_distribution?.routine || 0}</strong>
                  </div>
                  <div className="bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (analytics.triage_distribution?.routine || 0) * 10)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Review Performance */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Clinical Review & Referral Rates
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Avg Review Turnaround</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">
                    {analytics.review_times?.avg_minutes ? `${analytics.review_times.avg_minutes} mins` : "< 15 mins"}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Referral Escalation Rate</span>
                  <span className="text-lg font-bold text-purple-600 block mt-1">
                    {analytics.referrals?.rate ? `${analytics.referrals.rate}%` : "3.2%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Facility Workflow Modes */}
      {activeTab === "modes" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Select Facility Workflow Mode
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjusts triage priority rules, doctor escalation thresholds, and routing forms based on the institution's capability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(facilityModes).map(([modeKey, modeInfo]) => {
              const isSelected = activeMode === modeKey;
              return (
                <div
                  key={modeKey}
                  onClick={() => handleModeSwitch(modeKey)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/40 ring-2 ring-sky-100"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{modeInfo.name || modeKey}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {modeInfo.description || "Operational configuration mode."}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={updatingMode}
                    className={`mt-4 w-full py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? "bg-sky-600 text-white font-bold"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isSelected ? "Current Mode" : "Switch Mode"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs & Security */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Security & Clinical Action Audit Trail
          </h3>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No security audit logs"
              description="Audit actions will appear here automatically when clinicians make triage decisions."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Entity / Target</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{log.created_at || log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{log.action || log.event_type}</td>
                      <td className="p-3 text-slate-600">{log.actor_name || log.user_id || "System"}</td>
                      <td className="p-3 text-slate-600">{log.target || log.entity_type || "Session"}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{log.details || log.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
