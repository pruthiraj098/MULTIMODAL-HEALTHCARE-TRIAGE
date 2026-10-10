import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  Sparkles,
  Filter,
  Copy,
  Check,
  Trash2,
  Calendar,
  FileCheck,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  FileSearch,
  RefreshCw,
  Info
} from "lucide-react";
import { API_URL } from "../../config";
import { EmptyState, StatusBadge, AlertCard } from "../common";

export default function ReportAnalyzer({ goTo, embedded = false }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Upload & analysis state
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedQuestion, setCopiedQuestion] = useState(null);
  const [filterAbnormalOnly, setFilterAbnormalOnly] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem("healthtriage_token");

  // Load user's previous reports
  const fetchReports = async () => {
    if (!token) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_URL}/api/reports?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const reportsList = data.reports || [];
        setReports(reportsList);
        if (reportsList.length > 0 && !selectedReport) {
          setSelectedReport(reportsList[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const processFile = (file) => {
    if (!file) return;

    setError("");
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid PDF or image file (.pdf, .jpg, .png, .webp).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds maximum limit of 15MB.");
      return;
    }

    setUploadFile(file);

    // Create thumbnail preview if image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a medical report file to analyze.");
      return;
    }

    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setStatusMessage("Reading document & extracting clinical parameters...");

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(uploadFile);
      });

      setStatusMessage("Evaluating biomarkers against physiological standards & correlating symptoms...");

      const response = await fetch(`${API_URL}/api/reports/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          file_data: base64Data,
          file_name: uploadFile.name,
          mime_type: uploadFile.type,
          symptoms: symptoms.trim(),
          save_report: true
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Report analysis failed.");
      }

      setStatusMessage("Analysis complete!");
      setSelectedReport(data);
      setUploadFile(null);
      setFilePreview(null);
      setSymptoms("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchReports();
    } catch (err) {
      console.error("Report analysis error:", err);
      setError(err.message || "Failed to analyze report. Please try again.");
    } finally {
      setAnalyzing(false);
      setStatusMessage("");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Are you sure you want to delete this analyzed medical report?")) return;
    try {
      const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          const remaining = reports.filter((r) => r.id !== reportId);
          setSelectedReport(remaining.length > 0 ? remaining[0] : null);
        }
      }
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const copyDoctorQuestion = (q, idx) => {
    navigator.clipboard.writeText(q);
    setCopiedQuestion(idx);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const displayedParameters = (selectedReport?.parameters || selectedReport?.extracted_parameters || []).filter(
    (p) => !filterAbnormalOnly || p.is_abnormal || p.status !== "normal"
  );

  const abnormalCount =
    selectedReport?.abnormal_count ??
    displayedParameters.filter((p) => p.is_abnormal || p.status !== "normal").length;

  const normalCount = (selectedReport?.parameters || selectedReport?.extracted_parameters || []).length - abnormalCount;

  return (
    <div className={`space-y-6 ${embedded ? "" : "max-w-7xl mx-auto"}`}>
      {/* Page Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                Diagnostic OCR & Biomarker Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Medical Reports & Diagnostic OCR
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload blood panels, pathology, or imaging reports for instant parameter extraction, plain-language translation, and doctor questions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchReports}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh report history"
            >
              <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & History (Left) | Analysis Workplace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols on lg): Upload & History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/95 p-6 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563FF] to-[#53D8F5] text-white flex items-center justify-center font-bold shadow-sm">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#10245A] tracking-tight">
                    Upload Medical Report
                  </h3>
                  <span className="text-xs text-[#687797]">PDF, JPG, PNG or WEBP (Max 15MB)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Drag-and-Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${
                  isDragOver
                    ? "border-sky-500 bg-sky-50/60 scale-[0.99]"
                    : uploadFile
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {uploadFile ? (
                  <div className="space-y-2">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg mx-auto border border-emerald-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <FileCheck size={24} />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1 break-all">
                        {uploadFile.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </span>
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-sky-600 hover:underline">
                      Change File
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Drop your medical document here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        or click to browse from device
                      </p>
                    </div>
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Supports Multi-page PDF & Photos
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Symptoms Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Symptoms <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Fatigue, dizziness for 2 weeks, fasting test..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Status Banner when analyzing */}
              {analyzing && statusMessage && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs flex items-center gap-2 animate-pulse">
                  <RefreshCw size={14} className="animate-spin text-sky-600 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={analyzing || !uploadFile}
                className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                  analyzing || !uploadFile
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-gradient-to-r from-[#2563FF] via-[#1544C4] to-[#7657FF] hover:opacity-95 text-white shadow-[0_8px_24px_rgba(37,99,255,0.35)]"
                }`}
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Extracting Biomarkers...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Analyze Medical Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Reports List */}
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/95 p-6 shadow-[0_16px_40px_-10px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
              <h3 className="text-xs font-extrabold text-[#10245A] uppercase tracking-wider flex items-center gap-1.5">
                <FileSearch size={14} className="text-[#2563FF]" />
                Recent Reports ({reports.length})
              </h3>
              {loadingHistory && <RefreshCw size={12} className="animate-spin text-slate-400" />}
            </div>

            {loadingHistory && reports.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw size={18} className="animate-spin mx-auto text-sky-500" />
                <p>Loading previous reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <FileText size={28} className="mx-auto text-slate-300 mb-1" />
                <p>No reports uploaded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload your first report above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {reports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  const isUrgent = (r.overall_urgency || "").toUpperCase() === "URGENT";
                  const isPrompt = (r.overall_urgency || "").toUpperCase() === "PROMPT_REVIEW";

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                        isSelected
                          ? "bg-sky-50/70 border-sky-500 shadow-sm ring-1 ring-sky-500/20"
                          : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-sky-950" : "text-slate-800"}`}>
                            {r.report_type || r.file_name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="flex items-center gap-0.5">
                              <Calendar size={10} />
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[110px]">{r.file_name}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(r.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all"
                          title="Delete report"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/50">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isUrgent
                              ? "bg-rose-100 text-rose-700"
                              : isPrompt
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isUrgent ? "🔴 Urgent" : isPrompt ? "🟡 Prompt" : "🟢 Routine"}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500">
                          {r.abnormal_count > 0 ? (
                            <span className="text-amber-700 font-bold">{r.abnormal_count} Flagged</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Normal</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols on lg): Detailed Report Analysis View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedReport ? (
            <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(16,36,90,0.08),0_0_0_1px_rgba(83,216,245,0.12)] space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-[#10245A] tracking-tight">
                      {selectedReport.report_type || "Diagnostic Laboratory Report"}
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      Analyzed
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText size={12} className="text-slate-400" />
                      {selectedReport.file_name}
                    </span>
                    {selectedReport.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(selectedReport.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Urgency & Abnormal Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={
                      selectedReport.overall_urgency === "URGENT"
                        ? "emergency"
                        : selectedReport.overall_urgency === "PROMPT_REVIEW"
                        ? "urgent"
                        : "routine"
                    }
                    size="md"
                  />
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                      abnormalCount > 0
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {abnormalCount > 0 ? `⚠️ ${abnormalCount} Attention Item${abnormalCount > 1 ? "s" : ""}` : "✅ All Parameters Normal"}
                  </span>
                </div>
              </div>

              {/* Urgent Warning Alert if applicable */}
              {selectedReport.overall_urgency === "URGENT" && (
                <AlertCard
                  type="emergency"
                  title="Urgent Clinical Attention Recommended"
                  message="One or more extracted laboratory markers indicate values significantly outside safe physiological limits. Contact your physician or urgent care clinic promptly."
                />
              )}

              {/* 1. SECTION: SUMMARY & CLINICAL SYNTHESIS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    💡
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Summary & Plain-Language Explanation
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
                  {selectedReport.plain_language_explanation || selectedReport.summary || "No specific summary generated for this report."}
                </div>
              </div>

              {/* 2. SECTION: SYMPTOM CORRELATIONS (if present) */}
              {selectedReport.symptom_correlations && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      🔗
                    </div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Symptom Correlation
                    </h3>
                  </div>
                  <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                    {selectedReport.symptom_correlations}
                  </div>
                </div>
              )}

              {/* 3. SECTION: EXTRACTED BIOMARKERS & KEY VALUES */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={14} className="text-sky-600" />
                      Extracted Laboratory Biomarkers ({displayedParameters.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Standard adult reference ranges, extracted measurements, and clinical classification
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterAbnormalOnly(!filterAbnormalOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterAbnormalOnly
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Filter size={12} />
                    {filterAbnormalOnly ? "Showing Flagged Only" : "Show Flagged Only"}
                  </button>
                </div>

                {displayedParameters.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                    No biomarkers found matching the filter criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedParameters.map((p, idx) => {
                      const isAbnormal = p.is_abnormal || p.status !== "normal";
                      const isCritical = p.status === "critical_low" || p.status === "critical_high";

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isCritical
                              ? "bg-rose-50/60 border-rose-300 shadow-sm"
                              : isAbnormal
                              ? "bg-amber-50/50 border-amber-300 shadow-sm"
                              : "bg-slate-50/70 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {p.name}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isCritical
                                  ? "bg-rose-200 text-rose-900"
                                  : isAbnormal
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {p.status ? p.status.replace("_", " ") : isAbnormal ? "Flagged" : "Normal"}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 mb-1">
                            <span
                              className={`text-base font-black ${
                                isCritical ? "text-rose-700" : isAbnormal ? "text-amber-800" : "text-slate-900"
                              }`}
                            >
                              {p.value} {p.unit || ""}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mb-1">
                            Ref: <span className="font-semibold text-slate-700">{p.reference_range || "Standard adult range"}</span>
                          </div>

                          {p.explanation && (
                            <p className="text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60 leading-normal">
                              {p.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. SECTION: QUESTIONS TO ASK YOUR DOCTOR */}
              {selectedReport.doctor_questions && selectedReport.doctor_questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      <Stethoscope size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                        Questions for Your Physician
                      </h3>
                      <p className="text-[11px] text-purple-700">
                        Personalized clinical questions synthesized from your flagged parameters
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedReport.doctor_questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-800 font-medium leading-relaxed">
                          • {q}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyDoctorQuestion(q, qIdx)}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors shadow-xs"
                        >
                          {copiedQuestion === qIdx ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SECTION: SAFETY NOTICE & DISCLAIMER */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2.5 leading-relaxed">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700">Clinical Laboratory Disclaimer: </strong>
                  {selectedReport.disclaimer ||
                    "Laboratory findings must be interpreted by your ordering physician within the context of your overall clinical history. Results marked outside normal ranges warrant clinical consultation."}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
              <EmptyState
                icon={FileText}
                title="No Medical Report Selected"
                description="Upload a lab report PDF or image from the left panel to instantly extract findings, check abnormal values, and generate doctor questions."
                actionText="Upload Medical Report"
                onAction={() => fileInputRef.current?.click()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
