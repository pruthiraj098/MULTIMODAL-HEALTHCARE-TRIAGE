import React, { useState, useEffect, useRef } from "react";
import {
  Pill,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Camera,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Utensils,
  Trash2,
  HelpCircle,
  Info,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  Activity,
  FileCheck,
  RefreshCw,
  X
} from "lucide-react";
import { API_URL } from "../../config";
import { EmptyState, StatusBadge, AlertCard } from "../common";

export default function MedicationTracker({ goTo, embedded = false }) {
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "medications" | "interactions" | "prescription"
  const [medications, setMedications] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    schedule: { Morning: [], Afternoon: [], Evening: [], Night: [] },
    summary: { total_doses: 0, taken: 0, missed: 0, pending: 0 }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [interactions, setInteractions] = useState([]);
  const [foodWarnings, setFoodWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  // Add medication modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    time_of_day: "Morning",
    instructions: "",
    food_warnings: ""
  });

  // Missed dose state
  const [selectedMissedMed, setSelectedMissedMed] = useState("");
  const [missedGuidance, setMissedGuidance] = useState(null);

  // Prescription scan state
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const prescriptionInputRef = useRef(null);

  // Custom interaction check input
  const [customMedInput, setCustomMedInput] = useState("");
  const [checkingCustom, setCheckingCustom] = useState(false);
  const [customInteractions, setCustomInteractions] = useState(null);

  const token = localStorage.getItem("healthtriage_token");

  // Load medications & schedule
  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");

      // Fetch medications & active interactions
      const medRes = await fetch(`${API_URL}/api/medications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedications(medData.medications || []);
        setInteractions(medData.interactions || []);
        setFoodWarnings(medData.food_warnings || []);
      }

      // Fetch schedule for current date
      const schedRes = await fetch(`${API_URL}/api/medications/schedule?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setScheduleData(schedData);
      }
    } catch (err) {
      console.error("Error loading medication data:", err);
      setError("Unable to load medication schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleLogDose = async (medId, timeOfDay, status) => {
    try {
      const res = await fetch(`${API_URL}/api/medications/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medication_id: medId,
          scheduled_date: selectedDate,
          time_of_day: timeOfDay,
          status: status
        })
      });

      if (res.ok) {
        setActionMessage(`Dose marked as ${status}!`);
        setTimeout(() => setActionMessage(""), 2500);
        // Refresh schedule
        const schedRes = await fetch(`${API_URL}/api/medications/schedule?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (schedRes.ok) {
          const updated = await schedRes.json();
          setScheduleData(updated);
        }
      }
    } catch (err) {
      console.error("Error logging dose:", err);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim() || !medForm.dosage.trim()) {
      setError("Please provide at least a medication name and dosage.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: medForm.name.trim(),
          dosage: medForm.dosage.trim(),
          frequency: medForm.frequency,
          time_of_day: medForm.time_of_day,
          instructions: medForm.instructions.trim(),
          food_warnings: medForm.food_warnings.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to add medication.");
      }

      setModalOpen(false);
      setMedForm({
        name: "",
        dosage: "",
        frequency: "Once daily",
        time_of_day: "Morning",
        instructions: "",
        food_warnings: ""
      });
      setActionMessage("Medication added successfully!");
      setTimeout(() => setActionMessage(""), 2500);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMedication = async (medId) => {
    if (!confirm("Are you sure you want to remove this medication from your regimen?")) return;
    try {
      const res = await fetch(`${API_URL}/api/medications/${medId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage("Medication removed.");
        setTimeout(() => setActionMessage(""), 2500);
        loadData();
      }
    } catch (err) {
      console.error("Error deleting med:", err);
    }
  };

  const handleMissedDoseCheck = async (medName) => {
    try {
      const res = await fetch(`${API_URL}/api/medications/missed-dose?name=${encodeURIComponent(medName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMissedGuidance(data);
      }
    } catch (err) {
      console.error("Error fetching missed dose guidance:", err);
    }
  };

  const handleCustomInteractionCheck = async (e) => {
    e.preventDefault();
    if (!customMedInput.trim()) return;

    setCheckingCustom(true);
    try {
      const medList = customMedInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/api/medications/check-interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ medications: medList })
      });
      if (res.ok) {
        const data = await res.json();
        setCustomInteractions(data);
      }
    } catch (err) {
      console.error("Error checking custom interactions:", err);
    } finally {
      setCheckingCustom(false);
    }
  };

  const handlePrescriptionFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setScanPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setScanPreview(null);
    }
  };

  const handleScanPrescription = async (e) => {
    e.preventDefault();
    if (!scanFile) return;

    setScanning(true);
    setError("");

    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(scanFile);
      });

      const res = await fetch(`${API_URL}/api/medications/scan-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          file_data: base64Data,
          mime_type: scanFile.type,
          file_name: scanFile.name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to scan prescription.");
      }

      setScannedResult(data);
    } catch (err) {
      setError(err.message || "Failed to process prescription.");
    } finally {
      setScanning(false);
    }
  };

  const handleAddScannedMed = async (med) => {
    try {
      const res = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "Once daily",
          time_of_day: med.time_of_day || "Morning",
          instructions: med.instructions || "",
          food_warnings: med.food_warnings || ""
        })
      });
      if (res.ok) {
        setActionMessage(`Added ${med.name} to schedule!`);
        setTimeout(() => setActionMessage(""), 2500);
        loadData();
      }
    } catch (err) {
      console.error("Error adding scanned med:", err);
    }
  };

  const slots = [
    { slot: "Morning", icon: Sunrise, desc: "Breakfast & Start of Day" },
    { slot: "Afternoon", icon: Sun, desc: "Lunch & Midday" },
    { slot: "Evening", icon: Sunset, desc: "Dinner & Early Evening" },
    { slot: "Night", icon: Moon, desc: "Bedtime" }
  ];

  return (
    <div className={`space-y-6 ${embedded ? "" : "max-w-7xl mx-auto"}`}>
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                Drug Safety & Regimen Schedule
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Medication Regimen & Tracker
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor daily schedule doses, check drug-drug conflicts, review dietary cautions, and capture prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[#2563FF] via-[#1544C4] to-[#7657FF] hover:opacity-95 rounded-xl transition-all shadow-[0_8px_24px_rgba(37,99,255,0.35)]"
            >
              <Plus size={15} />
              Add Medication
            </button>
          </div>
        </div>
      )}

      {/* Action Toast / Message */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn backdrop-blur-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-1 p-1.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/95 shadow-sm w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "schedule"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_12px_rgba(37,99,255,0.25)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar size={14} className={activeTab === "schedule" ? "text-white" : "text-slate-400"} />
          Daily Schedule
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("medications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "medications"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_12px_rgba(37,99,255,0.25)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Pill size={14} className={activeTab === "medications" ? "text-white" : "text-slate-400"} />
          My Medications ({medications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "interactions"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_12px_rgba(37,99,255,0.25)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert size={14} className={activeTab === "interactions" ? "text-white" : "text-slate-400"} />
          Interaction Checker
          {interactions.some((i) => i.severity === "Severe") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prescription")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "prescription"
              ? "bg-gradient-to-r from-[#2563FF] to-[#7657FF] text-white shadow-[0_4px_12px_rgba(37,99,255,0.25)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Camera size={14} className={activeTab === "prescription" ? "text-white" : "text-slate-400"} />
          Prescription Reader
        </button>
      </div>

      {/* =========================================================
          TAB 1: DAILY VISUAL SCHEDULE & TRACKER
          ========================================================= */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Schedule Controls & Daily Adherence Bar */}
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Schedule Date
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                    className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Adherence Counters */}
            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-around md:justify-end">
              <div className="text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Taken</span>
                <p className="text-xl font-black text-emerald-600">{scheduleData.summary?.taken || 0}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Upcoming</span>
                <p className="text-xl font-black text-amber-600">{scheduleData.summary?.pending || 0}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Missed</span>
                <p className="text-xl font-black text-rose-600">{scheduleData.summary?.missed || 0}</p>
              </div>
            </div>
          </div>

          {/* 4 Time Slots Visual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slots.map(({ slot, icon: SlotIcon, desc }) => {
              const meds = scheduleData.schedule?.[slot] || [];

              return (
                <div
                  key={slot}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <SlotIcon size={17} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{slot}</h3>
                          <span className="text-[10px] text-slate-400 block">{desc}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {meds.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {meds.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          <Clock size={20} className="mx-auto text-slate-300 mb-1" />
                          <span>No medications for {slot.toLowerCase()}</span>
                        </div>
                      ) : (
                        meds.map((med) => {
                          const isTaken = med.status === "taken";
                          const isMissed = med.status === "missed";

                          return (
                            <div
                              key={med.id}
                              className={`p-3 rounded-xl border transition-all space-y-2 ${
                                isTaken
                                  ? "bg-emerald-50/60 border-emerald-200"
                                  : isMissed
                                  ? "bg-rose-50/60 border-rose-200"
                                  : "bg-slate-50/80 border-slate-200/80"
                              }`}
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {med.name}
                                </span>
                                <span className="text-[11px] font-semibold text-sky-700 shrink-0">
                                  {med.dosage}
                                </span>
                              </div>

                              {med.instructions && (
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {med.instructions}
                                </p>
                              )}

                              {med.food_warnings && (
                                <p className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                  ⚠️ {med.food_warnings}
                                </p>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleLogDose(med.id, slot, isTaken ? "pending" : "taken")}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                                    isTaken
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800"
                                  }`}
                                >
                                  <CheckCircle2 size={12} />
                                  {isTaken ? "Taken" : "Mark Taken"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleLogDose(med.id, slot, isMissed ? "pending" : "missed")}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                                    isMissed
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "bg-white border border-slate-200 hover:bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {isMissed ? "Missed" : "Skip"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: MY MEDICATIONS LIST & ADD
          ========================================================= */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Regimen ({medications.length})
            </h2>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
            >
              <Plus size={14} /> Add Prescribed Drug
            </button>
          </div>

          {medications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
              <EmptyState
                icon={Pill}
                title="No Medications in Regimen"
                description="Add your prescribed or OTC medications to monitor schedules, detect cross-drug interactions, and receive missed-dose protocols."
                actionText="Add Medication"
                onAction={() => setModalOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                        <span className="text-xs font-semibold text-sky-700">{med.dosage}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {med.time_of_day}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p><strong>Frequency:</strong> {med.frequency}</p>
                      {med.instructions && <p><strong>Directions:</strong> {med.instructions}</p>}
                      {med.food_warnings && (
                        <p className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200/60 font-medium">
                          ⚠️ {med.food_warnings}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleMissedDoseCheck(med.name)}
                      className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                    >
                      <HelpCircle size={13} />
                      Missed Dose Info
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedication(med.id)}
                      className="font-semibold text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Remove medication"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missed Dose Guidance Drawer */}
          {missedGuidance && (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    🕒
                  </div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Missed Dose Protocol: {missedGuidance.medication}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setMissedGuidance(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong>Specific Advice: </strong>{missedGuidance.specific_guidance}
              </p>
              <p className="text-[11px] text-emerald-800/80 italic">
                <strong>General Safety Rule: </strong>{missedGuidance.general_safe_protocol}
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: DRUG-DRUG & FOOD INTERACTION CHECKER
          ========================================================= */}
      {activeTab === "interactions" && (
        <div className="space-y-6">
          {/* Active Interactions Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-600" />
                Active Regimen Interaction Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time clinical conflict analysis between all active medications in your profile
              </p>
            </div>

            {interactions.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-emerald-950">No Documented Severe Interactions Detected</strong>
                  <span className="text-emerald-800 text-[11px]">
                    Your current medication combinations show no known contraindications or high-risk interactions.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((int, idx) => {
                  const isSevere = (int.severity || "").toLowerCase() === "severe";
                  const isMod = (int.severity || "").toLowerCase() === "moderate";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isSevere
                          ? "bg-rose-50/70 border-rose-200 text-rose-950"
                          : isMod
                          ? "bg-amber-50/70 border-amber-200 text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm font-bold">
                          {int.drug_a} + {int.drug_b}
                        </strong>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            isSevere
                              ? "bg-rose-200 text-rose-900"
                              : isMod
                              ? "bg-amber-200 text-amber-900"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {int.severity}
                        </span>
                      </div>
                      <p className="leading-relaxed"><strong>Mechanism:</strong> {int.clinical_effect}</p>
                      <p className="font-semibold"><strong>Physician Directive:</strong> {int.recommendation}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Food & Lifestyle Warnings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Utensils size={15} className="text-amber-600" />
              Dietary & Food Cautions
            </h3>

            {foodWarnings.length === 0 ? (
              <p className="text-xs text-slate-400">No specific food interactions recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {foodWarnings.map((fw, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                      {fw.medication}
                    </span>
                    <strong className="text-amber-950 block">Avoid: {fw.avoid}</strong>
                    <p className="text-amber-900/80 text-[11px] leading-relaxed">{fw.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Checker Tool */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Test New Drug Combinations
            </h3>
            <p className="text-xs text-slate-500">
              Enter multiple medication names separated by commas (e.g. Warfarin, Aspirin, Metformin) to test before taking:
            </p>

            <form onSubmit={handleCustomInteractionCheck} className="flex gap-2">
              <input
                type="text"
                value={customMedInput}
                onChange={(e) => setCustomMedInput(e.target.value)}
                placeholder="e.g. Lisinopril, Ibuprofen, Atorvastatin"
                className="flex-1 text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={checkingCustom}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                {checkingCustom ? "Checking..." : "Audit Safety"}
              </button>
            </form>

            {customInteractions && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800">{customInteractions.summary}</p>
                {customInteractions.interactions?.map((ci, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                    <strong className="text-slate-900">{ci.drug_a} + {ci.drug_b} ({ci.severity})</strong>
                    <p className="text-slate-600 text-[11px]">{ci.clinical_effect}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: PRESCRIPTION OCR READER
          ========================================================= */}
      {activeTab === "prescription" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Camera size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Prescription Photo Reader
                </h3>
                <span className="text-xs text-slate-400">Scan handwritten or printed prescription slips</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleScanPrescription} className="space-y-4">
              <div
                onClick={() => prescriptionInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <input
                  type="file"
                  ref={prescriptionInputRef}
                  onChange={handlePrescriptionFile}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                {scanFile ? (
                  <div className="space-y-2">
                    {scanPreview ? (
                      <img
                        src={scanPreview}
                        alt="Prescription preview"
                        className="w-20 h-20 object-cover rounded-lg mx-auto border border-purple-200"
                      />
                    ) : (
                      <FileCheck size={28} className="mx-auto text-purple-600" />
                    )}
                    <p className="text-xs font-semibold text-slate-800">{scanFile.name}</p>
                    <span className="text-[11px] text-purple-600">Change image</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera size={28} className="mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-800">Upload or snap prescription</p>
                    <p className="text-[11px] text-slate-400">JPG, PNG or PDF slip</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={scanning || !scanFile}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wide bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm disabled:opacity-50"
              >
                {scanning ? "Processing OCR & Medications..." : "Extract Prescription Regimen"}
              </button>
            </form>
          </div>

          {/* Scanned Results */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Extracted Prescriptions
            </h3>

            {scannedResult ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">{scannedResult.summary}</p>
                {scannedResult.medications?.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-purple-950 text-sm block">{m.name}</strong>
                      <span className="text-purple-800 font-medium">{m.dosage} • {m.frequency}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddScannedMed(m)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700 transition-colors shadow-xs"
                    >
                      + Add to Regimen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileCheck size={28} className="mx-auto text-slate-300 mb-1" />
                <p>Upload a prescription to see extracted drugs and timings here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD MEDICATION
          ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Prescribed Medication</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin, Atorvastatin"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500mg, 10ml"
                    value={medForm.dosage}
                    onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Thrice daily">Thrice daily</option>
                    <option value="As needed">As needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time of Day</label>
                <select
                  value={medForm.time_of_day}
                  onChange={(e) => setMedForm({ ...medForm, time_of_day: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Directions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Take with warm water after breakfast"
                  value={medForm.instructions}
                  onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Food / Alcohol Cautions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Avoid grapefruit, avoid alcohol"
                  value={medForm.food_warnings}
                  onChange={(e) => setMedForm({ ...medForm, food_warnings: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors shadow-sm"
                >
                  {submitting ? "Saving..." : "Add to Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
