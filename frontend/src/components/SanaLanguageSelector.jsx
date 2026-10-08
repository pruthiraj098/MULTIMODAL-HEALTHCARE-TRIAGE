// ============================================================
// HealthTriage AI - SANA Language Selector Component
// Supports English, Hindi, Odia, Bengali
// ============================================================

import { useState, useRef, useEffect } from "react";

const SANA_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    flag: "🇮🇳",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇮🇳",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
  },
];

export default function SanaLanguageSelector({
  currentLanguage = "en",
  onLanguageChange = () => {},
  variant = "pill", // 'pill' | 'dropdown'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected =
    SANA_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SANA_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "pill") {
    return (
      <div className="sana-lang-pill-group" role="group" aria-label="Language Selector">
        <span className="sana-lang-icon-prefix">🌐</span>
        {SANA_LANGUAGES.map((lang) => {
          const isActive = lang.code === currentLanguage;
          return (
            <button
              key={lang.code}
              type="button"
              className={`sana-lang-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => onLanguageChange(lang.code)}
              title={`${lang.name} (${lang.nativeName})`}
              aria-pressed={isActive}
            >
              <span>{lang.flag}</span>
              <span className="lang-label">{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="sana-lang-dropdown-wrapper" ref={containerRef}>
      <button
        type="button"
        className="sana-lang-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="trigger-flag">{selected.flag}</span>
        <span className="trigger-text">{selected.nativeName}</span>
        <span className="trigger-arrow">▾</span>
      </button>

      {isOpen && (
        <div className="sana-lang-dropdown-menu">
          <div className="dropdown-header-title">🌐 Language</div>
          {SANA_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`dropdown-lang-item ${
                lang.code === currentLanguage ? "selected" : ""
              }`}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
            >
              <span className="lang-item-flag">{lang.flag}</span>
              <div className="lang-item-names">
                <strong>{lang.nativeName}</strong>
                <small>{lang.name}</small>
              </div>
              {lang.code === currentLanguage && (
                <span className="lang-check-icon">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
