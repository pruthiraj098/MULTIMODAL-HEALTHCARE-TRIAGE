import React from "react";

/**
 * Standardized status badge pill for clinical priorities and states
 * Types: "emergency" | "urgent" | "routine" | "pending" | "improved" | "stable" | "review" | "normal" | "critical"
 */
export default function StatusBadge({ type = "routine", label, children, size = "md", dot = true }) {
  const normalizedType = String(type || "routine").toLowerCase().replace(/[^a-z0-9_]/g, "");

  const displayLabel = label || children || (
    normalizedType === "emergency" ? "Emergency" :
    normalizedType === "urgent" ? "Urgent" :
    normalizedType === "routine" ? "Routine" :
    normalizedType === "pending" || normalizedType === "review_needed" ? "Pending Review" :
    normalizedType === "improved" ? "Improved" :
    normalizedType === "stable" ? "Stable" :
    normalizedType === "critical" ? "Critical" :
    normalizedType === "normal" ? "Normal" :
    type
  );

  return (
    <span className={`clinical-status-badge badge-${normalizedType} badge-size-${size}`}>
      {dot && <span className={`badge-dot dot-${normalizedType}`} />}
      <span className="badge-text">{displayLabel}</span>
    </span>
  );
}
