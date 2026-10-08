import React, { useState } from "react";
import {
  Home,
  Sparkles,
  FileText,
  Activity,
  TrendingUp,
  Pill,
  Compass,
  MapPin,
  Stethoscope,
  ClipboardList,
  Layers,
  Shield,
  Building2,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  X,
  HeartPulse
} from "lucide-react";

export default function AppSidebar({
  currentPath = "/dashboard",
  goTo = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  mobileOpen = false,
  onCloseMobile = () => {},
  userRole = "PATIENT"
}) {
  const primaryNavItems = [
    { label: "Dashboard", path: "/dashboard", icon: Home, badge: null },
    { label: "SANA Assistant", path: "/triage", icon: Sparkles, badge: "AI" },
    { label: "Health Intelligence", path: "/intelligence", icon: Activity, badge: null },
    { label: "Health Monitor", path: "/health", icon: TrendingUp, badge: null },
    { label: "Medical Reports", path: "/reports", icon: FileText, badge: null },
    { label: "Medications", path: "/medications", icon: Pill, badge: null },
    { label: "Natural Self-Care", path: "/self-care", icon: Compass, badge: null },
    { label: "Nearby Healthcare", path: "/facilities", icon: MapPin, badge: null },
  ];

  const clinicalNavItems = [
    { label: "Doctor Workspace", path: "/doctor", icon: Stethoscope, roles: ["DOCTOR", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Nurse Intake", path: "/nurse", icon: ClipboardList, roles: ["NURSE", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Clinical Queue", path: "/queue", icon: Layers, roles: ["DOCTOR", "NURSE", "HEALTH_WORKER", "MEDICAL_OFFICER", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Medical Officer", path: "/medical-officer", icon: Shield, roles: ["MEDICAL_OFFICER", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Facility Admin", path: "/facility-admin", icon: Building2, roles: ["FACILITY_ADMIN", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Public Health", path: "/public-health", icon: BarChart3, roles: ["MEDICAL_OFFICER", "ADMIN", "SYSTEM_ADMIN"] },
    { label: "Doctor Copilot", path: "/copilot", icon: Bot, roles: ["DOCTOR", "ADMIN", "SYSTEM_ADMIN"] },
  ];

  const handleNavClick = (path) => {
    goTo(path);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${collapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div
            className="brand-clickable"
            onClick={() => handleNavClick("/dashboard")}
            title="HealthTriage AI"
          >
            <div className="brand-logo-icon">
              <HeartPulse size={20} className="pulse-icon" />
            </div>
            {!collapsed && (
              <div className="brand-titles">
                <span className="brand-name">HealthTriage<span className="brand-accent">AI</span></span>
                <span className="brand-subtitle">Clinical Intelligence</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="sidebar-nav-scroll">
          {/* Section: Primary Care */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">PATIENT CARE</div>}
            <nav className="sidebar-nav-list">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path || (item.path === "/facilities" && currentPath === "/nearby");
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNavClick(item.path)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon-box">
                      <Icon size={19} />
                    </span>
                    {!collapsed && (
                      <span className="nav-label-box">
                        <span className="nav-label">{item.label}</span>
                        {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: Clinical Workspaces */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">CLINICAL WORKSPACES</div>}
            <nav className="sidebar-nav-list">
              {clinicalNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNavClick(item.path)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon-box">
                      <Icon size={19} />
                    </span>
                    {!collapsed && (
                      <span className="nav-label-box">
                        <span className="nav-label">{item.label}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Emergency Rapid Dial */}
          {!collapsed ? (
            <div className="sidebar-emergency-card">
              <div className="emergency-header">
                <PhoneCall size={14} className="emergency-icon" />
                <span>Emergency Hotlines</span>
              </div>
              <div className="emergency-buttons">
                <a href="tel:108" className="emergency-btn red">🚑 108</a>
                <a href="tel:112" className="emergency-btn amber">🚨 112</a>
              </div>
            </div>
          ) : (
            <a href="tel:108" className="sidebar-emergency-mini" title="Ambulance: 108">
              🚨
            </a>
          )}

          {/* Collapse Toggle (Desktop only) */}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
