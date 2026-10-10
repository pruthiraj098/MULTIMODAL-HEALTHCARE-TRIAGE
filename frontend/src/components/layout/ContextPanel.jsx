import React, { useState } from "react";
import {
  Sparkles,
  PhoneCall,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Heart,
  Pill,
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import SanaOrb from "../SanaOrb";

export default function ContextPanel({
  goTo = () => {},
  onLaunchVoice = () => {},
  user = null,
  collapsed = false,
  onToggleCollapse = () => {}
}) {
  const quickPrompts = [
    "Check my symptoms",
    "Explain my latest report",
    "Review my health",
    "Prepare questions for my doctor",
  ];

  const handleQuickPrompt = (prompt) => {
    sessionStorage.setItem("sana_prefill_query", prompt);
    goTo("/triage");
  };

  if (collapsed) {
    return (
      <aside className="app-context-panel collapsed">
        <button
          type="button"
          className="context-panel-expand-btn"
          onClick={onToggleCollapse}
          title="Expand SANA & Alert Panel"
        >
          <ChevronLeft size={18} />
          <div className="collapsed-sana-icon">
            <Sparkles size={16} />
            <span>SANA</span>
          </div>
        </button>
      </aside>
    );
  }

  return (
    <aside className="app-context-panel">
      {/* Panel Header */}
      <div className="context-panel-header">
        <div className="panel-title-row">
          <Sparkles size={16} className="sana-header-icon" />
          <span>SANA & Alerts</span>
        </div>
        <button
          type="button"
          className="context-collapse-toggle"
          onClick={onToggleCollapse}
          title="Collapse context panel"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="context-panel-body">
        {/* SANA Central AI Assistant Card */}
        <div className="context-sana-card">
          <div className="sana-orb-wrapper" onClick={() => onLaunchVoice ? onLaunchVoice() : goTo("/triage")}>
            <SanaOrb state="idle" size="md" interactive={false} />
            <div className="sana-live-pulse-ring" />
          </div>

          <div className="sana-card-text">
            <h4>SANA Assistant</h4>
            <p className="sana-role-sub">Smart AI Nursing & Assessment</p>
            <p className="sana-speech-bubble">
              "Hello {user?.full_name?.split(" ")[0] || "there"}! How are you feeling today?"
            </p>
          </div>

          <button
            type="button"
            className="sana-launch-btn"
            onClick={() => onLaunchVoice ? onLaunchVoice() : goTo("/triage")}
          >
            <span>🎙️ Talk to SANA</span>
            <ArrowRight size={15} />
          </button>

          {/* Quick Prompt Chips */}
          <div className="sana-prompt-chips">
            <span className="chips-label">Quick actions:</span>
            <div className="chips-list">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sana-chip"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Rapid Dial Card */}
        <div className="context-emergency-card">
          <div className="emergency-card-title-row">
            <ShieldAlert size={16} className="emergency-alert-icon" />
            <strong>Emergency Rapid Dial</strong>
          </div>
          <p className="emergency-desc">
            Immediate assistance for acute distress, severe chest pain, or stroke signs.
          </p>

          <div className="emergency-dial-row">
            <a href="tel:108" className="emergency-dial-chip red" title="Call 108 Ambulance">
              <PhoneCall size={13} />
              <span>108 Ambulance</span>
            </a>
            <a href="tel:112" className="emergency-dial-chip amber" title="Call 112 National ER">
              <PhoneCall size={13} />
              <span>112 ER</span>
            </a>
          </div>

          <button
            type="button"
            className="emergency-facility-finder-btn"
            onClick={() => goTo("/facilities")}
          >
            <span>Find Nearest Trauma Center</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Clinical Highlights / Reminders */}
        <div className="context-alerts-card">
          <div className="alerts-card-header">
            <Clock size={15} />
            <span>Care Reminders</span>
          </div>

          <div className="alerts-list">
            <div className="alert-item green">
              <span className="alert-dot" />
              <div>
                <strong>Safety Verification</strong>
                <p>Vital signs & interaction checks verified.</p>
              </div>
            </div>

            <div className="alert-item blue">
              <span className="alert-dot" />
              <div>
                <strong>Prescription Regimen</strong>
                <p>Morning doses synchronized.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
