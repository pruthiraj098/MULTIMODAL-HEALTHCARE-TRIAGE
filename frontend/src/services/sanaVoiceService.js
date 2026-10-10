// ============================================================
// HealthTriage AI - SANA Voice & Audio Service
// Two-Way Continuous Speech Recognition (STT) & Speech Synthesis (TTS)
// Supporting Natural Pauses, Continuous Multi-phrase Utterances,
// Configurable Silence Thresholds, Audio Autoplay Unlocking,
// and Reliable Multilingual Audio Playback in Odia, Hindi, etc.
// ============================================================

import { API_URL } from "../config";

const STT_LANG_MAP = {
  en: "en-IN", // Indian English handles Indian medical terms and regional accents significantly better
  hi: "hi-IN",
  or: "or-IN", // Google Speech Service in Chromium recognizes Odia speech
  bn: "bn-IN",
  te: "te-IN",
  ta: "ta-IN",
};

class SanaVoiceService {
  constructor() {
    this.recognition = null;
    this.isListeningActive = false;
    this.currentAudio = null;
    this.speechSynthesisActive = false;
    this.silenceTimer = null;
    this.accumulatedFinalText = "";
    this.currentInterimText = "";
    this.isFinalizingTurn = false;
    this.turnCompletedCallback = null;
    this.onEndCallback = null;
    this.activeLang = "en";
    this.silenceThresholdMs = 2600;
    this.browserTTSWatchdog = null;
    this.audioUnlocked = false;
    this.audioContext = null;
    this.initRecognition();
  }

