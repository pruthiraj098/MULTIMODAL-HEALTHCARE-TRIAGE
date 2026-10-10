// ============================================================
// HealthTriage AI - Doctor Visit Copilot
// Pre-consultation briefing generator, symptom timeline,
// vital trends, report findings, and questions for doctor.
// ============================================================

import { useState, useEffect } from "react";
import {
  Stethoscope,
  Printer,
  Search,
  User,
  Heart,
  Activity,
  FileText,
  Pill,
  HelpCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { API_URL } from "../../config";

export default function DoctorVisitCopilot({ goTo = () => {} }) {
  const token = localStorage.getItem("healthtriage_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  const [concern, setConcern] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const fetchBrief = async (customConcern = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/copilot/doctor-visit-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_concern: customConcern || concern || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate consultation briefing.");
      }

      const data = await res.json();
      setBrief(data.brief);
    } catch (err) {
      setError(err.message || "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBrief();
    }
  }, []);

  const handlePrint = () => {
    const printUrl = `${API_URL}/api/copilot/doctor-visit-summary/print${
      concern ? `?concern=${encodeURIComponent(concern)}` : ""
    }`;
    window.open(printUrl, "_blank");
  };

  const toggleQuestion = (idx) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Doctor Visit Copilot
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Consultation Briefing
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Pre-Consultation Clinical Briefing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Prepare for your upcoming medical appointment with a structured summary of vitals, timeline, and questions.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={loading || !brief}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 shrink-0 self-start md:self-auto"
        >
          <Printer className="w-4 h-4" /> Print Consultation Slip
        </button>
      </div>

      {/* Primary Concern Input */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          What is your primary reason or concern for this doctor visit?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Follow-up for high blood pressure, persistent dry cough, rash on arm..."
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBrief(concern)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
          <button
            onClick={() => fetchBrief(concern)}
            disabled={loading}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            {loading ? "Updating..." : "Update Briefing"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {loading && !brief && (
        <div className="py-16 text-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Compiling your health records and generating doctor visit briefing...
        </div>
      )}

      {brief && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Summary & Vitals */}
          <div className="space-y-5">
            {/* Patient & Appointment Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" /> Patient Profile & Visit Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Patient Name</span>
                  <strong className="text-slate-900 block mt-0.5">
                    {brief.patient_name || user?.full_name || "Patient"}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Date Prepared</span>
                  <span className="text-slate-900 font-semibold block mt-0.5">
                    {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>
                <div className="col-span-2 p-3 bg-sky-50/60 rounded-xl border border-sky-100">
                  <span className="text-sky-700 font-semibold block">Chief Complaint</span>
                  <span className="text-slate-900 font-bold block mt-0.5">
                    {brief.chief_complaint || "Routine Clinical Assessment"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vital Sign Snapshot */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" /> Recent Vital Sign Trends
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Blood Pressure</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {brief.vitals_summary?.blood_pressure || "Not recorded"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Heart Rate</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {brief.vitals_summary?.heart_rate || "Not recorded"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Oxygen (SpO2)</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {brief.vitals_summary?.spo2 || "Not recorded"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Temperature</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {brief.vitals_summary?.temperature || "Not recorded"}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Medications & Reports */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-600" /> Medications & Lab Reports
              </h3>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-600 uppercase text-[10px] block">
                  Current Medications:
                </span>
                {brief.active_medications && brief.active_medications.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-slate-800">
                    {brief.active_medications.map((m, i) => (
                      <li key={i}>{typeof m === "string" ? m : `${m.name || m.medication_name} (${m.dosage || "Standard"})`}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">No active medications recorded.</p>
                )}
              </div>

              <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-600 uppercase text-[10px] block">
                  Uploaded Medical Reports:
                </span>
                {brief.recent_reports && brief.recent_reports.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-slate-800">
                    {brief.recent_reports.map((r, i) => (
                      <li key={i}>{typeof r === "string" ? r : `${r.test_name || r.title || "Report"} (${r.date || "Recent"})`}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">No recent lab reports uploaded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Questions & Timeline */}
          <div className="space-y-5">
            {/* Suggested Questions to Ask Doctor */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" /> Questions to Ask Your Doctor
                </h3>
                <span className="text-[11px] text-slate-400">Checklist</span>
              </div>
              <p className="text-xs text-slate-500">
                Tap each question below to remember during your consultation:
              </p>
              <div className="space-y-2">
                {(brief.questions_to_ask || [
                  "What could be causing these symptoms given my vitals?",
                  "Are there specific diagnostic tests or lab work you recommend?",
                  "Are my current medications still optimal or do they need adjustments?",
                  "What warning signs should prompt immediate emergency care?",
                  "When should I schedule a follow-up visit?",
                ]).map((q, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleQuestion(idx)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                      checkedQuestions[idx]
                        ? "bg-sky-50 border-sky-300 text-sky-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedQuestions[idx]}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>{q}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Symptom Progression & Context */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" /> Symptom Progression & Context
              </h3>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                {brief.symptom_progression || (
                  <p>
                    Reported symptoms have been documented in recent triage check-ins. Bring this summary to your treating physician to review symptom onset, changes in intensity, and relevant life context.
                  </p>
                )}
              </div>
            </div>

            {/* Mandatory Safety Notice */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Healthcare Copilot Notice:
              </div>
              <p className="text-amber-800 leading-relaxed">
                This pre-consultation briefing is generated to assist patient communication with their doctor. It is NOT a clinical diagnosis, medical record, or prescription.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
