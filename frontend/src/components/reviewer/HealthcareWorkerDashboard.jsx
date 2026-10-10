// ============================================================
// HealthTriage AI - Healthcare Worker Dashboard & Clinical Review Workspace
// Smart Healthcare Queue & Human-in-the-Loop Review System
// For Nurses, Doctors, Medical Officers, and Health Workers
// ============================================================

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Layers,
  Search,
  ShieldAlert,
  Stethoscope,
  User,
  UserCheck,
  ClipboardList,
  ChevronRight,
  ExternalLink,
  Check,
  Flame,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

export default function HealthcareWorkerDashboard({ goTo = () => {}, onOpenReferral = () => {} }) {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("healthtriage_token");

  // Queue State
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cases, setCases] = useState([]);
  const [counts, setCounts] = useState({ all: 0, emergency: 0, urgent: 0, routine: 0, pending_review: 0 });
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Review Decision State
  const [reviewDecision, setReviewDecision] = useState("APPROVED");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [overrideTriageLevel, setOverrideTriageLevel] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Facility Mode
  const [facilityMode, setFacilityMode] = useState("GOVERNMENT_HOSPITAL");

  // Clinical Queue Status Formatter (Section 22)
  const getQueueStatusInfo = (c) => {
    if (c.reviewer_decision === "REFERRED" || c.status === "REFERRED") {
      return { label: "Referred", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" };
    }
    if (c.reviewer_decision === "APPROVED" || c.status === "COMPLETED") {
      return { label: "Completed", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (c.status === "WITH_DOCTOR") {
      return { label: "With Doctor", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (c.reviewer_name) {
      return { label: "In Review", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" };
    }
    return { label: "Waiting", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
  };

  // Fetch Queue Data
  const fetchQueue = async (filter = activeFilter) => {
    setLoadingQueue(true);
    try {
      const url = new URL(`${API_URL}/api/queue/cases`);
      if (filter !== "all") url.searchParams.append("filter_type", filter);
      if (searchQuery.trim()) url.searchParams.append("search", searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue(activeFilter);
  }, [activeFilter]);

  // Fetch Case Details
  const handleOpenCase = async (sessionId) => {
    setSelectedCaseId(sessionId);
    setLoadingDetail(true);
    setReviewFeedback("");
    setReviewerNotes("");
    try {
      const res = await fetch(`${API_URL}/api/queue/case/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCaseDetail(data.case);
        setOverrideTriageLevel(data.case.triage_level || "ROUTINE");
        setReviewDecision(data.case.reviewer_decision || "APPROVED");
        setReviewerNotes(data.case.reviewer_notes || "");
      }
    } catch (err) {
      console.error("Case detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Review Decision
  const handleSubmitReview = async () => {
    if (!selectedCaseId) return;
    setSubmittingReview(true);
    setReviewFeedback("");

    try {
      const res = await fetch(`${API_URL}/api/queue/case/${selectedCaseId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: reviewDecision,
          reviewer_notes: reviewerNotes || `Clinical evaluation confirmed by ${user?.full_name}`,
          new_status: reviewDecision === "ESCALATED" ? "ESCALATED" : (reviewDecision === "REFERRED" ? "REFERRED" : "APPROVED"),
          new_triage_level: overrideTriageLevel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReviewFeedback("✓ Review decision committed successfully. Queue updated.");
        fetchQueue(activeFilter);
        handleOpenCase(selectedCaseId);
      } else {
        setReviewFeedback(`Error: ${data.detail || data.message || "Failed to submit review."}`);
      }
    } catch (err) {
      setReviewFeedback(`Network error: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Assign to Me
  const handleAssignToMe = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/queue/case/${sessionId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewer_id: user?.id || 1 }),
      });
      if (res.ok) {
        fetchQueue(activeFilter);
        if (selectedCaseId === sessionId) handleOpenCase(sessionId);
      }
    } catch (err) {
      console.error("Assign error:", err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563FF] to-[#7657FF] flex items-center justify-center text-white shrink-0 shadow-[0_8px_20px_rgba(37,99,255,0.3)]">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#2563FF] border border-sky-200">
                Clinical Workstation
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                HITL Verification Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10245A] tracking-tight">
              Clinical Triage & Healthcare Queue
            </h1>
            <p className="text-xs sm:text-sm text-[#687797]">
              Smart triage queue with Human-in-the-Loop multimodal verification for clinicians.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong className="text-[#10245A]">{user?.full_name || "Healthcare Staff"}</strong>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#2563FF] font-extrabold text-[10px]">
              {user?.role || "CLINICIAN"}
            </span>
          </div>

          <button
            onClick={() => goTo("/dashboard")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-white/90 shadow-sm transition backdrop-blur-sm"
          >
            Patient View
          </button>
          <button
            onClick={() => goTo("/facility-admin")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-white/90 shadow-sm transition backdrop-blur-sm"
          >
            Facility KPIs
          </button>
          <button
            onClick={() => goTo("/public-health")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-white/90 shadow-sm transition backdrop-blur-sm"
          >
            Public Health
          </button>
        </div>
      </div>

      {/* TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setActiveFilter("emergency")}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeFilter === "emergency"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
              : "bg-white border-slate-200/80 hover:border-rose-200"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Emergency
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {counts.emergency}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Immediate Care</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveFilter("urgent")}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeFilter === "urgent"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
              : "bg-white border-slate-200/80 hover:border-amber-200"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Urgent
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {counts.urgent}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Within 24 Hours</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveFilter("routine")}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeFilter === "routine"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
              : "bg-white border-slate-200/80 hover:border-emerald-200"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Routine
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {counts.routine}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Standard Care</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveFilter("review_needed")}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
            activeFilter === "review_needed"
              ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
              : "bg-white border-slate-200/80 hover:border-indigo-200"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Pending Review
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {counts.pending_review}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Needs Verification</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Main Clinical Queue Table / Split Workspace */}
      <div className={`grid grid-cols-1 ${selectedCaseId ? "lg:grid-cols-12" : ""} gap-6 items-start`}>
        {/* Healthcare Queue Table Section */}
        <section className={selectedCaseId ? "lg:col-span-5 space-y-4" : "space-y-4"}>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, complaint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchQueue(activeFilter)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
              <button
                onClick={() => fetchQueue(activeFilter)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                Search
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
              <div className="flex flex-wrap gap-1.5">
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                  onClick={() => setActiveFilter("all")}
                >
                  All ({counts.all})
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeFilter === "emergency"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                  onClick={() => setActiveFilter("emergency")}
                >
                  Emergency ({counts.emergency})
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeFilter === "urgent"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}
                  onClick={() => setActiveFilter("urgent")}
                >
                  Urgent ({counts.urgent})
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeFilter === "routine"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  onClick={() => setActiveFilter("routine")}
                >
                  Routine ({counts.routine})
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeFilter === "review_needed"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                  onClick={() => setActiveFilter("review_needed")}
                >
                  Pending ({counts.pending_review})
                </button>
              </div>

              {selectedCaseId && (
                <button
                  type="button"
                  onClick={() => setSelectedCaseId(null)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
                >
                  Full Table View
                </button>
              )}
            </div>
          </div>

          {/* Queue Case Table (Section 22) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {loadingQueue ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading clinical queue cases...
              </div>
            ) : cases.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={ClipboardList}
                  title="No patients in this queue"
                  description="There are currently no cases matching this filter."
                  primaryAction={{
                    label: "View All Cases",
                    onClick: () => setActiveFilter("all"),
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
                      <th className="py-3 px-3.5">Token</th>
                      <th className="py-3 px-3.5">Patient</th>
                      <th className="py-3 px-3.5">Priority</th>
                      {!selectedCaseId && <th className="py-3 px-3.5">Reason</th>}
                      {!selectedCaseId && <th className="py-3 px-3.5">Wait Time</th>}
                      {!selectedCaseId && <th className="py-3 px-3.5">Assigned To</th>}
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cases.map((c) => {
                      const isSelected = selectedCaseId === c.id;
                      const statusInfo = getQueueStatusInfo(c);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleOpenCase(c.id)}
                          className={`transition cursor-pointer hover:bg-slate-50/80 ${
                            isSelected ? "bg-sky-50/80 font-semibold text-sky-950" : ""
                          }`}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                            #TK-{c.id}
                          </td>
                          <td className="py-3 px-3.5">
                            <strong className="text-slate-900 block text-xs">{c.patient_name}</strong>
                            <span className="text-[10.5px] text-slate-400">
                              {c.patient_age ? `${c.patient_age}y` : "Age N/A"} • {c.patient_gender || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <StatusBadge status={c.triage_level} />
                          </td>
                          {!selectedCaseId && (
                            <td className="py-3 px-3.5 text-slate-600 max-w-[240px] truncate" title={c.chief_complaint}>
                              {c.chief_complaint || "Clinical intake via SANA"}
                            </td>
                          )}
                          {!selectedCaseId && (
                            <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                              {c.created_at || "Just now"}
                            </td>
                          )}
                          {!selectedCaseId && (
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {c.reviewer_name ? (
                                <span className="text-slate-700 font-medium flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                                  {c.reviewer_name}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignToMe(c.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[10.5px] transition"
                                >
                                  Claim
                                </button>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCase(c.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200"
                              }`}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Case Review Workspace & Multimodal Evidence */}
        {selectedCaseId && (
          <section className="lg:col-span-7">
            {loadingDetail ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 text-sm">
                <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading multimodal case evidence...
              </div>
            ) : !caseDetail ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 text-sm">
                Case details unavailable.
              </div>
            ) : (
            <div className="space-y-5">
              {/* Patient Header Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider mb-1">
                    CASE ID: #{caseDetail.id} ({caseDetail.session_uuid})
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {caseDetail.patient_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {caseDetail.patient_age || "N/A"} years • {caseDetail.patient_gender || "N/A"} • Intake:{" "}
                    {caseDetail.created_at} • Facility: {caseDetail.facility_type}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedCaseId(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Back to Full Queue
                  </button>
                  <button
                    onClick={() => onOpenReferral(caseDetail)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Referral Note
                  </button>
                </div>
              </div>

              {/* 5-Section Multimodal Evidence Viewer */}
              <div className="space-y-4">
                {/* 1. Patient Reported Information */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Patient-Reported Information
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      Patient Statement
                    </span>
                  </div>
                  <div className="text-xs space-y-2">
                    <p className="text-slate-800">
                      <strong>Chief Complaint:</strong> {caseDetail.chief_complaint}
                    </p>
                    {caseDetail.patient_reported_info?.patient_statement_raw && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-700">
                        "{caseDetail.patient_reported_info.patient_statement_raw}"
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. AI-Extracted Information (Vitals & Labs) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. AI-Extracted Information
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700">
                      Diagnostic Capture
                    </span>
                  </div>
                  <div className="space-y-4">
                    {/* Vitals Snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {caseDetail.vitals_snapshot && caseDetail.vitals_snapshot.length > 0 ? (
                        caseDetail.vitals_snapshot.map((v, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-medium text-slate-500 block">
                              {v.parameter}
                            </span>
                            <span className="text-sm font-bold text-slate-900 block mt-0.5">
                              {v.value} {v.unit}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                              {v.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 col-span-full">
                          No physiological vitals recorded during intake.
                        </p>
                      )}
                    </div>

                    {/* Report OCR Findings */}
                    {caseDetail.report_findings && caseDetail.report_findings.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h5 className="text-xs font-bold text-slate-800">
                          Uploaded Lab Report Findings:
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Parameter</th>
                                <th className="p-2.5">Result</th>
                                <th className="p-2.5">Reference Range</th>
                                <th className="p-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {caseDetail.report_findings.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-medium text-slate-800">{r.test_name}</td>
                                  <td className="p-2.5 font-bold text-slate-900">
                                    {r.result} {r.unit}
                                  </td>
                                  <td className="p-2.5 text-slate-500">{r.reference_range}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Image Observations */}
                    {caseDetail.image_observations && caseDetail.image_observations.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h5 className="text-xs font-bold text-slate-800">
                          Visible Image Observations:
                        </h5>
                        {caseDetail.image_observations.map((img, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <strong className="text-slate-800">{img.observation_type}:</strong>{" "}
                            <span className="text-slate-600">{img.observation_summary}</span>
                            <span className="block text-[10px] text-slate-400 mt-1 italic">
                              {img.disclaimer}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. AI-Generated Summary */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. AI Triage Summary
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                      Decision Support
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2">
                    <p>
                      <strong className="text-slate-900">Clinical Assessment:</strong>{" "}
                      {caseDetail.ai_generated_summary?.clinical_summary || "Routine assessment."}
                    </p>
                    {caseDetail.ai_generated_summary?.contributing_factors && (
                      <div>
                        <strong className="text-slate-900">Contributing Factors:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                          {caseDetail.ai_generated_summary.contributing_factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-slate-500">
                      <strong>Missing Information:</strong>{" "}
                      {caseDetail.missing_information || "None detected."}
                    </p>
                  </div>
                </div>

                {/* 4. Safety Flags */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      4. Safety Flags & Alerts
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                      Risk Engine
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    {caseDetail.safety_flags?.alerts && caseDetail.safety_flags.alerts.length > 0 ? (
                      caseDetail.safety_flags.alerts.map((alert, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-800 font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{alert}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        No acute deterministic emergency flags detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Human Review Panel (The Core HITL Requirement) */}
                <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      5. Qualified Healthcare Worker Review
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                      Human-in-the-Loop Required
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Review Action Decision:
                        </label>
                        <select
                          value={reviewDecision}
                          onChange={(e) => setReviewDecision(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                        >
                          <option value="APPROVED">✓ Approve AI Triage (Confirmed)</option>
                          <option value="MODIFIED">✏️ Modify Triage Level / Disposition</option>
                          <option value="REQUEST_INFO">❓ Request Additional Vitals / Diagnostics</option>
                          <option value="ESCALATED">🚨 Escalate to Senior Medical Officer</option>
                          <option value="REFERRED">📄 Transfer / Specialist Referral</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Final Triage Priority Level:
                        </label>
                        <select
                          value={overrideTriageLevel}
                          onChange={(e) => setOverrideTriageLevel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                        >
                          <option value="EMERGENCY">🔴 EMERGENCY (Immediate)</option>
                          <option value="URGENT">🟠 URGENT (Within 24 Hours)</option>
                          <option value="ROUTINE">🟢 ROUTINE (Primary Care / Self-care)</option>
                          <option value="INSUFFICIENT_INFO">⚪ INSUFFICIENT INFORMATION</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reviewer Clinical Notes & Management Plan:
                      </label>
                      <textarea
                        rows={3}
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Document your clinical verification rationale, patient orders, or escalation instructions..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                      />
                    </div>

                    {reviewFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          reviewFeedback.startsWith("✓")
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border border-rose-200 text-rose-800"
                        }`}
                      >
                        {reviewFeedback.startsWith("✓") ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        {reviewFeedback}
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap pt-1">
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {submittingReview ? "Saving Decision..." : "Commit Clinical Review Decision"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenReferral(caseDetail)}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Formal Referral Slip
                      </button>
                    </div>

                    {/* Review Audit History */}
                    {caseDetail.reviewer_actions && caseDetail.reviewer_actions.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                        <h6 className="font-bold text-slate-700">Review Audit Log:</h6>
                        {caseDetail.reviewer_actions.map((act) => (
                          <div key={act.id} className="p-2 bg-slate-50 rounded-lg text-slate-600 text-[11px]">
                            <span className="text-slate-400">{act.created_at}</span> •{" "}
                            <strong className="text-slate-800">{act.action_type}</strong> by{" "}
                            {act.reviewer_name} ({act.reviewer_role}): <em>{act.notes}</em>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
