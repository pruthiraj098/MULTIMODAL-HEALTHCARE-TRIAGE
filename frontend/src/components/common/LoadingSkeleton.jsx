import React from "react";

export default function LoadingSkeleton({
  type = "card", // "card" | "text" | "vitals" | "table" | "kpi"
  count = 1,
  className = ""
}) {
  const items = Array.from({ length: count });

  if (type === "kpi") {
    return (
      <div className={`skeleton-kpi-grid ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-card skeleton-kpi-box">
            <div className="skeleton-line w-24 mb-2" />
            <div className="skeleton-line h-8 w-16 mb-2" />
            <div className="skeleton-line w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "vitals") {
    return (
      <div className={`skeleton-vitals-grid ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-card skeleton-vital-box">
            <div className="skeleton-line w-20 mb-2" />
            <div className="skeleton-line h-7 w-28 mb-3" />
            <div className="skeleton-line w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`skeleton-container ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line w-40 mb-3" />
          <div className="skeleton-line w-full mb-2" />
          <div className="skeleton-line w-3/4 mb-4" />
          <div className="skeleton-line h-9 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
