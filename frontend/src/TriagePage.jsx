// ============================================================
// HealthTriage AI - SANA Clinical Chatbot (Gemini-Inspired Redesign)
// Clean, Focused Healthcare Conversational Interface
// Integrates Real Continuous Two-Way Voice Studio, Clinical Triage,
// Multimodal Image/Report Inputs, and Longitudinal Safety Rules.
// ============================================================

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Mic,
  Send,
  Camera,
  FileText,
  Activity,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  PhoneCall,
} from "lucide-react";

import SanaVoiceInterface from "./components/SanaVoiceInterface";
import SanaLanguageSelector from "./components/SanaLanguageSelector";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { API_URL } from "./config";
import "./TriagePage.css";

const WELCOME_GREETINGS = {
  en: "Hello! I am SANA, how are you feeling today?",
  hi: "नमस्ते! मैं साना (SANA) हूँ। आज आप कैसा महसूस कर रहे हैं?",
  or: "ନମସ୍କାର! ମୁଁ ସାନା (SANA)। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି କୁହନ୍ତୁ?",
  bn: "নমস্কার! আমি সানা (SANA)। আজ আপনি কেমন অনুভব করছেন বলুন?",
  te: "నమస్కారం! నేను సానా (SANA)। ఈరోజు మీరు ఎలా ఉన్నారు?",
  ta: "வணக்கம்! நான் சானா (SANA)। இன்று நீங்கள் எவ்வாறு உணர்கிறீர்கள்?",
};

