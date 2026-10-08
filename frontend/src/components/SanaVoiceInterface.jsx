// ============================================================
// HealthTriage AI - SANA Voice Interface Component
// Complete Two-Way Continuous Conversational Healthcare Voice Studio
// State Flow: IDLE -> ACTIVATING -> LISTENING -> THINKING -> SPEAKING -> LISTENING...
// Loops automatically until user explicitly presses "Stop SANA"
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import SanaOrb from "./SanaOrb";
import SanaLanguageSelector from "./SanaLanguageSelector";
import SanaTranscript from "./SanaTranscript";
import sanaVoiceService from "../services/sanaVoiceService";
import { API_URL } from "../config";

export default function SanaVoiceInterface({
  isOpen = false,
  onClose = () => {},
  initialMessage = "",
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

  // SANA States: 'idle' | 'activating' | 'listening' | 'thinking' | 'speaking' | 'emergency'
  const [sanaState, setSanaState] = useState("idle");
  const sanaStateRef = useRef("idle");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Keep state ref synchronized for callbacks
  useEffect(() => {
    sanaStateRef.current = sanaState;
  }, [sanaState]);

  // Silence retry tracker to prevent infinite loops if microphone is disconnected
  const silenceRetriesRef = useRef(0);
  const MAX_SILENCE_RETRIES = 6;

  // Dialogue transcript
  const [messages, setMessages] = useState([
    {
      id: "sana-greeting-initial",
      role: "assistant",
      spokenResponse:
        "Hello! I am SANA, how are you feeling?",
      content:
        "Hello! I am SANA, how are you feeling?",
      triageLevel: "SELF_CARE",
      triageBadge: {
        icon: "❤️",
        title: "SANA Ready",
        subtext: "Continuous voice & clinical assessment ready",
      },
      screenSummary: "SANA is ready to listen to your symptoms in English, Hindi, Odia, or Bengali.",
      recommendedNextSteps: [
        "Tap 'Talk to SANA' to start the continuous conversation.",
        "SANA will listen, respond, and automatically listen again until you press Stop SANA.",
      ],
      safetyDisclaimer:
        "I am an AI triage assistant, not your treating doctor. If you experience severe pain, difficulty breathing, or sudden numbness, seek emergency care immediately.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [interimSpeech, setInterimSpeech] = useState("");
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
  }, [messages, interimSpeech, sanaState]);

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
    setSessionActive(false);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    sanaVoiceService.stopAll();
    setSanaState("idle");
    setInterimSpeech("");
    silenceRetriesRef.current = 0;
  }, []);

  // Clean shutdown when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSanaSession();
    }
  }, [isOpen, stopSanaSession]);

  // ============================================================
  // START LISTENING TURN (With Continuous Conversation Loop)
  // ============================================================
  const startListeningTurn = useCallback(() => {
    if (!sessionActiveRef.current) {
      setSanaState("idle");
      return;
    }

    // Stop speaking immediately before listening to prevent audio feedback
    sanaVoiceService.stopSpeaking();
    setSanaState("listening");
    setErrorMessage("");

    sanaVoiceService.startListening({
      lang: selectedLanguageRef.current,
      onStart: () => {
        if (!sessionActiveRef.current) {
          sanaVoiceService.stopListening();
          setSanaState("idle");
          return;
        }
        setSanaState("listening");
      },
      onInterim: (interim) => {
        if (!sessionActiveRef.current) return;
        setInterimSpeech(interim);
      },
      onResult: (finalText) => {
        if (!sessionActiveRef.current) return;
        setInterimSpeech("");
        silenceRetriesRef.current = 0;
        // Process user speech and advance conversation
        submitTurnToSana(finalText);
      },
      onEnd: (finalText) => {
        // If final text was received, it's already sent in onResult
        if (finalText && finalText.trim()) {
          return;
        }

        // If turn ended without user speech while session is still active
        if (sessionActiveRef.current && sanaStateRef.current === "listening") {
          silenceRetriesRef.current += 1;
          if (silenceRetriesRef.current < MAX_SILENCE_RETRIES) {
            // Restart listening seamlessly after brief 250ms silence pause
            restartTimerRef.current = setTimeout(() => {
              if (sessionActiveRef.current) {
                startListeningTurn();
              }
            }, 250);
          } else {
            // Paused after extended silence: keep session open, let user speak when ready
            setSanaState("idle");
            setInterimSpeech("");
          }
        }
      },
      onError: (errObj) => {
        const { message, errorType, isFatal } =
          typeof errObj === "string"
            ? { message: errObj, errorType: "error", isFatal: false }
            : errObj;

        if (errorType === "no-speech") {
          // Patient is pausing to think; safely restart listening if session is still active
          if (sessionActiveRef.current && sanaStateRef.current === "listening") {
            silenceRetriesRef.current += 1;
            if (silenceRetriesRef.current < MAX_SILENCE_RETRIES) {
              restartTimerRef.current = setTimeout(() => {
                if (sessionActiveRef.current) {
                  startListeningTurn();
                }
              }, 250);
              return;
            }
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
  // SUBMIT TURN TO SANA BACKEND
  // ============================================================
  const submitTurnToSana = async (userText) => {
    if (!userText.trim() && !activeImage && !activeReport) return;

    // Smart interruption: halt any ongoing speech immediately
    sanaVoiceService.stopSpeaking();

    const cleanInput = userText.trim();
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
    setInterimSpeech("");
    setTypedMessage("");
    setErrorMessage("");
    setSanaState("thinking");

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
              startListeningTurn();
            } else {
              setSanaState("idle");
            }
          },
          onError: () => {
            if (sessionActiveRef.current) {
              startListeningTurn();
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
      setErrorMessage(
        "I'm having trouble connecting right now. Please try speaking again or type below."
      );

      // Even on temporary network glitch, keep session alive and let user retry speaking
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
  // START SANA CONVERSATIONAL SESSION
  // ============================================================
  const startSanaSession = useCallback(() => {
    sessionActiveRef.current = true;
    setSessionActive(true);
    setSanaState("activating");
    setErrorMessage("");
    silenceRetriesRef.current = 0;

    // Small delay for microphone initialization UX
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
      onError: () => {
        if (sessionActiveRef.current) {
          startListeningTurn();
        } else {
          setSanaState("idle");
        }
      },
    });
  };

  // Multimodal file handlers
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
    if (file.name.endsWith(".txt") || file.type.startsWith("text/")) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="sana-modal-overlay" onClick={stopSanaSession}>
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
                sessionActive && sanaState === "listening"
                  ? "active"
                  : sessionActive
                  ? "session-live"
                  : "inactive"
              }`}
            >
              <span className="indicator-dot" />
              <span>
                {sessionActive && sanaState === "listening"
                  ? "🎙️ LISTENING (MICROPHONE ON)"
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
            {/* 4 Supported Languages */}
            <SanaLanguageSelector
              currentLanguage={selectedLanguage}
              onLanguageChange={(newLang) => {
                setSelectedLanguage(newLang);
                if (sessionActiveRef.current) {
                  sanaVoiceService.stopSpeaking();
                  startListeningTurn();
                }
              }}
              variant="pill"
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

        {/* ===================================================
            CENTER HERO: Futuristic SANA Energy Orb & Prompts
        =================================================== */}
        <section className="sana-hero-stage">
          <div className="sana-orb-anchor">
            <SanaOrb
              state={sanaState}
              size="hero"
              onClick={handlePrimaryAction}
              interactive={true}
            />
          </div>

          <div className="sana-hero-captions">
            <h3 className="sana-stage-prompt">
              {sanaState === "listening" && "Listening... Speak naturally"}
              {sanaState === "activating" && "Starting SANA..."}
              {sanaState === "thinking" && "Thinking & checking clinical safety..."}
              {sanaState === "speaking" && "SANA is speaking..."}
              {sanaState === "emergency" && "🚨 Emergency Assistance Advised"}
              {sanaState === "idle" && (sessionActive ? "Listening paused — tap to speak" : "Tap to talk with SANA")}
            </h3>

            <p className="sana-privacy-subtext">
              {sessionActive ? (
                <span>
                  🟢 Continuous session active — SANA will listen after each response. Press <strong>Stop SANA</strong> when finished.
                </span>
              ) : (
                <span>
                  🔒 Privacy First: Microphone is OFF until you tap to talk. No unauthorized background recording.
                </span>
              )}
            </p>
          </div>

          {/* Prominent Action Controls: Talk & Stop SANA */}
          <div className="sana-hero-actions">
            {!sessionActive ? (
              <button
                type="button"
                className="sana-main-talk-btn"
                onClick={startSanaSession}
              >
                <span className="mic-icon">🎙️</span>
                <span>Talk to SANA</span>
              </button>
            ) : (
              <button
                type="button"
                className="sana-stop-cancel-btn"
                onClick={stopSanaSession}
                title="Stop microphone, audio, and end conversation session"
              >
                <span className="stop-square">⏹</span>
                <span>Stop SANA</span>
              </button>
            )}

            {/* Quick Vitals Toggle */}
            <button
              type="button"
              className={`sana-vitals-drawer-btn ${showVitalsDrawer ? "open" : ""}`}
              onClick={() => setShowVitalsDrawer(!showVitalsDrawer)}
            >
              ❤️ {showVitalsDrawer ? "Hide Vitals" : "Optional Vitals"}
            </button>
          </div>
        </section>

        {/* ===================================================
            OPTIONAL PATIENT VITALS DRAWER
        =================================================== */}
        {showVitalsDrawer && (
          <section className="sana-vitals-drawer">
            <div className="drawer-header">
              <strong>❤️ Patient Vitals (Optional)</strong>
              <small>You can type vitals here or speak them naturally (e.g., "my oxygen is 94")</small>
            </div>
            <div className="drawer-grid">
              <div className="drawer-field">
                <label>SpO₂ Oxygen</label>
                <div className="drawer-input-row">
                  <input
                    type="number"
                    placeholder="98"
                    value={vitals.spo2 || ""}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                  <span>%</span>
                </div>
              </div>

              <div className="drawer-field">
                <label>Heart Rate</label>
                <div className="drawer-input-row">
                  <input
                    type="number"
                    placeholder="72"
                    value={vitals.heart_rate || ""}
                    onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                  />
                  <span>BPM</span>
                </div>
              </div>

              <div className="drawer-field">
                <label>Temperature</label>
                <div className="drawer-input-row">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitals.temperature || ""}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  />
                  <span>°F</span>
                </div>
              </div>

              <div className="drawer-field">
                <label>Blood Pressure</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="number"
                    placeholder="120"
                    value={vitals.systolic_bp || ""}
                    onChange={(e) => setVitals({ ...vitals, systolic_bp: e.target.value })}
                    style={{ width: "65px" }}
                  />
                  <span style={{ alignSelf: "center" }}>/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitals.diastolic_bp || ""}
                    onChange={(e) => setVitals({ ...vitals, diastolic_bp: e.target.value })}
                    style={{ width: "65px" }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Active Multimodal Attachment Chips */}
        {(activeImage || activeReport) && (
          <div className="sana-active-attachments-tray">
            {activeImage && (
              <span className="sana-att-chip">
                📷 {activeImage.name}
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  title="Remove image"
                >
                  ×
                </button>
              </span>
            )}
            {activeReport && (
              <span className="sana-att-chip">
                📄 {activeReport.name}
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  title="Remove report"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Friendly Error or Status Banner */}
        {errorMessage && (
          <div className="sana-studio-error">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* ===================================================
            LIVE CONVERSATION TRANSCRIPT VIEWPORT
        =================================================== */}
        <section className="sana-transcript-viewport">
          <SanaTranscript
            messages={messages}
            interimTranscript={interimSpeech}
            isListening={sanaState === "listening"}
            isThinking={sanaState === "thinking"}
            onReplayAudio={handleReplayAudio}
            scrollRef={scrollRef}
          />
        </section>

        {/* ===================================================
            FOOTER: Text Fallback & Multimodal File Uploads
        =================================================== */}
        <footer className="sana-studio-footer">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedMessage.trim() || activeImage || activeReport) {
                submitTurnToSana(typedMessage);
              }
            }}
            className="sana-input-form"
          >
            {/* Attachment Buttons */}
            <div className="sana-tool-btn-group">
              <button
                type="button"
                className="sana-tool-btn"
                onClick={() => photoInputRef.current?.click()}
                title="Attach medical/rash photo"
              >
                📷 Photo
              </button>

              <button
                type="button"
                className="sana-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload lab report or PDF"
              >
                📄 Report
              </button>
            </div>

            {/* Text message fallback */}
            <input
              type="text"
              className="sana-text-fallback-input"
              placeholder="Or type your symptoms here if in a noisy room..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              disabled={sanaState === "thinking"}
            />

            <button
              type="submit"
              className="sana-send-turn-btn"
              disabled={
                sanaState === "thinking" ||
                (!typedMessage.trim() && !activeImage && !activeReport)
              }
              title="Send symptoms"
            >
              Send ➤
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
