import React from "react";

function renderIcon(icon, defaultSize = 22) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && (icon.$$typeof || icon.render))) {
    const IconComp = icon;
    return <IconComp size={defaultSize} />;
  }
  return icon;
}

export default function PageHeader({
  badge,
  badgeType = "primary",
  title,
  icon,
  subtitle,
  statusPill,
  actions,
  className = ""
}) {
  return (
    <div className={`app-page-header-card ${className}`}>
      <div className="page-header-content">
        {badge && (
          <div className="page-header-badge-row">
            <span className={`page-header-badge badge-${badgeType}`}>{badge}</span>
            {statusPill && <span className="page-header-status-pill">{statusPill}</span>}
          </div>
        )}

        <div className="page-header-title-row">
          {icon && <span className="page-header-icon">{renderIcon(icon, 22)}</span>}
          <h1 className="page-header-title">{title}</h1>
        </div>

        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
