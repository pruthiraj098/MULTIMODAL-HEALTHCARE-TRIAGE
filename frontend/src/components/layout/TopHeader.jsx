import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  X
} from "lucide-react";

export default function TopHeader({
  currentPath = "/dashboard",
  goTo = () => {},
  onToggleMobile = () => {},
  onOpenSearch = () => {},
  onOpenDemo = () => {},
  user = null
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/login");
  };

  // Map path to friendly page title
  const getPageInfo = () => {
    switch (currentPath) {
      case "/dashboard":
        return { title: "Patient Care Dashboard", section: "Home" };
      case "/triage":
        return { title: "SANA Multimodal Clinical Triage", section: "AI Clinical Assessment" };
      case "/intelligence":
        return { title: "Health & Disease Intelligence Hub", section: "Clinical Intelligence" };
      case "/health":
        return { title: "Personal Health Monitoring & Vitals", section: "Physiological Tracking" };
      case "/reports":
        return { title: "Medical Reports & Diagnostic OCR", section: "Laboratory Records" };
      case "/medications":
        return { title: "Medication Regimen & Tracker", section: "Pharmacopeia & Timetable" };
      case "/self-care":
        return { title: "Natural & Evidence-Based Self-Care", section: "Supportive Wellness" };
      case "/facilities":
      case "/nearby":
        return { title: "Nearby Care & Emergency Centers", section: "Geographic Facilities" };
      case "/doctor":
        return { title: "Doctor Clinical Workspace", section: "Physician Decision Support" };
      case "/nurse":
        return { title: "Nurse Triage & Intake Desk", section: "Nursing Operations" };
      case "/queue":
        return { title: "Clinical Review & Triage Queue", section: "Hospital Queue" };
      case "/medical-officer":
        return { title: "Medical Officer Dashboard", section: "Facility Operations" };
      case "/facility-admin":
        return { title: "Facility Administration & Modes", section: "System Management" };
      case "/public-health":
        return { title: "Public Health Surveillance", section: "Epidemiological Trends" };
      case "/copilot":
        return { title: "Doctor Visit Copilot", section: "Encounter Assistant" };
      default:
        return { title: "HealthTriage AI", section: "Portal" };
    }
  };

  const pageInfo = getPageInfo();

  const notifications = [
    {
      id: "n1",
      title: "Real-Time Safety Engine Active",
      desc: "Deterministic vital triage rules running with zero hallucination guarantee.",
      time: "Just now",
      type: "success",
      icon: CheckCircle2
    },
    {
      id: "n2",
      title: "Medication Schedule Updated",
      desc: "Prescriptions synchronized with morning and evening reminder slots.",
      time: "20m ago",
      type: "info",
      icon: Activity
    },
    {
      id: "n3",
      title: "Hospital Trauma Beds Monitored",
      desc: "Trauma centers and ER facilities ready for 1-tap dial and ambulance dispatch.",
      time: "1h ago",
      type: "alert",
      icon: AlertTriangle
    }
  ];

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";
  const userRole = user?.role || "PATIENT";

  return (
    <header className="app-top-header">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="top-header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={onToggleMobile}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div className="mobile-header-logo-container" style={{ display: "none" }}>
          <img
            src="/logo.png"
            alt="HealthTriage AI"
            style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "8px" }}
          />
        </div>

        <div className="header-breadcrumb-block">
          <div className="breadcrumb-path">
            <span className="crumb-root">Portal</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{pageInfo.section}</span>
          </div>
          <div className="breadcrumb-title-row">
            <h1 className="header-page-title">{pageInfo.title}</h1>
            <span className="header-status-pill">
              <span className="status-live-dot" /> AI Safety Active
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search trigger */}
      <div className="top-header-center">
        <button
          type="button"
          className="header-search-trigger"
          onClick={onOpenSearch}
          title="Search patients, reports, medications or ask SANA (Ctrl+K)"
        >
          <Search size={16} className="search-trigger-icon" />
          <span className="search-placeholder">Search patients, reports, medications or ask SANA...</span>
          <kbd className="search-kbd">Ctrl K</kbd>
        </button>
      </div>

      {/* Right: Actions, Demo, Notifications, Profile */}
      <div className="top-header-right">
        {/* 10 Demo Scenarios Launcher */}
        <button
          type="button"
          className="header-demo-btn"
          onClick={onOpenDemo}
          title="Open 10 Synthetic Clinical Demo Scenarios"
        >
          <Sparkles size={15} />
          <span>10 Demo Scenarios</span>
        </button>

        {/* Notifications Bell */}
        <div className="header-action-dropdown-wrapper" ref={notifRef}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Clinical notifications"
          >
            <Bell size={19} />
            <span className="notif-badge-dot">3</span>
          </button>

          {showNotifications && (
            <div className="notifications-dropdown-menu">
              <div className="dropdown-menu-header">
                <span className="menu-title">Clinical Alerts & Notifications</span>
                <span className="menu-badge">3 Unread</span>
              </div>
              <div className="notifications-list">
                {notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className={`notification-item ${item.type}`}>
                      <div className="notif-icon-box">
                        <Icon size={16} />
                      </div>
                      <div className="notif-content">
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                        <small>{item.time}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="dropdown-menu-footer">
                <button
                  type="button"
                  className="dropdown-footer-btn"
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Profile Menu */}
        <div className="header-action-dropdown-wrapper" ref={profileRef}>
          <button
            type="button"
            className="header-user-chip"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <div className="user-avatar-circle">
              {userInitial}
            </div>
            <div className="user-chip-meta">
              <span className="user-chip-name">{user?.full_name || "Guest Patient"}</span>
              <span className="user-chip-role">{userRole}</span>
            </div>
            <ChevronDown size={14} className="user-chip-arrow" />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="profile-menu-header">
                <div className="profile-user-card">
                  <div className="user-avatar-circle large">{userInitial}</div>
                  <div>
                    <strong>{user?.full_name || "User"}</strong>
                    <p>{user?.email || "Signed In"}</p>
                    <span className="profile-role-tag">{userRole}</span>
                  </div>
                </div>
              </div>

              <div className="profile-menu-items">
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    goTo("/dashboard");
                  }}
                >
                  <User size={16} />
                  <span>Personal Care Center</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenDemo();
                  }}
                >
                  <Sparkles size={16} />
                  <span>Switch Role / Demo Scenario</span>
                </button>

                <div className="profile-menu-divider" />

                <button
                  type="button"
                  className="profile-menu-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
