// ============================================================
// HealthTriage AI - SANA Voice Interface Component
// Complete Two-Way Continuous Conversational Healthcare Voice Studio
// State Machine:
// IDLE -> ACTIVATING -> LISTENING -> FINALIZING_TRANSCRIPT -> READY_TO_RESPOND -> THINKING -> SPEAKING -> READY / LISTENING
// Listens until patient finishes; supports natural pauses, manual "Done Speaking",
// symptom corrections, and robust multi-language audio synthesis.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import SanaOrb from "./SanaOrb";
import SanaLanguageSelector from "./SanaLanguageSelector";
import SanaTranscript from "./SanaTranscript";
import sanaVoiceService from "../services/sanaVoiceService";
import { API_URL } from "../config";

const WELCOME_GREETINGS = {
  en: "Hello! I am SANA, how are you feeling today?",
  hi: "नमस्ते! मैं साना (SANA) हूँ। आज आप कैसा महसूस कर रहे हैं?",
  or: "ନମସ୍କାର! ମୁଁ ସାନା (SANA)। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି କୁହନ୍ତୁ?",
  bn: "নমস্কার! আমি সানা (SANA)। আজ আপনি কেমন অনুভব করছেন বলুন?",
  te: "నమస్కారం! నేను సానా (SANA)। ఈరోజు మీరు ఎలా ఉన్నారు?",
  ta: "வணக்கம்! நான் சானா (SANA)। இன்று நீங்கள் எவ்வாறு உணர்கிறீர்கள்?",
};

