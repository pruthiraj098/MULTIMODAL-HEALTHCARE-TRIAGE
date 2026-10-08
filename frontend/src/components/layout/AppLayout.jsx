import React, { useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import TopHeader from "./TopHeader";
import MobileBottomNav from "./MobileBottomNav";
import ContextPanel from "./ContextPanel";
import GlobalSearchModal from "./GlobalSearchModal";

export default function AppLayout({
  children,
  currentPath = "/dashboard",
  goTo = () => {},
  onOpenDemo = () => {},
  showContextPanel = false,
  onLaunchVoice = null
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [contextPanelCollapsed, setContextPanelCollapsed] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  // Handle Ctrl+K / Cmd+K global search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      {/* 1. Left Collapsible Sidebar */}
      <AppSidebar
        currentPath={currentPath}
        goTo={goTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userRole={user?.role || "PATIENT"}
      />

      {/* 2. Main Content Wrapper */}
      <div className="app-main-column">
        {/* Top Header */}
        <TopHeader
          currentPath={currentPath}
          goTo={goTo}
          onToggleMobile={() => setMobileSidebarOpen((prev) => !prev)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenDemo={onOpenDemo}
          user={user}
        />

        {/* Content & Context Panel Layout */}
        <div className="app-content-and-context">
          <main className="app-page-content" id="main-content">
            {children}
          </main>

          {/* Context Panel (Desktop Right Panel - shown where relevant, e.g. Dashboard) */}
          {showContextPanel && (
            <ContextPanel
              goTo={goTo}
              onLaunchVoice={onLaunchVoice}
              user={user}
              collapsed={contextPanelCollapsed}
              onToggleCollapse={() => setContextPanelCollapsed((prev) => !prev)}
            />
          )}
        </div>
      </div>

      {/* 3. Mobile Bottom Navigation (Android App Style) */}
      <MobileBottomNav
        currentPath={currentPath}
        goTo={goTo}
        onOpenDemo={onOpenDemo}
        user={user}
      />

      {/* 4. Global Search & Command Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        goTo={goTo}
      />
    </div>
  );
}
