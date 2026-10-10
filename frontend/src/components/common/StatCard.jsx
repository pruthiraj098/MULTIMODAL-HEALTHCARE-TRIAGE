import React from "react";

function renderIcon(icon, defaultSize = 18) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && (icon.$$typeof || icon.render))) {
    const IconComp = icon;
    return <IconComp size={defaultSize} />;
  }
  return icon;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeType = "routine",
  accentColor = "blue",
  onClick,
  actionText,
  className = ""
}) {
  return (
    <div
      onClick={onClick}
      className={`app-stat-card stat-accent-${accentColor} ${onClick ? "clickable" : ""} ${className}`}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <div className={`stat-card-icon-box icon-${accentColor}`}>{renderIcon(icon, 18)}</div>}
      </div>

      <div className="stat-card-value-row">
        <span className="stat-card-value">{value ?? "—"}</span>
        {badgeText && (
          <span className={`stat-card-badge badge-${badgeType}`}>
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || actionText) && (
        <div className="stat-card-footer">
          {subtitle && <span className="stat-card-sub">{subtitle}</span>}
          {actionText && <span className="stat-card-action">{actionText} →</span>}
        </div>
      )}
    </div>
  );
}