  /**
   * Unlocks browser HTML5 Audio and Web Audio API permissions during user gestures
   * (e.g. clicking 'Talk to SANA' or 'Done Speaking'), preventing browser autoplay blocking.
   */
  unlockAudio() {
    if (this.audioUnlocked) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }
      }

      // Pre-warm HTML5 audio element
      const dummy = new Audio();
      dummy.volume = 0;
      dummy.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      dummy.play().catch(() => {});
      this.audioUnlocked = true;
    } catch {
      // Ignore unlocking errors
    }
  }

  isSpeechSupported() {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      navigator.mediaDevices
    );
  }

  initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[SANA Voice] SpeechRecognition is not supported in this browser.");
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      this.recognition = recognition;
      return recognition;
    } catch (err) {
      console.error("[SANA Voice] Failed to initialize SpeechRecognition:", err);
      return null;
    }
  }

  startListening({
    lang = "en",
    silenceThresholdMs = 2600,
    onStart = () => {},
    onInterim = () => {},
    onTurnComplete = () => {},
    onEnd = () => {},
    onError = () => {},
  }) {
    this.unlockAudio();
    this.stopSpeaking();
    this.clearSilenceTimer();
    this.accumulatedFinalText = "";
    this.currentInterimText = "";
    this.isFinalizingTurn = false;
    this.turnCompletedCallback = onTurnComplete;
    this.onEndCallback = onEnd;
    this.activeLang = lang;
    this.silenceThresholdMs = Math.max(1500, silenceThresholdMs);

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      onError({
        message: "Speech recognition is not supported in your browser. You can still type your symptoms below.",
        errorType: "not-supported",
        isFatal: true,
      });
      return;
    }

    try {
      if (this.isListeningActive) {
        try {
          this.recognition.abort();
        } catch {}
      }

      const sttLang = STT_LANG_MAP[lang] || STT_LANG_MAP.en;
      this.recognition.lang = sttLang;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.isFinalizingTurn = false;
        onStart();
      };

      this.recognition.onresult = (event) => {
        if (this.isFinalizingTurn) return;

        let currentTurnFinal = "";
        let currentTurnInterim = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            currentTurnFinal += transcript + " ";
          } else {
            currentTurnInterim += transcript;
          }
        }

        this.accumulatedFinalText = currentTurnFinal.trim();
        this.currentInterimText = currentTurnInterim.trim();

        const fullLiveTranscript = [this.accumulatedFinalText, this.currentInterimText]
          .filter(Boolean)
          .join(" ")
          .trim();

        onInterim({
          interimText: this.currentInterimText,
          finalizedText: this.accumulatedFinalText,
          fullLiveTranscript,
        });

        this.clearSilenceTimer();

        if (fullLiveTranscript.length > 0 && !this.isFinalizingTurn) {
          this.silenceTimer = setTimeout(() => {
            this.finalizeTurn("silence_timeout");
          }, this.silenceThresholdMs);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("[SANA Voice] Recognition error event:", event.error);
        let userMsg = "I couldn't hear that clearly. Please try speaking again.";
        let isFatal = false;

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          userMsg =
            "Microphone access was denied. Please allow microphone permissions in your browser address bar.";
          isFatal = true;
          this.isListeningActive = false;
        } else if (event.error === "network") {
          userMsg = "Speech recognition network interruption. Please check your internet connection.";
          isFatal = false;
        } else if (event.error === "no-speech") {
          userMsg = "No speech detected in this turn.";
          isFatal = false;
        } else if (event.error === "aborted") {
          return;
        }

        if (isFatal) {
          this.clearSilenceTimer();
          this.isListeningActive = false;
          onError({ message: userMsg, errorType: event.error, isFatal: true });
        } else {
          onError({ message: userMsg, errorType: event.error, isFatal: false });
        }
      };

      this.recognition.onend = () => {
        if (this.isFinalizingTurn) {
          this.isListeningActive = false;
          if (this.onEndCallback) this.onEndCallback();
          return;
        }

        const fullText = [this.accumulatedFinalText, this.currentInterimText]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (fullText.length > 0) {
          this.finalizeTurn("recognition_end");
        } else {
          this.isListeningActive = false;
          if (this.onEndCallback) this.onEndCallback();
        }
      };

      this.recognition.start();
    } catch (err) {
      this.isListeningActive = false;
      console.error("[SANA Voice] Failed to activate recognition:", err);
      onError({
        message: "Could not activate microphone. Please check permissions and try again.",
        errorType: "start-failed",
        isFatal: true,
      });
    }
  }

  finalizeTurn(triggerReason = "manual") {
    if (this.isFinalizingTurn) return;
    this.isFinalizingTurn = true;
    this.clearSilenceTimer();

    const fullUtterance = [this.accumulatedFinalText, this.currentInterimText]
      .filter(Boolean)
      .join(" ")
      .trim();

    this.stopListening();

    if (fullUtterance && this.turnCompletedCallback) {
      const cb = this.turnCompletedCallback;
      this.turnCompletedCallback = null;
      cb(fullUtterance, triggerReason);
    } else if (this.onEndCallback) {
      const endCb = this.onEndCallback;
      this.onEndCallback = null;
      endCb();
    }
  }

  finalizeTurnNow() {
    this.finalizeTurn("user_explicit_done");
  }

  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  stopListening() {
    this.clearSilenceTimer();
    this.isListeningActive = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {}
      }
    }
  }

  /**
   * Synthesize and play speech with audio element or browser SpeechSynthesis.
   * Prioritizes high-fidelity server MP3 audio (Odia, Hindi, Bengali, Telugu, Tamil, English).
   */
  async speak({
    text,
    audioBase64 = null,
    lang = "en",
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
  }) {
    this.unlockAudio();
    this.stopSpeaking();
    this.stopListening();

    if (!text && !audioBase64) {
      onEnd();
      return;
    }

    let hasCompleted = false;
    const safeEnd = () => {
      if (!hasCompleted) {
        hasCompleted = true;
        this.speechSynthesisActive = false;
        this.currentAudio = null;
        onEnd();
      }
    };

    // If server audio was not provided, fetch high-fidelity audio from /api/sana/tts
    // Crucial for Odia (or) and Indian languages where local browser OS TTS has no native voices
    if (!audioBase64 && text && text.trim()) {
      try {
        const res = await fetch(`${API_URL}/api/sana/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), language: lang }),
        });
        if (res.ok) {
          const ttsData = await res.json();
          if (ttsData.success && ttsData.audio_base64) {
            audioBase64 = ttsData.audio_base64;
          }
        }
      } catch (ttsErr) {
        console.warn("[SANA Voice] On-demand server audio fetch notice:", ttsErr);
      }
    }

    // Preference 1: High-fidelity Server Audio Base64
    if (audioBase64) {
      try {
        const audio = new Audio();
        audio.src = audioBase64;
        audio.volume = 1.0;
        this.currentAudio = audio;

        audio.onplay = () => {
          this.speechSynthesisActive = true;
          onStart();
        };

        audio.onended = () => {
          safeEnd();
        };

        audio.onerror = (e) => {
          console.warn("[SANA Voice] Server audio element error, falling back to Web Speech:", e);
          this.currentAudio = null;
          this.speakBrowserTTS(text, lang, onStart, safeEnd, onError);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Successfully started playback
            })
            .catch((err) => {
              console.warn("[SANA Voice] audio.play() promise rejected:", err);
              this.currentAudio = null;
              this.speakBrowserTTS(text, lang, onStart, safeEnd, onError);
            });
        }
        return;
      } catch (e) {
        console.warn("[SANA Voice] Audio element creation error:", e);
        this.currentAudio = null;
      }
    }

    // Preference 2: Browser SpeechSynthesis
    this.speakBrowserTTS(text, lang, onStart, safeEnd, onError);
  }

  cleanTextForBrowserTTS(text) {
    if (!text) return "";
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`.*?`/g, "")
      .replace(/^[\s]*[#*-]+\s*/gm, "")
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}❤️🚨⚠️🌿🩺💊👤✦•✓]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Transliterate Odia characters to Devanagari for browsers with Hindi voices.
   */
  odiaToDevanagari(text) {
    if (!text) return "";
    let res = "";
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0b00 && code <= 0x0b7f) {
        res += String.fromCharCode(code - 0x0b00 + 0x0900);
      } else {
        res += text[i];
      }
    }
    return res;
  }

  speakBrowserTTS(text, lang, onStart, onEnd, onError) {
    if (!window.speechSynthesis) {
      console.warn("[SANA Voice] Web SpeechSynthesis is not supported.");
      onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (this.browserTTSWatchdog) {
        clearTimeout(this.browserTTSWatchdog);
        this.browserTTSWatchdog = null;
      }

      let cleanText = this.cleanTextForBrowserTTS(text);
      if (!cleanText) {
        onEnd();
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      const sttLang = STT_LANG_MAP[lang] || "en-IN";

      // 1. Direct language voice match
      let selectedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === sttLang.toLowerCase() ||
          v.lang.toLowerCase().startsWith(lang.toLowerCase())
      );

      // 2. Fallback: If Odia has no native browser voice, check if Hindi voice exists
      if (!selectedVoice && lang === "or") {
        selectedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("hi") ||
            v.name.toLowerCase().includes("hindi") ||
            v.name.toLowerCase().includes("kalpana") ||
            v.name.toLowerCase().includes("hemant")
        );
        if (selectedVoice) {
          cleanText = this.odiaToDevanagari(cleanText);
        }
      }

      // 3. Fallback: Indian English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes("en-in") ||
            v.name.toLowerCase().includes("india") ||
            v.name.toLowerCase().includes("heera") ||
            v.name.toLowerCase().includes("ravi")
        );
      }

      // 4. Fallback: default voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = sttLang;
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      let hasEnded = false;
      const safeEnd = () => {
        if (!hasEnded) {
          hasEnded = true;
          if (this.browserTTSWatchdog) {
            clearTimeout(this.browserTTSWatchdog);
            this.browserTTSWatchdog = null;
          }
          this.speechSynthesisActive = false;
          onEnd();
        }
      };

      utterance.onstart = () => {
        this.speechSynthesisActive = true;
        onStart();
      };

      utterance.onend = () => {
        safeEnd();
      };

      utterance.onerror = (event) => {
        console.warn("[SANA Voice] SpeechSynthesis error:", event);
        if (onError) onError("Speech playback encountered an issue.");
        safeEnd();
      };

      const estimatedDurationMs = Math.max(3000, (cleanText.length / 12) * 1000 + 4000);
      this.browserTTSWatchdog = setTimeout(() => {
        if (!hasEnded) {
          console.warn("[SANA Voice] Browser TTS watchdog expired; forcing state return.");
          safeEnd();
        }
      }, estimatedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("[SANA Voice] Browser TTS error:", err);
      this.speechSynthesisActive = false;
      onEnd();
    }
  }

  stopSpeaking() {
    if (this.browserTTSWatchdog) {
      clearTimeout(this.browserTTSWatchdog);
      this.browserTTSWatchdog = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.speechSynthesisActive = false;
  }

  stopAll() {
    this.stopListening();
    this.stopSpeaking();
  }

  isSpeaking() {
    return this.speechSynthesisActive || !!this.currentAudio;
  }

  isListening() {
    return this.isListeningActive;
  }
}

const sanaVoiceService = new SanaVoiceService();
export default sanaVoiceService;
