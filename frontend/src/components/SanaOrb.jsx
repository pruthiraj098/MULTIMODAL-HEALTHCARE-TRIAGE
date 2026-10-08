// ============================================================
// HealthTriage AI - SANA Orb Component
// Futuristic JARVIS-Inspired AI Healthcare Visual Identity
// ============================================================

import { useMemo } from "react";

/**
 * States:
 * - 'idle': available, microphone off
 * - 'activating': microphone initializing
 * - 'listening': actively hearing user voice, animated equalizer waves
 * - 'thinking': processing with Gemini & safety engine
 * - 'speaking': speaking response via TTS
 * - 'emergency': critical red flag alert state
 */
export default function SanaOrb({
  state = "idle",
  size = "md", // 'sm' | 'md' | 'lg' | 'hero'
  onClick,
  showLabel = false,
  interactive = true,
}) {
  const sizeMap = {
    sm: { dimension: 56, coreSize: 34, iconSize: 18 },
    md: { dimension: 96, coreSize: 58, iconSize: 28 },
    lg: { dimension: 140, coreSize: 84, iconSize: 38 },
    hero: { dimension: 190, coreSize: 114, iconSize: 50 },
  };

  const { dimension, coreSize, iconSize } = sizeMap[size] || sizeMap.md;

  const stateConfig = useMemo(() => {
    switch (state) {
      case "activating":
        return {
          themeClass: "sana-orb-activating",
          glowColor: "rgba(56, 189, 248, 0.6)",
          coreColor: "#0284c7",
          statusText: "Activating...",
          icon: "⚡",
        };
      case "listening":
        return {
          themeClass: "sana-orb-listening",
          glowColor: "rgba(16, 185, 129, 0.75)",
          coreColor: "#059669",
          statusText: "Listening...",
          icon: "🎙️",
        };
      case "thinking":
        return {
          themeClass: "sana-orb-thinking",
          glowColor: "rgba(147, 51, 234, 0.75)",
          coreColor: "#7c3aed",
          statusText: "Thinking...",
          icon: "✦",
        };
      case "speaking":
        return {
          themeClass: "sana-orb-speaking",
          glowColor: "rgba(14, 165, 233, 0.8)",
          coreColor: "#2563eb",
          statusText: "Speaking...",
          icon: "🔊",
        };
      case "emergency":
        return {
          themeClass: "sana-orb-emergency",
          glowColor: "rgba(239, 68, 68, 0.85)",
          coreColor: "#dc2626",
          statusText: "EMERGENCY ALERT",
          icon: "🚨",
        };
      case "idle":
      default:
        return {
          themeClass: "sana-orb-idle",
          glowColor: "rgba(40, 103, 232, 0.35)",
          coreColor: "#2563eb",
          statusText: "Tap to Talk",
          icon: "❤️",
        };
    }
  }, [state]);

  return (
    <div
      className={`sana-orb-wrapper ${stateConfig.themeClass} ${
        interactive ? "interactive" : ""
      }`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : "presentation"}
      tabIndex={interactive ? 0 : -1}
      aria-label={`SANA AI Health Agent - State: ${stateConfig.statusText}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* Outer Pulse Waves (Animated during listening / speaking / emergency) */}
      <div className="sana-orb-aura-ring ring-1" />
      <div className="sana-orb-aura-ring ring-2" />
      <div className="sana-orb-aura-ring ring-3" />

      {/* Rotating Cyber Ring */}
      <svg
        className="sana-orb-orbit-svg"
        viewBox="0 0 100 100"
        style={{ width: dimension, height: dimension }}
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          className="orbit-circle-outer"
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 6"
          className="orbit-circle-inner"
        />
      </svg>

      {/* Audio Equalizer Bars (Active during listening & speaking) */}
      {(state === "listening" || state === "speaking") && (
        <div className="sana-equalizer-bars">
          <span className="eq-bar bar-1" />
          <span className="eq-bar bar-2" />
          <span className="eq-bar bar-3" />
          <span className="eq-bar bar-4" />
          <span className="eq-bar bar-5" />
        </div>
      )}

      {/* Core Glowing Orb */}
      <div
        className="sana-orb-core"
        style={{
          width: coreSize,
          height: coreSize,
        }}
      >
        <div className="sana-orb-inner-glow" />
        <span
          className="sana-orb-symbol"
          style={{ fontSize: iconSize }}
          aria-hidden="true"
        >
          {stateConfig.icon}
        </span>
      </div>

      {showLabel && (
        <span className="sana-orb-badge-label">
          {stateConfig.statusText}
        </span>
      )}
    </div>
  );
}
