import React from "react";
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
  LogOut,
  Calendar
} from "lucide-react";

export default function AppSidebar({
  currentPath = "/dashboard",
  goTo = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  mobileOpen = false,
  onCloseMobile = () => {},
  userRole = "PATIENT",
  user = null
}) {
  const currentUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

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

  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/welcome");
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
            <div
              className="brand-logo-icon"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#ffffff",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E0E6ED",
                boxShadow: "0 2px 6px rgba(21, 52, 91, 0.06)",
                overflow: "hidden",
                flexShrink: 0
              }}
            >
              <img
                src="/logo.png"
                alt="HealthTriage AI"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block"
                }}
              />
            </div>
            {!collapsed && (
              <div className="brand-titles">
                <span className="brand-name" style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", letterSpacing: "-0.3px" }}>
                  HealthTriage<span className="brand-accent" style={{ color: "#1769D2" }}> AI</span>
                </span>
                <span className="brand-subtitle" style={{ fontSize: "12px", color: "#596579", fontWeight: "600" }}>
                  Clinical Platform
                </span>
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

        {/* User Mini Card (Clean Hospital Dashboard Style) */}
        {!collapsed && currentUser && (
          <div
            style={{
              padding: "10px 12px",
              margin: "12px 12px 4px",
              background: "#F5F7FA",
              borderRadius: "12px",
              border: "1px solid #E0E6ED",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#1769D2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                flexShrink: 0
              }}
            >
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : "P"}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#15345B",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {currentUser.full_name || "Patient"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#159C98",
                  fontWeight: "600",
                  textTransform: "capitalize"
                }}
              >
                {currentUser.role?.toLowerCase() || "Patient"}
              </div>
            </div>
          </div>
        )}

        {/* Gemini-Style New Chat Action */}
        <div style={{ padding: "6px 12px" }}>
          <button
            type="button"
            onClick={() => handleNavClick("/triage")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: "10px",
              background: "#EFF6FF",
              color: "#1D4ED8",
              border: "1px solid #DBEAFE",
              borderRadius: "10px",
              padding: collapsed ? "10px 0" : "9px 14px",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="New Chat with SANA"
          >
            <Sparkles size={16} color="#2563EB" />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation Items Scroll Container */}
        <div className="sidebar-nav-scroll">
          {/* Primary Patient Section */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">PATIENT CARE</div>}
            <nav className="sidebar-nav-list">
              {primaryNavItems.map((item) => {
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
                      <Icon size={20} />
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

          {/* Clinical & Professional Section (if authorized) */}
          {clinicalNavItems.some((item) => item.roles.includes(userRole)) && (
            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-title">CLINICAL WORKSPACES</div>}
              <nav className="sidebar-nav-list">
                {clinicalNavItems
                  .filter((item) => item.roles.includes(userRole))
                  .map((item) => {
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
                          <Icon size={20} />
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
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Emergency Rapid Dial */}
          {!collapsed ? (
            <div className="sidebar-emergency-card">
              <div className="emergency-header">
                <PhoneCall size={14} className="emergency-icon" />
                <span>24/7 Emergency Support</span>
              </div>
              <div className="emergency-buttons">
                <a href="tel:108" className="emergency-btn red">🚑 108 Ambulance</a>
                <a href="tel:112" className="emergency-btn amber">🚨 112 ER</a>
              </div>
            </div>
          ) : (
            <a href="tel:108" className="sidebar-emergency-mini" title="Ambulance: 108">
              🚨
            </a>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title={collapsed ? "Logout" : undefined}
          >
            <span className="nav-icon-box">
              <LogOut size={18} />
            </span>
            {!collapsed && <span className="nav-label">Sign Out</span>}
          </button>

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
