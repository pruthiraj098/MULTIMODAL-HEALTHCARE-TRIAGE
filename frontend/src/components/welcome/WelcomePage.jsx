import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Activity,
  FileText,
  TrendingUp,
  Stethoscope,
  Mic,
  ArrowRight,
  Play,
  CheckCircle2,
  Heart,
  ChevronRight,
  Globe,
  Lock,
  Clock,
  PhoneCall,
  UserCheck,
  AlertTriangle,
  Bot,
  Search,
  MapPin,
  Calendar,
  ClipboardList,
  Volume2
} from "lucide-react";

export default function WelcomePage({
  goTo = () => {},
  onOpenDemo = () => {}
}) {
  const [selectedLang, setSelectedLang] = useState("English");
  const [sanaMessage, setSanaMessage] = useState(
    "Hello! I am SANA, your AI healthcare triage assistant. Tell me what symptoms you are experiencing today."
  );
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  const supportedLanguages = [
    { code: "en", name: "English", sample: "Hello, how can I assist your health today?" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)", sample: "ନମସ୍କାର, ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ସମସ୍ୟା କୁହନ୍ତୁ।" },
    { code: "hi", name: "हिन्दी (Hindi)", sample: "नमस्ते, आप अपने लक्षणों के बारे में बताएं।" },
    { code: "te", name: "తెలుగు (Telugu)", sample: "నమస్కారం, మీ ఆరోగ్య సమస్యలను వివరించండి." },
    { code: "ta", name: "தமிழ் (Tamil)", sample: "வணக்கம், உங்கள் உடல்நலக் குறிகளைப் பகிருங்கள்." }
  ];

  const handleLangChange = (langName) => {
    setSelectedLang(langName);
    const item = supportedLanguages.find((l) => l.name === langName);
    if (item) {
      setSanaMessage(item.sample);
    }
  };

  const handleTestVoiceAudio = () => {
    setIsSpeakingAudio(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sanaMessage);
      utterance.onend = () => setIsSpeakingAudio(false);
      utterance.onerror = () => setIsSpeakingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeakingAudio(false), 2000);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      sessionStorage.setItem("sana_prefill_query", heroSearchQuery.trim());
      goTo("/triage");
    }
  };

  const capabilities = [
    {
      id: "triage",
      icon: Stethoscope,
      title: "Symptom Assessment",
      desc: "Multimodal symptom evaluation with deterministic emergency red-flag checking.",
      tag: "Clinical Triage"
    },
    {
      id: "sana",
      icon: Mic,
      title: "SANA Voice Assistant",
      desc: "Conversational healthcare support in English, Odia, Hindi, Telugu, and Tamil.",
      tag: "Voice AI"
    },
    {
      id: "intelligence",
      icon: Activity,
      title: "Health Intelligence",
      desc: "Longitudinal health analysis detecting trends across vitals, reports, and visits.",
      tag: "Longitudinal"
    },
    {
      id: "ocr",
      icon: FileText,
      title: "Medical Report OCR",
      desc: "Extracts laboratory parameters from PDFs and scans with clinical reference ranges.",
      tag: "Diagnostics"
    },
    {
      id: "compare",
      icon: TrendingUp,
      title: "Report Comparison",
      desc: "Side-by-side analyte comparison across visits showing numerical trends.",
      tag: "Analytics"
    },
    {
      id: "medication",
      icon: Heart,
      title: "Medication Safety",
      desc: "Drug-drug interaction checks, allergy alerts, and clinician-approved schedules.",
      tag: "Safety Guard"
    },
    {
      id: "doctor",
      icon: Stethoscope,
      title: "Doctor Workspace",
      desc: "Clinical workspace for patient assessments, treatment plans, and approved orders.",
      tag: "Physician"
    },
    {
      id: "nurse",
      icon: ClipboardList,
      title: "Nurse Intake Desk",
      desc: "Rapid patient intake, physiological vitals recording, and triage priority queue.",
      tag: "Nursing"
    },
    {
      id: "vitals",
      icon: Activity,
      title: "Health Monitoring",
      desc: "Longitudinal tracker for HR, SpO2, Blood Pressure, Temperature, and Respiration.",
      tag: "Vitals"
    }
  ];

  const workflowSteps = [
    {
      num: 1,
      title: "Describe Symptoms",
      text: "Converse naturally with SANA using voice or text in your regional language.",
      badge: "Multimodal Voice & Text"
    },
    {
      num: 2,
      title: "AI Clinical Triage",
      text: "Deterministic clinical safety rules cross-reference symptom severity and vital thresholds.",
      badge: "Clinical Evidence"
    },
    {
      num: 3,
      title: "Reports & Health Data",
      text: "Upload lab PDFs or diagnostic scans. Automated OCR extracts analytes and detects health deltas.",
      badge: "Diagnostic Synthesis"
    },
    {
      num: 4,
      title: "Clinician Review",
      text: "Doctors and triage nurses review the structured clinical note and approve care plans.",
      badge: "Human-in-the-Loop"
    },
    {
      num: 5,
      title: "Continuous Follow-Up",
      text: "Patients receive clinician-approved guidance, prescription timetables, and continuity alerts.",
      badge: "Continuity of Care"
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F7FA",
        color: "#202B3C",
        fontFamily: "'Plus Jakarta Sans', 'Outfit', Inter, sans-serif"
      }}
    >
      {/* 1. Top Utility Hotline Bar (Inspired by Narayana Health Reference) */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E0E6ED",
          padding: "7px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "#596579"
        }}
        className="hidden md:flex"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#C83D4D", fontWeight: "700" }}>
            <span style={{ fontSize: "14px" }}>🚨</span>
            <span>24/7 Emergency: 108 (Ambulance) / 112 (ER)</span>
          </div>
          <span style={{ color: "#E0E6ED" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PhoneCall size={14} className="text-blue-600" />
            <span>Support Helpline: 1800-309-0309</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} className="text-teal-600" />
            <span style={{ fontWeight: "600", color: "#202B3C" }}>Bhubaneswar / Regional Centers</span>
          </div>
          <span style={{ color: "#E0E6ED" }}>|</span>
          <button
            type="button"
            onClick={() => goTo("/login")}
            style={{
              background: "none",
              border: "none",
              color: "#1769D2",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Patient / Staff Login
          </button>
        </div>
      </div>

      {/* 2. Main Hospital Navigation Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1px solid #E0E6ED",
          padding: "14px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(21, 52, 91, 0.04)"
        }}
      >
        {/* Brand Logo with exact original asset */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
          onClick={() => goTo("/welcome")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#FFFFFF",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E0E6ED",
              boxShadow: "0 2px 6px rgba(21, 52, 91, 0.06)",
              overflow: "hidden"
            }}
          >
            <img
              src="/logo.png"
              alt="HealthTriage AI Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#15345B", letterSpacing: "-0.3px" }}>
                HealthTriage<span style={{ color: "#1769D2" }}> AI</span>
              </span>
              <span
                style={{
                  background: "#EBF3FC",
                  color: "#1769D2",
                  border: "1px solid rgba(23, 105, 210, 0.25)",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}
              >
                CLINICAL PLATFORM
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#596579", fontWeight: "500" }}>
              Trusted Healthcare Support, Powered by AI
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "28px" }} className="hidden lg:flex">
          <a href="#home" style={{ textDecoration: "none", color: "#1769D2", fontSize: "15px", fontWeight: "700" }}>
            Home
          </a>
          <a href="#features" style={{ textDecoration: "none", color: "#202B3C", fontSize: "15px", fontWeight: "600" }}>
            Features
          </a>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "#202B3C", fontSize: "15px", fontWeight: "600" }}>
            How It Works
          </a>
          <a href="#sana-voice" style={{ textDecoration: "none", color: "#202B3C", fontSize: "15px", fontWeight: "600" }}>
            SANA AI
          </a>
          <a href="#security" style={{ textDecoration: "none", color: "#202B3C", fontSize: "15px", fontWeight: "600" }}>
            Security
          </a>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={onOpenDemo}
            style={{
              background: "#EBF3FC",
              color: "#1769D2",
              border: "1px solid rgba(23, 105, 210, 0.3)",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Live Demo Scenarios
          </button>
          <button
            type="button"
            onClick={() => goTo("/login")}
            style={{
              background: "#FFFFFF",
              color: "#15345B",
              border: "1px solid #CBD5E1",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => goTo("/register")}
            style={{
              background: "#1769D2",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 22px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(23, 105, 210, 0.3)",
              transition: "all 0.15s ease"
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* 3. Hero Section (Photographic Hospital Hero Banner) */}
      <section
        id="home"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "480px",
          maxHeight: "560px",
          overflow: "hidden",
          background: "#15345B"
        }}
      >
        {/* Authentic Clinical Photography Asset */}
        <img
          src="/assets/hospital-hero.jpg"
          alt="Compassionate healthcare interaction"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 25%",
            position: "absolute",
            inset: 0,
            opacity: 0.88
          }}
        />

        {/* Subtle, Professional Clinical Overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(21, 52, 91, 0.92) 0%, rgba(21, 52, 91, 0.70) 50%, rgba(21, 52, 91, 0.35) 100%)"
          }}
        />

        {/* Hero Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1320px",
            margin: "0 auto",
            padding: "64px 36px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "480px"
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "30px",
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#FFFFFF",
                marginBottom: "16px"
              }}
            >
              <Sparkles size={14} className="text-sky-300" />
              <span>Evidence-Based Multimodal Clinical Support</span>
            </div>

            <h1
              style={{
                fontSize: "46px",
                lineHeight: 1.15,
                fontWeight: "800",
                color: "#FFFFFF",
                marginBottom: "16px",
                letterSpacing: "-1px"
              }}
            >
              Trusted Healthcare Support, <br />
              Powered by AI
            </h1>

            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.55,
                color: "rgba(255, 255, 255, 0.92)",
                marginBottom: "28px",
                fontWeight: "500"
              }}
            >
              Understand your health information, explore symptoms, and connect with smarter healthcare support.
            </p>

            {/* Find Doctor / Symptom Assessment Search Bar (Reference Pattern) */}
            <form
              onSubmit={handleHeroSearch}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FFFFFF",
                borderRadius: "12px",
                padding: "6px 8px 6px 16px",
                maxWidth: "560px",
                marginBottom: "28px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)"
              }}
            >
              <Search size={20} style={{ color: "#79869C", marginRight: "10px", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search symptoms, lab parameters, or ask SANA..."
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  color: "#202B3C",
                  background: "transparent"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#1769D2",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Search
              </button>
            </form>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => goTo("/register")}
                style={{
                  background: "#1769D2",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px 28px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 4px 14px rgba(23, 105, 210, 0.4)",
                  transition: "all 0.15s ease"
                }}
              >
                <span>Start Your Health Journey</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#features"
                style={{
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  borderRadius: "10px",
                  padding: "14px 24px",
                  fontSize: "16px",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease"
                }}
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three Prominent Action Panels (Directly below hero, Narayana Reference Pattern) */}
      <section
        style={{
          maxWidth: "1320px",
          margin: "-32px auto 60px",
          padding: "0 36px",
          position: "relative",
          zIndex: 20
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px"
          }}
        >
          {/* Action 1: Symptom Assessment */}
          <div
            onClick={() => goTo("/triage")}
            style={{
              background: "#1769D2",
              color: "#FFFFFF",
              borderRadius: "14px",
              padding: "26px 28px",
              boxShadow: "0 10px 28px rgba(23, 105, 210, 0.25)",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "150px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
                  Start Symptom Assessment
                </h3>
                <ArrowRight size={22} />
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.88)", margin: 0, lineHeight: 1.5 }}>
                Evaluate your symptoms in minutes with verified clinical red-flag checking.
              </p>
            </div>
            <div style={{ marginTop: "16px", fontSize: "13px", fontWeight: "700", color: "#BAE6FD" }}>
              Voice & Text Available →
            </div>
          </div>

          {/* Action 2: Analyze Medical Reports */}
          <div
            onClick={() => goTo("/reports")}
            style={{
              background: "#C83D4D",
              color: "#FFFFFF",
              borderRadius: "14px",
              padding: "26px 28px",
              boxShadow: "0 10px 28px rgba(200, 61, 77, 0.25)",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "150px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
                  Analyze Medical Reports
                </h3>
                <ArrowRight size={22} />
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.88)", margin: 0, lineHeight: 1.5 }}>
                Upload laboratory PDFs or diagnostic scans to extract and track parameters.
              </p>
            </div>
            <div style={{ marginTop: "16px", fontSize: "13px", fontWeight: "700", color: "#FECDD3" }}>
              OCR Extraction & Trends →
            </div>
          </div>

          {/* Action 3: Explore Health Monitoring */}
          <div
            onClick={() => goTo("/health")}
            style={{
              background: "#15345B",
              color: "#FFFFFF",
              borderRadius: "14px",
              padding: "26px 28px",
              boxShadow: "0 10px 28px rgba(21, 52, 91, 0.25)",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "150px"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
                  Explore Health Monitoring
                </h3>
                <ArrowRight size={22} />
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.88)", margin: 0, lineHeight: 1.5 }}>
                Track heart rate, blood pressure, oxygen saturation, and temperature history.
              </p>
            </div>
            <div style={{ marginTop: "16px", fontSize: "13px", fontWeight: "700", color: "#93C5FD" }}>
              Physiological Tracking →
            </div>
          </div>
        </div>
      </section>

      {/* 5. How HealthTriage AI Works (5 Clean Clinical Steps) */}
      <section
        id="how-it-works"
        style={{
          maxWidth: "1320px",
          margin: "0 auto 80px",
          padding: "0 36px"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              background: "#EBF3FC",
              color: "#1769D2",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-block",
              marginBottom: "8px"
            }}
          >
            CLINICAL WORKFLOW
          </span>
          <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#15345B", margin: "0 0 10px 0" }}>
            How HealthTriage AI Works
          </h2>
          <p style={{ fontSize: "16px", color: "#596579", maxWidth: "620px", margin: "0 auto" }}>
            A transparent 5-step clinical workflow designed for patient safety and physician empowerment.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "14px",
                padding: "24px 20px",
                boxShadow: "0 2px 8px rgba(21, 52, 91, 0.04)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#1769D2",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "15px",
                  marginBottom: "14px"
                }}
              >
                {step.num}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", marginBottom: "8px" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#596579", lineHeight: 1.5, flex: 1, marginBottom: "14px" }}>
                {step.text}
              </p>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#1769D2",
                  background: "#EBF3FC",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  alignSelf: "flex-start"
                }}
              >
                {step.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SANA Multilingual Voice Assistance (Clean Hospital Assistant Showcase) */}
      <section
        id="sana-voice"
        style={{
          maxWidth: "1320px",
          margin: "0 auto 80px",
          padding: "0 36px"
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E6ED",
            borderRadius: "20px",
            padding: "44px 40px",
            boxShadow: "0 4px 16px rgba(21, 52, 91, 0.05)",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "40px",
            alignItems: "center"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#E6F7F6",
                color: "#159C98",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                marginBottom: "14px"
              }}
            >
              <Globe size={14} />
              <span>REGIONAL INDIAN LANGUAGES SUPPORT</span>
            </div>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#15345B", margin: "0 0 14px 0", lineHeight: 1.25 }}>
              Speak Naturally with SANA. <br />
              <span style={{ color: "#1769D2" }}>In Your Own Regional Language.</span>
            </h2>
            <p style={{ fontSize: "16px", color: "#596579", lineHeight: 1.6, marginBottom: "24px" }}>
              SANA (Smart AI Nursing & Assessment Assistant) listens attentively and responds in Odia, Hindi, Telugu, Tamil, and English. Designed to support rural and regional accessibility with deterministic safety guardrails.
            </p>

            {/* Language Selector Chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLangChange(l.name)}
                  style={{
                    background: selectedLang === l.name ? "#1769D2" : "#F5F7FA",
                    color: selectedLang === l.name ? "#FFFFFF" : "#202B3C",
                    border: selectedLang === l.name ? "1px solid #1769D2" : "1px solid #E0E6ED",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {l.name}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => goTo("/triage")}
                style={{
                  background: "#1769D2",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Mic size={18} />
                <span>Open SANA Voice Assistant</span>
              </button>

              <button
                type="button"
                onClick={handleTestVoiceAudio}
                style={{
                  background: "#F5F7FA",
                  color: "#15345B",
                  border: "1px solid #E0E6ED",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Volume2 size={18} className={isSpeakingAudio ? "text-blue-600 animate-pulse" : ""} />
                <span>{isSpeakingAudio ? "Playing audio..." : "Preview Greeting Audio"}</span>
              </button>
            </div>
          </div>

          {/* Clinical Assistant Speech Card (Clean & Realistic) */}
          <div
            style={{
              background: "#F5F7FA",
              border: "1px solid #E0E6ED",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#1769D2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "14px"
                  }}
                >
                  S
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#15345B" }}>SANA Assistant</div>
                  <div style={{ fontSize: "12px", color: "#159C98", fontWeight: "600" }}>Active in {selectedLang}</div>
                </div>
              </div>

              <span
                style={{
                  background: "#E8F5E9",
                  color: "#198754",
                  border: "1px solid rgba(25, 135, 84, 0.25)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                ● Online
              </span>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "15px",
                color: "#202B3C",
                lineHeight: 1.6
              }}
            >
              “{sanaMessage}”
            </div>

            <div style={{ fontSize: "13px", color: "#596579", lineHeight: 1.5 }}>
              🛡️ <strong>Safety Protocol:</strong> SANA analyzes patient complaints against deterministic clinical criteria and provides structured information for clinician review. SANA does not autonomously prescribe medications.
            </div>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Clinical Capabilities */}
      <section
        id="features"
        style={{
          maxWidth: "1320px",
          margin: "0 auto 80px",
          padding: "0 36px"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              background: "#EBF3FC",
              color: "#1769D2",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-block",
              marginBottom: "8px"
            }}
          >
            INTELLIGENCE MODULES
          </span>
          <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#15345B", margin: "0 0 10px 0" }}>
            Comprehensive Clinical Capabilities
          </h2>
          <p style={{ fontSize: "16px", color: "#596579", maxWidth: "600px", margin: "0 auto" }}>
            Integrated modules connecting symptoms, diagnostic OCR, vitals tracking, and clinician desks.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {capabilities.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E6ED",
                  borderRadius: "14px",
                  padding: "22px 20px",
                  boxShadow: "0 2px 8px rgba(21, 52, 91, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#EBF3FC",
                      color: "#1769D2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#1769D2",
                      background: "#EBF3FC",
                      padding: "3px 8px",
                      borderRadius: "6px"
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", margin: 0 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#596579", lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Security & Clinical Governance */}
      <section
        id="security"
        style={{
          maxWidth: "1320px",
          margin: "0 auto 80px",
          padding: "0 36px"
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E6ED",
            borderRadius: "20px",
            padding: "36px 32px",
            boxShadow: "0 4px 16px rgba(21, 52, 91, 0.04)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px"
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#FDF2F4",
                color: "#C83D4D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", marginBottom: "6px" }}>
                Zero Autonomous Prescribing
              </h3>
              <p style={{ fontSize: "14px", color: "#596579", lineHeight: 1.5, margin: 0 }}>
                HealthTriage AI does not autonomously prescribe medicines. Every medication decision requires review and approval from a registered doctor.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#EBF3FC",
                color: "#1769D2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", marginBottom: "6px" }}>
                HIPAA & Data Privacy
              </h3>
              <p style={{ fontSize: "14px", color: "#596579", lineHeight: 1.5, margin: 0 }}>
                Standard JWT encryption, role-based access control, and strict privacy protection. Patient health data is never sold or shared.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#E8F5E9",
                color: "#198754",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#15345B", marginBottom: "6px" }}>
                Human-in-the-Loop Validation
              </h3>
              <p style={{ fontSize: "14px", color: "#596579", lineHeight: 1.5, margin: 0 }}>
                Deterministic physiological checks trigger doctor and triage nurse prioritization before clinical care plans take effect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Hospital Footer with Original Logo */}
      <footer
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E0E6ED",
          padding: "44px 36px",
          color: "#596579"
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#FFFFFF",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E0E6ED",
                boxShadow: "0 2px 6px rgba(21, 52, 91, 0.06)",
                overflow: "hidden"
              }}
            >
              <img
                src="/logo.png"
                alt="HealthTriage AI"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: "800", color: "#15345B" }}>
                HealthTriage<span style={{ color: "#1769D2" }}> AI</span>
              </div>
              <div style={{ fontSize: "12px", color: "#596579" }}>
                Multimodal Healthcare Triage Assistant
              </div>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "#596579" }}>
            © {new Date().getFullYear()} HealthTriage AI. All rights reserved. Clinical decision support system.
          </div>

          <div style={{ display: "flex", gap: "20px", fontSize: "14px", fontWeight: "600" }}>
            <button
              type="button"
              onClick={() => goTo("/welcome")}
              style={{ background: "none", border: "none", color: "#596579", cursor: "pointer" }}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => goTo("/login")}
              style={{ background: "none", border: "none", color: "#596579", cursor: "pointer" }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => goTo("/register")}
              style={{ background: "none", border: "none", color: "#596579", cursor: "pointer" }}
            >
              Register
            </button>
            <button
              type="button"
              onClick={onOpenDemo}
              style={{ background: "none", border: "none", color: "#1769D2", cursor: "pointer", fontWeight: "700" }}
            >
              Demo Scenarios
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
