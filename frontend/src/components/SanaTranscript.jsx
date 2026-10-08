// ============================================================
// HealthTriage AI - SANA Live Transcript Component (Phase 8)
// Displays Dialogue Turns, Clinical Badges, Spoken Audio,
// Emergency Trauma Center Nav, Self-Care Cards & Drug Cautions
// ============================================================

import { useState } from "react";

export default function SanaTranscript({
  messages = [],
  interimTranscript = "",
  isListening = false,
  isThinking = false,
  onReplayAudio = () => {},
  scrollRef = null,
}) {
  const [expandedTriageIds, setExpandedTriageIds] = useState({});

  const toggleDetails = (id) => {
    setExpandedTriageIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="sana-transcript-container">
      {messages.length === 0 && !interimTranscript && !isListening && (
        <div className="sana-transcript-empty">
          <div className="empty-sparkle">✦</div>
          <h4>Start speaking or tap SANA</h4>
          <p>
            Tell SANA how you're feeling in your own words. SANA listens, remembers,
            checks for red flags, and connects with your longitudinal health record.
          </p>
        </div>
      )}

      {messages.map((turn) => {
        const isUser = turn.role === "user";
        const hasTriage = turn.triageBadge || turn.triageLevel;
        const isExpanded = expandedTriageIds[turn.id] ?? true;

        return (
          <div
            key={turn.id}
            className={`sana-transcript-bubble-row ${isUser ? "user" : "sana"}`}
          >
            {/* Avatar / Identity */}
            <div className="transcript-avatar">
              {isUser ? "👤" : "❤️"}
            </div>

            <div className="transcript-card">
              {/* Speaker Header */}
              <div className="transcript-card-header">
                <span className="speaker-name">
                  {isUser ? "You" : "SANA (AI Health Agent)"}
                </span>
                <span className="transcript-timestamp">
                  {turn.timestamp}
                </span>
              </div>

              {/* Longitudinal Record Connection Badge */}
              {!isUser && turn.patientProfileApplied && (
                <div className="sana-profile-sync-badge" title="Unified with your vitals, medications & reports">
                  <span className="sync-pulse">●</span>
                  <span>Unified with your longitudinal health record</span>
                </div>
              )}

              {/* Spoken Message Text */}
              <div className="transcript-spoken-content">
                <p>{turn.spokenResponse || turn.content}</p>

                {/* Replay audio button for SANA spoken responses */}
                {!isUser && (
                  <button
                    type="button"
                    className="replay-audio-btn"
                    onClick={() =>
                      onReplayAudio(turn.spokenResponse || turn.content, turn.audioBase64)
                    }
                    title="Play SANA's spoken voice"
                  >
                    🔊 Listen Again
                  </button>
                )}
              </div>

              {/* Attachments preview if user uploaded image/report */}
              {isUser && turn.attachments && (
                <div className="transcript-attachments">
                  {turn.attachments.image && (
                    <span className="att-chip">📷 {turn.attachments.image}</span>
                  )}
                  {turn.attachments.report && (
                    <span className="att-chip">📄 {turn.attachments.report}</span>
                  )}
                </div>
              )}

              {/* SANA Rich Clinical Triage Card */}
              {!isUser && hasTriage && (
                <div className="sana-clinical-card">
                  {/* Triage Level Banner */}
                  <div
                    className={`triage-level-strip ${
                      turn.triageLevel?.toLowerCase() || "self_care"
                    }`}
                  >
                    <div className="triage-strip-left">
                      <span className="triage-icon">
                        {turn.triageBadge?.icon || (turn.isEmergency ? "🚨" : "🩺")}
                      </span>
                      <div>
                        <strong>{turn.triageBadge?.title || turn.triageLevel}</strong>
                        <p>{turn.triageBadge?.subtext || turn.screenSummary}</p>
                      </div>
                    </div>

                    {turn.isEmergency && (
                      <a
                        href="tel:108"
                        className="emergency-direct-call-btn"
                        title="Emergency Call 108 / 112 / 911"
                      >
                        🚨 Call 108 / 112
                      </a>
                    )}
                  </div>

                  {/* Independent Vital Sign Safety Alerts */}
                  {turn.safetyWarnings && turn.safetyWarnings.length > 0 && (
                    <div className="sana-vital-alert-box">
                      <strong>⚠️ Vital Sign Safety Warning:</strong>
                      <ul>
                        {turn.safetyWarnings.map((warn, wIdx) => (
                          <li key={wIdx}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* EMERGENCY TRAUMA CENTER CARD (PHASE 7 INTEGRATION) */}
                  {/* ============================================================ */}
                  {turn.nearestEmergencyFacility && (
                    <div className="sana-emergency-hospital-card">
                      <div className="emergency-card-header">
                        <span className="emergency-badge-pulse">🚨 URGENT TRAUMA FACILITY</span>
                        <span className="emergency-dist-tag">
                          {turn.nearestEmergencyFacility.distance_km} km away (~{turn.nearestEmergencyFacility.estimated_transit_minutes} min)
                        </span>
                      </div>
                      <h4 className="emergency-hospital-title">
                        {turn.nearestEmergencyFacility.name}
                      </h4>
                      <p className="emergency-hospital-address">
                        📍 {turn.nearestEmergencyFacility.address}, {turn.nearestEmergencyFacility.city}
                      </p>
                      <div className="emergency-facility-specs">
                        <span className="spec-badge">
                          🏥 {turn.nearestEmergencyFacility.trauma_level || "Level 1 Trauma"}
                        </span>
                        <span className="spec-badge">
                          ⏱️ {turn.nearestEmergencyFacility.is_24x7 ? "24x7 Open" : "Emergency Hours"}
                        </span>
                        <span className="spec-badge">
                          🩺 {turn.nearestEmergencyFacility.icu_available ? "ICU Available" : "ER Triage"}
                        </span>
                      </div>
                      <div className="emergency-actions-bar">
                        {turn.nearestEmergencyFacility.phone && (
                          <a
                            href={`tel:${turn.nearestEmergencyFacility.phone}`}
                            className="emergency-call-hospital-btn"
                          >
                            📞 Call Hospital ({turn.nearestEmergencyFacility.phone})
                          </a>
                        )}
                        {turn.nearestEmergencyFacility.directions_url && (
                          <a
                            href={turn.nearestEmergencyFacility.directions_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="emergency-maps-btn"
                          >
                            🧭 1-Tap Google Maps Navigation
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* MEDICATION & DRUG INTERACTION CAUTIONS (PHASE 5 INTEGRATION) */}
                  {/* ============================================================ */}
                  {turn.medicationCautions && turn.medicationCautions.length > 0 && (
                    <div className="sana-medication-cautions-card">
                      <div className="med-cautions-header">
                        <span>⚠️ Active Medication Warnings ({turn.medicationCautions.length})</span>
                      </div>
                      <div className="med-cautions-list">
                        {turn.medicationCautions.map((mc, mcIdx) => (
                          <div key={mcIdx} className="med-caution-item">
                            <div className="med-caution-title-row">
                              <span className="caution-severity-pill">
                                {mc.severity || "Warning"}
                              </span>
                              <strong>{mc.title}</strong>
                            </div>
                            {mc.effect && <p className="caution-effect-text">{mc.effect}</p>}
                            {mc.recommendation && (
                              <p className="caution-rec-text">
                                👉 <strong>Recommendation:</strong> {mc.recommendation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* NATURAL & SELF-CARE GUIDANCE CARD (PHASE 6 INTEGRATION) */}
                  {/* ============================================================ */}
                  {turn.selfCareGuidance && (
                    <div className="sana-self-care-guidance-card">
                      <div className="self-care-card-header">
                        <div className="header-left">
                          <span className="leaf-icon">🌿</span>
                          <div>
                            <strong>{turn.selfCareGuidance.title || "Supportive Home Care"}</strong>
                            <span className="category-sub">
                              {turn.selfCareGuidance.category || "Conservative Comfort Measures"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {turn.selfCareGuidance.pediatric_warning && (
                        <div className="self-care-pediatric-banner">
                          ⚠️ {turn.selfCareGuidance.pediatric_warning}
                        </div>
                      )}

                      {turn.selfCareGuidance.remedies && turn.selfCareGuidance.remedies.length > 0 && (
                        <div className="self-care-remedies-container">
                          <h5>Recommended Evidence-Based Remedies:</h5>
                          {turn.selfCareGuidance.remedies.slice(0, 3).map((rem, rIdx) => (
                            <div key={rIdx} className="remedy-entry">
                              <div className="remedy-entry-header">
                                <span className="entry-dot">●</span>
                                <strong>{rem.name}</strong>
                                {rem.evidence_strength && (
                                  <span className="evidence-tag">{rem.evidence_strength}</span>
                                )}
                              </div>
                              {rem.instructions && <p className="entry-inst">{rem.instructions}</p>}
                              {rem.precautions && (
                                <small className="entry-prec">⚠️ {rem.precautions}</small>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {turn.selfCareGuidance.contraindications && turn.selfCareGuidance.contraindications.length > 0 && (
                        <div className="self-care-contraindications">
                          <strong>Seek prompt medical care if you observe:</strong>
                          <ul>
                            {turn.selfCareGuidance.contraindications.slice(0, 3).map((cf, cIdx) => (
                              <li key={cIdx}>{cf}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible toggle for extended clinical details */}
                  <button
                    type="button"
                    className="triage-details-toggle"
                    onClick={() => toggleDetails(turn.id)}
                  >
                    <span>Clinical Assessment Details</span>
                    <span className="toggle-chevron">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="triage-expanded-body">
                      {/* Key Observations */}
                      {turn.keyObservations && turn.keyObservations.length > 0 && (
                        <div className="triage-section-group">
                          <h5>Key Clinical Observations:</h5>
                          <div className="observation-chips">
                            {turn.keyObservations.map((obs, oIdx) => (
                              <span key={oIdx} className="observation-chip">
                                • {obs}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Next Steps */}
                      {turn.recommendedNextSteps && turn.recommendedNextSteps.length > 0 && (
                        <div className="triage-section-group">
                          <h5>Recommended Next Steps:</h5>
                          <ul className="next-steps-list">
                            {turn.recommendedNextSteps.map((step, sIdx) => (
                              <li key={sIdx}>
                                <span className="step-check">✓</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up question if any */}
                      {turn.followUpQuestion && (
                        <div className="sana-follow-up-box">
                          <span className="follow-up-sparkle">💬</span>
                          <div>
                            <strong>SANA's Clarification Question:</strong>
                            <p>{turn.followUpQuestion}</p>
                          </div>
                        </div>
                      )}

                      {/* Safety Disclaimer */}
                      {turn.safetyDisclaimer && (
                        <div className="sana-disclaimer-subtext">
                          <small>🔒 {turn.safetyDisclaimer}</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Real-time Live Interim Speech Bubble */}
      {isListening && interimTranscript && (
        <div className="sana-transcript-bubble-row user interim">
          <div className="transcript-avatar">🎙️</div>
          <div className="transcript-card interim-card">
            <div className="transcript-card-header">
              <span className="speaker-name">Speaking now...</span>
              <span className="live-pulsing-badge">● Live</span>
            </div>
            <p className="interim-text">{interimTranscript}</p>
          </div>
        </div>
      )}

      {/* SANA Thinking Bubble */}
      {isThinking && (
        <div className="sana-transcript-bubble-row sana thinking">
          <div className="transcript-avatar">❤️</div>
          <div className="transcript-card thinking-card">
            <div className="sana-thinking-loader">
              <div className="thinking-dots">
                <span />
                <span />
                <span />
              </div>
              <span>SANA is understanding your symptoms, checking your health profile, and verifying safety...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ height: "1px" }} />
    </div>
  );
}
