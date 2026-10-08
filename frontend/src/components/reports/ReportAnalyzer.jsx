import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../config";

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
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

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || "").toUpperCase()) {
      case "URGENT":
        return { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "URGENT CLINICAL REVIEW", icon: "🚨" };
      case "PROMPT_REVIEW":
        return { bg: "#fffbeb", border: "#fde68a", text: "#b45309", label: "PROMPT MEDICAL REVIEW", icon: "⚠️" };
      default:
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", label: "ROUTINE REVIEW", icon: "✅" };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "critical_low":
      case "critical_high":
        return { bg: "#fef2f2", text: "#dc2626", label: "CRITICAL" };
      case "low":
        return { bg: "#eff6ff", text: "#1d4ed8", label: "LOW" };
      case "high":
        return { bg: "#fffbeb", text: "#b45309", label: "HIGH" };
      default:
        return { bg: "#ecfdf5", text: "#047857", label: "NORMAL" };
    }
  };

  const displayedParameters = (selectedReport?.parameters || selectedReport?.extracted_parameters || []).filter(
    (p) => !filterAbnormalOnly || p.is_abnormal || p.status !== "normal"
  );

  const abnormalCount =
    selectedReport?.abnormal_count ??
    displayedParameters.filter((p) => p.is_abnormal || p.status !== "normal").length;

  const urgencyInfo = getUrgencyBadge(selectedReport?.overall_urgency);

  return (
    <div className="medical-report-analyzer" style={{ maxWidth: embedded ? "100%" : "1200px", margin: "0 auto" }}>
      {/* Header */}
      {!embedded && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "24px" }}>📄</span>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              Smart Medical Report Analyzer
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#e0e7ff",
                color: "#3730a3",
                padding: "3px 10px",
                borderRadius: "9999px"
              }}
            >
              Multimodal AI & Biomarker Engine
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            Upload laboratory blood panels, pathology, or imaging reports for instant biomarker extraction, plain-language translation, and doctor consultation questions.
          </p>
        </div>
      )}

      {/* Main Layout Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: reports.length > 0 ? "320px 1fr" : "1fr",
          gap: "24px",
          alignItems: "start"
        }}
      >
        {/* Left Column: Upload Box + Past Reports History */}
        <div>
          {/* Upload Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
              marginBottom: "20px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "16px" }}>📤</span>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                Upload Lab Report
              </h3>
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  marginBottom: "14px"
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAnalyze}>
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "12px",
                  padding: "20px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: uploadFile ? "#f8fafc" : "#fafafa",
                  transition: "border-color 0.2s ease",
                  marginBottom: "14px"
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                />

                {uploadFile ? (
                  <div>
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        style={{ maxHeight: "80px", maxWidth: "100%", borderRadius: "8px", marginBottom: "8px" }}
                      />
                    ) : (
                      <div style={{ fontSize: "32px", marginBottom: "6px" }}>📑</div>
                    )}
                    <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", wordBreak: "break-all" }}>
                      {uploadFile.name}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {(uploadFile.size / 1024).toFixed(1)} KB • Click to change
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>📁</div>
                    <strong style={{ fontSize: "13px", color: "#2563eb", display: "block" }}>
                      Choose PDF or Image
                    </strong>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      PDF, JPG, PNG up to 15MB
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Symptoms Input */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Current Symptoms (Optional Context):
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Fatigue, weakness, fever for 3 days..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    resize: "vertical"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !uploadFile}
                style={{
                  width: "100%",
                  background: analyzing || !uploadFile ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: analyzing || !uploadFile ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {analyzing ? (
                  <>
                    <span className="spinner-icon">🔄</span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Analyze Medical Report</span>
                  </>
                )}
              </button>

              {statusMessage && (
                <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: "#2563eb", textAlign: "center", fontWeight: "600" }}>
                  {statusMessage}
                </p>
              )}
            </form>
          </div>

          {/* Past Reports List */}
          {reports.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                  Report History ({reports.length})
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
                {reports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  const itemUrgency = getUrgencyBadge(r.overall_urgency);
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                        background: isSelected ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <strong
                          style={{
                            fontSize: "12px",
                            color: isSelected ? "#1d4ed8" : "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "180px"
                          }}
                        >
                          {r.file_name}
                        </strong>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(r.id);
                          }}
                          title="Delete report"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: "0 2px"
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                        <span style={{ color: "#64748b" }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                        </span>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: itemUrgency.bg,
                            color: itemUrgency.text,
                            fontWeight: "700",
                            fontSize: "10px"
                          }}
                        >
                          {r.abnormal_count > 0 ? `${r.abnormal_count} Flagged` : "Normal"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Report Analysis View */}
        <div>
          {selectedReport ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "28px",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)"
              }}
            >
              {/* Report Header Card */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #e2e8f0",
                  marginBottom: "24px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
                      {selectedReport.report_type || "Medical Laboratory Report"}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                    <span>📁 {selectedReport.file_name}</span>
                    {selectedReport.created_at && (
                      <span>📅 Analyzed: {new Date(selectedReport.created_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      background: urgencyInfo.bg,
                      border: `1px solid ${urgencyInfo.border}`,
                      color: urgencyInfo.text,
                      fontSize: "12px",
                      fontWeight: "800"
                    }}
                  >
                    <span>{urgencyInfo.icon}</span>
                    <span>{urgencyInfo.label}</span>
                  </span>

                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      background: abnormalCount > 0 ? "#fef3c7" : "#ecfdf5",
                      border: `1px solid ${abnormalCount > 0 ? "#fde68a" : "#a7f3d0"}`,
                      color: abnormalCount > 0 ? "#b45309" : "#047857",
                      fontSize: "12px",
                      fontWeight: "800"
                    }}
                  >
                    {abnormalCount} Abnormal Finding{abnormalCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Critical Alert Banner if Urgent */}
              {selectedReport.overall_urgency === "URGENT" && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🚨</span>
                  <div>
                    <strong style={{ color: "#991b1b", fontSize: "14px", display: "block" }}>
                      URGENT CLINICAL ATTENTION RECOMMENDED
                    </strong>
                    <span style={{ color: "#b91c1c", fontSize: "12px" }}>
                      One or more extracted laboratory markers indicate values significantly outside safe physiological limits. Contact your physician or urgent care clinic promptly.
                    </span>
                  </div>
                </div>
              )}

              {/* Plain-Language Clinical Synthesis */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  marginBottom: "24px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px" }}>💡</span>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                    Plain-Language Clinical Explanation
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                  {selectedReport.plain_language_explanation || selectedReport.summary}
                </p>
              </div>

              {/* Symptom Correlation Section */}
              {selectedReport.symptom_correlations && (
                <div
                  style={{
                    background: "#f0fdf4",
                    borderRadius: "16px",
                    border: "1px solid #bbf7d0",
                    padding: "20px",
                    marginBottom: "24px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🔗</span>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                      Symptom Correlation
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#14532d", lineHeight: "1.6" }}>
                    {selectedReport.symptom_correlations}
                  </p>
                </div>
              )}

              {/* Extracted Biomarkers Section */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px"
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase" }}>
                      Extracted Laboratory Biomarkers ({displayedParameters.length})
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                      Parameters extracted with adult reference ranges and status
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterAbnormalOnly(!filterAbnormalOnly)}
                    style={{
                      background: filterAbnormalOnly ? "#2563eb" : "#f1f5f9",
                      color: filterAbnormalOnly ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    {filterAbnormalOnly ? "Show All Parameters" : "Show Abnormal Only"}
                  </button>
                </div>

                {displayedParameters.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#64748b", fontSize: "13px" }}>
                    No parameters found matching the selected filter.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {displayedParameters.map((p, idx) => {
                      const statusBadge = getStatusBadge(p.status);
                      const isAbnormal = p.is_abnormal || p.status !== "normal";

                      return (
                        <div
                          key={idx}
                          style={{
                            background: isAbnormal ? "#fff" : "#f8fafc",
                            borderRadius: "14px",
                            border: `1px solid ${isAbnormal ? "#fca5a5" : "#e2e8f0"}`,
                            padding: "16px",
                            boxShadow: isAbnormal ? "0 2px 8px rgba(239, 68, 68, 0.08)" : "none"
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "8px"
                            }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                              {p.name}
                            </span>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                background: statusBadge.bg,
                                color: statusBadge.text,
                                fontSize: "11px",
                                fontWeight: "800"
                              }}
                            >
                              {statusBadge.label}
                            </span>
                          </div>

                          {/* Value vs Reference Range */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "12px",
                              marginBottom: "8px",
                              flexWrap: "wrap"
                            }}
                          >
                            <span style={{ fontSize: "18px", fontWeight: "900", color: isAbnormal ? "#dc2626" : "#0f172a" }}>
                              {p.value} {p.unit || ""}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              Normal Reference: <strong>{p.reference_range || "Standard adult range"}</strong>
                            </span>
                          </div>

                          {/* Plain-Language Parameter Explanation */}
                          {p.explanation && (
                            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
                              {p.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Doctor Questions Checklist */}
              {selectedReport.doctor_questions && selectedReport.doctor_questions.length > 0 && (
                <div
                  style={{
                    background: "#faf5ff",
                    borderRadius: "16px",
                    border: "1px solid #e9d5ff",
                    padding: "20px",
                    marginBottom: "24px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🩺</span>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#6b21a8", textTransform: "uppercase" }}>
                      Questions to Ask Your Doctor About This Report
                    </h3>
                  </div>
                  <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#7e22ce" }}>
                    Bring these personalized questions to your appointment to get the most clarity on your results:
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedReport.doctor_questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        style={{
                          background: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #f3e8ff",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px"
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "500" }}>
                          • {q}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyDoctorQuestion(q, qIdx)}
                          style={{
                            background: copiedQuestion === qIdx ? "#10b981" : "#f1f5f9",
                            color: copiedQuestion === qIdx ? "#ffffff" : "#475569",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {copiedQuestion === qIdx ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Notice */}
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "#f1f5f9",
                  fontSize: "11px",
                  color: "#64748b",
                  lineHeight: "1.5"
                }}
              >
                <strong>⚠️ Clinical Laboratory Disclaimer: </strong>
                {selectedReport.disclaimer ||
                  "Laboratory findings must be interpreted by your ordering physician within the context of your overall clinical history. Results marked outside normal ranges warrant clinical consultation."}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "2px dashed #cbd5e1",
                padding: "60px 24px",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                No Medical Report Selected
              </h3>
              <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                Upload a lab report PDF or image from the left panel to instantly extract findings, check abnormal values, and generate doctor questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
