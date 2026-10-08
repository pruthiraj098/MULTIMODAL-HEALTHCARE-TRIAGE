import React, { useState, useEffect } from "react";
import SanaOrb from "../SanaOrb";

export default function WelcomePage({
  goTo = () => {},
  onOpenDemo = () => {}
}) {
  const [sanaState, setSanaState] = useState("idle");
  const [activeTab, setActiveTab] = useState("all");
  const [sanaMessage, setSanaMessage] = useState(
    "Hello! I am SANA, your Smart AI Nursing & Assessment Assistant. How can I assist with your health today?"
  );

  const sanaPhrases = [
    { state: "listening", text: "Listening to your spoken symptoms..." },
    { state: "thinking", text: "Analyzing symptoms, vital ranges, and medical safety guidelines..." },
    { state: "speaking", text: "Ready. Your symptoms and vitals have been organized for clinical review." },
    { state: "idle", text: "Tap me anytime to start an empathetic voice health check." }
  ];

  const handleOrbClick = () => {
    const states = ["activating", "listening", "thinking", "speaking", "idle"];
    const nextIdx = (states.indexOf(sanaState) + 1) % states.length;
    const nextState = states[nextIdx];
    setSanaState(nextState);

    if (nextState === "activating") {
      setSanaMessage("Connecting to SANA clinical intelligence layer...");
    } else if (nextState === "listening") {
      setSanaMessage("🎙️ Listening... 'Describe any pain, fever, duration, or vital measurements.'");
    } else if (nextState === "thinking") {
      setSanaMessage("✦ Fusing voice evidence with deterministic vital rules...");
    } else if (nextState === "speaking") {
      setSanaMessage("🔊 SANA: 'I have logged your inputs for clinician review. Your vitals are within stable thresholds.'");
    } else {
      setSanaMessage("Hello! I am SANA, your Smart AI Nursing & Assessment Assistant.");
    }
  };

  const capabilities = [
    {
      id: "triage",
      icon: "🩺",
      title: "AI Health Triage",
      desc: "Multimodal symptom evaluation with deterministic emergency red-flag checking.",
      tag: "Core Clinical"
    },
    {
      id: "sana",
      icon: "❤️",
      title: "SANA AI Assistant",
      desc: "Voice-driven conversational nurse assistant supporting 6 regional Indian languages.",
      tag: "Voice AI"
    },
    {
      id: "intelligence",
      icon: "🧠",
      title: "Health Intelligence",
      desc: "Longitudinal health analysis detecting trends across vitals, reports, and visits.",
      tag: "Longitudinal"
    },
    {
      id: "ocr",
      icon: "📄",
      title: "Medical Report OCR",
      desc: "Extracts lab parameters from PDFs and scans with report-specific reference ranges.",
      tag: "Diagnostics"
    },
    {
      id: "compare",
      icon: "📊",
      title: "Report Comparison",
      desc: "Side-by-side analyte comparison across visits showing numerical trends (↑, ↓, →).",
      tag: "Analytics"
    },
    {
      id: "what-changed",
      icon: "🔍",
      title: "What Changed?",
      desc: "Instant health delta detector highlighting improved, stable, and review-needed metrics.",
      tag: "Delta AI"
    },
    {
      id: "disease",
      icon: "📚",
      title: "Disease Intelligence",
      desc: "Evidence-based knowledge base across 22 specialties with clinician decision support.",
      tag: "Knowledge"
    },
    {
      id: "medication",
      icon: "💊",
      title: "Medication Safety",
      desc: "Rigorous drug-drug interaction checker, allergy alerts, and food timing warnings.",
      tag: "Safety Guard"
    },
    {
      id: "doctor",
      icon: "👨‍⚕️",
      title: "Doctor Workspace",
      desc: "Complete clinical workspace for patient assessments, treatment plans, and orders.",
      tag: "Clinician"
    },
    {
      id: "nurse",
      icon: "👩‍⚕️",
      title: "Nurse Dashboard",
      desc: "Rapid patient intake, vitals recording, triage priority assignment, and monitoring.",
      tag: "Nursing"
    },
    {
      id: "mo",
      icon: "🏛️",
      title: "Medical Officer Hub",
      desc: "Facility-wide operational oversight, emergency escalation tracking, and staff load.",
      tag: "Leadership"
    },
    {
      id: "queue",
      icon: "🚦",
      title: "Smart Healthcare Queue",
      desc: "Real-time prioritized triage queue: Emergency (🔴), Urgent (🟡), and Routine (🟢).",
      tag: "Operations"
    },
    {
      id: "referral",
      icon: "📑",
      title: "Referral Management",
      desc: "Standardized clinical referral slips with specialty matching and printable copies.",
      tag: "Coordination"
    },
    {
      id: "vitals",
      icon: "📈",
      title: "Health Monitoring",
      desc: "Longitudinal tracker for HR, SpO2, Blood Pressure, Temperature, and Respiration.",
      tag: "Vitals"
    },
    {
      id: "facility",
      icon: "🏥",
      title: "Facility Intelligence",
      desc: "Workflow modes for Govt Hospitals, PHCs, Screening Camps, and Campus Units.",
      tag: "Facility SaaS"
    }
  ];

  const steps = [
    {
      num: 1,
      title: "Create an Account or Log In",
      text: "Sign in securely with role-based credentials (Patient, Nurse, Doctor, Medical Officer, Admin)."
    },
    {
      num: 2,
      title: "Enter Health Information",
      text: "Maintain a secure longitudinal personal health profile with age, medical history, and allergies."
    },
    {
      num: 3,
      title: "Describe Symptoms via Voice or Text",
      text: "Converse naturally with SANA in your preferred language or type your complaints."
    },
    {
      num: 4,
      title: "Add Optional Vitals",
      text: "Provide Heart Rate, SpO2, Temperature, or Blood Pressure. Missing vitals never block triage."
    },
    {
      num: 5,
      title: "Upload Medical Reports",
      text: "Upload pathology PDFs or scans; automated OCR extracts analytes and reference ranges."
    },
    {
      num: 6,
      title: "Upload Medical Images",
      text: "Submit dermatological or clinical photos. AI provides structured observation without diagnosing."
    },
    {
      num: 7,
      title: "AI Multimodal Synthesis",
      text: "AI organizes complaints, vitals, OCR, and history into a structured clinical note."
    },
    {
      num: 8,
      title: "Deterministic Safety Rules",
      text: "Safety engine evaluates physiological red flags (HR >130, SpO2 <90%) with absolute priority."
    },
    {
      num: 9,
      title: "Human Healthcare Worker Review",
      text: "Nurses and clinical reviewers review the structured note and prioritize queue status."
    },
    {
      num: 10,
      title: "Doctor Approves Treatment Plan",
      text: "Licensed physicians formulate final clinical assessments, prescriptions, and follow-ups."
    },
    {
      num: 11,
      title: "SANA Explains Approved Plan",
      text: "SANA clarifies doctor-approved prescriptions, food timings, and dosage reminders clearly."
    },
    {
      num: 12,
      title: "Follow-Up & Continuity of Care",
      text: "Automated schedule reminders, adherence tracking, and specialist referral management."
    }
  ];

  return (
    <div className="welcome-page-root" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => goTo("/welcome")}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "bold",
              boxShadow: "0 4px 12px rgba(37,99,235,0.25)"
            }}
          >
            +
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
                HealthTriage AI
              </span>
              <span
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}
              >
                PRO HEALTHCARE PLATFORM
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Multimodal Human-in-the-Loop Healthcare Intelligence
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
            How It Works
          </a>
          <a href="#capabilities" style={{ textDecoration: "none", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
            Capabilities
          </a>
          <a href="#user-guide" style={{ textDecoration: "none", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
            User Guide
          </a>
          <a href="#safety-privacy" style={{ textDecoration: "none", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
            Safety & Safety Rules
          </a>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={onOpenDemo}
            style={{
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            🚀 Try Live Scenarios
          </button>
          <button
            type="button"
            onClick={() => goTo("/login")}
            style={{
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #2563eb",
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => goTo("/register")}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "none",
              padding: "8px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
            }}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Emergency Alert Banner */}
      <div
        style={{
          background: "#fef2f2",
          borderBottom: "1px solid #fecaca",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontSize: "13px",
          color: "#991b1b"
        }}
      >
        <span style={{ fontSize: "16px" }}>🚨</span>
        <strong>Immediate Emergency Notice:</strong> If you or someone around you is experiencing chest pain, severe breathlessness, or sudden weakness, seek immediate emergency medical care (Call <strong>112</strong> / <strong>108</strong>).
      </div>

      {/* Hero Section */}
      <section
        style={{
          padding: "60px 32px 80px",
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "center"
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              color: "#1d4ed8",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "18px"
            }}
          >
            <span>✦</span> NEXT-GEN HEALTHCARE INTELLIGENCE
          </div>
          <h1
            style={{
              fontSize: "44px",
              lineHeight: 1.15,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "18px",
              letterSpacing: "-1px"
            }}
          >
            Welcome to <span style={{ color: "#2563eb" }}>HealthTriage AI</span>
          </h1>
          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.55,
              color: "#475569",
              marginBottom: "32px",
              maxWidth: "600px"
            }}
          >
            AI-assisted healthcare triage, health intelligence and clinical decision support — designed to connect patients and healthcare professionals with multimodal safety, verified doctor workflows, and continuous AI nursing.
          </p>

          {/* Call to Actions */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "36px" }}>
            <button
              type="button"
              onClick={() => goTo("/register")}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>Get Started Now</span> →
            </button>
            <button
              type="button"
              onClick={() => goTo("/login")}
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "14px 26px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              Sign In to Portal
            </button>
            <button
              type="button"
              onClick={onOpenDemo}
              style={{
                background: "#f8fafc",
                color: "#0284c7",
                border: "1px solid #bae6fd",
                borderRadius: "12px",
                padding: "14px 22px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Explore 10 Demo Scenarios
            </button>
          </div>

          {/* Trust Highlights */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>6 Languages</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Odia, Hindi, Bengali, Telugu, Tamil, English</div>
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb" }}>100% Deterministic</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Safety engine priority over generative LLMs</div>
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669" }}>Human-in-the-Loop</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Doctors make all final clinical decisions</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive SANA Orb Card */}
        <div
          style={{
            background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "28px",
            padding: "36px 32px",
            color: "#ffffff",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.45)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#38bdf8",
              marginBottom: "20px"
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
            CENTRAL AI LAYER
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0" }}>
            Meet SANA
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 28px 0" }}>
            Smart AI Nursing & Assessment Assistant
          </p>

          {/* Interactive SanaOrb Showcase */}
          <div style={{ marginBottom: "24px", cursor: "pointer" }} onClick={handleOrbClick} title="Click to test SANA states">
            <SanaOrb size="hero" state={sanaState} interactive={false} />
          </div>

          {/* SANA Live Status Dialogue */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
              width: "100%",
              marginBottom: "20px",
              minHeight: "76px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13.5px",
              lineHeight: 1.45,
              color: "#e2e8f0"
            }}
          >
            "{sanaMessage}"
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => {
                setSanaState("listening");
                setSanaMessage("🎙️ Listening to patient verbal symptoms in Odia/Hindi/English...");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11.5px",
                cursor: "pointer"
              }}
            >
              Simulate Voice Input
            </button>
            <button
              onClick={() => {
                setSanaState("thinking");
                setSanaMessage("✦ Synthesizing lab analytes with vital bounds...");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11.5px",
                cursor: "pointer"
              }}
            >
              Analyze Vitals
            </button>
            <button
              onClick={() => {
                setSanaState("speaking");
                setSanaMessage("🔊 SANA explaining clinician treatment plan dosage & food warnings.");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11.5px",
                cursor: "pointer"
              }}
            >
              Explain Treatment
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: What HealthTriage AI Does */}
      <section style={{ background: "#ffffff", padding: "80px 32px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Clinical Foundations
          </span>
          <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", marginTop: "8px", marginBottom: "16px" }}>
            What HealthTriage AI Does
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "750px", margin: "0 auto 48px auto", lineHeight: 1.6 }}>
            HealthTriage AI bridges the gap between community intake and specialized medical care. It provides structured decision support for triage, verifies medication safety, extracts diagnostic lab parameters, and empowers healthcare teams to save lives.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px", textAlign: "left" }}>
            <div style={{ background: "#f8fafc", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "18px" }}>
                🎯
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Multimodal Evidence Fusion
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                Synthesizes patient complaints, voice transcripts in regional languages, physiological vitals, OCR report analytes, and visual observations into an immutable 5-section triage note.
              </p>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "18px" }}>
                🛡️
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Deterministic Safety Guarantee
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                Critical thresholds like SpO2 &lt;90% or Heart Rate &gt;130 BPM instantly trigger deterministic emergency escalations that Google Gemini or generative LLMs can never override.
              </p>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "18px" }}>
                👨‍⚕️
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Human-in-the-Loop Review
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                AI assists and organizes, but qualified nurses and doctors retain full authority to approve, modify, escalate, or prescribe clinician treatment plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works Workflow Diagram */}
      <section id="how-it-works" style={{ padding: "80px 32px", background: "#f1f5f9" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
            End-to-End Clinical Flow
          </span>
          <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", marginTop: "8px", marginBottom: "40px" }}>
            How It Works
          </h2>

          {/* Workflow Sequence */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "40px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0"
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "20px",
                position: "relative"
              }}
            >
              {/* Step 1 */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 14px auto", fontWeight: "800" }}>
                  1
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Patient / Worker</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Voice, symptoms, optional vitals, reports &amp; images</p>
              </div>

              {/* Step 2 */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 14px auto", fontWeight: "800" }}>
                  2
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>AI Evidence Fusion</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>SANA + Gemini parses text, audio &amp; OCR data</p>
              </div>

              {/* Step 3 */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 14px auto", fontWeight: "800" }}>
                  3
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Risk &amp; Safety Engine</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Deterministic rule verification &amp; drug safety guard</p>
              </div>

              {/* Step 4 */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 14px auto", fontWeight: "800" }}>
                  4
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Clinical Review</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Nurses &amp; Doctors review prioritized triage note</p>
              </div>

              {/* Step 5 */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 14px auto", fontWeight: "800" }}>
                  5
                </div>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Treatment &amp; Care</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Clinician plan, referral slip, and SANA guidance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Key Capabilities (15 Cards) */}
      <section id="capabilities" style={{ padding: "80px 32px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Healthcare Intelligence Suite
            </span>
            <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
              Key Platform Capabilities
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "650px", margin: "12px auto 0 auto" }}>
              A fully integrated clinical ecosystem from patient symptom check-in to hospital bed management.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px"
            }}
          >
            {capabilities.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                }}
                onClick={() => goTo("/login")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <span style={{ fontSize: "30px" }}>{c.icon}</span>
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}
                  >
                    {c.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.55, margin: 0 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5, 6, 7: Audience Breakdown (Patients, Professionals, Facilities) */}
      <section style={{ padding: "80px 32px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Target Stakeholders
            </span>
            <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
              Engineered for Every Tier of Care
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }}>
            {/* For Patients */}
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "32px", border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#2563eb", fontSize: "28px", marginBottom: "14px" }}>🧑‍🤝‍🧑</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                For Patients
              </h3>
              <ul style={{ paddingLeft: "20px", color: "#64748b", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                <li>Voice-guided triage in your native Indian dialect</li>
                <li>Longitudinal health timeline &amp; vitals tracking</li>
                <li>Clear "What Changed?" report comparisons</li>
                <li>SANA medication explanations &amp; dose reminders</li>
                <li>Nearby emergency care finder with GPS routing</li>
                <li>Doctor visit briefing copilot for appointments</li>
              </ul>
            </div>

            {/* For Healthcare Professionals */}
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "32px", border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#059669", fontSize: "28px", marginBottom: "14px" }}>🩺</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                For Healthcare Professionals
              </h3>
              <ul style={{ paddingLeft: "20px", color: "#64748b", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                <li>Dedicated Doctor Clinical Workspace &amp; Assessment Note</li>
                <li>Clinician Treatment Plan creation &amp; prescription orders</li>
                <li>Nurse patient intake with real-time vital alerts</li>
                <li>Smart prioritized triage queue board (🔴 🟡 🟢)</li>
                <li>Printable clinical referral slip generator</li>
                <li>Evidence-based disease &amp; pharmacopeia intelligence</li>
              </ul>
            </div>

            {/* For Healthcare Facilities */}
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "32px", border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#7c3aed", fontSize: "28px", marginBottom: "14px" }}>🏥</div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                For Facilities &amp; Public Health
              </h3>
              <ul style={{ paddingLeft: "20px", color: "#64748b", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                <li>Facility Admin Dashboard with staff workload KPIs</li>
                <li>Configurable workflow modes (Govt Hospital, PHC, Camp)</li>
                <li>De-identified regional symptom cluster surveillance</li>
                <li>Public health anomaly early warning notifications</li>
                <li>Resource requirement forecasting (Ambulance &amp; nurse load)</li>
                <li>Complete audit trail compliance and access logging</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: User Guide (How to Use HealthTriage AI - 12 Steps) */}
      <section id="user-guide" style={{ padding: "80px 32px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Step-by-Step Instructions
            </span>
            <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
              How to Use HealthTriage AI
            </h2>
            <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "600px", margin: "10px auto 0 auto" }}>
              Follow this 12-step pathway for clinical assessments and care coordination.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px"
            }}
          >
            {steps.map((st) => (
              <div
                key={st.num}
                style={{
                  display: "flex",
                  gap: "18px",
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "800",
                    flexShrink: 0
                  }}
                >
                  {st.num}
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
                    {st.title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    {st.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9 & 10: Safety Rules, Privacy & AI Limitations */}
      <section id="safety-privacy" style={{ padding: "80px 32px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#dc2626", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Medical Ethics &amp; AI Safety Guard
            </span>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
              Privacy, Safety &amp; Clinical Limitations
            </h2>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: "20px",
              padding: "36px",
              marginBottom: "30px",
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.05)"
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#991b1b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> Mandatory Clinical Disclaimer
            </h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>
              HealthTriage AI is an AI-assisted healthcare support and triage intelligence system. <strong>It does not replace a qualified healthcare professional or licensed physician.</strong>
            </p>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              AI never autonomously prescribes medication, never makes definitive diagnoses from images or numerical lab changes, and never overrides emergency safety protocols. All prescription treatment plans must be formulated and approved by licensed medical doctors.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "26px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                🔒 Strict Privacy &amp; Data Protection
              </h4>
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                Longitudinal patient records are strictly access-controlled. Doctors only access authorized patients. Public health surveillance uses 100% de-identified symptom clusters with zero personally identifiable information (PII).
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "26px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                ⚡ Low-Connectivity &amp; Fallback Mode
              </h4>
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                If internet or Gemini API access is temporarily interrupted, the system does not crash. Local deterministic risk rules, vital thresholds, stored medical records, and triage queue operations continue seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: Call to Action & Footer */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          padding: "70px 32px 50px",
          textAlign: "center"
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "14px" }}>
            Experience the Future of AI-Assisted Healthcare
          </h2>
          <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "32px" }}>
            Join patients, nurses, doctors, and healthcare administrators on the unified HealthTriage AI intelligence platform.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "50px" }}>
            <button
              onClick={() => goTo("/register")}
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(37,99,235,0.4)"
              }}
            >
              Create Account
            </button>
            <button
              onClick={() => goTo("/login")}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Login to Platform
            </button>
            <button
              onClick={onOpenDemo}
              style={{
                background: "transparent",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "12px",
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Evaluate Synthetic Scenarios
            </button>
          </div>

          {/* Footer Meta */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12.5px",
              color: "#64748b",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              © 2026 HealthTriage AI. Multimodal Human-in-the-Loop Healthcare Intelligence Platform.
            </div>
            <div style={{ display: "flex", gap: "18px" }}>
              <span>Emergency Helpline: 112 / 108</span>
              <span>SANA Voice AI v2.0</span>
              <span>HIPAA / Health Data Security Aligned</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
