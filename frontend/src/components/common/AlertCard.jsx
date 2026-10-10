import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

export default function AlertCard({
  type = "info", // "emergency" | "warning" | "success" | "info"
  title,
  message,
  children,
  action,
  onClose,
  className = ""
}) {
  const getIcon = () => {
    switch (type) {
      case "emergency":
      case "danger":
        return <ShieldAlert size={20} className="alert-icon-emergency" />;
      case "warning":
      case "urgent":
        return <AlertTriangle size={20} className="alert-icon-warning" />;
      case "success":
        return <CheckCircle2 size={20} className="alert-icon-success" />;
      default:
        return <Info size={20} className="alert-icon-info" />;
    }
  };

  return (
    <div className={`app-alert-card alert-${type} ${className}`} role="alert">
      <div className="alert-icon-wrapper">{getIcon()}</div>
      <div className="alert-content-body">
        {title && <strong className="alert-title">{title}</strong>}
        {message && <p className="alert-message">{message}</p>}
        {children}
      </div>
      {action && <div className="alert-action-slot">{action}</div>}
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
