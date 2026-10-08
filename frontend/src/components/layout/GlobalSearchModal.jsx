import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  FileText,
  Activity,
  TrendingUp,
  Pill,
  MapPin,
  Stethoscope,
  X,
  ArrowRight,
  ShieldAlert,
  Clock
} from "lucide-react";

export default function GlobalSearchModal({
  isOpen = false,
  onClose = () => {},
  goTo = () => {}
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const searchableItems = [
    { title: "Ask SANA AI Assistant", category: "Triage & AI", path: "/triage", icon: Sparkles, hint: "Voice & multimodal triage consultation" },
    { title: "Medical Reports & OCR Scanner", category: "Documents", path: "/reports", icon: FileText, hint: "Upload & analyze blood, pathology, radiology reports" },
    { title: "Health Intelligence Hub", category: "Clinical Intelligence", path: "/intelligence", icon: Activity, hint: "Disease explorer, what changed, interaction checker" },
    { title: "Health Monitoring & Vitals", category: "Physiological Trends", path: "/health", icon: TrendingUp, hint: "Track blood pressure, heart rate, SpO2 baseline" },
    { title: "Medication Guidance & Tracker", category: "Pharmacy", path: "/medications", icon: Pill, hint: "Prescription timetable, missed dose guidance" },
    { title: "Emergency Care & Nearby Facilities", category: "Urgent Care", path: "/facilities", icon: MapPin, hint: "24x7 trauma centers, hospitals, directions" },
    { title: "Doctor Clinical Workspace", category: "Clinician Support", path: "/doctor", icon: Stethoscope, hint: "Physician decision support, approve treatment plans" },
    { title: "Nurse Intake & Triage Desk", category: "Nurse Workflow", path: "/nurse", icon: Clock, hint: "Record patient vitals, assess safety red flags" },
    { title: "Natural & Self-Care Guidance", category: "Wellness", path: "/self-care", icon: Activity, hint: "Evidence-based home comfort remedies" },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = query.trim()
    ? searchableItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.hint.toLowerCase().includes(query.toLowerCase())
      )
    : searchableItems;

  const handleSelect = (path) => {
    onClose();
    goTo(path);
  };

  const handleAskSana = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    sessionStorage.setItem("sana_prefill_query", query.trim());
    goTo("/triage");
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="search-modal-input-row">
          <Search size={20} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search clinical modules, reports, or ask SANA..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                handleAskSana(e);
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
          <span className="search-shortcut-badge">ESC</span>
        </div>

        {/* Ask SANA Quick Action if query typed */}
        {query.trim() && (
          <div className="search-ask-sana-strip" onClick={handleAskSana}>
            <div className="sana-sparkle-box">
              <Sparkles size={16} />
            </div>
            <div className="sana-ask-text">
              <span>Ask SANA: <strong>"{query.trim()}"</strong></span>
              <small>Initiate multimodal AI triage with this query</small>
            </div>
            <ArrowRight size={16} className="sana-arrow" />
          </div>
        )}

        {/* Results List */}
        <div className="search-modal-results">
          <div className="search-section-label">CLINICAL MODULES & ACTIONS</div>
          {filteredItems.length === 0 ? (
            <div className="search-empty-state">
              <p>No matching module found.</p>
              <button
                type="button"
                className="search-empty-sana-btn"
                onClick={handleAskSana}
              >
                Ask SANA AI about "{query}" →
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="search-result-item"
                  onClick={() => handleSelect(item.path)}
                >
                  <div className="result-icon-box">
                    <Icon size={18} />
                  </div>
                  <div className="result-details">
                    <div className="result-title-row">
                      <span className="result-title">{item.title}</span>
                      <span className="result-category">{item.category}</span>
                    </div>
                    <span className="result-hint">{item.hint}</span>
                  </div>
                  <ArrowRight size={16} className="result-arrow" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="search-modal-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Open with <kbd>Enter</kbd></span>
          <span>Close with <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
