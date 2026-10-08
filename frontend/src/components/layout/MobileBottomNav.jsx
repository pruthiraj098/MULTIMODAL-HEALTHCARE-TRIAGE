import React, { useState } from "react";
import {
  Home,
  Sparkles,
  FileText,
  Activity,
  Menu,
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
  X,
  PhoneCall,
  LogOut
} from "lucide-react";

export default function MobileBottomNav({
  currentPath = "/dashboard",
  goTo = () => {},
  onOpenDemo = () => {},
  user = null
}) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const mainTabs = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "SANA", path: "/triage", icon: Sparkles, isAi: true },
    { label: "Reports", path: "/reports", icon: FileText },
    { label: "Health", path: "/intelligence", icon: Activity },
  ];

  const moreItems = [
    { label: "Vitals Monitor", path: "/health", icon: TrendingUp },
    { label: "Medication Regimen", path: "/medications", icon: Pill },
    { label: "Self-Care Guide", path: "/self-care", icon: Compass },
    { label: "Nearby Healthcare", path: "/facilities", icon: MapPin },
    { label: "Doctor Workspace", path: "/doctor", icon: Stethoscope },
    { label: "Nurse Intake", path: "/nurse", icon: ClipboardList },
    { label: "Clinical Queue", path: "/queue", icon: Layers },
    { label: "Medical Officer", path: "/medical-officer", icon: Shield },
    { label: "Facility Admin", path: "/facility-admin", icon: Building2 },
    { label: "Public Health", path: "/public-health", icon: BarChart3 },
  ];

  const handleNav = (path) => {
    goTo(path);
    setShowMoreSheet(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/login");
  };

  return (
    <>
      {/* Android Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path;
          return (
            <button
              key={tab.path}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""} ${tab.isAi ? "ai-tab" : ""}`}
              onClick={() => handleNav(tab.path)}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          className={`bottom-nav-item ${showMoreSheet ? "active" : ""}`}
          onClick={() => setShowMoreSheet(true)}
        >
          <div className="nav-icon-wrapper">
            <Menu size={20} />
          </div>
          <span className="nav-tab-label">More</span>
        </button>
      </nav>

      {/* Android Bottom Sheet Drawer */}
      {showMoreSheet && (
        <div className="mobile-sheet-backdrop" onClick={() => setShowMoreSheet(false)}>
          <div className="mobile-sheet-container" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div className="sheet-header">
              <div className="sheet-user-info">
                <strong>{user?.full_name || "Patient"}</strong>
                <span>Role: {user?.role || "PATIENT"}</span>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setShowMoreSheet(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Emergency Dial Buttons */}
            <div className="sheet-emergency-strip">
              <div className="emergency-strip-label">
                <PhoneCall size={14} />
                <span>Emergency Speed Dial</span>
              </div>
              <div className="emergency-strip-actions">
                <a href="tel:108" className="sheet-dial-btn ambulance">🚑 108 Ambulance</a>
                <a href="tel:112" className="sheet-dial-btn er">🚨 112 National ER</a>
              </div>
            </div>

            {/* More Clinical Modules Grid */}
            <div className="sheet-modules-grid">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`sheet-module-card ${isActive ? "active" : ""}`}
                    onClick={() => handleNav(item.path)}
                  >
                    <Icon size={20} className="module-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="sheet-bottom-actions">
              <button
                type="button"
                className="sheet-demo-btn"
                onClick={() => {
                  setShowMoreSheet(false);
                  onOpenDemo();
                }}
              >
                <Sparkles size={16} />
                <span>10 Demo Scenarios</span>
              </button>

              <button
                type="button"
                className="sheet-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
