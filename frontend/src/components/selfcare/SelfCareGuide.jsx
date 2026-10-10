import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Heart,
  Droplets,
  Moon,
  Smile,
  Zap,
  BookOpen,
  Calendar,
  Activity,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Info,
  ShieldCheck,
  Search
} from "lucide-react";
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
  const [mood, setMood] = useState("Good");
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

  // Quick symptom chips matching exact prompt specifications
  const quickSymptomChips = [
    { label: "Cough", query: "Cough and mild throat tickle" },
    { label: "Sore Throat", query: "Scratchy sore throat" },
    { label: "Sinus Congestion", query: "Nasal congestion and stuffy nose" },
    { label: "Headache", query: "Mild tension headache and fatigue" },
    { label: "Nausea", query: "Mild nausea and queasiness" },
    { label: "Heartburn", query: "Mild acid reflux and heartburn" },
    { label: "Muscle Soreness", query: "Mild muscle strain and ache" },
    { label: "Constipation", query: "Occasional mild constipation" },
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
          setMood(data.today_checkin.mood || "Good");
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
    <div className={`w-full max-w-6xl mx-auto ${embedded ? "p-0" : "p-4 sm:p-6"} space-y-6`}>
      {/* 1. PROFESSIONAL PAGE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🌿 Supportive Wellness
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Evidence-Based Comfort
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Natural &amp; Self-Care Guidance
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Non-pharmacological comfort measures, hydration &amp; sleep habits, and lifestyle recovery protocols.
          </p>
        </div>

        {goTo && (
          <button
            type="button"
            onClick={() => goTo("/dashboard")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
          >
            ← Patient Dashboard
          </button>
        )}
      </div>

      {/* 2. CLINICAL SAFETY DISCLAIMER NOTICE */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-amber-950">Clinical Disclaimer: </strong>
          Supportive comfort measures and home wellness do not replace professional medical evaluation, diagnosis, or prescription treatment. If symptoms persist, escalate, or present red flags, consult a healthcare provider immediately.
        </div>
      </div>

      {/* 3. FOUR PROMINENT FEATURE NAVIGATION CARDS (Section 20 Redesign) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Symptom Self-Care */}
        <div
          onClick={() => setActiveTab("remedies")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === "remedies"
              ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/15"
              : "border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🌿</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeTab === "remedies" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
            }`}>
              Active
            </span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Symptom Self-Care</h3>
          <p className="text-xs text-slate-500 mt-1">Supportive comfort guidance</p>
        </div>

        {/* Card 2: Daily Wellness */}
        <div
          onClick={() => setActiveTab("wellness")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === "wellness"
              ? "border-cyan-500 shadow-md ring-2 ring-cyan-500/15"
              : "border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📅</span>
            <span className="text-[10px] font-bold text-slate-500">Daily Log</span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Daily Wellness</h3>
          <p className="text-xs text-slate-500 mt-1">Track your wellness &amp; habits</p>
        </div>

        {/* Card 3: Lifestyle Analytics */}
        <div
          onClick={() => setActiveTab("trends")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === "trends"
              ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/15"
              : "border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
            <span className="text-[10px] font-bold text-slate-500">{wellnessHistory.length} Logs</span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Lifestyle Analytics</h3>
          <p className="text-xs text-slate-500 mt-1">Understand your habits over time</p>
        </div>

        {/* Card 4: Remedy Library */}
        <div
          onClick={() => setActiveTab("library")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === "library"
              ? "border-blue-500 shadow-md ring-2 ring-blue-500/15"
              : "border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📚</span>
            <span className="text-[10px] font-bold text-slate-500">Knowledge</span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Remedy Library</h3>
          <p className="text-xs text-slate-500 mt-1">Evidence-based clinical info</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SYMPTOM REMEDY SEARCH & CHECKER */}
      {/* ============================================================ */}
      {activeTab === "remedies" && (
        <div className="space-y-6">
          {/* MODERN SYMPTOM INPUT CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base font-extrabold text-slate-800">
                Symptom Self-Care Assessment
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Enter a mild symptom below. The engine screens for emergency red flags, cross-references clinical safety criteria, and displays vetted comfort measures.
            </p>

            <form onSubmit={handleSearchRemedies} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Symptom Description
                  </label>
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="e.g. Dry hacking cough, mild tension headache, scratchy throat..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                  >
                    <option value="mild">Mild (Discomfort, functional)</option>
                    <option value="moderate">Moderate (Noticeable burden)</option>
                    <option value="severe">Severe (Urgent medical review)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              {/* QUICK SYMPTOM CHIPS (PROMPT SECTION 20) */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-2">Quick Symptom Chips:</span>
                <div className="flex flex-wrap gap-2">
                  {quickSymptomChips.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSymptomInput(c.query);
                        setSeverity("mild");
                        setDurationDays(1);
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {remedyError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {remedyError}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loadingRemedy}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loadingRemedy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking Clinical Safety...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Evaluate Remedies
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* EMERGENCY ESCALATION OVERRIDE BANNER */}
          {isEmergency && (
            <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl shrink-0">
                  !
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-rose-900">
                      EMERGENCY WARNING: SEEK IMMEDIATE CARE
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                      Red-Flag Alert
                    </span>
                  </div>

                  <p className="text-sm text-rose-800 leading-relaxed font-semibold">
                    {remedyResult.warning}
                  </p>

                  {remedyResult.safety_reasons && remedyResult.safety_reasons.length > 0 && (
                    <div className="bg-white/80 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
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
                      href="tel:108"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs flex items-center gap-2"
                    >
                      <PhoneCall size={16} />
                      Ambulance Speed Dial (108)
                    </a>
                    <a
                      href="tel:112"
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs flex items-center gap-2"
                    >
                      National Emergency (112)
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
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {remedyResult.matched_category || "Supportive Care"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Category: {remedyResult.category_type || "General"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Guidance for: "{remedyResult.symptom}"
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Verified Safe for Home Comfort
                  </span>
                </div>
              </div>

              {/* SAFETY WARNINGS / MEDICATION ALERTS */}
              {remedyResult.safety_warnings && remedyResult.safety_warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle size={15} />
                    Safety Considerations &amp; Cross-Checks:
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
                    className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-800">
                          {rem.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                          rem.evidence_strength?.includes("High")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {rem.evidence_strength}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-emerald-700 block mb-1">Instructions:</span>
                        {rem.instructions}
                      </div>

                      <div className="text-xs text-slate-500 leading-relaxed">
                        <strong className="text-slate-700">Clinical Rationale: </strong>
                        {rem.rationale}
                      </div>

                      {rem.precautions && (
                        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-800 leading-relaxed font-medium">
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
                <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Contraindications (Do NOT Use Home Care If:)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {remedyResult.contraindications && remedyResult.contraindications.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold shrink-0">✕</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* WHEN TO SEE A DOCTOR */}
                <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    When to See a Doctor (Decision Checkpoints)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {remedyResult.when_to_see_doctor && remedyResult.when_to_see_doctor.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold shrink-0">→</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* GENERAL LIFESTYLE RECOMMENDATIONS */}
              {remedyResult.general_lifestyle && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">
                    Lifestyle &amp; Immune Recovery Protocol
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {remedyResult.general_lifestyle.map((g, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Daily Holistic Wellness Check-in
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log your daily water hydration, sleep duration, mood, and vitality.
                </p>
              </div>

              <div>
                <input
                  type="date"
                  value={todayDate}
                  onChange={(e) => setTodayDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
            </div>

            <form onSubmit={handleSaveWellness} className="space-y-6">
              {/* WATER HYDRATION SECTION */}
              <div className="space-y-3 bg-cyan-50/40 p-5 rounded-2xl border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">💧</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Daily Hydration Tracker</h3>
                      <p className="text-xs text-slate-500">Clinical goal: 8 to 10 glasses (2 – 2.5 Liters)</p>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold px-3 py-1 rounded-xl ${
                    waterGlasses >= 8 ? "bg-cyan-100 text-cyan-800 border border-cyan-300" : "bg-white text-slate-700 border border-slate-200"
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
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        g <= waterGlasses
                          ? "bg-cyan-100 border-cyan-400 text-cyan-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
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
                    className="px-3 py-1 text-xs rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold cursor-pointer"
                  >
                    - 1 Glass
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterGlasses(waterGlasses + 1)}
                    className="px-3 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                  >
                    + 1 Glass
                  </button>
                </div>
              </div>

              {/* SLEEP RESTORATION SECTION */}
              <div className="space-y-3 bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌙</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Sleep Duration</h3>
                      <p className="text-xs text-slate-500">Optimal adult restorative range: 7.0 – 9.0 hours</p>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold px-3 py-1 rounded-xl ${
                    sleepHours >= 7 && sleepHours <= 9
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      : "bg-white text-slate-700 border border-slate-200"
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
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>3 hrs (Deprived)</span>
                    <span className="text-indigo-700 font-bold">7 – 9 hrs (Optimal)</span>
                    <span>12 hrs</span>
                  </div>
                </div>
              </div>

              {/* MOOD & ENERGY SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MOOD */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
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
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          mood === m.label
                            ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-[10px] font-semibold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ENERGY LEVEL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Energy / Vitality Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "High", sub: "Energized" },
                      { label: "Medium", sub: "Balanced" },
                      { label: "Low", sub: "Sluggish" },
                    ].map((e) => (
                      <button
                        key={e.label}
                        type="button"
                        onClick={() => setEnergyLevel(e.label)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          energyLevel === e.label
                            ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Daily Notes &amp; Comfort Observations (Optional)
                </label>
                <textarea
                  rows="2"
                  value={wellnessNotes}
                  onChange={(e) => setWellnessNotes(e.target.value)}
                  placeholder="e.g. Drank ginger tea in the morning, went for a 20 min walk, symptoms settled..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {wellnessMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold ${
                  wellnessMessage.includes("Error")
                    ? "bg-rose-50 border border-rose-200 text-rose-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                }`}>
                  {wellnessMessage}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingWellness}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-cyan-600 hover:bg-cyan-700 text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-slate-500 block mb-1">Check-in Streak</span>
                  <span className="text-2xl font-black text-slate-800">
                    {wellnessTrends?.total_checkins || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Past 14 Days</span>
                </div>

                <div className="bg-white border border-cyan-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-cyan-700 font-bold block mb-1">Avg Water Intake</span>
                  <span className="text-2xl font-black text-slate-800">
                    {wellnessTrends?.average_water_glasses || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Glasses / day (Goal: 8)</span>
                </div>

                <div className="bg-white border border-indigo-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-indigo-700 font-bold block mb-1">Avg Sleep</span>
                  <span className="text-2xl font-black text-slate-800">
                    {wellnessTrends?.average_sleep_hours || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Hours / night (7-9 goal)</span>
                </div>

                <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-xs text-emerald-700 font-bold block mb-1">Dominant Mood</span>
                  <span className="text-lg font-black text-slate-800 truncate block">
                    {wellnessTrends?.dominant_mood || "Good"}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Energy: {wellnessTrends?.dominant_energy || "Medium"}
                  </span>
                </div>
              </div>

              {/* LIFESTYLE INSIGHTS BOX */}
              {wellnessTrends?.lifestyle_insights && wellnessTrends.lifestyle_insights.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    Clinical Lifestyle &amp; Recovery Insights
                  </h3>
                  <div className="space-y-1.5 pt-1">
                    {wellnessTrends.lifestyle_insights.map((ins, i) => (
                      <div key={i} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {ins}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT CHECK-INS TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Logged Check-in Records</h3>

                {wellnessHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No wellness check-ins recorded yet. Switch to the "Daily Wellness" card above to create your first entry!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-2 font-bold">Date</th>
                          <th className="pb-2 font-bold">Hydration</th>
                          <th className="pb-2 font-bold">Sleep</th>
                          <th className="pb-2 font-bold">Mood</th>
                          <th className="pb-2 font-bold">Energy</th>
                          <th className="pb-2 font-bold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wellnessHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-bold text-slate-800">{item.checkin_date}</td>
                            <td className="py-2.5 text-cyan-700 font-semibold">{item.water_glasses} glasses</td>
                            <td className="py-2.5 text-indigo-700 font-semibold">{item.sleep_hours} hrs</td>
                            <td className="py-2.5 text-slate-700">{item.mood || "—"}</td>
                            <td className="py-2.5 text-slate-700">{item.energy_level || "—"}</td>
                            <td className="py-2.5 text-slate-500 truncate max-w-xs">{item.notes || "—"}</td>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-800 mb-1">
              Evidence-Based Home Remedies Knowledge Base
            </h2>
            <p className="text-xs text-slate-500">
              Peer-reviewed non-pharmacological comfort measures for minor, non-emergency conditions.
            </p>
          </div>

          {loadingLibrary ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading clinical library...
            </div>
          ) : (
            <div className="space-y-5">
              {libraryData && Object.keys(libraryData).map((catKey) => {
                const item = libraryData[catKey];
                return (
                  <div key={catKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                        <span className="text-xs text-slate-500">Category: {item.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSymptomInput(item.title);
                          setActiveTab("remedies");
                        }}
                        className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition font-bold cursor-pointer"
                      >
                        Assess Symptom →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.evidence_remedies.map((r, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{r.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                              {r.evidence_strength}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{r.instructions}</p>
                          {r.precautions && (
                            <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
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
