import React, { useState } from "react";
import { Sparkles, MessageSquare, Mic, X, ArrowRight, ShieldCheck } from "lucide-react";
import SanaOrb from "../SanaOrb";

export default function FloatingSanaAssistant({
  goTo = () => {},
  currentPath = ""
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Do not show floating assistant when user is already on the full SANA triage page
  if (currentPath === "/triage") {
    return null;
  }

  const quickPrompts = [
    "Check my symptoms",
    "Explain latest lab report",
    "Show my vital trends",
    "Find nearest emergency center"
  ];

  const handleLaunchPrompt = (prompt) => {
    sessionStorage.setItem("sana_prefill_query", prompt);
    setIsOpen(false);
    goTo("/triage");
  };

  return (
    <>
      {/* Floating SANA Button */}
      <div className="floating-sana-container">
        <button
          type="button"
          className="floating-sana-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Open SANA AI Healthcare Assistant"
          aria-label="SANA AI Assistant"
        >
          <div className="floating-sana-orb">
            <SanaOrb state="idle" size="sm" interactive={false} />
          </div>
          <span className="floating-sana-label">Ask SANA</span>
          <span className="floating-sana-ping" />
        </button>
      </div>

      {/* SANA Quick Assistant Drawer / Popup */}
      {isOpen && (
        <div className="floating-sana-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="floating-sana-popup"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="floating-sana-header">
              <div className="floating-sana-title-block">
                <div className="floating-sana-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="floating-sana-title">SANA Assistant</h4>
                  <span className="floating-sana-sub">Multimodal Clinical AI</span>
                </div>
              </div>
              <button
                type="button"
                className="floating-sana-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close SANA assistant"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="floating-sana-body">
              <div className="floating-sana-bubble">
                <p>
                  "Hello! I can analyze your symptoms, summarize medical reports, or guide you to nearest care. How can I help?"
                </p>
                <div className="floating-sana-safety-tag">
                  <ShieldCheck size={12} />
                  <span>Deterministic Safety Engine Verified</span>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="floating-sana-prompts">
                <span className="floating-prompts-label">Quick actions:</span>
                <div className="floating-prompts-grid">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="floating-prompt-chip"
                      onClick={() => handleLaunchPrompt(q)}
                    >
                      <span>{q}</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Voice / Full Studio */}
              <button
                type="button"
                className="floating-sana-launch-full-btn"
                onClick={() => {
                  setIsOpen(false);
                  goTo("/triage");
                }}
              >
                <Mic size={16} />
                <span>Open Full SANA Voice Studio</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
