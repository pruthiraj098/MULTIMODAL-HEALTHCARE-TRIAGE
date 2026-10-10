// ============================================================
// HealthTriage AI - Doctor Clinical Workspace
// Comprehensive Physician Decision Support & Treatment Planning
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  Clock,
  UserCheck,
  FileText,
  Calendar,
  Pill,
  Heart,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

export default function DoctorWorkspace({
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

  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "assigned" | "patient_workspace" | "treatment_plans"

  // Selected Patient for Clinical Workspace
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [patientTimeline, setPatientTimeline] = useState([]);
  const [patientPlans, setPatientPlans] = useState([]);

  // Treatment Plan Formulation Form State
  const [assessmentText, setAssessmentText] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [testsRecommended, setTestsRecommended] = useState("");
  const [lifestyleGuidance, setLifestyleGuidance] = useState("");
  const [planMeds, setPlanMeds] = useState([
    {
      medicine_name: "",
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration_days: 5,
      food_relation: "After food",
      time_of_day: "Morning & Night",
      instructions: "Take with warm water"
    }
  ]);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");

  // Quick Prescriptions presets
  const prescriptionPresets = [
    {
      name: "Amoxicillin-Clavulanate 625mg",
      dosage: "625 mg",
      frequency: "Twice daily",
      duration: 5,
      food: "After food",
      time: "Morning & Night",
      instr: "Complete full course. Do not skip doses."
    },
    {
      name: "Paracetamol 650mg",
      dosage: "650 mg",
      frequency: "SOS / Max 3 times daily",
      duration: 3,
      food: "After food",
      time: "As needed",
      instr: "For fever >100°F or severe body ache."
    },
    {
      name: "Azithromycin 500mg",
      dosage: "500 mg",
      frequency: "Once daily",
      duration: 3,
      food: "1 hour before food",
      time: "Morning",
      instr: "Take at the exact same hour each day."
    },
    {
      name: "ORS Electrolyte Sachet",
      dosage: "1 sachet in 1L water",
      frequency: "Throughout day",
      duration: 3,
      food: "After loose stools",
      time: "Daytime",
      instr: "Maintain hydration. Discard solution after 24h."
    },
    {
      name: "Pantoprazole 40mg",
      dosage: "40 mg",
      frequency: "Once daily",
      duration: 14,
      food: "30 mins before breakfast",
      time: "Morning",
      instr: "Swallow whole, do not crush."
    }
  ];

  // Fetch Workspace Data
  const fetchWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/doctor/workspace`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceData(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Unable to load doctor workspace.");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  // Select a Case to open in Patient Clinical Workspace
  const handleSelectCase = async (session) => {
    setSelectedCase(session);
    setActiveTab("patient_workspace");
    setLoadingCase(true);
    setPlanSuccessMsg("");

    // Reset Treatment Plan Form
    setAssessmentText(
      session.clinical_summary ||
      session.symptoms ? `Clinical review of: ${session.symptoms}. Patient evaluated.` : ""
    );
    setDiagnosisNotes("");
    setFollowUpDate("");
    setTestsRecommended("");
    setLifestyleGuidance("Adequate hydration and rest. Monitor symptoms.");

    try {
      // 1. Fetch case detail
      const cRes = await fetch(`${API_URL}/api/queue/case/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.case) setSelectedCase(cData.case);
      }

      // 2. Fetch patient timeline if user_id exists
      const pId = session.user_id || session.patient_id;
      if (pId) {
        const tRes = await fetch(`${API_URL}/api/health-intelligence/timeline?patient_id=${pId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          setPatientTimeline(tData.events || []);
        }

        // 3. Fetch past treatment plans
        const plRes = await fetch(`${API_URL}/api/treatment-plans/patient/${pId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (plRes.ok) {
          const plData = await plRes.json();
          setPatientPlans(plData.plans || []);
        }
      }
    } catch (err) {
      console.error("Error loading patient clinical context:", err);
    } finally {
      setLoadingCase(false);
    }
  };

  // Add medication row to form
  const handleAddMedRow = () => {
    setPlanMeds([
      ...planMeds,
      {
        medicine_name: "",
        dosage: "1 tablet",
        frequency: "Once daily",
        duration_days: 5,
        food_relation: "After food",
        time_of_day: "Morning",
        instructions: ""
      }
    ]);
  };

  // Update medication row
  const handleMedChange = (index, field, value) => {
    const updated = [...planMeds];
    updated[index][field] = value;
    setPlanMeds(updated);
  };

  // Remove medication row
  const handleRemoveMedRow = (index) => {
    setPlanMeds(planMeds.filter((_, i) => i !== index));
  };

  // Apply a preset
  const handleApplyPreset = (preset) => {
    setPlanMeds([
      ...planMeds.filter((m) => m.medicine_name.trim() !== ""),
      {
        medicine_name: preset.name,
        dosage: preset.dosage,
        frequency: preset.frequency,
        duration_days: preset.duration,
        food_relation: preset.food,
        time_of_day: preset.time,
        instructions: preset.instr
      }
    ]);
  };

  // Submit Treatment Plan
  const handleSubmitTreatmentPlan = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    const patientId = selectedCase.user_id || selectedCase.patient_id;
    if (!patientId) {
      alert("Notice: This patient is in walk-in / triage session mode. Plan will be sealed against this clinical session.");
    }

    if (!assessmentText.trim()) {
      alert("Please enter a clinical assessment before finalizing the treatment plan.");
      return;
    }

    setSubmittingPlan(true);
    setPlanSuccessMsg("");

    try {
      const validMeds = planMeds.filter((m) => m.medicine_name.trim() !== "");

      const res = await fetch(`${API_URL}/api/treatment-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: patientId || 1,
          clinical_assessment: assessmentText.trim(),
          diagnosis_notes: diagnosisNotes.trim() || null,
          follow_up_date: followUpDate || null,
          tests_recommended: testsRecommended.trim() || null,
          lifestyle_guidance: lifestyleGuidance.trim() || null,
          session_id: selectedCase.id,
          medications: validMeds
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlanSuccessMsg("✓ Clinician Treatment Plan Approved & Sealed. Prescriptions synced with patient timetable.");
        fetchWorkspace();
      } else {
        alert(data.detail || data.message || "Failed to submit treatment plan.");
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const counts = workspaceData?.counts || { all: 0, emergency: 0, urgent: 0, routine: 0 };
  const allCases = workspaceData?.today_queue || [];
  const assignedPatients = workspaceData?.assigned_patients || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Workspace Header */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563FF] to-[#53D8F5] flex items-center justify-center text-white shrink-0 shadow-[0_8px_20px_rgba(37,99,255,0.3)]">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#2563FF] border border-sky-200">
                Physician Station
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Decision Support Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10245A] tracking-tight">
              Doctor Clinical Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#687797]">
              Physician decision support, patient longitudinal review, and clinician-approved treatment planning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-right backdrop-blur-sm">
            <div className="text-xs font-extrabold text-[#10245A]">
              Dr. {user?.full_name || "Physician"}
            </div>
            <div className="text-[10px] text-[#2563FF] font-bold">Licensed Medical Practitioner</div>
          </div>
          <button
            onClick={() => goTo("/queue")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#7657FF] hover:opacity-95 text-white font-extrabold text-xs shadow-[0_8px_20px_rgba(37,99,255,0.3)] transition"
          >
            Triage Queue
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-rose-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Critical Emergencies</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{counts.emergency || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Immediate clinical attention</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-amber-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Urgent Queue</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.urgent || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Priority assessment needed</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-sky-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Assigned to Me</span>
          <div className="text-2xl font-black text-[#2563FF] mt-1">{assignedPatients.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Active patient caseload</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-emerald-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Total Today Cases</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{counts.all || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Facility triage volume</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "queue"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          Today's Queue ({allCases.length})
        </button>
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "assigned"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          Assigned Patients ({assignedPatients.length})
        </button>
        {selectedCase && (
          <button
            onClick={() => setActiveTab("patient_workspace")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "patient_workspace"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Patient Workspace: {selectedCase.patient_name || "Active Session"}
          </button>
        )}
      </div>

      {/* TAB 1: TODAY'S QUEUE */}
      {activeTab === "queue" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Patient Queue</h3>
              <p className="text-xs text-slate-500">
                Select any patient to launch the complete Clinical Workspace with Treatment Plan Creator.
              </p>
            </div>
            <button
              onClick={fetchWorkspace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading cases...
            </div>
          ) : allCases.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No patients in queue"
              description="All patient cases for today have been reviewed or discharged."
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
                    <th className="py-3 px-3.5">Patient</th>
                    <th className="py-3 px-3.5">Age / Gender</th>
                    <th className="py-3 px-3.5">Priority</th>
                    <th className="py-3 px-3.5">Latest Vitals</th>
                    <th className="py-3 px-3.5">Chief Complaint</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allCases.map((c) => {
                    const isEmergency = c.triage_level === "EMERGENCY" || c.is_emergency;
                    const isUrgent = c.triage_level === "URGENT";
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCase(c)}
                        className={`transition cursor-pointer hover:bg-slate-50/80 ${
                          isEmergency ? "bg-rose-50/20" : isUrgent ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <strong className="text-slate-900 block text-xs">{c.patient_name || "Patient"}</strong>
                          <span className="text-[10px] text-slate-400">Case #{c.id}</span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                          {c.age ? `${c.age} yrs` : "N/A"} {c.gender ? `• ${c.gender}` : ""}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={c.triage_level} />
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {c.vitals?.heart_rate ? `${c.vitals.heart_rate} bpm` : ""}{c.vitals?.spo2 ? ` • ${c.vitals.spo2}% SpO2` : ""}{c.vitals?.blood_pressure ? ` • ${c.vitals.blood_pressure}` : (!c.vitals?.heart_rate && !c.vitals?.spo2 ? "Standard vitals" : "")}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-[220px] truncate" title={c.symptoms}>
                          {c.symptoms || "General clinical check-in"}
                          {c.safety_warnings && c.safety_warnings.length > 0 && (
                            <span className="text-[10px] text-rose-600 font-semibold block truncate">
                              ⚠️ {c.safety_warnings[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCase(c);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1"
                          >
                            Examine <ArrowRight className="w-3 h-3" />
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
      )}

      {/* TAB 2: ASSIGNED PATIENTS */}
      {activeTab === "assigned" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Physician Assigned Patient Roster
          </h3>
          {assignedPatients.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No permanently assigned patients"
              description="You can review and claim cases from Today's Queue."
              primaryAction={{
                label: "Go to Queue",
                onClick: () => setActiveTab("queue"),
              }}
            />
          ) : (
            <div className="space-y-3">
              {assignedPatients.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.full_name}</h4>
                    <p className="text-xs text-slate-500">
                      Email: {p.email} • Assigned:{" "}
                      {p.assigned_at ? new Date(p.assigned_at).toLocaleDateString() : "Active"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSelectCase({
                        id: p.id,
                        patient_name: p.full_name,
                        user_id: p.id,
                        symptoms: "Assigned follow-up",
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1 self-start sm:self-auto"
                  >
                    Open Clinical Record <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETE PATIENT CLINICAL WORKSPACE & TREATMENT PLAN */}
      {activeTab === "patient_workspace" && selectedCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Patient Case Context & Timeline */}
          <div className="lg:col-span-6 space-y-5">
            {/* Patient Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={selectedCase.triage_level} />
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedCase.patient_name || "Patient"}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500">
                    Age: {selectedCase.age || "N/A"} • Gender: {selectedCase.gender || "N/A"} • Case ID: #{selectedCase.id}
                  </div>
                </div>

                <button
                  onClick={() => onOpenReferral(selectedCase)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <FileText className="w-3.5 h-3.5" /> Create Referral
                </button>
              </div>

              {/* Symptoms */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Chief Complaint & Symptoms
                </div>
                <div className="text-xs text-slate-900 font-medium">
                  {selectedCase.symptoms || "No chief complaint recorded."}
                </div>
              </div>

              {/* Recorded Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Heart Rate</span>
                  <span className={`text-sm font-bold block mt-0.5 ${selectedCase.heart_rate > 100 ? "text-rose-600" : "text-slate-900"}`}>
                    {selectedCase.heart_rate ? `${selectedCase.heart_rate} bpm` : "—"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">SpO2</span>
                  <span className={`text-sm font-bold block mt-0.5 ${selectedCase.spo2 < 95 ? "text-rose-600" : "text-slate-900"}`}>
                    {selectedCase.spo2 ? `${selectedCase.spo2}%` : "—"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {selectedCase.systolic_bp ? `${selectedCase.systolic_bp}/${selectedCase.diastolic_bp || 80}` : "—"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Temperature</span>
                  <span className={`text-sm font-bold block mt-0.5 ${selectedCase.temperature > 100 ? "text-rose-600" : "text-slate-900"}`}>
                    {selectedCase.temperature ? `${selectedCase.temperature}°` : "—"}
                  </span>
                </div>
              </div>

              {/* AI Clinical Summary Note */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-sky-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Clinical Summary Note (Decision Support)
                </div>
                <div className="text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                  {selectedCase.screen_summary || selectedCase.triage_result || "Triage evaluation completed without acute red flags."}
                </div>
              </div>
            </div>

            {/* Longitudinal Health Timeline */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Longitudinal Patient Health Timeline
              </h3>
              {patientTimeline.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No prior longitudinal history on file for this patient.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {patientTimeline.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <span className="text-base shrink-0 mt-0.5">{ev.icon}</span>
                      <div>
                        <div className="font-bold text-slate-900">{ev.title}</div>
                        <div className="text-slate-600">{ev.summary}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ev.date ? new Date(ev.date).toLocaleDateString() : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: CLINICIAN TREATMENT PLAN FORMULATION */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Formulation Desk
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Clinician Treatment Plan
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                Final Signoff: <strong className="text-slate-800">Physician</strong>
              </div>
            </div>

            {planSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                {planSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitTreatmentPlan} className="space-y-4">
              {/* Clinical Assessment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Assessment & Findings *
                </label>
                <textarea
                  rows={3}
                  value={assessmentText}
                  onChange={(e) => setAssessmentText(e.target.value)}
                  placeholder="e.g. Acute upper respiratory infection with mild tonsillar exudate. Stable vitals."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              {/* Diagnosis Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Working Diagnosis / ICD-11 Reference
                </label>
                <input
                  type="text"
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  placeholder="e.g. CA40 (Viral pharyngitis) / Non-streptococcal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              {/* Quick Prescribing Presets */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  Quick Pharmacopeia Presets:
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {prescriptionPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition"
                    >
                      + {p.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prescribed Medications List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Prescribed Medications ({planMeds.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition"
                  >
                    <Plus className="w-3 h-3" /> Add Med
                  </button>
                </div>

                <div className="space-y-2">
                  {planMeds.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={med.medicine_name}
                        onChange={(e) => handleMedChange(idx, "medicine_name", e.target.value)}
                        className="sm:col-span-5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Dose"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                        className="sm:col-span-3 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Freq (e.g. 1-0-1)"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        className="sm:col-span-3 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedRow(idx)}
                        className="sm:col-span-1 text-rose-500 hover:text-rose-700 p-1 flex justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up & Lab Orders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recommended Lab Tests
                  </label>
                  <input
                    type="text"
                    value={testsRecommended}
                    onChange={(e) => setTestsRecommended(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Lifestyle / Diet Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dietary & Recovery Guidance (Explained to patient by SANA)
                </label>
                <input
                  type="text"
                  value={lifestyleGuidance}
                  onChange={(e) => setLifestyleGuidance(e.target.value)}
                  placeholder="e.g. Drink warm fluids, avoid heavy salt, rest for 48 hours"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingPlan}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {submittingPlan ? "Sealing Treatment Plan..." : "Approve & Seal Clinician Treatment Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
