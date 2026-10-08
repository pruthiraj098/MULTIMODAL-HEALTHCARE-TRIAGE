// ============================================================
// HealthTriage AI - Personal Health Monitor Studio Component
// Full vital sign tracking, interactive trends, wellness check-in, & timeline
// ============================================================

import { useState, useEffect, useCallback } from "react";
import VitalTrendChart from "./VitalTrendChart";
import HealthTimeline from "./HealthTimeline";
import { API_URL } from "../../config";

const VITAL_METRICS_INFO = {
  heart_rate: { title: "Heart Rate", icon: "❤️", unit: "BPM", normalMin: 60, normalMax: 100, color: "#e11d48" },
  spo2: { title: "Blood Oxygen (SpO2)", icon: "🫁", unit: "%", normalMin: 95, normalMax: 100, color: "#0284c7" },
  temperature: { title: "Body Temperature", icon: "🌡", unit: "°F", normalMin: 97.0, normalMax: 99.0, color: "#d97706" },
  blood_pressure_systolic: { title: "Systolic Blood Pressure", icon: "🩸", unit: "mmHg", normalMin: 90, normalMax: 120, color: "#4f46e5" },
  respiratory_rate: { title: "Respiratory Rate", icon: "🫁", unit: "breaths/min", normalMin: 12, normalMax: 20, color: "#0d9488" },
  weight: { title: "Body Weight", icon: "⚖️", unit: "kg", normalMin: null, normalMax: null, color: "#9333ea" },
};

