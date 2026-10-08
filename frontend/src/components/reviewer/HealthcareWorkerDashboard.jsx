// ============================================================
// HealthTriage AI - Healthcare Worker Dashboard & Clinical Review Workspace
// Smart Healthcare Queue & Human-in-the-Loop Review System
// For Nurses, Doctors, Medical Officers, and Health Workers
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../../config";

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
    <div className="clinical-dashboard-wrapper">
      {/* Top Banner Header */}
      <header className="clinical-header">
        <div className="clinical-brand">
          <div className="clinical-brand-icon">⚕</div>
          <div>
            <h2>Clinical Triage & Healthcare Queue</h2>
            <p>Smart Healthcare Queue • Human-in-the-Loop Clinical Verification Workspace</p>
          </div>
        </div>
        <div className="clinical-header-actions">
          <div className="reviewer-badge-pill">
            <span className="dot online"></span>
            <strong>{user?.full_name || "Healthcare Staff"}</strong>
            <span className="role-tag">{user?.role || "CLINICIAN"}</span>
          </div>
          <button className="btn-secondary-sm" onClick={() => goTo("/dashboard")}>
            Patient View
          </button>
          <button className="btn-secondary-sm" onClick={() => goTo("/facility-admin")}>
            Facility KPIs
          </button>
          <button className="btn-secondary-sm" onClick={() => goTo("/public-health")}>
            Public Health
          </button>
        </div>
      </header>

      {/* Main Workspace Split Grid */}
      <div className="clinical-workspace-grid">
        {/* Left Column: Smart Healthcare Queue */}
        <section className="queue-panel">
          <div className="queue-controls">
            <div className="queue-search-row">
              <input
                type="text"
                placeholder="Search by patient name, complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchQueue(activeFilter)}
                className="queue-search-input"
              />
              <button className="btn-primary-sm" onClick={() => fetchQueue(activeFilter)}>
                Filter
              </button>
            </div>

            {/* Filter Pills */}
            <div className="queue-filter-pills">
              <button
                className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Cases ({counts.all})
              </button>
              <button
                className={`filter-pill red ${activeFilter === "emergency" ? "active" : ""}`}
                onClick={() => setActiveFilter("emergency")}
              >
                🔴 Emergency ({counts.emergency})
              </button>
              <button
                className={`filter-pill yellow ${activeFilter === "urgent" ? "active" : ""}`}
                onClick={() => setActiveFilter("urgent")}
              >
                🟠 Urgent ({counts.urgent})
              </button>
              <button
                className={`filter-pill green ${activeFilter === "routine" ? "active" : ""}`}
                onClick={() => setActiveFilter("routine")}
              >
                🟢 Routine ({counts.routine})
              </button>
              <button
                className={`filter-pill slate ${activeFilter === "review_needed" ? "active" : ""}`}
                onClick={() => setActiveFilter("review_needed")}
              >
                ⚪ Pending Review ({counts.pending_review})
              </button>
            </div>
          </div>

          {/* Queue Case List */}
          <div className="queue-list-container">
            {loadingQueue ? (
              <div className="queue-loading">Loading clinical queue cases...</div>
            ) : cases.length === 0 ? (
              <div className="queue-empty">
                <p>No cases match the selected queue filter.</p>
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                const isEmergency = c.triage_level === "EMERGENCY" || c.is_emergency;
                const isUrgent = c.triage_level === "URGENT";

                return (
                  <div
                    key={c.id}
                    className={`queue-case-card ${isSelected ? "selected" : ""} ${
                      isEmergency ? "border-emergency" : isUrgent ? "border-urgent" : ""
                    }`}
                    onClick={() => handleOpenCase(c.id)}
                  >
                    <div className="case-card-header">
                      <div className="case-patient-title">
                        <strong>{c.patient_name}</strong>
                        <span className="case-demographics">
                          {c.patient_age ? `${c.patient_age}y` : "Age N/A"} • {c.patient_gender || "N/A"}
                        </span>
                      </div>
                      <span
                        className={`badge-priority ${
                          isEmergency ? "badge-red" : isUrgent ? "badge-yellow" : "badge-green"
                        }`}
                      >
                        {isEmergency ? "🔴 Emergency" : isUrgent ? "🟠 Urgent" : "🟢 Routine"}
                      </span>
                    </div>

                    <p className="case-complaint-snippet">
                      {c.chief_complaint || "Clinical intake logged via SANA."}
                    </p>

                    <div className="case-card-footer">
                      <span className="case-time">{c.created_at}</span>
                      <div className="case-status-badge">
                        Status: <strong>{c.status}</strong>
                      </div>
                      {c.reviewer_name ? (
                        <span className="case-reviewer">👨‍⚕️ {c.reviewer_name}</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-assign-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignToMe(c.id);
                          }}
                        >
                          Claim Case
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Case Review Workspace & Multimodal Evidence */}
        <section className="case-review-workspace">
          {!selectedCaseId ? (
            <div className="no-case-selected">
              <div className="select-prompt-icon">📋</div>
              <h3>Select a Patient Case from the Queue</h3>
              <p>
                Click any case on the left to review its complete multimodal evidence bundle,
                structured clinical note, and submit professional medical disposition.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="queue-loading">Loading multimodal case evidence...</div>
          ) : !caseDetail ? (
            <div className="queue-empty">Case details unavailable.</div>
          ) : (
            <div className="case-detail-content">
              {/* Patient Header Bar */}
              <div className="case-banner">
                <div>
                  <div className="case-uuid">CASE ID: #{caseDetail.id} ({caseDetail.session_uuid})</div>
                  <h2>{caseDetail.patient_name}</h2>
                  <p>
                    {caseDetail.patient_age || "N/A"} years • {caseDetail.patient_gender || "N/A"} • Intake:{" "}
                    {caseDetail.created_at} • Mode: {caseDetail.facility_type}
                  </p>
                </div>
                <div className="case-banner-actions">
                  <button
                    className="btn-referral-launch"
                    onClick={() => onOpenReferral(caseDetail)}
                  >
                    📄 Prepare Referral Note
                  </button>
                </div>
              </div>

              {/* 5-Section Multimodal Evidence Viewer */}
              <div className="evidence-sections-container">
                {/* 1. Patient Reported Information */}
                <div className="evidence-card">
                  <div className="evidence-header">
                    <h4>1. Patient-Reported Information [SOURCE: PATIENT]</h4>
                    <span className="tag-source">Patient Statement</span>
                  </div>
                  <div className="evidence-body">
                    <p>
                      <strong>Chief Complaint:</strong> {caseDetail.chief_complaint}
                    </p>
                    {caseDetail.patient_reported_info?.patient_statement_raw && (
                      <p className="quote-box">
                        "{caseDetail.patient_reported_info.patient_statement_raw}"
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. AI-Extracted Information (Vitals & Labs) */}
                <div className="evidence-card">
                  <div className="evidence-header">
                    <h4>2. AI-Extracted Information [SOURCE: MEASURED VITALS & OCR]</h4>
                    <span className="tag-source">Diagnostic Capture</span>
                  </div>
                  <div className="evidence-body">
                    {/* Vitals Snapshot */}
                    <div className="vitals-snapshot-grid">
                      {caseDetail.vitals_snapshot && caseDetail.vitals_snapshot.length > 0 ? (
                        caseDetail.vitals_snapshot.map((v, idx) => (
                          <div key={idx} className="vital-item-card">
                            <span className="vital-label">{v.parameter}</span>
                            <span className="vital-val">
                              {v.value} {v.unit}
                            </span>
                            <span className={`vital-status-tag ${v.status?.toLowerCase()}`}>
                              {v.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No physiological vitals recorded during intake.</p>
                      )}
                    </div>

                    {/* Report OCR Findings */}
                    {caseDetail.report_findings && caseDetail.report_findings.length > 0 && (
                      <div className="report-ocr-table-wrap">
                        <h5>Uploaded Lab Report Findings:</h5>
                        <table className="mini-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Result</th>
                              <th>Reference Range</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseDetail.report_findings.map((r, idx) => (
                              <tr key={idx}>
                                <td>{r.test_name}</td>
                                <td>
                                  <strong>
                                    {r.result} {r.unit}
                                  </strong>
                                </td>
                                <td>{r.reference_range}</td>
                                <td>
                                  <span className={`tag-status ${r.status?.toLowerCase()}`}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Image Observations */}
                    {caseDetail.image_observations && caseDetail.image_observations.length > 0 && (
                      <div className="image-observations-wrap">
                        <h5>Visible Image Observations:</h5>
                        {caseDetail.image_observations.map((img, idx) => (
                          <div key={idx} className="image-obs-box">
                            <strong>{img.observation_type}:</strong> {img.observation_summary}
                            <span className="obs-disclaimer">{img.disclaimer}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. AI-Generated Summary */}
                <div className="evidence-card">
                  <div className="evidence-header">
                    <h4>3. AI Triage Summary [SOURCE: DECISION SUPPORT]</h4>
                    <span className="tag-source">Triage Indicator</span>
                  </div>
                  <div className="evidence-body">
                    <p>
                      <strong>Clinical Assessment:</strong>{" "}
                      {caseDetail.ai_generated_summary?.clinical_summary || "Routine assessment."}
                    </p>
                    {caseDetail.ai_generated_summary?.contributing_factors && (
                      <div>
                        <strong>Contributing Factors:</strong>
                        <ul>
                          {caseDetail.ai_generated_summary.contributing_factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p>
                      <strong>Missing Information:</strong>{" "}
                      {caseDetail.missing_information || "None detected."}
                    </p>
                  </div>
                </div>

                {/* 4. Safety Flags */}
                <div className="evidence-card red-accent">
                  <div className="evidence-header">
                    <h4>4. Safety Flags & Alerts [SOURCE: RISK ENGINE]</h4>
                    <span className="tag-source alert">Safety Controller</span>
                  </div>
                  <div className="evidence-body">
                    {caseDetail.safety_flags?.alerts && caseDetail.safety_flags.alerts.length > 0 ? (
                      caseDetail.safety_flags.alerts.map((alert, idx) => (
                        <div key={idx} className="safety-alert-item">
                          ⚠️ {alert}
                        </div>
                      ))
                    ) : (
                      <p className="text-safe">🟢 No acute deterministic emergency flags detected.</p>
                    )}
                  </div>
                </div>

                {/* 5. Human Review Panel (The Core HITL Requirement!) */}
                <div className="evidence-card review-panel-card">
                  <div className="evidence-header">
                    <h4>5. Qualified Healthcare Worker Review [SOURCE: CLINICAL DECISION]</h4>
                    <span className="tag-source review">Human-in-the-Loop</span>
                  </div>
                  <div className="evidence-body">
                    <div className="review-action-grid">
                      <div className="form-group">
                        <label>Review Action Decision:</label>
                        <select
                          value={reviewDecision}
                          onChange={(e) => setReviewDecision(e.target.value)}
                          className="select-decision"
                        >
                          <option value="APPROVED">✓ Approve AI Triage (Confirmed)</option>
                          <option value="MODIFIED">✏️ Modify Triage Level / Disposition</option>
                          <option value="REQUEST_INFO">❓ Request Additional Vitals / Diagnostics</option>
                          <option value="ESCALATED">🚨 Escalate to Senior Medical Officer / Resuscitation</option>
                          <option value="REFERRED">📄 Transfer / Specialist Referral</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Final Triage Priority Level:</label>
                        <select
                          value={overrideTriageLevel}
                          onChange={(e) => setOverrideTriageLevel(e.target.value)}
                          className="select-level"
                        >
                          <option value="EMERGENCY">🔴 EMERGENCY (Immediate)</option>
                          <option value="URGENT">🟠 URGENT (Within 24 Hours)</option>
                          <option value="ROUTINE">🟢 ROUTINE (Primary Care / Self-care)</option>
                          <option value="INSUFFICIENT_INFO">⚪ INSUFFICIENT INFORMATION</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <label>Reviewer Clinical Notes & Management Plan:</label>
                      <textarea
                        rows={3}
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Document your clinical verification rationale, patient orders, or escalation instructions..."
                        className="textarea-notes"
                      />
                    </div>

                    {reviewFeedback && (
                      <div
                        className={`feedback-msg ${
                          reviewFeedback.startsWith("✓") ? "success" : "error"
                        }`}
                      >
                        {reviewFeedback}
                      </div>
                    )}

                    <div className="review-submit-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button
                        className="btn-submit-review"
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                      >
                        {submittingReview ? "Saving Decision..." : "Commit Clinical Review Decision"}
                      </button>
                      <button
                        type="button"
                        style={{
                          background: "#7c3aed",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "10px",
                          padding: "10px 18px",
                          fontSize: "13.5px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                        onClick={() => onOpenReferral(caseDetail)}
                      >
                        📄 Generate Formal Referral Slip
                      </button>
                    </div>

                    {/* Review Audit History */}
                    {caseDetail.reviewer_actions && caseDetail.reviewer_actions.length > 0 && (
                      <div className="reviewer-audit-history">
                        <h6>Review Audit Log:</h6>
                        {caseDetail.reviewer_actions.map((act) => (
                          <div key={act.id} className="audit-item">
                            <span className="audit-time">{act.created_at}</span> •{" "}
                            <strong>{act.action_type}</strong> by {act.reviewer_name} ({act.reviewer_role}):{" "}
                            <em>{act.notes}</em>
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
      </div>
    </div>
  );
}
