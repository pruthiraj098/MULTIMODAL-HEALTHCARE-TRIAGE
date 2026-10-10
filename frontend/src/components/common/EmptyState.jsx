import React from "react";

function renderIcon(icon, defaultSize = 28) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && (icon.$$typeof || icon.render))) {
    const IconComp = icon;
    return <IconComp size={defaultSize} />;
  }
  return icon;
}

export default function EmptyState({
  icon = "📋",
  title = "No data found",
  description = "There are currently no items to display in this view.",
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  primaryAction,
  secondaryAction,
  className = ""
}) {
  const resolvedPrimaryText = actionText || primaryAction?.label;
  const resolvedPrimaryAction = onAction || primaryAction?.onClick;
  const resolvedSecondaryText = secondaryActionText || secondaryAction?.label;
  const resolvedSecondaryAction = onSecondaryAction || secondaryAction?.onClick;

  return (
    <div className={`app-empty-state-card ${className}`}>
      <div className="empty-state-icon-circle">{renderIcon(icon, 32)}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {(resolvedPrimaryText || resolvedSecondaryText) && (
        <div className="empty-state-actions">
          {resolvedPrimaryText && (
            <button
              type="button"
              className="empty-state-primary-btn"
              onClick={resolvedPrimaryAction}
            >
              {resolvedPrimaryText}
            </button>
          )}
          {resolvedSecondaryText && (
            <button
              type="button"
              className="empty-state-secondary-btn"
              onClick={resolvedSecondaryAction}
            >
              {resolvedSecondaryText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
