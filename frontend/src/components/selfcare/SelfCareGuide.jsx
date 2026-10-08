import React, { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function SelfCareGuide({ goTo, embedded = false }) {
  const [activeTab, setActiveTab] = useState("remedies"); // "remedies" | "wellness" | "trends" | "library"
  const [symptomInput, setSymptomInput] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [durationDays, setDurationDays] = useState(1);
  const [loadingRemedy, setLoadingRemedy] = useState(false);
  const [remedyResult, setRemedyResult] = useState(null);
  const [remedyError, setRemedyError] = useState("");

  // Daily wellness form state
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0]);
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [mood, setMood] = useState("Neutral");
  const [energyLevel, setEnergyLevel] = useState("Medium");
  const [wellnessNotes, setWellnessNotes] = useState("");
  const [savingWellness, setSavingWellness] = useState(false);
  const [wellnessMessage, setWellnessMessage] = useState("");

  // Wellness history state
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [wellnessTrends, setWellnessTrends] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Remedy library state
  const [libraryData, setLibraryData] = useState(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const token = localStorage.getItem("healthtriage_token");

  // Quick categories for symptom selector
  const quickCategories = [
    { label: "Cough & Cold", query: "Cough and mild throat tickle" },
    { label: "Sore Throat", query: "Scratchy sore throat" },
    { label: "Sinus Congestion", query: "Nasal congestion and stuffy nose" },
    { label: "Tension Headache", query: "Mild tension headache and fatigue" },
    { label: "Mild Nausea", query: "Mild nausea and queasiness" },
    { label: "Heartburn / Acidity", query: "Mild acid reflux and heartburn" },
    { label: "Muscle Soreness", query: "Mild muscle strain and ache" },
    { label: "Mild Constipation", query: "Occasional mild constipation" },
    { label: "Sleep Restlessness", query: "Difficulty falling asleep and restlessness" },
  ];

  // Fetch wellness history and trends
  const loadWellnessHistory = async () => {
    if (!token) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_URL}/api/self-care/wellness-history?days=14`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWellnessHistory(data.logs || []);
        setWellnessTrends(data.trends || null);

        // Prepopulate today if logged
        if (data.today_checkin) {
          setWaterGlasses(data.today_checkin.water_glasses || 0);
          setSleepHours(data.today_checkin.sleep_hours || 7.0);
          setMood(data.today_checkin.mood || "Neutral");
          setEnergyLevel(data.today_checkin.energy_level || "Medium");
          setWellnessNotes(data.today_checkin.notes || "");
        }
      }
    } catch (err) {
      console.error("Failed to load wellness history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch remedy library
  const loadLibrary = async () => {
    if (!token || libraryData) return;
    try {
      setLoadingLibrary(true);
      const res = await fetch(`${API_URL}/api/self-care/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLibraryData(data.categories || {});
      }
    } catch (err) {
      console.error("Failed to load remedy library:", err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadWellnessHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "library" && !libraryData) {
      loadLibrary();
    }
  }, [activeTab]);

  // Handle Remedy Search
  const handleSearchRemedies = async (e) => {
    if (e) e.preventDefault();
    if (!symptomInput.trim()) {
      setRemedyError("Please enter your symptom or select a quick topic.");
      return;
    }

    try {
      setLoadingRemedy(true);
      setRemedyError("");
      setRemedyResult(null);

      const res = await fetch(`${API_URL}/api/self-care/remedies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom: symptomInput.trim(),
          severity: severity,
          duration_days: parseInt(durationDays) || 1,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to retrieve self-care guidance.");
      }

      const data = await res.json();
      setRemedyResult(data);
    } catch (err) {
      setRemedyError(err.message || "An error occurred fetching remedies.");
    } finally {
      setLoadingRemedy(false);
    }
  };

  // Handle Save Wellness Check-in
  const handleSaveWellness = async (e) => {
    e.preventDefault();
    try {
      setSavingWellness(true);
      setWellnessMessage("");

      const res = await fetch(`${API_URL}/api/self-care/wellness-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkin_date: todayDate,
          water_glasses: parseInt(waterGlasses) || 0,
          sleep_hours: parseFloat(sleepHours) || 0.0,
          mood: mood,
          energy_level: energyLevel,
          notes: wellnessNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not save wellness check-in.");
      }

      setWellnessMessage("Daily wellness log saved successfully!");
      loadWellnessHistory();
      setTimeout(() => setWellnessMessage(""), 4000);
    } catch (err) {
      setWellnessMessage("Error: " + err.message);
    } finally {
      setSavingWellness(false);
    }
  };

  const isEmergency = remedyResult && remedyResult.alert_level === "EMERGENCY";

  return (
    <div className={`w-full max-w-6xl mx-auto ${embedded ? "p-0" : "p-4 sm:p-6"} space-y-6 text-slate-100`}>
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Phase 6 - Natural & Self-Care
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Evidence-Based
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-emerald-400">Natural & Self-Care</span> Guidance
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Supportive comfort measures, conservative home care, hydration & sleep tracking.
              Home care never replaces clinical diagnosis or emergency escalation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {goTo && (
              <button
                onClick={() => goTo("dashboard")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* CLINICAL DISCLAIMER BAR */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-300/80 flex items-start gap-2 bg-amber-500/5 p-2.5 rounded-lg border-amber-500/20">
          <span className="text-amber-400 font-bold shrink-0">NOTICE:</span>
          <span>
            Comfort measures and supportive home care do not replace medical evaluation or treatment.
            If symptoms escalate, persist beyond expected duration, or include red flags, seek immediate clinical care.
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("remedies")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "remedies"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Symptom Remedies
        </button>

        <button
          onClick={() => setActiveTab("wellness")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "wellness"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Daily Wellness Log
        </button>

        <button
          onClick={() => setActiveTab("trends")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "trends"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Lifestyle Analytics ({wellnessHistory.length})
        </button>

        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "library"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Clinical Remedy Library
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SYMPTOM REMEDY SEARCH & CHECKER */}
      {/* ============================================================ */}
      {activeTab === "remedies" && (
        <div className="space-y-6">
          {/* SEARCH FORM CARD */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Symptom Self-Care Assessment
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter your mild symptom below. The engine screens for emergency red flags, verifies against your active vitals, and provides vetted comfort measures.
            </p>

            <form onSubmit={handleSearchRemedies} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Describe Your Symptom
                  </label>
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="e.g. Dry hacking cough at night, mild heartburn, scratchy throat..."
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Reported Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="mild">Mild (Discomfort, functional)</option>
                    <option value="moderate">Moderate (Noticeable burden)</option>
                    <option value="severe">Severe (Urgent medical evaluation needed)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* QUICK PILLS */}
              <div>
                <span className="text-xs text-slate-500 mr-2 font-medium">Quick Suggestions:</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {quickCategories.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSymptomInput(c.query);
                        setSeverity("mild");
                        setDurationDays(1);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700/70 text-slate-300 transition"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {remedyError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {remedyError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingRemedy}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingRemedy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Checking Clinical Safety...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Evaluate Remedies
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* EMERGENCY ESCALATION OVERRIDE BANNER */}
          {isEmergency && (
            <div className="bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-2xl shrink-0">
                  !
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-extrabold text-rose-200">
                      EMERGENCY WARNING: SEEK IMMEDIATE CARE
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                      Red-Flag Alert
                    </span>
                  </div>

                  <p className="text-sm text-rose-100/90 leading-relaxed font-medium">
                    {remedyResult.warning}
                  </p>

                  {remedyResult.safety_reasons && remedyResult.safety_reasons.length > 0 && (
                    <div className="bg-rose-900/40 p-3 rounded-xl border border-rose-500/40 text-xs text-rose-200 space-y-1">
                      <span className="font-bold">Clinical Concerns Identified:</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {remedyResult.safety_reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap gap-3">
                    <a
                      href="tel:112"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Emergency (112)
                    </a>
                    <a
                      href="tel:108"
                      className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm shadow-lg flex items-center gap-2"
                    >
                      Ambulance (108)
                    </a>
                    <a
                      href="tel:911"
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-600 flex items-center gap-2"
                    >
                      US Emergency (911)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAFE EVIDENCE-BASED REMEDIES DISPLAY */}
          {remedyResult && !isEmergency && (
            <div className="space-y-6">
              {/* TOP SUMMARY BAR */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {remedyResult.matched_category || "Supportive Care"}
                    </span>
                    <span className="text-xs text-slate-400">
                      Category: {remedyResult.category_type || "General"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Guidance for: "{remedyResult.symptom}"
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Triage Status</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Safe for Supportive Home Care
                    </span>
                  </div>
                </div>
              </div>

              {/* SAFETY WARNINGS / MEDICATION ALERTS */}
              {remedyResult.safety_warnings && remedyResult.safety_warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Safety Considerations & Cross-Checks:
                  </span>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {remedyResult.safety_warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* REMEDIES LIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {remedyResult.remedies && remedyResult.remedies.map((rem, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                          {rem.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                          rem.evidence_strength.includes("High")
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {rem.evidence_strength}
                        </span>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-emerald-400 block mb-1">Instructions:</span>
                        {rem.instructions}
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-semibold text-slate-300">Clinical Rationale: </span>
                        {rem.rationale}
                      </div>

                      {rem.precautions && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-xs text-rose-300 leading-relaxed font-medium">
                          {rem.precautions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CONTRAINDICATIONS & WHEN TO SEE DOCTOR 2-COLUMN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CONTRAINDICATIONS */}
                <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-5 shadow-lg">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Contraindications (Do NOT Use Home Care If:)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {remedyResult.contraindications && remedyResult.contraindications.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold shrink-0">x</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* WHEN TO SEE A DOCTOR */}
                <div className="bg-slate-900/80 border border-blue-500/20 rounded-2xl p-5 shadow-lg">
                  <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    When to See a Doctor (Decision Checkpoints)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {remedyResult.when_to_see_doctor && remedyResult.when_to_see_doctor.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold shrink-0">-</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* GENERAL LIFESTYLE RECOMMENDATIONS */}
              {remedyResult.general_lifestyle && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
                  <h4 className="text-sm font-bold text-emerald-300 mb-2">
                    Lifestyle & Immune Recovery Protocol
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {remedyResult.general_lifestyle.map((g, i) => (
                      <div key={i} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DAILY WELLNESS & HABIT TRACKER */}
      {/* ============================================================ */}
      {activeTab === "wellness" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  Daily Holistic Wellness Check-in
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track your restorative pillars: daily water hydration, sleep quality, mood, and vitality.
                </p>
              </div>

              <div>
                <input
                  type="date"
                  value={todayDate}
                  onChange={(e) => setTodayDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <form onSubmit={handleSaveWellness} className="space-y-6">
              {/* WATER HYDRATION SECTION */}
              <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💧</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Daily Hydration Tracker</h3>
                      <p className="text-xs text-slate-400">Clinical goal: 8 to 10 glasses (2 - 2.5 Liters)</p>
                    </div>
                  </div>
                  <span className={`text-base font-extrabold px-3 py-1 rounded-xl ${
                    waterGlasses >= 8 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-slate-800 text-slate-300"
                  }`}>
                    {waterGlasses} / 8 Glasses
                  </span>
                </div>

                {/* INTERACTIVE GLASSES */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWaterGlasses(g === waterGlasses ? g - 1 : g)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                        g <= waterGlasses
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10"
                          : "bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-lg">{g <= waterGlasses ? "💧" : "🥛"}</span>
                      <span className="text-[10px] font-bold">Glass {g}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    - 1 Glass
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterGlasses(waterGlasses + 1)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    + 1 Glass
                  </button>
                </div>
              </div>

              {/* SLEEP RESTORATION SECTION */}
              <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌙</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Sleep Duration</h3>
                      <p className="text-xs text-slate-400">Optimal adult restorative range: 7.0 - 9.0 hours</p>
                    </div>
                  </div>
                  <span className={`text-base font-extrabold px-3 py-1 rounded-xl ${
                    sleepHours >= 7 && sleepHours <= 9
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-slate-800 text-slate-300"
                  }`}>
                    {sleepHours} Hours
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <input
                    type="range"
                    min="3.0"
                    max="12.0"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>3 hrs (Deprived)</span>
                    <span className="text-indigo-400 font-bold">7 - 9 hrs (Optimal)</span>
                    <span>12 hrs</span>
                  </div>
                </div>
              </div>

              {/* MOOD & ENERGY SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MOOD */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Today's Mood State
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "Great", emoji: "😊" },
                      { label: "Good", emoji: "🙂" },
                      { label: "Neutral", emoji: "😐" },
                      { label: "Stressed", emoji: "😰" },
                      { label: "Fatigued", emoji: "😴" },
                    ].map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setMood(m.label)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          mood === m.label
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-[10px] font-semibold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ENERGY LEVEL */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Energy / Vitality Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "High", sub: "Energized", color: "emerald" },
                      { label: "Medium", sub: "Balanced", color: "blue" },
                      { label: "Low", sub: "Sluggish", color: "amber" },
                    ].map((e) => (
                      <button
                        key={e.label}
                        type="button"
                        onClick={() => setEnergyLevel(e.label)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                          energyLevel === e.label
                            ? "bg-slate-800 border-emerald-400 text-emerald-300 shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-xs font-bold">{e.label}</span>
                        <span className="text-[10px] text-slate-500">{e.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">
                  Daily Notes & Comfort Observations (Optional)
                </label>
                <textarea
                  rows="2"
                  value={wellnessNotes}
                  onChange={(e) => setWellnessNotes(e.target.value)}
                  placeholder="e.g. Drank ginger tea in the morning, went for a 20 min walk, cough settled down..."
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {wellnessMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  wellnessMessage.includes("Error")
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                }`}>
                  {wellnessMessage}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingWellness}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {savingWellness ? "Saving Record..." : "Save Today's Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: WELLNESS TRENDS & ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading wellness trends...
            </div>
          ) : (
            <>
              {/* TOP METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-slate-400 block mb-1">Check-in Streak</span>
                  <span className="text-2xl font-extrabold text-white">
                    {wellnessTrends?.total_checkins || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Past 14 Days</span>
                </div>

                <div className="bg-slate-900/80 border border-cyan-500/20 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-cyan-400 block mb-1">Avg Water Intake</span>
                  <span className="text-2xl font-extrabold text-white">
                    {wellnessTrends?.average_water_glasses || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Glasses / day (Goal: 8)</span>
                </div>

                <div className="bg-slate-900/80 border border-indigo-500/20 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-indigo-400 block mb-1">Avg Sleep</span>
                  <span className="text-2xl font-extrabold text-white">
                    {wellnessTrends?.average_sleep_hours || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Hours / night (7-9 optimal)</span>
                </div>

                <div className="bg-slate-900/80 border border-emerald-500/20 p-4 rounded-2xl shadow-lg">
                  <span className="text-xs text-emerald-400 block mb-1">Dominant Mood</span>
                  <span className="text-lg font-extrabold text-white truncate block">
                    {wellnessTrends?.dominant_mood || "Neutral"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Energy: {wellnessTrends?.dominant_energy || "Medium"}
                  </span>
                </div>
              </div>

              {/* LIFESTYLE INSIGHTS BOX */}
              {wellnessTrends?.lifestyle_insights && wellnessTrends.lifestyle_insights.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Clinical Lifestyle & Recovery Insights
                  </h3>
                  <div className="space-y-1.5 pt-1">
                    {wellnessTrends.lifestyle_insights.map((ins, i) => (
                      <div key={i} className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                        {ins}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT CHECK-INS TABLE */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white">Logged Check-in Records</h3>

                {wellnessHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No wellness check-ins recorded yet. Switch to the "Daily Wellness Log" tab to create your first entry!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2 font-semibold">Date</th>
                          <th className="pb-2 font-semibold">Hydration</th>
                          <th className="pb-2 font-semibold">Sleep</th>
                          <th className="pb-2 font-semibold">Mood</th>
                          <th className="pb-2 font-semibold">Energy</th>
                          <th className="pb-2 font-semibold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {wellnessHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2.5 font-medium text-slate-200">{item.checkin_date}</td>
                            <td className="py-2.5 text-cyan-300 font-semibold">{item.water_glasses} glasses</td>
                            <td className="py-2.5 text-indigo-300 font-semibold">{item.sleep_hours} hrs</td>
                            <td className="py-2.5 text-slate-300">{item.mood || "-"}</td>
                            <td className="py-2.5 text-slate-300">{item.energy_level || "-"}</td>
                            <td className="py-2.5 text-slate-400 truncate max-w-xs">{item.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: CLINICAL REMEDY LIBRARY */}
      {/* ============================================================ */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-1">
              Evidence-Based Home Remedies Knowledge Base
            </h2>
            <p className="text-xs text-slate-400">
              Peer-reviewed non-pharmacological comfort measures for minor, non-emergency conditions.
            </p>
          </div>

          {loadingLibrary ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading clinical library...
            </div>
          ) : (
            <div className="space-y-6">
              {libraryData && Object.keys(libraryData).map((catKey) => {
                const item = libraryData[catKey];
                return (
                  <div key={catKey} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-emerald-400">{item.title}</h3>
                        <span className="text-xs text-slate-400">Category: {item.category}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSymptomInput(item.title);
                          setActiveTab("remedies");
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition font-semibold"
                      >
                        Assess Symptom &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.evidence_remedies.map((r, i) => (
                        <div key={i} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{r.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {r.evidence_strength}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{r.instructions}</p>
                          {r.precautions && (
                            <p className="text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                              {r.precautions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