export default function TriagePage({ goTo, initialVoiceOpen = false }) {
  // Voice Studio Modal State
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(initialVoiceOpen);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Vitals State
  const [showVitals, setShowVitals] = useState(false);
  const [vitals, setVitals] = useState({
    age: "",
    gender: "",
    heart_rate: "",
    spo2: "",
    temperature: "",
    respiratory_rate: "",
    systolic_bp: "",
    diastolic_bp: "",
  });

  const [symptoms, setSymptoms] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome-initial",
      role: "assistant",
      content: WELCOME_GREETINGS.en,
      statusBanner: null,
      safetyWarnings: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Multimodal Attachments
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imageAttachment, setImageAttachment] = useState(null); // { name, dataUrl }
  const [reportAttachment, setReportAttachment] = useState(null); // { name, data }

  // Speech Recognition (Dictation into text box)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Assessment History
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);
  const attachMenuRef = useRef(null);

  const token = localStorage.getItem("healthtriage_token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  // Synchronize language welcome message if user changes language before first message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome-initial") {
      setMessages([
        {
          id: "welcome-initial",
          role: "assistant",
          content: WELCOME_GREETINGS[selectedLanguage] || WELCOME_GREETINGS.en,
          statusBanner: null,
          safetyWarnings: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [selectedLanguage]);

  // Auth Guard
  useEffect(() => {
    if (!token) {
      goTo("/login");
    }
  }, [token]);

  // Direct Voice Route trigger
  useEffect(() => {
    if (initialVoiceOpen) {
      setIsVoiceStudioOpen(true);
    }
  }, [initialVoiceOpen]);

  // Demo Scenario loading from sessionStorage if selected
  useEffect(() => {
    try {
      const storedScenario = sessionStorage.getItem("healthtriage_demo_scenario");
      if (storedScenario) {
        sessionStorage.removeItem("healthtriage_demo_scenario");
        const sc = JSON.parse(storedScenario);
        if (sc.symptoms) {
          setSymptoms(sc.symptoms);
        }
        if (sc.vitals) {
          setVitals((prev) => ({ ...prev, ...sc.vitals }));
          setShowVitals(true);
        }
      }
    } catch (e) {
      console.warn("[TriagePage] Error loading demo scenario:", e);
    }
  }, []);

  // Auto-scroll transcript on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Speech Recognition setup for dictation into composer
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === "hi" ? "hi-IN" : selectedLanguage === "or" ? "or-IN" : "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }
  }, [selectedLanguage]);

  const toggleDictation = () => {
    if (!speechSupported) {
      // Fallback: open full voice studio
      setIsVoiceStudioOpen(true);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageAttachment({
        name: file.name,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReportSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReportAttachment({
        name: file.name,
        data: reader.result,
      });
    };

    if (file.name.endsWith(".txt") || file.type.startsWith("text/")) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleVitalChange = (event) => {
    setVitals({
      ...vitals,
      [event.target.name]: event.target.value,
    });
  };

  // 4 Suggested Prompts (Gemini Reference Pattern)
  const suggestedPrompts = [
    {
      title: "I have a fever and body aches.",
      desc: "Check symptoms and get clinical self-care guidance",
      icon: Activity,
      action: () => {
        setSymptoms("I have a persistent fever and generalized body aches.");
        textareaRef.current?.focus();
      },
    },
    {
      title: "Help me understand my symptoms.",
      desc: "Walk through symptom duration, triggers, and severity",
      icon: Sparkles,
      action: () => {
        setSymptoms("Help me understand my symptoms: ");
        textareaRef.current?.focus();
      },
    },
    {
      title: "I want to review a medical report.",
      desc: "Upload lab tests, blood work, or clinical doctor notes",
      icon: FileText,
      action: () => {
        setSymptoms("Please analyze this attached medical report:");
        fileInputRef.current?.click();
      },
    },
    {
      title: "What do these vital signs mean?",
      desc: "Assess heart rate, SpO₂, blood pressure & temperature",
      icon: Heart,
      action: () => {
        setShowVitals(true);
        setSymptoms("What do these vital signs indicate regarding my health condition?");
        textareaRef.current?.focus();
      },
    },
  ];

  // Parse Color-Coded Triage Output Banner
  const parseTriageBanner = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Red: Urgent: Visit Emergency
    if (
      lower.includes("emergency") ||
      lower.includes("🔴") ||
      lower.includes("visit emergency") ||
      lower.includes("immediate er")
    ) {
      return {
        level: "emergency",
        title: "Urgent: Visit Emergency",
        icon: "🚨",
        subtext: "Immediate emergency medical care (ER or call 108 / 112) is strongly recommended.",
        colorClass: "banner-red",
      };
    }

    // Yellow: See a Doctor Soon
    if (
      lower.includes("urgent care") ||
      lower.includes("doctor visit") ||
      lower.includes("see a doctor soon") ||
      lower.includes("moderate urgency") ||
      lower.includes("high urgency") ||
      lower.includes("🟡")
    ) {
      return {
        level: "urgent",
        title: "See a Doctor Soon",
        icon: "⚠️",
        subtext: "Schedule an urgent care consultation or visit a doctor within 24–48 hours.",
        colorClass: "banner-yellow",
      };
    }

    // Green: Safe for Home Care
    if (
      lower.includes("self-care") ||
      lower.includes("home care") ||
      lower.includes("safe for home care") ||
      lower.includes("low urgency") ||
      lower.includes("🟢")
    ) {
      return {
        level: "home",
        title: "Safe for Home Care",
        icon: "🌿",
        subtext: "Manageable with supportive home comfort steps, hydration, and monitoring.",
        colorClass: "banner-green",
      };
    }

    return null;
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "welcome-initial",
        role: "assistant",
        content: WELCOME_GREETINGS[selectedLanguage] || WELCOME_GREETINGS.en,
        statusBanner: null,
        safetyWarnings: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setSymptoms("");
    setImageAttachment(null);
    setReportAttachment(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setError("");

    const currentSymptoms = symptoms.trim();
    if (!currentSymptoms && !imageAttachment && !reportAttachment) {
      return;
    }

    if (!token) {
      goTo("/login");
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: "user",
      content: currentSymptoms || "Uploaded attachments for clinical assessment.",
      attachments: {
        image: imageAttachment ? imageAttachment.name : null,
        report: reportAttachment ? reportAttachment.name : null,
      },
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setSymptoms("");
    setLoading(true);

    try {
      const payload = {
        name: user?.full_name || "",
        age: vitals.age ? parseInt(vitals.age, 10) : null,
        gender: vitals.gender || "",
        symptoms: currentSymptoms || "Patient uploaded diagnostic images/reports for assessment.",
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        spo2: vitals.spo2 ? parseFloat(vitals.spo2) : null,
        heart_rate: vitals.heart_rate ? parseFloat(vitals.heart_rate) : null,
        respiratory_rate: vitals.respiratory_rate ? parseFloat(vitals.respiratory_rate) : null,
        systolic_bp: vitals.systolic_bp ? parseFloat(vitals.systolic_bp) : null,
        diastolic_bp: vitals.diastolic_bp ? parseFloat(vitals.diastolic_bp) : null,
        conversation: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        final_assessment: true,
        image_data: imageAttachment?.dataUrl || null,
        report_data: reportAttachment?.data || null,
        language: selectedLanguage,
      };

      const response = await fetch(`${API_URL}/api/triage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Triage service failed.");
      }

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const triageResult = data.triage_result || "Triage evaluation completed.";
      const safetyWarnings = data.safety_warnings || [];
      const banner = parseTriageBanner(triageResult);

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: triageResult,
        statusBanner: banner,
        safetyWarnings,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setImageAttachment(null);
      setReportAttachment(null);
    } catch (err) {
      console.error("[SANA Triage] Error:", err);
      setError(err.message || "Failed to generate triage response. Please try again.");

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ I encountered an issue while analyzing your symptoms: ${
            err.message || "Service unavailable."
          }\n\nPlease try again or seek direct medical attention if experiencing severe symptoms.`,
          statusBanner: null,
          safetyWarnings: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTriageHistory = async () => {
    try {
      setHistoryLoading(true);
      setShowHistoryModal(true);

      const response = await fetch(`${API_URL}/api/user/triage-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to fetch triage history.");
      }

      const data = await response.json();
      setHistoryRecords(data.history || []);
    } catch (err) {
      console.error("[SANA History] Error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper to format structured text
  const renderFormattedResult = (content) => {
    if (!content) return null;

    const lines = content.split("\n");
    return (
      <div style={{ fontSize: "14.5px", lineHeight: "1.65", color: "#1E293B" }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("### ")) {
            return (
              <div
                key={idx}
                style={{
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#0F172A",
                  marginTop: "14px",
                  marginBottom: "6px",
                }}
              >
                {trimmed.replace("### ", "")}
              </div>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <div
                key={idx}
                style={{
                  fontWeight: "800",
                  fontSize: "17px",
                  color: "#15345B",
                  marginTop: "16px",
                  marginBottom: "8px",
                }}
              >
                {trimmed.replace("## ", "")}
              </div>
            );
          }
          if (trimmed.startsWith("- ")) {
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  margin: "4px 0",
                }}
              >
                <span style={{ color: "#2563EB", fontWeight: "bold" }}>•</span>
                <span>{trimmed.replace("- ", "")}</span>
              </div>
            );
          }
          if (trimmed === "") {
            return <div key={idx} style={{ height: "6px" }} />;
          }
          return (
            <div key={idx} style={{ margin: "2px 0" }}>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <div className="sana-gemini-container">
      {/* Hidden file inputs for attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleReportSelect}
        accept=".txt,.pdf,.doc,.docx"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* =====================================================
          TOP NAVIGATION BAR: GEMINI INSPIRED APPLICATION BAR
      ===================================================== */}
      <header className="sana-gemini-topbar">
        <div className="sana-gemini-brand-group">
          <div className="sana-gemini-avatar-badge" aria-hidden="true">
            <span className="sana-heart-pulse">❤️</span>
          </div>
          <div className="sana-gemini-title-meta">
            <h1>
              <span>SANA Assistant</span>
              <span className="sana-safety-badge">
                <span className="safety-dot" /> AI Safety Active
              </span>
            </h1>
            <p>Smart AI Nursing & Assessment • Multimodal Clinical Triage</p>
          </div>
        </div>

        <div className="sana-gemini-actions-group">
          {/* Language Selector */}
          <SanaLanguageSelector
            currentLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            variant="dropdown"
          />

          {/* Prominent Talk to SANA Voice Button */}
          <button
            type="button"
            className="sana-talk-voice-btn"
            onClick={() => setIsVoiceStudioOpen(true)}
            title="Launch continuous two-way voice assistant"
          >
            <Mic size={16} />
            <span className="btn-text">Talk to SANA</span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            className="sana-new-chat-btn"
            onClick={handleNewChat}
            title="Start a fresh consultation"
          >
            <Plus size={15} />
            <span className="btn-text">New Chat</span>
          </button>

          {/* Assessment History Button */}
          <button
            type="button"
            className="sana-history-nav-btn"
            onClick={fetchTriageHistory}
            title="View your previous assessments"
          >
            <Clock size={15} />
            <span className="btn-text">History</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN CONVERSATION AREA
      ===================================================== */}
      <main className="sana-gemini-main">
        {/* CASE 1: GEMINI-STYLE CENTERED WELCOME SCREEN (NO USER MESSAGES YET) */}
        {!hasUserMessages ? (
          <div className="sana-gemini-welcome-container">
            <h2 className="sana-gemini-greeting">
              Hello, I'm SANA. How can I help you today?
            </h2>
            <p className="sana-gemini-subtext">
              Describe how you're feeling, ask a health-related question, or share a medical report for assistance.
            </p>

            {/* Suggested Prompts (Gemini Reference Design) */}
            <div className="sana-gemini-prompts-grid">
              {suggestedPrompts.map((p, idx) => {
                const PromptIcon = p.icon || Sparkles;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="sana-gemini-prompt-card"
                    onClick={p.action}
                  >
                    <div className="prompt-card-icon">
                      <PromptIcon size={22} />
                    </div>
                    <div className="prompt-card-text">
                      <div className="prompt-card-title">{p.title}</div>
                      <div className="prompt-card-desc">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* CASE 2: CONVERSATION MESSAGES STREAM */
          <div className="sana-gemini-messages-viewport">
            <div className="sana-gemini-messages-thread">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`sana-message-row ${msg.role === "user" ? "user" : "assistant"}`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <div className="sana-assistant-avatar" aria-hidden="true">
                        🩺
                      </div>
                      <div className="sana-assistant-card">
                        <div className="sana-assistant-header">
                          <span className="sana-assistant-name">
                            <span>SANA</span>
                            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "normal" }}>
                              • Clinical Assessment
                            </span>
                          </span>
                          <span className="sana-assistant-time">{msg.timestamp}</span>
                        </div>

                        {/* Color-Coded Triage Status Banner */}
                        {msg.statusBanner && (
                          <div className={`sana-triage-banner ${msg.statusBanner.colorClass}`}>
                            <div className="sana-triage-banner-left">
                              <span className="sana-triage-icon">{msg.statusBanner.icon}</span>
                              <div>
                                <span className="sana-triage-title">{msg.statusBanner.title}</span>
                                <p className="sana-triage-subtext">{msg.statusBanner.subtext}</p>
                              </div>
                            </div>

                            {msg.statusBanner.level === "emergency" && (
                              <a
                                href="tel:108"
                                className="sana-emergency-dial-btn"
                                title="Immediate emergency medical dial"
                              >
                                <PhoneCall size={14} /> Call 108 / 112
                              </a>
                            )}
                          </div>
                        )}

                        {/* Vital-Signs Safety Engine Warnings */}
                        {msg.safetyWarnings && msg.safetyWarnings.length > 0 && (
                          <div className="sana-vitals-alert-box">
                            <strong>⚠️ Physiological Safety Alert:</strong>
                            <ul>
                              {msg.safetyWarnings.map((warn, wIdx) => (
                                <li key={wIdx}>{warn}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Formatted Content */}
                        {renderFormattedResult(msg.content)}
                      </div>
                    </>
                  ) : (
                    /* User Message */
                    <div className="sana-user-bubble">
                      <div>{msg.content}</div>
                      {msg.attachments && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "8px",
                          }}
                        >
                          {msg.attachments.report && (
                            <span
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                              }}
                            >
                              📄 {msg.attachments.report}
                            </span>
                          )}
                          {msg.attachments.image && (
                            <span
                              style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                              }}
                            >
                              📷 {msg.attachments.image}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="sana-user-meta">{msg.timestamp}</div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking / Analyzing Indicator */}
              {loading && (
                <div className="sana-message-row assistant">
                  <div className="sana-assistant-avatar" aria-hidden="true">
                    🩺
                  </div>
                  <div className="sana-thinking-card">
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>SANA is analyzing your symptoms with clinical safety rules...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div
            style={{
              maxWidth: "820px",
              width: "100%",
              margin: "0 auto 10px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* =====================================================
            ANCHORED CHAT COMPOSER (GEMINI REFERENCE DESIGN)
        ===================================================== */}
        <div className="sana-gemini-composer-wrapper">
          <div className="sana-gemini-composer-inner">
            {/* Optional Vitals Toggle Pill & Collapsible Drawer */}
            <div className="vitals-toggle-row">
              <button
                type="button"
                className="vitals-toggle-btn"
                onClick={() => setShowVitals(!showVitals)}
              >
                <Heart size={14} color="#E11D48" />
                <span>{showVitals ? "Hide Vitals" : "Add Vitals (Optional) — SpO₂, HR, Temp, BP"}</span>
                {showVitals ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Optional Physiological Vitals Drawer Panel */}
            {showVitals && (
              <div className="vitals-drawer-panel">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "13px", color: "#15345B" }}>
                    Physiological Vitals (Smartwatch / Home Devices)
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Optional</span>
                </div>
                <div className="vitals-drawer-grid">
                  <div className="vitals-drawer-field">
                    <label>SpO₂ Oxygen</label>
                    <div className="vitals-drawer-input-row">
                      <input
                        type="number"
                        placeholder="98"
                        name="spo2"
                        value={vitals.spo2}
                        onChange={handleVitalChange}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="vitals-drawer-field">
                    <label>Heart Rate</label>
                    <div className="vitals-drawer-input-row">
                      <input
                        type="number"
                        placeholder="72"
                        name="heart_rate"
                        value={vitals.heart_rate}
                        onChange={handleVitalChange}
                      />
                      <span>BPM</span>
                    </div>
                  </div>

                  <div className="vitals-drawer-field">
                    <label>Temperature</label>
                    <div className="vitals-drawer-input-row">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        name="temperature"
                        value={vitals.temperature}
                        onChange={handleVitalChange}
                      />
                      <span>°F</span>
                    </div>
                  </div>

                  <div className="vitals-drawer-field">
                    <label>Blood Pressure</label>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <div className="vitals-drawer-input-row" style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="120"
                          name="systolic_bp"
                          value={vitals.systolic_bp}
                          onChange={handleVitalChange}
                        />
                        <span>Sys</span>
                      </div>
                      <div className="vitals-drawer-input-row" style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="80"
                          name="diastolic_bp"
                          value={vitals.diastolic_bp}
                          onChange={handleVitalChange}
                        />
                        <span>Dia</span>
                      </div>
                    </div>
                  </div>

                  <div className="vitals-drawer-field">
                    <label>Patient Age</label>
                    <div className="vitals-drawer-input-row">
                      <input
                        type="number"
                        placeholder="32"
                        name="age"
                        value={vitals.age}
                        onChange={handleVitalChange}
                      />
                      <span>Yrs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Rounded Gemini Composer Box */}
            <form onSubmit={handleSubmit} className="sana-gemini-composer-box">
              {/* Active Attachments Tray */}
              {(imageAttachment || reportAttachment) && (
                <div className="composer-attachments-tray">
                  {reportAttachment && (
                    <span className="composer-att-chip">
                      <FileText size={14} />
                      <span>{reportAttachment.name}</span>
                      <button type="button" onClick={() => setReportAttachment(null)}>
                        ×
                      </button>
                    </span>
                  )}
                  {imageAttachment && (
                    <span className="composer-att-chip">
                      <Camera size={14} />
                      <span>{imageAttachment.name}</span>
                      <button type="button" onClick={() => setImageAttachment(null)}>
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className="composer-input-row">
                {/* + Attachment Button & Dropdown */}
                <div style={{ position: "relative" }} ref={attachMenuRef}>
                  <button
                    type="button"
                    className="composer-attach-btn"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    title="Add medical attachment"
                    aria-label="Add attachment"
                  >
                    <Plus size={20} />
                  </button>

                  {showAttachMenu && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "44px",
                        left: "0",
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                        padding: "6px",
                        width: "240px",
                        zIndex: 40,
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachMenu(false);
                          fileInputRef.current?.click();
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          borderRadius: "8px",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#1E293B",
                          fontSize: "13.5px",
                          fontWeight: "600",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <FileText size={18} color="#2563EB" />
                        <div>
                          <div>Upload Lab Report</div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>PDF, TXT, DOCX</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachMenu(false);
                          photoInputRef.current?.click();
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          borderRadius: "8px",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#1E293B",
                          fontSize: "13.5px",
                          fontWeight: "600",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Camera size={18} color="#2563EB" />
                        <div>
                          <div>Photo of Symptom</div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>Rash, wound, swelling</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiline Composer Textarea */}
                <textarea
                  ref={textareaRef}
                  id="symptoms-input"
                  className="composer-textarea"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!loading && (symptoms.trim() || imageAttachment || reportAttachment)) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  placeholder="Ask SANA or describe how you feel... (e.g. My head hurts and I feel dizzy)"
                  rows={1}
                  disabled={loading}
                />

                {/* Composer Right Controls: Model Pill, Microphone, Send */}
                <div className="composer-actions-right">
                  <div className="composer-engine-pill" title="Deterministic clinical triage safety engine active">
                    <ShieldCheck size={13} color="#16A34A" />
                    <span>Clinical Engine</span>
                  </div>

                  {/* Dictation / Voice Button */}
                  <button
                    type="button"
                    className={`composer-mic-btn ${isListening ? "listening" : ""}`}
                    onClick={toggleDictation}
                    title={isListening ? "Stop listening" : "Speak your symptoms"}
                    aria-label="Dictate symptoms"
                  >
                    <Mic size={18} />
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="composer-send-btn"
                    disabled={loading || (!symptoms.trim() && !imageAttachment && !reportAttachment)}
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* =====================================================
          CONTINUOUS TWO-WAY SANA VOICE STUDIO MODAL
          Protected with Error Boundary against runtime crashes
      ===================================================== */}
      <ErrorBoundary context="voice" onClose={() => setIsVoiceStudioOpen(false)}>
        <SanaVoiceInterface
          isOpen={isVoiceStudioOpen}
          onClose={() => setIsVoiceStudioOpen(false)}
          userName={user?.full_name || "Patient"}
          initialLanguage={selectedLanguage}
          initialVitals={vitals}
          onVitalsUpdated={(updated) => setVitals((prev) => ({ ...prev, ...updated }))}
        />
      </ErrorBoundary>

      {/* =====================================================
          ASSESSMENT HISTORY MODAL
      ===================================================== */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Triage History</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {historyLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                  Loading your past assessments...
                </div>
              ) : historyRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                  No previous triage assessments found.
                </div>
              ) : (
                historyRecords.map((item) => (
                  <div key={item.id} className="history-card-item">
                    <div className="history-card-top">
                      <strong>Patient: {item.patient_name || user?.full_name || "Self"}</strong>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>

                    <div className="history-card-symptoms">
                      <strong>Symptoms:</strong> {item.symptoms}
                    </div>

                    <div style={{ marginTop: "8px" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}
                        onClick={() =>
                          setExpandedHistoryId(
                            expandedHistoryId === item.id ? null : item.id
                          )
                        }
                      >
                        {expandedHistoryId === item.id ? "Hide Assessment ▲" : "View Full Assessment ▼"}
                      </button>
                    </div>

                    {expandedHistoryId === item.id && (
                      <div className="history-card-preview" style={{ marginTop: "10px" }}>
                        {renderFormattedResult(item.triage_result)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}