export default function HealthMonitor({ goTo = () => {} }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Trend settings
  const [selectedVital, setSelectedVital] = useState("heart_rate");
  const [selectedRange, setSelectedRange] = useState("7d");
  const [trendData, setTrendData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Form State for logging vitals
  const [showLogModal, setShowLogModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formVitals, setFormVitals] = useState({
    heart_rate: "",
    spo2: "",
    temperature: "",
    systolic_bp: "",
    diastolic_bp: "",
    respiratory_rate: "",
    weight: "",
    symptoms: "",
    notes: "",
    wellness_status: "feeling_well",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("healthtriage_token") || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // 1. Fetch Overview (Latest cards and recent timeline)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/health/monitoring`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        goTo("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOverview(data);
      } else {
        setError(data.detail || "Unable to load health monitoring data.");
      }
    } catch (err) {
      setError("Network error while connecting to health service.");
    } finally {
      setLoading(false);
    }
  }, [goTo]);

  // 2. Fetch Trend Data for selected vital & range
  const fetchTrends = useCallback(async (vitalType, range) => {
    setTrendLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/health/trends?range=${range}&type=${vitalType}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setTrendData(data.data || []);
        setTrendAnalysis(data.analysis || null);
      }
    } catch (err) {
      console.error("Trend fetch error:", err);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchTrends(selectedVital, selectedRange);
  }, [fetchTrends, selectedVital, selectedRange]);

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormVitals((prev) => ({ ...prev, [name]: value }));
  };

  // Submit New Measurements
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    const payload = {
      wellness_status: formVitals.wellness_status,
      notes: formVitals.notes.trim() || undefined,
      symptoms: formVitals.symptoms.trim() || undefined,
    };

    if (formVitals.heart_rate) payload.heart_rate = parseFloat(formVitals.heart_rate);
    if (formVitals.spo2) payload.spo2 = parseFloat(formVitals.spo2);
    if (formVitals.temperature) payload.temperature = parseFloat(formVitals.temperature);
    if (formVitals.systolic_bp) payload.systolic_bp = parseFloat(formVitals.systolic_bp);
    if (formVitals.diastolic_bp) payload.diastolic_bp = parseFloat(formVitals.diastolic_bp);
    if (formVitals.respiratory_rate) payload.respiratory_rate = parseFloat(formVitals.respiratory_rate);
    if (formVitals.weight) payload.weight = parseFloat(formVitals.weight);

    try {
      const res = await fetch(`${API_URL}/api/health/measurements`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to record health measurements.");
      }

      setSuccessMsg("Health measurements logged successfully!");
      setShowLogModal(false);
      setFormVitals({
        heart_rate: "",
        spo2: "",
        temperature: "",
        systolic_bp: "",
        diastolic_bp: "",
        respiratory_rate: "",
        weight: "",
        symptoms: "",
        notes: "",
        wellness_status: "feeling_well",
      });

      // Refresh overview and trend
      fetchOverview();
      fetchTrends(selectedVital, selectedRange);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete measurement
  const handleDeleteLog = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/health/measurements/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchOverview();
        fetchTrends(selectedVital, selectedRange);
      }
    } catch (err) {
      console.error("Delete measurement error:", err);
    }
  };

  const currentVitalConfig = VITAL_METRICS_INFO[selectedVital] || VITAL_METRICS_INFO.heart_rate;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Health Monitoring</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track vital signs, daily wellness, and clinical trajectory over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+</span> Log Measurements
          </button>
        </div>
      </div>

      {/* Notice messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-500 font-bold ml-2">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Section 1: Latest Vital Signs Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider text-xs">
            Current Physiological Overview
          </h2>
          <span className="text-xs text-slate-400">Patient-reported baselines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heart Rate */}
          <div
            onClick={() => setSelectedVital("heart_rate")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
              selectedVital === "heart_rate"
                ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                : "border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Heart Rate</span>
              <span className="text-lg">❤️</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-black text-slate-900">
                {overview?.cards?.heart_rate?.value ?? "—"}
              </span>
              <span className="text-xs text-slate-500 font-semibold">BPM</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  overview?.cards?.heart_rate?.status === "NORMAL"
                    ? "bg-emerald-50 text-emerald-700"
                    : overview?.cards?.heart_rate?.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {overview?.cards?.heart_rate?.status === "NORMAL" ? "Normal" : overview?.cards?.heart_rate?.status || "No Data"}
              </span>
              <span className="text-slate-400 text-[11px]">60–100 BPM</span>
            </div>
          </div>

          {/* SpO2 */}
          <div
            onClick={() => setSelectedVital("spo2")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
              selectedVital === "spo2"
                ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                : "border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Blood Oxygen (SpO2)</span>
              <span className="text-lg">🫁</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-black text-slate-900">
                {overview?.cards?.spo2?.value ?? "—"}
              </span>
              <span className="text-xs text-slate-500 font-semibold">%</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  overview?.cards?.spo2?.status === "NORMAL"
                    ? "bg-emerald-50 text-emerald-700"
                    : overview?.cards?.spo2?.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {overview?.cards?.spo2?.status === "NORMAL" ? "Normal" : overview?.cards?.spo2?.status || "No Data"}
              </span>
              <span className="text-slate-400 text-[11px]">95–100%</span>
            </div>
          </div>

          {/* Temperature */}
          <div
            onClick={() => setSelectedVital("temperature")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
              selectedVital === "temperature"
                ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                : "border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Temperature</span>
              <span className="text-lg">🌡</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-black text-slate-900">
                {overview?.cards?.temperature?.value ?? "—"}
              </span>
              <span className="text-xs text-slate-500 font-semibold">°F</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  overview?.cards?.temperature?.status === "NORMAL"
                    ? "bg-emerald-50 text-emerald-700"
                    : overview?.cards?.temperature?.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {overview?.cards?.temperature?.status === "NORMAL" ? "Normal" : overview?.cards?.temperature?.status || "No Data"}
              </span>
              <span className="text-slate-400 text-[11px]">97.0–99.0°F</span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div
            onClick={() => setSelectedVital("blood_pressure_systolic")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
              selectedVital === "blood_pressure_systolic"
                ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                : "border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Blood Pressure</span>
              <span className="text-lg">🩸</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-black text-slate-900">
                {overview?.blood_pressure_card?.display || "— / —"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  overview?.blood_pressure_card?.status === "NORMAL"
                    ? "bg-emerald-50 text-emerald-700"
                    : overview?.blood_pressure_card?.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {overview?.blood_pressure_card?.status || "No Data"}
              </span>
              <span className="text-slate-400 text-[11px]">&lt; 120/80</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Health Trend Studio */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Vital Sign Trajectory & Trend</h2>
            <p className="text-xs text-slate-500">
              Select a physiological metric to inspect trends across Today, 7 days, 30 days, or 3 months.
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {Object.entries(VITAL_METRICS_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedVital(key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedVital === key
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.title.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trend Summary Banner */}
        {trendAnalysis && trendAnalysis.count > 0 && (
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs text-blue-900">
            <div className="flex items-center gap-3">
              <span className="text-xl">📈</span>
              <div>
                <p className="font-bold text-sm text-blue-950">{trendAnalysis.summary}</p>
                <p className="text-blue-700/80 mt-0.5">
                  Trajectory: <strong className="capitalize">{trendAnalysis.direction}</strong> • Average: <strong>{trendAnalysis.average} {currentVitalConfig.unit}</strong> • Min: {trendAnalysis.min} • Max: {trendAnalysis.max}
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
              Non-diagnostic statistical trend
            </span>
          </div>
        )}

        {/* Vital Trend Chart Component */}
        <VitalTrendChart
          title={currentVitalConfig.title}
          unit={currentVitalConfig.unit}
          data={trendData}
          range={selectedRange}
          onRangeChange={(r) => setSelectedRange(r)}
          normalMin={currentVitalConfig.normalMin}
          normalMax={currentVitalConfig.normalMax}
          color={currentVitalConfig.color}
        />
      </div>

      {/* Section 3: Timeline of Measurements */}
      <HealthTimeline
        logs={overview?.recent_logs || []}
        onDeleteLog={handleDeleteLog}
        loading={loading}
      />

      {/* Non-Diagnostic Clinical Safety Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
        <span className="text-base text-slate-400">ℹ️</span>
        <div>
          <strong className="text-slate-700">Clinical Safety Notice:</strong>{" "}
          Health monitoring trends and physiological evaluations provide lifestyle and triage context. Measurements are self-reported and not calibrated by certified diagnostic instruments. Never diagnose disease or alter clinical treatments from individual readings.
        </div>
      </div>

      {/* Log Measurement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Log Health Measurements</h3>
                <p className="text-xs text-slate-500">Record vital signs manually for your personal health record</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              {/* Daily Wellness Check */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Daily Wellness Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "feeling_well", label: "😊 Great", desc: "No complaints" },
                    { id: "mild_fatigue", label: "😐 Tired", desc: "Mild fatigue" },
                    { id: "under_the_weather", label: "🤒 Unwell", desc: "Early symptoms" },
                    { id: "in_discomfort", label: "🤕 Discomfort", desc: "Noticeable pain" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setFormVitals((prev) => ({ ...prev, wellness_status: w.id }))}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        formVitals.wellness_status === w.id
                          ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-sm">{w.label}</div>
                      <div className="text-[10px] text-slate-400">{w.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">❤️ Heart Rate (BPM)</label>
                  <input
                    type="number"
                    name="heart_rate"
                    placeholder="e.g. 75"
                    value={formVitals.heart_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🫁 SpO2 (%)</label>
                  <input
                    type="number"
                    name="spo2"
                    placeholder="e.g. 98"
                    value={formVitals.spo2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🌡 Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="e.g. 98.6"
                    value={formVitals.temperature}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🫁 Resp. Rate (/min)</label>
                  <input
                    type="number"
                    name="respiratory_rate"
                    placeholder="e.g. 16"
                    value={formVitals.respiratory_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🩸 Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="systolic_bp"
                    placeholder="e.g. 120"
                    value={formVitals.systolic_bp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">🩸 Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="diastolic_bp"
                    placeholder="e.g. 80"
                    value={formVitals.diastolic_bp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">⚖️ Optional Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    placeholder="e.g. 70.5"
                    value={formVitals.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Symptoms / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">User-Reported Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  placeholder="e.g. Mild headache, slight fatigue"
                  value={formVitals.symptoms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Notes</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Measured after morning walk"
                  value={formVitals.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100 flex items-center gap-2">
                <span>🔒</span>
                <span>Values are stored strictly in your authenticated medical profile.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Measurement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
