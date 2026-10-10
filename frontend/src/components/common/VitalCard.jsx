import React from "react";
import StatusBadge from "./StatusBadge";

function renderIcon(icon, defaultSize = 20) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && (icon.$$typeof || icon.render))) {
    const IconComp = icon;
    return <IconComp size={defaultSize} />;
  }
  return icon;
}

export default function VitalCard({
  title,
  icon,
  value,
  unit = "",
  status = "Normal",
  statusType = "routine",
  range = "",
  active = false,
  onClick,
  className = ""
}) {
  const isNormal = status?.toUpperCase() === "NORMAL" || status?.toUpperCase() === "OPTIMAL";
  const isCritical = status?.toUpperCase() === "CRITICAL" || status?.toUpperCase() === "EMERGENCY";
  const isWarning = status?.toUpperCase() === "ELEVATED" || status?.toUpperCase() === "BORDERLINE" || status?.toUpperCase() === "URGENT";

  const resolvedBadgeType = isCritical ? "emergency" : isWarning ? "urgent" : isNormal ? "routine" : "stable";

  return (
    <div
      onClick={onClick}
      className={`app-vital-card ${active ? "is-active" : ""} ${onClick ? "is-clickable" : ""} ${className}`}
    >
      <div className="vital-card-top">
        <span className="vital-card-title">{title}</span>
        <span className="vital-card-icon">{renderIcon(icon, 18)}</span>
      </div>

      <div className="vital-card-value-row">
        <span className="vital-card-value">{value ?? "—"}</span>
        {unit && <span className="vital-card-unit">{unit}</span>}
      </div>

      <div className="vital-card-bottom">
        <StatusBadge type={resolvedBadgeType} label={status || "Normal"} size="sm" />
        {range && <span className="vital-card-range">{range}</span>}
      </div>
    </div>
  );
}
