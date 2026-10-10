// ============================================================
// HealthTriage AI - SANA Visual Control Component
// Professional Healthcare Assistant Status & Practical Mic Control
// ============================================================

import React, { useMemo } from "react";
import { Heart, Mic, Sparkles, Volume2, AlertTriangle, Activity, AlertCircle } from "lucide-react";

/**
 * States:
 * - 'idle': available, ready
 * - 'activating': microphone initializing
 * - 'listening': actively hearing user voice
 * - 'finalizing_transcript': finishing utterance, verifying speech
 * - 'ready_to_respond': turn captured, preparing triage
 * - 'thinking': processing with clinical triage engine
 * - 'speaking': speaking response via audio
 * - 'emergency': critical red flag alert state
 * - 'error': error or microphone permission denied
 */
export default function SanaOrb({
  state = "idle",
  size = "md", // 'sm' | 'md' | 'lg' | 'hero'
  onClick,
  showLabel = false,
  interactive = true,
}) {
  const sizeMap = {
    sm: { dimension: 40, iconSize: 18 },
    md: { dimension: 52, iconSize: 24 },
    lg: { dimension: 64, iconSize: 28 },
    hero: { dimension: 72, iconSize: 32 },
  };

  const { dimension, iconSize } = sizeMap[size] || sizeMap.md;

  const config = useMemo(() => {
    switch (state) {
      case "activating":
        return {
          bg: "#EBF3FC",
          color: "#1769D2",
          border: "#1769D2",
          icon: Activity,
          statusText: "Connecting...",
          pulse: false,
        };
      case "listening":
        return {
          bg: "#198754",
          color: "#FFFFFF",
          border: "#146C43",
          icon: Mic,
          statusText: "Listening...",
          pulse: true,
        };
      case "finalizing_transcript":
      case "ready_to_respond":
        return {
          bg: "#159C98",
          color: "#FFFFFF",
          border: "#11817E",
          icon: Sparkles,
          statusText: "Processing speech...",
          pulse: false,
        };
      case "thinking":
        return {
          bg: "#1769D2",
          color: "#FFFFFF",
          border: "#1255AA",
          icon: Sparkles,
          statusText: "Analyzing symptoms...",
          pulse: false,
        };
      case "speaking":
        return {
          bg: "#159C98",
          color: "#FFFFFF",
          border: "#11817E",
          icon: Volume2,
          statusText: "SANA is speaking...",
          pulse: true,
        };
      case "emergency":
        return {
          bg: "#C83D4D",
          color: "#FFFFFF",
          border: "#A52837",
          icon: AlertTriangle,
          statusText: "Clinical Alert",
          pulse: true,
        };
      case "error":
        return {
          bg: "#FEF7EA",
          color: "#C78116",
          border: "#F59E0B",
          icon: AlertCircle,
          statusText: "Microphone Error",
          pulse: false,
        };
      case "idle":
      default:
        return {
          bg: "#1769D2",
          color: "#FFFFFF",
          border: "#1255AA",
          icon: Mic,
          statusText: "Talk to SANA",
          pulse: false,
        };
    }
  }, [state]);

  const IconComponent = config.icon;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        userSelect: "none"
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Practical Professional Action Button */}
        <button
          type="button"
          onClick={interactive ? onClick : undefined}
          style={{
            width: `${dimension}px`,
            height: `${dimension}px`,
            borderRadius: "50%",
            background: config.bg,
            color: config.color,
            border: `2px solid ${config.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: interactive ? "pointer" : "default",
            boxShadow: "0 2px 8px rgba(21, 52, 91, 0.12)",
            transition: "transform 0.15s ease, background 0.2s ease"
          }}
          title={`SANA Assistant: ${config.statusText}`}
          aria-label={`SANA Assistant: ${config.statusText}`}
        >
          <IconComponent size={iconSize} />
        </button>
      </div>

      {showLabel && (
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#15345B" }}>
          {config.statusText}
        </span>
      )}
    </div>
  );
}
