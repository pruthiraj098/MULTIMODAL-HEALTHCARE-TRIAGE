// ============================================================
// HealthTriage AI - SANA Agent Compact Control Component
// Compact, Professional AI Healthcare Voice Assistant
// Layout:
// ❤️ SANA                          🎙 Talk to SANA
// Smart AI Nursing & Assessment Assistant
// ============================================================

import { useState, useEffect } from "react";
import SanaVoiceInterface from "./SanaVoiceInterface";
import SanaLanguageSelector from "./SanaLanguageSelector";
import ErrorBoundary from "./common/ErrorBoundary";

export default function SanaAgent({
  userName = "Patient",
  currentVitals = {},
  onVitalsUpdated = () => {},
  isVoiceOpen = false,
  onVoiceOpenChange = null,
}) {
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(isVoiceOpen);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (typeof isVoiceOpen === "boolean") {
      setIsVoiceStudioOpen(isVoiceOpen);
    }
  }, [isVoiceOpen]);

  const handleOpenVoice = () => {
    setHasInteracted(true);
    setIsVoiceStudioOpen(true);
    if (onVoiceOpenChange) onVoiceOpenChange(true);
  };

  const handleCloseVoice = () => {
    setIsVoiceStudioOpen(false);
    if (onVoiceOpenChange) onVoiceOpenChange(false);
  };

  return (
    <>
      <section className="sana-compact-control" aria-label="SANA Voice Assistant">
        {/* Left Side: SANA Heart + Identity */}
        <div className="sana-compact-left">
          <div className="sana-compact-heart-wrapper" aria-hidden="true">
            <span className="sana-compact-heart">❤️</span>
          </div>

          <div className="sana-compact-meta">
            <div className="sana-compact-header-row">
              <h2 className="sana-compact-brand">SANA</h2>
              <span className="sana-compact-status-chip">
                <span className="sana-status-dot" />
                Ready
              </span>
            </div>
            <p className="sana-compact-subtitle">
              Smart AI Nursing & Assessment Assistant
            </p>
          </div>
        </div>

        {/* Right Side: Language + Compact "Talk to SANA" Button */}
        <div className="sana-compact-right">
          <div className="sana-compact-lang-box">
            <SanaLanguageSelector
              currentLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              variant="dropdown"
            />
          </div>

          <div className="sana-compact-action-col">
            <button
              type="button"
              className="sana-compact-talk-button"
              onClick={handleOpenVoice}
              title="Click to talk with SANA. Microphone is OFF until you activate it."
              aria-label="Talk to SANA"
            >
              <span className="sana-btn-mic" aria-hidden="true">🎙️</span>
              <span className="sana-btn-text">Talk to SANA</span>
            </button>
            <span className="sana-compact-mic-status">
              {hasInteracted ? "Tap to talk again" : "Tap to talk"}
            </span>
          </div>
        </div>
      </section>

      {/* SANA Continuous Voice Studio Modal */}
      <ErrorBoundary context="voice" onClose={handleCloseVoice}>
        <SanaVoiceInterface
          isOpen={isVoiceStudioOpen}
          onClose={handleCloseVoice}
          userName={userName}
          initialLanguage={selectedLanguage}
          initialVitals={currentVitals}
          onVitalsUpdated={onVitalsUpdated}
        />
      </ErrorBoundary>
    </>
  );
}