export default function SanaVoiceInterface({
  isOpen = false,
  onClose = () => {},
  initialMessage = "",
  initialLanguage = "en",
  initialVitals = {},
  initialImage = null,
  initialReport = null,
  onVitalsUpdated = () => {},
  userName = "Patient",
  autoStartSession = true,
}) {
  // Conversational Session State: persistent until user explicitly clicks Stop
  const [sessionActive, setSessionActive] = useState(false);
  const sessionActiveRef = useRef(false);

  // SANA States:
  // 'idle' | 'activating' | 'listening' | 'finalizing_transcript' | 'ready_to_respond' | 'thinking' | 'speaking' | 'emergency'
  const [sanaState, setSanaState] = useState("idle");
  const sanaStateRef = useRef("idle");
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || "en");

  // Keep selectedLanguage synchronized if initialLanguage prop changes
  useEffect(() => {
    if (initialLanguage) {
      setSelectedLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  // Submission lock mutex to prevent duplicate AI queries
  const isSubmittingRef = useRef(false);

  // Keep state ref synchronized for callbacks
  useEffect(() => {
    sanaStateRef.current = sanaState;
  }, [sanaState]);

  // Dialogue transcript
  const [messages, setMessages] = useState([
    {
      id: "sana-greeting-initial",
      role: "assistant",
      spokenResponse:
        WELCOME_GREETINGS[initialLanguage] || WELCOME_GREETINGS.en,
      content:
        WELCOME_GREETINGS[initialLanguage] || WELCOME_GREETINGS.en,
      triageLevel: "SELF_CARE",
      triageBadge: {
        icon: "❤️",
        title: "SANA Ready",
        subtext: "Continuous voice & clinical assessment ready",
      },
      screenSummary: "SANA is ready to listen to your symptoms in English, Hindi, Odia, Bengali, Telugu, or Tamil.",
      recommendedNextSteps: [
        "Speak your symptoms naturally at your own pace.",
        "SANA listens across natural pauses and will not interrupt until you finish or press Done Speaking.",
      ],
      safetyDisclaimer:
        "I am an AI triage assistant, not your treating doctor. If you experience severe pain, difficulty breathing, or sudden numbness, seek emergency care immediately.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Live Speech State tracking
  const [liveTranscript, setLiveTranscript] = useState("");
  const liveTranscriptRef = useRef("");
  const [typedMessage, setTypedMessage] = useState(initialMessage || "");
  const [errorMessage, setErrorMessage] = useState("");

  // Multimodal attachments & optional vitals
  const [activeImage, setActiveImage] = useState(initialImage);
  const [activeReport, setActiveReport] = useState(initialReport);
  const [vitals, setVitals] = useState(initialVitals || {});
  const [showVitalsDrawer, setShowVitalsDrawer] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Attempt to resolve browser GPS for emergency trauma routing
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { timeout: 7000, maximumAge: 60000 }
      );
    }
  }, []);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const restartTimerRef = useRef(null);

  // Auto-scroll transcript on updates
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript, sanaState]);

  // Forward refs for internal turn coordination
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const selectedLanguageRef = useRef(selectedLanguage);
  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  const vitalsRef = useRef(vitals);
  useEffect(() => {
    vitalsRef.current = vitals;
  }, [vitals]);

  // ============================================================
  // STOP SANA SESSION (User Explicit Action)
  // ============================================================
  const stopSanaSession = useCallback(() => {
    sessionActiveRef.current = false;
    isSubmittingRef.current = false;
    setSessionActive(false);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    sanaVoiceService.stopAll();
    setSanaState("idle");
    setLiveTranscript("");
    liveTranscriptRef.current = "";
  }, []);

  // Clean shutdown when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSanaSession();
    }
  }, [isOpen, stopSanaSession]);

  // ============================================================
  // SUBMIT TURN TO SANA BACKEND
  // ============================================================
  const submitTurnToSana = async (userText) => {
    const cleanInput = (userText || "").trim();
    if (!cleanInput && !activeImage && !activeReport) {
      setSanaState("idle");
      isSubmittingRef.current = false;
      return;
    }

    // Atomic submission lock to prevent duplicate queries
    if (isSubmittingRef.current) {
      console.log("[SANA Voice] Submission already in flight, ignoring duplicate call.");
      return;
    }
    isSubmittingRef.current = true;

    // Transition State: FINALIZING_TRANSCRIPT -> READY_TO_RESPOND -> THINKING
    setSanaState("thinking");
    sanaVoiceService.stopSpeaking();

    const userMsgId = `user-${Date.now()}`;

    // Add user turn to dialogue history
    const userTurn = {
      id: userMsgId,
      role: "user",
      spokenResponse: cleanInput || "Patient provided clinical attachments.",
      content: cleanInput || "Patient provided clinical attachments.",
      attachments: {
        image: activeImage ? activeImage.name : null,
        report: activeReport ? activeReport.name : null,
      },
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextConversation = [...messagesRef.current, userTurn];
    setMessages(nextConversation);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    setTypedMessage("");
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        user_message: cleanInput || "Patient uploaded clinical files.",
        conversation: nextConversation.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.spokenResponse || m.content || "",
        })),
        language: selectedLanguageRef.current,
        vitals: vitalsRef.current,
        image_data: activeImage?.dataUrl || null,
        report_data: activeReport?.data || null,
        generate_audio: true,
        patient_name: userName || "Patient",
        user_lat: userLocation?.lat || null,
        user_lng: userLocation?.lng || null,
        patient_age: vitalsRef.current?.age ? parseInt(vitalsRef.current.age, 10) : null,
      };

      const response = await fetch(`${API_URL}/api/sana/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "SANA service unavailable.");
      }

      // Update extracted vitals in state if any detected
      if (data.updated_vitals) {
        setVitals(data.updated_vitals);
        onVitalsUpdated(data.updated_vitals);
      }

      const sanaTurn = {
        id: `sana-${Date.now()}`,
        role: "assistant",
        spokenResponse: data.spoken_response,
        content: data.spoken_response,
        triageLevel: data.triage_level,
        triageBadge: data.triage_badge,
        isEmergency: data.is_emergency,
        screenSummary: data.screen_summary,
        keyObservations: data.key_observations || [],
        recommendedNextSteps: data.recommended_next_steps || [],
        followUpQuestion: data.follow_up_question || "",
        safetyDisclaimer: data.safety_disclaimer || "",
        safetyWarnings: data.safety_warnings || [],
        audioBase64: data.audio_base64,
        nearestEmergencyFacility: data.nearest_emergency_facility || null,
        emergencyContacts: data.emergency_contacts || [],
        selfCareGuidance: data.self_care_guidance || null,
        medicationCautions: data.medication_cautions || [],
        patientProfileApplied: Boolean(data.patient_profile_applied),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, sanaTurn]);

      // Emergency status detection
      if (data.is_emergency) {
        setSanaState("emergency");
      } else {
        setSanaState("speaking");
      }

      // Clear one-time attachments after sending
      setActiveImage(null);
      setActiveReport(null);

      // Release submission mutex once response turn is fully in state
      isSubmittingRef.current = false;

      // Play SANA spoken response
      if (data.spoken_response) {
        sanaVoiceService.speak({
          text: data.spoken_response,
          audioBase64: data.audio_base64,
          lang: data.language || selectedLanguageRef.current,
          onStart: () => {
            if (!data.is_emergency) setSanaState("speaking");
          },
          // CRITICAL PERSISTENT CONVERSATION RULE:
          // After SANA finishes speaking, automatically return to LISTENING if session is active!
          onEnd: () => {
            if (sessionActiveRef.current) {
              // Brief pause before listening resumes to prevent mic hearing tail audio
              restartTimerRef.current = setTimeout(() => {
                if (sessionActiveRef.current) {
                  startListeningTurn();
                }
              }, 400);
            } else {
              setSanaState("idle");
            }
          },
          onError: () => {
            if (sessionActiveRef.current) {
              restartTimerRef.current = setTimeout(() => {
                if (sessionActiveRef.current) {
                  startListeningTurn();
                }
              }, 400);
            } else {
              setSanaState("idle");
            }
          },
        });
      } else {
        // No spoken response: return directly to listening if session is active
        if (sessionActiveRef.current) {
          startListeningTurn();
        } else {
          setSanaState("idle");
        }
      }
    } catch (err) {
      console.error("[SANA Voice Interface] Error:", err);
      isSubmittingRef.current = false;
      setErrorMessage(
        "I'm having trouble connecting right now. Please try speaking again or type below."
      );

      // Keep session alive and allow user to retry
      if (sessionActiveRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (sessionActiveRef.current) {
            startListeningTurn();
          }
        }, 1200);
      } else {
        setSanaState("idle");
      }
    }
  };

  // ============================================================
  // START LISTENING TURN (Accurate Multi-Phrase State Machine)
  // ============================================================
  const startListeningTurn = useCallback(() => {
    if (!sessionActiveRef.current) {
      setSanaState("idle");
      return;
    }

    // Stop speaking immediately before listening to avoid audio feedback
    sanaVoiceService.stopSpeaking();
    setSanaState("listening");
    setErrorMessage("");
    setLiveTranscript("");
    liveTranscriptRef.current = "";

    sanaVoiceService.startListening({
      lang: selectedLanguageRef.current,
      silenceThresholdMs: 2600, // Configurable silence threshold (2.6 seconds)
      onStart: () => {
        if (!sessionActiveRef.current) {
          sanaVoiceService.stopListening();
          setSanaState("idle");
          return;
        }
        setSanaState("listening");
      },
      onInterim: ({ fullLiveTranscript }) => {
        if (!sessionActiveRef.current) return;
        setLiveTranscript(fullLiveTranscript);
        liveTranscriptRef.current = fullLiveTranscript;
      },
      onTurnComplete: (completeUtterance, triggerReason) => {
        if (!sessionActiveRef.current) return;
        console.log(`[SANA Voice] Turn complete (reason=${triggerReason}): "${completeUtterance}"`);

        setSanaState("finalizing_transcript");
        setLiveTranscript(completeUtterance);
        liveTranscriptRef.current = completeUtterance;

        // Transition through state machine: FINALIZING_TRANSCRIPT -> READY_TO_RESPOND -> submit
        setTimeout(() => {
          if (sessionActiveRef.current && !isSubmittingRef.current) {
            setSanaState("ready_to_respond");
            submitTurnToSana(completeUtterance);
          }
        }, 180);
      },
      onEnd: () => {
        // If turn ended without user speech while session is still active, safely stay ready
        if (sessionActiveRef.current && sanaStateRef.current === "listening" && !isSubmittingRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (sessionActiveRef.current && sanaStateRef.current === "listening") {
              startListeningTurn();
            }
          }, 350);
        }
      },
      onError: (errObj) => {
        const { message, errorType, isFatal } =
          typeof errObj === "string"
            ? { message: errObj, errorType: "error", isFatal: false }
            : errObj;

        if (errorType === "no-speech") {
          // Patient took a quiet pause; safely restart listening if session is still active
          if (sessionActiveRef.current && sanaStateRef.current === "listening" && !isSubmittingRef.current) {
            restartTimerRef.current = setTimeout(() => {
              if (sessionActiveRef.current && sanaStateRef.current === "listening") {
                startListeningTurn();
              }
            }, 300);
            return;
          }
        }

        if (isFatal) {
          setErrorMessage(message);
          stopSanaSession();
          return;
        }

        if (errorType !== "aborted" && errorType !== "no-speech") {
          setErrorMessage(message);
        }
      },
    });
  }, [stopSanaSession]);

  // ============================================================
  // USER EXPLICIT "DONE SPEAKING" ACTION
  // ============================================================
  const handleDoneSpeaking = () => {
    if (sanaStateRef.current === "listening") {
      setSanaState("finalizing_transcript");
      // Trigger voice service immediate finalization
      sanaVoiceService.finalizeTurnNow();
    }
  };

  // ============================================================
  // START SANA CONVERSATIONAL SESSION
  // ============================================================
  const startSanaSession = useCallback(() => {
    sessionActiveRef.current = true;
    isSubmittingRef.current = false;
    setSessionActive(true);
    setSanaState("activating");
    setErrorMessage("");

    setTimeout(() => {
      if (sessionActiveRef.current) {
        startListeningTurn();
      }
    }, 150);
  }, [startListeningTurn]);

  // Auto-launch continuous session when opened if requested
  useEffect(() => {
    if (isOpen && autoStartSession && !sessionActiveRef.current) {
      startSanaSession();
    }
  }, [isOpen, autoStartSession, startSanaSession]);

  // Primary Action Button Toggle (Start / Stop)
  const handlePrimaryAction = () => {
    if (sanaState === "speaking") {
      // Barge-in: user interrupted SANA speaking
      sanaVoiceService.stopSpeaking();
      startListeningTurn();
      return;
    }

    if (sanaState === "listening" && liveTranscript.trim()) {
      // If user taps orb while speaking, submit current turn
      handleDoneSpeaking();
      return;
    }

    if (sessionActiveRef.current) {
      stopSanaSession();
    } else {
      startSanaSession();
    }
  };

  // Replay a previous assistant turn audio
  const handleReplayAudio = (text, audioBase64) => {
    sanaVoiceService.stopListening();
    setSanaState("speaking");
    sanaVoiceService.speak({
      text,
      audioBase64,
      lang: selectedLanguageRef.current,
      onStart: () => setSanaState("speaking"),
      onEnd: () => {
        if (sessionActiveRef.current) {
          startListeningTurn();
        } else {
          setSanaState("idle");
        }
      },
    });
  };

  // Handle image upload
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setActiveImage({
        name: file.name,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle report upload
  const handleReportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setActiveReport({
        name: file.name,
        data: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="sana-voice-modal-backdrop" onClick={stopSanaSession}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handleImageFile}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleReportFile}
        accept=".pdf,.txt,.doc,.docx"
        style={{ display: "none" }}
      />

      <div
        className={`sana-voice-studio-card ${
          sanaState === "emergency" ? "emergency-mode" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================
            HEADER: Brand, Live Mic State, Language, Close
        =================================================== */}
        <header className="sana-studio-header">
          <div className="sana-header-identity">
            <div className="sana-header-badge">
              <span className="heart-dot">❤️</span>
              <div>
                <strong>SANA</strong>
                <small>Smart AI Nursing & Assessment</small>
              </div>
            </div>

            {/* Live Session & Microphone Indicator */}
            <div
              className={`mic-live-indicator ${
                sessionActive && (sanaState === "listening" || sanaState === "finalizing_transcript")
                  ? "active"
                  : sessionActive
                  ? "session-live"
                  : "inactive"
              }`}
            >
              <span className="indicator-dot" />
              <span>
                {sessionActive && sanaState === "listening"
                  ? "🎙️ LISTENING (SPEAK CONTINUOUSLY)"
                  : sessionActive && sanaState === "finalizing_transcript"
                  ? "⏳ FINALIZING SPEECH..."
                  : sessionActive && sanaState === "speaking"
                  ? "🔊 SANA SPEAKING"
                  : sessionActive && sanaState === "thinking"
                  ? "🧠 ANALYZING..."
                  : sessionActive
                  ? "🟢 SESSION ACTIVE"
                  : "🔒 MICROPHONE OFF"}
              </span>
            </div>
          </div>

          <div className="sana-header-controls">
            {/* Multilingual Selector */}
            <SanaLanguageSelector
              currentLanguage={selectedLanguage}
              onLanguageChange={(newLang) => {
                setSelectedLanguage(newLang);
                setMessages((prev) => {
                  if (prev.length === 1 && prev[0].id === "sana-greeting-initial") {
                    const localizedText = WELCOME_GREETINGS[newLang] || WELCOME_GREETINGS.en;
                    return [
                      {
                        ...prev[0],
                        spokenResponse: localizedText,
                        content: localizedText,
                        audioBase64: null,
                      },
                    ];
                  }
                  return prev;
                });
                if (sessionActiveRef.current) {
                  sanaVoiceService.stopSpeaking();
                  startListeningTurn();
                }
              }}
              variant="dropdown"
            />

            <button
              type="button"
              className="sana-close-button"
              onClick={() => {
                stopSanaSession();
                onClose();
              }}
              title="Close SANA conversation"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        {/* Emergency Top Alert Banner */}
        {sanaState === "emergency" && (
          <div className="sana-emergency-top-banner">
            <span className="emergency-siren">🚨</span>
            <div className="emergency-banner-text">
              <strong>SANA ALERT: Potential Emergency Red Flag Detected</strong>
              <p>Critical symptoms or vitals identified. Immediate medical attention advised.</p>
            </div>
            <a href="tel:108" className="emergency-call-now-pill">
              Call 108 / 112
            </a>
          </div>
        )}

        {/* Compact Clinical Status & Mode Indicator Strip */}
        <div
          style={{
            padding: "8px 24px",
            background:
              sanaState === "listening"
                ? "#E8F5E9"
                : sanaState === "thinking"
                ? "#EBF3FC"
                : sanaState === "speaking"
                ? "#E6F7F6"
                : "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#15345B"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  sanaState === "listening"
                    ? "#198754"
                    : sanaState === "speaking"
                    ? "#159C98"
                    : sanaState === "thinking"
                    ? "#1769D2"
                    : "#94A3B8"
              }}
              className={sanaState === "listening" || sanaState === "speaking" ? "animate-pulse" : ""}
            />
            <span style={{ fontWeight: "700" }}>
              {sanaState === "listening" && "Listening... Speak continuously (tap Done Speaking when finished)"}
              {sanaState === "finalizing_transcript" && "Finalizing speech..."}
              {sanaState === "thinking" && "Analyzing with deterministic clinical safety rules..."}
              {sanaState === "speaking" && "SANA is speaking... (tap microphone to pause)"}
              {sanaState === "emergency" && "Clinical Alert Active"}
              {sanaState === "idle" && (sessionActive ? "Continuous session active — ready to listen" : "SANA AI Assistant Ready")}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {(sanaState === "listening" || sanaState === "finalizing_transcript") && (
              <button
                type="button"
                onClick={handleDoneSpeaking}
                style={{
                  background: "#198754",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                ✓ Done Speaking
              </button>
            )}

            {sessionActive && (
              <button
                type="button"
                onClick={stopSanaSession}
                style={{
                  background: "#F1F5F9",
                  color: "#C83D4D",
                  border: "1px solid #E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Stop SANA
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowVitalsDrawer(!showVitalsDrawer)}
              style={{
                background: showVitalsDrawer ? "#EBF3FC" : "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#1769D2",
                padding: "4px 10px",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {showVitalsDrawer ? "Hide Vitals" : "Optional Vitals"}
            </button>
          </div>
        </div>

        {/* Optional Patient Vitals Drawer */}
        {showVitalsDrawer && (
          <section className="sana-vitals-drawer" style={{ background: "#FFFFFF", borderBottom: "1px solid #E0E6ED", padding: "14px 24px" }}>
            <div className="drawer-header" style={{ marginBottom: "8px" }}>
              <strong style={{ fontSize: "13.5px", color: "#15345B" }}>Optional Physiological Vitals</strong>
              <small style={{ color: "#596579", marginLeft: "10px" }}>You can enter vitals here or speak them naturally</small>
            </div>
            <div className="drawer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
              <div className="drawer-field">
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#596579" }}>SpO₂ Oxygen</label>
                <div className="drawer-input-row" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    placeholder="98"
                    value={vitals.spo2 || ""}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                  <span style={{ fontSize: "12px", color: "#596579" }}>%</span>
                </div>
              </div>

              <div className="drawer-field">
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#596579" }}>Heart Rate</label>
                <div className="drawer-input-row" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    placeholder="72"
                    value={vitals.heart_rate || ""}
                    onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                  <span style={{ fontSize: "12px", color: "#596579" }}>BPM</span>
                </div>
              </div>

              <div className="drawer-field">
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#596579" }}>Temperature</label>
                <div className="drawer-input-row" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitals.temperature || ""}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                  <span style={{ fontSize: "12px", color: "#596579" }}>°F</span>
                </div>
              </div>

              <div className="drawer-field">
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#596579" }}>Blood Pressure</label>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="120"
                    value={vitals.systolic_bp || ""}
                    onChange={(e) => setVitals({ ...vitals, systolic_bp: e.target.value })}
                    style={{ width: "60px", padding: "6px 6px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                  <span style={{ color: "#596579" }}>/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitals.diastolic_bp || ""}
                    onChange={(e) => setVitals({ ...vitals, diastolic_bp: e.target.value })}
                    style={{ width: "60px", padding: "6px 6px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Active Multimodal Attachment Chips */}
        {(activeImage || activeReport) && (
          <div className="sana-active-attachments-tray" style={{ padding: "8px 24px", background: "#F5F7FA", borderBottom: "1px solid #E0E6ED" }}>
            {activeImage && (
              <span className="sana-att-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#EBF3FC", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", color: "#1769D2" }}>
                📷 {activeImage.name}
                <button type="button" onClick={() => setActiveImage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1769D2" }}>×</button>
              </span>
            )}
            {activeReport && (
              <span className="sana-att-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#EBF3FC", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", color: "#1769D2", marginLeft: "8px" }}>
                📄 {activeReport.name}
                <button type="button" onClick={() => setActiveReport(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1769D2" }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="sana-studio-error" style={{ padding: "8px 24px", background: "#FEF7EA", color: "#C78116", borderBottom: "1px solid #F59E0B", fontSize: "13px", fontWeight: "600" }}>
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* ===================================================
            LIVE CONVERSATION TRANSCRIPT VIEWPORT (SPACIOUS GEMINI-STYLE FEED)
        =================================================== */}
        <section
          className="sana-transcript-viewport"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "#FFFFFF",
            minHeight: "360px"
          }}
        >
          {/* Gemini-Inspired Empty State Prompt & Suggestion Chips */}
          {messages.length <= 1 && (
            <div style={{ textAlign: "center", margin: "20px auto 30px", maxWidth: "600px" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#15345B", marginBottom: "8px" }}>
                Where should we start?
              </div>
              <p style={{ fontSize: "15px", color: "#596579", lineHeight: 1.5, marginBottom: "24px" }}>
                Tell me what is concerning you, and I'll help you explore symptoms and understand the next clinical steps.
              </p>

              {/* 4 Clickable Suggestion Chips (Gemini Reference Style) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", textAlign: "left" }}>
                {[
                  "I have a persistent dry cough and mild fever for 2 days",
                  "Help me understand my latest blood test report",
                  "What are the common signs of elevated blood pressure?",
                  "Check potential drug interactions for my medications"
                ].map((chipText, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => {
                      setTypedMessage(chipText);
                      submitTurnToSana(chipText);
                    }}
                    style={{
                      background: "#F5F7FA",
                      border: "1px solid #E0E6ED",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      fontSize: "13.5px",
                      color: "#15345B",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#1769D2";
                      e.currentTarget.style.background = "#EBF3FC";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E0E6ED";
                      e.currentTarget.style.background = "#F5F7FA";
                    }}
                  >
                    ✦ {chipText}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SanaTranscript
            messages={messages}
            interimTranscript={liveTranscript}
            isListening={sanaState === "listening"}
            isFinalizing={sanaState === "finalizing_transcript"}
            isThinking={sanaState === "thinking"}
            onReplayAudio={handleReplayAudio}
            scrollRef={scrollRef}
          />
        </section>

        {/* ===================================================
            FOOTER COMPOSER: GEMINI REFERENCE INSPIRED CLEAN PROMPT BAR
        =================================================== */}
        <footer
          style={{
            padding: "16px 24px",
            background: "#FFFFFF",
            borderTop: "1px solid #E0E6ED"
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedMessage.trim() || activeImage || activeReport) {
                submitTurnToSana(typedMessage);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#F5F7FA",
              border: "1px solid #CBD5E1",
              borderRadius: "16px",
              padding: "6px 8px 6px 14px",
              gap: "8px"
            }}
          >
            {/* Attachment Buttons */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#596579",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Attach clinical photo"
            >
              📷
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#596579",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Upload lab report"
            >
              📄
            </button>

            {/* Input Composer Field (16px readable text) */}
            <input
              type="text"
              placeholder="Ask SANA or describe your symptoms..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              disabled={sanaState === "thinking"}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "16px",
                color: "#15345B",
                padding: "8px 4px"
              }}
            />

            {/* Practical Clearly Labeled Microphone Control Button */}
            <button
              type="button"
              onClick={handlePrimaryAction}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background:
                  sanaState === "listening"
                    ? "#198754"
                    : sanaState === "speaking"
                    ? "#159C98"
                    : "#1769D2",
                color: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(21, 52, 91, 0.15)",
                transition: "all 0.15s ease",
                flexShrink: 0
              }}
              title={sessionActive ? "Click to pause / submit speech" : "Talk with SANA (Microphone)"}
            >
              <Mic size={20} />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                sanaState === "thinking" ||
                (!typedMessage.trim() && !activeImage && !activeReport)
              }
              style={{
                background: "#15345B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                opacity:
                  sanaState === "thinking" ||
                  (!typedMessage.trim() && !activeImage && !activeReport)
                    ? 0.5
                    : 1
              }}
            >
              Send
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
