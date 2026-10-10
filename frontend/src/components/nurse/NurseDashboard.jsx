// ============================================================
// HealthTriage AI - Nurse Dashboard & Intake Workspace
// Rapid Patient Intake, Vitals Monitoring, Triage Priority & Escalation
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Thermometer,
  User,
  UserPlus,
  ArrowRight,
  ChevronRight,
  Flame,
  Check,
  AlertCircle,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

export default function NurseDashboard({
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

  const [nurseData, setNurseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "intake_form"

  // Patient Intake Form State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Female");
  const [symptoms, setSymptoms] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [systolicBp, setSystolicBp] = useState("");
  const [diastolicBp, setDiastolicBp] = useState("");
  const [observations, setObservations] = useState("");
  const [escalateToDoctor, setEscalateToDoctor] = useState(false);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeSuccess, setIntakeSuccess] = useState(null);

  // Quick vital flag computation
  const vitalWarnings = useMemo(() => {
    const list = [];
    const hr = parseFloat(heartRate);
    const sp = parseFloat(spo2);
    const temp = parseFloat(temperature);
    const sys = parseFloat(systolicBp);

    if (hr > 130) list.push("Critical Tachycardia (HR > 130 bpm)");
    else if (hr > 100) list.push("Elevated Pulse (HR > 100 bpm)");
    else if (hr < 50) list.push("Bradycardia (HR < 50 bpm)");

    if (sp < 90) list.push("Severe Hypoxia (SpO2 < 90%) — Immediate O2 required");
    else if (sp < 95) list.push("Borderline Hypoxemia (SpO2 < 95%)");

    if (temp > 102) list.push("High Grade Pyrexia (Temp > 102°F)");
    else if (temp > 100) list.push("Febrile (Temp > 100°F)");

    if (sys > 180) list.push("Hypertensive Crisis (Systolic > 180 mmHg)");
    else if (sys < 90) list.push("Hypotension (Systolic < 90 mmHg)");

    return list;
  }, [heartRate, spo2, temperature, systolicBp]);

  // Fetch Nurse Overview
  const fetchNurseOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/nurse/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNurseData(data);
      }
    } catch (err) {
      console.error("Nurse overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurseOverview();
  }, []);

  // Submit Patient Intake
  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !symptoms.trim()) {
      alert("Patient name and primary symptoms are required.");
      return;
    }

    setSubmittingIntake(true);
    setIntakeSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/nurse/intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          age: patientAge ? parseInt(patientAge) : null,
          gender: patientGender,
          symptoms: symptoms.trim(),
          heart_rate: heartRate ? parseFloat(heartRate) : null,
          spo2: spo2 ? parseFloat(spo2) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          respiratory_rate: respiratoryRate ? parseFloat(respiratoryRate) : null,
          systolic_bp: systolicBp ? parseFloat(systolicBp) : null,
          diastolic_bp: diastolicBp ? parseFloat(diastolicBp) : null,
          observations: observations.trim() || null,
          escalate_to_doctor: escalateToDoctor || vitalWarnings.some((w) => w.includes("Critical") || w.includes("Severe") || w.includes("Crisis"))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIntakeSuccess(data);
        // Reset form
        setPatientName("");
        setPatientAge("");
        setSymptoms("");
        setHeartRate("");
        setSpo2("");
        setTemperature("");
        setRespiratoryRate("");
        setSystolicBp("");
        setDiastolicBp("");
        setObservations("");
        setEscalateToDoctor(false);
        fetchNurseOverview();
      } else {
        alert(data.detail || data.message || "Failed to submit patient intake.");
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmittingIntake(false);
    }
  };

  const counts = nurseData?.counts || { all: 0, emergency: 0, urgent: 0, routine: 0 };
  const allCases = nurseData?.all_cases || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#58DDB5] to-[#2563FF] flex items-center justify-center text-white shrink-0 shadow-[0_8px_20px_rgba(88,221,181,0.3)]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Nursing & Triage Intake
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                First-Contact Desk
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10245A] tracking-tight">
              Nurse Dashboard & Intake Desk
            </h1>
            <p className="text-xs sm:text-sm text-[#687797]">
              First-contact patient check-in, vitals monitoring, priority classification, and doctor escalation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-right backdrop-blur-sm">
            <div className="text-xs font-extrabold text-[#10245A]">
              Nurse {user?.full_name || "Clinical Nurse"}
            </div>
            <div className="text-[10px] text-teal-600 font-bold">Nursing Officer • On Duty</div>
          </div>
          <button
            onClick={() => setActiveTab("intake_form")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#7657FF] hover:opacity-95 text-white font-extrabold text-xs shadow-[0_8px_20px_rgba(37,99,255,0.3)] transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Patient Check-In
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-rose-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Emergency Triage</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{counts.emergency || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Immediate resuscitation / doctor alert</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-amber-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Urgent Cases</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.urgent || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Priority nurse observation</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-emerald-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Routine OPD Intake</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{counts.routine || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Stable outpatient queue</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 border-l-4 border-l-sky-500 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.06)]">
          <span className="text-[11px] font-extrabold text-[#687797] uppercase tracking-wider">Total Intake Today</span>
          <div className="text-2xl font-black text-[#2563FF] mt-1">{counts.all || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Total processed intake slips</div>
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
          Live Triage Queue ({allCases.length})
        </button>
        <button
          onClick={() => setActiveTab("intake_form")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeTab === "intake_form"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_15px_rgba(37,99,255,0.3)]"
              : "bg-white/80 hover:bg-white text-slate-700 border border-white/90 backdrop-blur-sm"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Rapid Patient Intake & Vitals
        </button>
      </div>

      {/* TAB 1: LIVE TRIAGE QUEUE */}
      {activeTab === "queue" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Nursing Triage Queue</h3>
              <p className="text-xs text-slate-500">
                Patients waiting for physician consultation or vital updates.
              </p>
            </div>
            <button
              onClick={fetchNurseOverview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading queue...
            </div>
          ) : allCases.length === 0 ? (
            <EmptyState
              icon={User}
              title="No patients in current nursing queue"
              description="Click '+ New Patient Check-In' above to register a walk-in patient."
              primaryAction={{
                label: "Register Walk-in Patient",
                onClick: () => setActiveTab("intake_form"),
              }}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
                    <th className="py-3 px-3.5">Queue ID</th>
                    <th className="py-3 px-3.5">Patient</th>
                    <th className="py-3 px-3.5">Age / Gender</th>
                    <th className="py-3 px-3.5">Priority</th>
                    <th className="py-3 px-3.5">Reported Symptoms</th>
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
                        className={`transition hover:bg-slate-50/80 ${
                          isEmergency ? "bg-rose-50/20" : isUrgent ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                          #Q-{c.id}
                        </td>
                        <td className="py-3 px-3.5">
                          <strong className="text-slate-900 block text-xs">{c.patient_name || "Patient"}</strong>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                          {c.age ? `${c.age} yrs` : "N/A"} {c.gender ? `• ${c.gender}` : ""}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={c.triage_level} />
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-[280px] truncate" title={c.symptoms}>
                          {c.symptoms || "General intake"}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => goTo("/queue")}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1"
                          >
                            Details <ArrowRight className="w-3 h-3" />
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

      {/* TAB 2: RAPID INTAKE & VITALS RECORDING FORM */}
      {activeTab === "intake_form" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Intake Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  STEP-BY-STEP INTAKE
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Patient Intake & Vital Signs Registration
              </h3>
            </div>

            {intakeSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> {intakeSuccess.message}
                </div>
                <div>
                  Assigned Triage Priority: <strong>{intakeSuccess.triage_level}</strong> • Session ID: #{intakeSuccess.session_id}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitIntake} className="space-y-4">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient-Reported Symptoms & Chief Complaint *
                </label>
                <textarea
                  rows={2}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. High fever for 3 days, dry cough, weakness, breathing difficulty on stairs."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Vitals Recording Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-teal-800 uppercase">
                  Clinical Vital Signs (Optional — Missing vitals will NOT block intake)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="e.g. 88"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="e.g. 96"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="e.g. 98.6"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Respiration Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Nurse Observations */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nurse Observations / Physical Appearance
                </label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="e.g. Pallor visible, conscious and oriented, ambulatory without support."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Emergency Escalation Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <input
                  type="checkbox"
                  id="escalateCheck"
                  checked={escalateToDoctor}
                  onChange={(e) => setEscalateToDoctor(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="escalateCheck" className="text-xs text-rose-800 font-bold cursor-pointer">
                  Escalate Immediately to Doctor (Forces Emergency Status)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingIntake}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {submittingIntake ? "Registering & Running Triage..." : "Save Patient Intake & Assign Triage Priority"}
              </button>
            </form>
          </div>

          {/* Right Column: Live Physiological Safety Gauge */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Real-Time Physiological Risk Monitor
              </h4>
              <p className="text-xs text-slate-500">
                Deterministic safety bounds evaluate vital numbers dynamically as you type.
              </p>

              {vitalWarnings.length === 0 ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  All entered physiological values are within safe outpatient limits.
                </div>
              ) : (
                <div className="space-y-2">
                  {vitalWarnings.map((w, i) => (
                    <div
                      key={i}
                      className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-slate-900">
                Nursing Intake Workflow Rules
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Vital signs are optional — never delay intake if a vitals instrument is temporarily unavailable.</li>
                <li>Red-flag physiological warnings will automatically bump the case to Emergency priority.</li>
                <li>Intake slips immediately sync into the Doctor Clinical Workspace queue.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
