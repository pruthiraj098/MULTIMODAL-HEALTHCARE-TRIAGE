import { useState, useEffect, useRef } from "react";
import SanaAgent from "./components/SanaAgent";
import { API_URL } from "./config";

function TriagePage({ goTo }) {
  // 1. Collapsible/Optional Vital Signs Card (Default to collapsed)
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
      id: "welcome-msg",
      role: "assistant",
      content: "Hello! I am SANA, how are you feeling?",
      statusBanner: null,
      safetyWarnings: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Multimodal states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imageAttachment, setImageAttachment] = useState(null); // { name, dataUrl }
  const [reportAttachment, setReportAttachment] = useState(null); // { name, data }

  // History modal states
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
  const user = JSON.parse(localStorage.getItem("healthtriage_user") || "null");

  // Layman-friendly quick prompts
  const quickPrompts = [
    "Feeling dizzy",
    "Fever & body aches",
    "Skin rash",
    "Stomach pain",
  ];

  useEffect(() => {
    if (!token) {
      goTo("/login");
    }
  }, [token]);

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

  // Initialize Speech Recognition if supported
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
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please type your symptoms.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
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

  const selectQuickPrompt = (prompt) => {
    setSymptoms(prompt);
    textareaRef.current?.focus();
  };

  // Determine Intuitive Color-Coded Triage Output Banner
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
        subtext: "Immediate emergency medical care (ER or call 911 / 112) is recommended.",
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
        subtext: "Schedule an urgent care appointment or consult a doctor within 24–48 hours.",
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
        subtext: "Manageable with supportive home comfort steps and gentle monitoring.",
        colorClass: "banner-green",
      };
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const currentSymptoms = symptoms.trim();
    if (!currentSymptoms && !imageAttachment && !reportAttachment) {
      return;
    }

    if (!token) {
      goTo("/login");
      return;
    }

    // Add user message to conversation thread
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
        age: vitals.age ? parseInt(vitals.age) : null,
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

      // Reset attachments after sending
      setImageAttachment(null);
      setReportAttachment(null);
    } catch (err) {
      console.error("Triage error:", err);
      setError(err.message || "Failed to generate triage response. Please try again.");

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ I encountered an issue while analyzing your symptoms: ${err.message || "Service unavailable."}\n\nPlease try again or seek direct medical attention if experiencing severe distress.`,
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
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/login");
  };

  // Helper to format Markdown headers and sections inside AI response
  const renderFormattedResult = (content) => {
    if (!content) return null;

    const lines = content.split("\n");
    return (
      <div className="triage-text-body">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("### ")) {
            return (
              <div key={idx} className="triage-section-header">
                {trimmed.replace("### ", "")}
              </div>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <div key={idx} className="triage-section-header" style={{ fontSize: "18px" }}>
                {trimmed.replace("## ", "")}
              </div>
            );
          }
          if (trimmed.startsWith("- ")) {
            return (
              <div key={idx} className="triage-bullet-point">
                <span className="bullet-dot">•</span>
                <span>{trimmed.replace("- ", "")}</span>
              </div>
            );
          }
          if (trimmed === "") {
            return <div key={idx} style={{ height: "8px" }} />;
          }
          return <div key={idx} className="triage-body-line">{line}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="triage-page">
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
          ACTION BAR & HISTORY
      ===================================================== */}
      <div className="triage-action-bar-strip">
        <div className="action-bar-left">
          <span className="sana-session-pill">
            <span className="live-dot" /> SANA Multimodal Consultation Active
          </span>
        </div>
        <div className="action-bar-right">
          <button
            type="button"
            className="triage-history-button"
            onClick={fetchTriageHistory}
          >
            📋 Assessment History
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="triage-main">
        {/* Dedicated SANA AI Healthcare Voice Agent */}
        <SanaAgent
          userName={user?.full_name || "Patient"}
          currentVitals={vitals}
          onVitalsUpdated={(updated) => setVitals((prev) => ({ ...prev, ...updated }))}
        />

        {/* ===================================================
            CONVERSATION / CHAT THREAD
        =================================================== */}
        <section className="triage-chat-container">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-wrapper ${msg.role}`}
            >
              {msg.role === "assistant" && (
                <div className="chat-avatar assistant">🩺</div>
              )}

              <div className={`chat-bubble ${msg.role}`}>
                {msg.role === "assistant" ? (
                  <div className="assessment-container">
                    {/* 4. CLEAR COLOR-CODED STATUS BANNER */}
                    {msg.statusBanner && (
                      <div className={`intuitive-status-banner ${msg.statusBanner.colorClass}`}>
                        <div className="banner-left">
                          <span className="banner-icon">{msg.statusBanner.icon}</span>
                          <div>
                            <strong className="banner-title">{msg.statusBanner.title}</strong>
                            <p className="banner-subtext">{msg.statusBanner.subtext}</p>
                          </div>
                        </div>

                        {msg.statusBanner.level === "emergency" && (
                          <a
                            href="tel:911"
                            className="banner-emergency-call-btn"
                            title="Call Emergency Services immediately"
                          >
                            Call 911 / 112
                          </a>
                        )}
                      </div>
                    )}

                    {/* Independent Vital Signs Safety Engine Warnings */}
                    {msg.safetyWarnings && msg.safetyWarnings.length > 0 && (
                      <div className="safety-warning-banner">
                        <strong>⚠️ Vital-Sign Safety Alert:</strong>
                        <ul>
                          {msg.safetyWarnings.map((warn, wIdx) => (
                            <li key={wIdx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {renderFormattedResult(msg.content)}
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0 }}>{msg.content}</p>
                    {msg.attachments && (
                      <div className="message-attachments">
                        {msg.attachments.report && (
                          <span className="attachment-chip">
                            📄 {msg.attachments.report}
                          </span>
                        )}
                        {msg.attachments.image && (
                          <span className="attachment-chip">
                            📷 {msg.attachments.image}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "11px",
                    color: msg.role === "user" ? "rgba(255,255,255,0.8)" : "#94a3b8",
                    marginTop: "8px",
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking / Evaluating Animation */}
          {loading && (
            <div className="chat-bubble-wrapper assistant">
              <div className="chat-avatar assistant">🩺</div>
              <div className="triage-thinking-card">
                <div className="thinking-pulse">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>HealthTriage AI is thinking and analyzing your symptoms...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </section>

        {error && (
          <div className="auth-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* ===================================================
            2. LAYMAN-FRIENDLY QUICK PROMPTS (ABOVE CHAT BAR)
        =================================================== */}
        <section className="quick-prompts-bar-container">
          <span className="quick-prompts-label">Common concerns:</span>
          <div className="quick-prompts-chips">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="quick-chip-button"
                onClick={() => selectQuickPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        {/* ===================================================
            3. MULTIMODAL CHAT BAR (PROMINENT VOICE & ATTACHMENT)
        =================================================== */}
        <section className="chat-bar-card">
          <form onSubmit={handleSubmit} className="chat-bar-form">
            {/* Active Attachment Chips (Preview before send) */}
            {(imageAttachment || reportAttachment) && (
              <div className="active-attachments-tray">
                {reportAttachment && (
                  <span className="attachment-chip active-chip">
                    📄 {reportAttachment.name}
                    <button
                      type="button"
                      className="remove-att-btn"
                      onClick={() => setReportAttachment(null)}
                      title="Remove report"
                    >
                      ×
                    </button>
                  </span>
                )}
                {imageAttachment && (
                  <div className="photo-preview-chip">
                    <img
                      src={imageAttachment.dataUrl}
                      alt="Preview"
                      className="image-preview-thumb"
                    />
                    <span>{imageAttachment.name}</span>
                    <button
                      type="button"
                      className="remove-att-btn"
                      onClick={() => setImageAttachment(null)}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live voice recording feedback bar */}
            {isListening && (
              <div className="voice-listening-bar">
                <span className="voice-pulse-ring"></span>
                <span>Listening to your voice... Speak your symptoms clearly.</span>
                <button
                  type="button"
                  className="voice-stop-btn"
                  onClick={toggleSpeech}
                >
                  Done Speaking
                </button>
              </div>
            )}

            <div className="chat-bar-input-row">
              {/* + Attachment Button & Dropdown Menu */}
              <div className="attachment-menu-container" ref={attachMenuRef}>
                <button
                  type="button"
                  className={`attachment-plus-btn ${showAttachMenu ? "active" : ""}`}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  title="Attach file or photo"
                  aria-label="Add attachment"
                >
                  +
                </button>

                {showAttachMenu && (
                  <div className="attachment-dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowAttachMenu(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <span className="dropdown-menu-icon">📄</span>
                      <div>
                        <strong>Upload Medical Report</strong>
                        <small>Attach lab work, prescription or note</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowAttachMenu(false);
                        photoInputRef.current?.click();
                      }}
                    >
                      <span className="dropdown-menu-icon">📷</span>
                      <div>
                        <strong>Take Photo of Rash/Symptom</strong>
                        <small>Attach skin rash, eye, or wound image</small>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Textarea for symptoms */}
              <textarea
                ref={textareaRef}
                id="symptoms-input"
                className="chat-bar-textarea"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && (symptoms.trim() || imageAttachment || reportAttachment)) {
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder="Describe what you are feeling in simple words... (e.g. My head hurts and I feel sick)"
                rows="2"
                disabled={loading}
              />

              <div className="chat-bar-actions">
                {/* Prominent Microphone with Active Tooltip */}
                <div className="mic-button-wrapper">
                  <button
                    type="button"
                    className={`mic-tool-btn ${isListening ? "listening" : ""}`}
                    onClick={toggleSpeech}
                    title="Tap to speak your symptoms"
                    aria-label="Tap to speak your symptoms"
                  >
                    🎙️
                  </button>
                  <span className="mic-tooltip-bubble">
                    Tap to speak your symptoms
                  </span>
                </div>

                {/* Large Clear Send Button */}
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={loading || (!symptoms.trim() && !imageAttachment && !reportAttachment)}
                  title="Send message"
                  aria-label="Send symptoms"
                >
                  {loading ? "..." : "➤"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* ===================================================
            OPTIONAL VITAL SIGNS (BELOW CHAT)
        =================================================== */}
        <section className="vitals-card" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="vitals-header"
            onClick={() => setShowVitals(!showVitals)}
            aria-expanded={showVitals}
          >
            <div className="vitals-title-section">
              <div className="vitals-icon">♥</div>
              <div>
                <div className="vitals-title-row">
                  <h3>Vital Signs (Optional)</h3>
                  <span className="optional-pill-badge">Optional</span>
                </div>
                <p className="vitals-subtitle">
                  From smartwatch, thermometer, or pulse oximeter
                </p>
              </div>
            </div>

            <div className="vitals-toggle-action">
              <span className="vitals-toggle-text">
                {showVitals ? "Hide Vitals" : "Add Vitals (Optional)"}
              </span>
              <span className={`vitals-arrow ${showVitals ? "open" : ""}`}>
                ▼
              </span>
            </div>
          </button>

          {showVitals && (
            <div className="vitals-content">
              <div className="vital-field">
                <label>Age (Optional)</label>
                <div className="vital-input-wrapper">
                  <input
                    type="number"
                    name="age"
                    placeholder="e.g. 32"
                    value={vitals.age}
                    onChange={handleVitalChange}
                  />
                  <span>Yrs</span>
                </div>
                <small className="vital-helper-text">Patient age in years</small>
              </div>

              <div className="vital-field">
                <label>Heart Rate</label>
                <div className="vital-input-wrapper">
                  <input
                    type="number"
                    name="heart_rate"
                    placeholder="72"
                    value={vitals.heart_rate}
                    onChange={handleVitalChange}
                  />
                  <span>BPM</span>
                </div>
                <small className="vital-helper-text">From smartwatch or pulse oximeter</small>
              </div>

              <div className="vital-field">
                <label>SpO₂ (Oxygen)</label>
                <div className="vital-input-wrapper">
                  <input
                    type="number"
                    name="spo2"
                    placeholder="98"
                    value={vitals.spo2}
                    onChange={handleVitalChange}
                  />
                  <span>%</span>
                </div>
                <small className="vital-helper-text">From pulse oximeter</small>
              </div>

              <div className="vital-field">
                <label>Temperature</label>
                <div className="vital-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="98.6"
                    value={vitals.temperature}
                    onChange={handleVitalChange}
                  />
                  <span>°F/°C</span>
                </div>
                <small className="vital-helper-text">From oral or forehead thermometer</small>
              </div>

              <div className="vital-field">
                <label>Breathing Rate</label>
                <div className="vital-input-wrapper">
                  <input
                    type="number"
                    name="respiratory_rate"
                    placeholder="16"
                    value={vitals.respiratory_rate}
                    onChange={handleVitalChange}
                  />
                  <span>/min</span>
                </div>
                <small className="vital-helper-text">Breaths per minute</small>
              </div>

              <div className="vital-field">
                <label>Blood Pressure</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div className="vital-input-wrapper" style={{ flex: 1 }}>
                    <input
                      type="number"
                      name="systolic_bp"
                      placeholder="120"
                      value={vitals.systolic_bp}
                      onChange={handleVitalChange}
                    />
                    <span>Sys</span>
                  </div>
                  <div className="vital-input-wrapper" style={{ flex: 1 }}>
                    <input
                      type="number"
                      name="diastolic_bp"
                      placeholder="80"
                      value={vitals.diastolic_bp}
                      onChange={handleVitalChange}
                    />
                    <span>Dia</span>
                  </div>
                </div>
                <small className="vital-helper-text">From home BP cuff (optional)</small>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          HISTORY MODAL
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
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  Loading your past assessments...
                </div>
              ) : historyRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
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

export default TriagePage;