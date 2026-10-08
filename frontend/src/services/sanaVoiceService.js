// ============================================================
// HealthTriage AI - SANA Voice & Audio Service
// Two-Way Speech Recognition (STT) & Speech Synthesis (TTS)
// Supporting Persistent Conversational Sessions & Smart Turn-Taking
// ============================================================

const STT_LANG_MAP = {
  en: "en-US",
  hi: "hi-IN",
  or: "or-IN",
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
    this.initRecognition();
  }

  /**
   * Check if speech recognition or media capture is available in this browser.
   */
  isSpeechSupported() {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      navigator.mediaDevices
    );
  }

  /**
   * Initialize or re-initialize Web Speech API recognition instance.
   */
  initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[SANA Voice] SpeechRecognition is not supported in this browser.");
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Single utterance turn for precise speech end detection
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      this.recognition = recognition;
      return recognition;
    } catch (err) {
      console.error("[SANA Voice] Failed to initialize SpeechRecognition:", err);
      return null;
    }
  }

  /**
   * Start listening for patient speech.
   * Dispatches callbacks for start, interim text, final result, turn end, and errors.
   */
  startListening({
    lang = "en",
    onStart = () => {},
    onInterim = () => {},
    onResult = () => {},
    onEnd = () => {},
    onError = () => {},
  }) {
    // Stop any ongoing speech synthesis before activating mic (prevent mic hearing SANA)
    this.stopSpeaking();

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      onError({
        message: "Speech recognition is not supported in your browser. You can still type your symptoms.",
        errorType: "not-supported",
        isFatal: true,
      });
      return;
    }

    try {
      if (this.isListeningActive) {
        try {
          this.recognition.abort();
        } catch {
          // ignore abort errors if already transitioning
        }
      }

      const sttLang = STT_LANG_MAP[lang] || STT_LANG_MAP.en;
      this.recognition.lang = sttLang;

      let finalTranscript = "";
      let hasDispatchedResult = false;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += text + " ";
          } else {
            interimTranscript += text;
          }
        }

        if (interimTranscript) {
          onInterim(interimTranscript);
        }

        if (finalTranscript.trim() && !hasDispatchedResult) {
          hasDispatchedResult = true;
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        this.isListeningActive = false;
        console.warn("[SANA Voice] Recognition error event:", event.error);

        let userMsg = "I couldn't hear that clearly. Please try again.";
        let isFatal = false;

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          userMsg =
            "Microphone access is required for voice conversation. Please allow microphone permission in your browser.";
          isFatal = true;
        } else if (event.error === "network") {
          userMsg =
            "Network connection issue with speech recognition. Please check your internet connection.";
          isFatal = false;
        } else if (event.error === "no-speech") {
          // Recoverable: Patient stayed silent or paused
          userMsg = "No speech detected in this turn.";
          isFatal = false;
        } else if (event.error === "aborted") {
          // Deliberately cancelled or interrupted by user/turn transition
          return;
        }

        onError({
          message: userMsg,
          errorType: event.error,
          isFatal,
        });
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        onEnd(finalTranscript.trim());
      };

      this.recognition.start();
    } catch (err) {
      this.isListeningActive = false;
      console.error("[SANA Voice] Failed to start recognition:", err);
      onError({
        message: "Could not activate microphone. Please check permissions and try again.",
        errorType: "start-failed",
        isFatal: true,
      });
    }
  }

  /**
   * Stop listening immediately.
   */
  stopListening() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {
          // ignore
        }
      }
    }
    this.isListeningActive = false;
  }

  /**
   * Synthesize and play speech with audio element or browser SpeechSynthesis.
   * Guarantees invocation of onEnd so the caller can return to LISTENING state.
   */
  speak({
    text,
    audioBase64 = null,
    lang = "en",
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
  }) {
    // Ensure any previous speech is halted
    this.stopSpeaking();

    // Ensure mic is not listening while speaking to avoid audio echo
    this.stopListening();

    if (!text && !audioBase64) {
      onEnd();
      return;
    }

    // Preference 1: High-fidelity Server Audio Base64 if available
    if (audioBase64) {
      try {
        const audio = new Audio(audioBase64);
        this.currentAudio = audio;

        audio.onplay = () => {
          this.speechSynthesisActive = true;
          onStart();
        };

        audio.onended = () => {
          this.speechSynthesisActive = false;
          this.currentAudio = null;
          onEnd();
        };

        audio.onerror = (e) => {
          console.warn("[SANA Voice] Server audio playback failed, falling back to Web Speech:", e);
          this.currentAudio = null;
          this.speakBrowserTTS(text, lang, onStart, onEnd, onError);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[SANA Voice] Audio play promise rejected:", err);
            this.currentAudio = null;
            this.speakBrowserTTS(text, lang, onStart, onEnd, onError);
          });
        }

        return;
      } catch (e) {
        console.warn("[SANA Voice] Audio element creation error:", e);
        this.currentAudio = null;
      }
    }

    // Preference 2: Browser SpeechSynthesis
    this.speakBrowserTTS(text, lang, onStart, onEnd, onError);
  }

  /**
   * Fallback text-to-speech using browser native window.speechSynthesis.
   */
  speakBrowserTTS(text, lang, onStart, onEnd, onError) {
    if (!window.speechSynthesis) {
      console.warn("[SANA Voice] Web SpeechSynthesis is not supported.");
      onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const sttLang = STT_LANG_MAP[lang] || "en-US";
      utterance.lang = sttLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Warm, friendly clinical tone

      // Select the best matching voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === sttLang.toLowerCase() ||
          v.lang.toLowerCase().startsWith(lang)
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      let hasEnded = false;
      const safeEnd = () => {
        if (!hasEnded) {
          hasEnded = true;
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

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("[SANA Voice] Browser TTS error:", err);
      this.speechSynthesisActive = false;
      onEnd();
    }
  }

  /**
   * Stop SANA speech immediately (interruption / barge-in / stop action).
   */
  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    this.speechSynthesisActive = false;
  }

  /**
   * Stop all active voice processing (both recognition and audio playback).
   */
  stopAll() {
    this.stopListening();
    this.stopSpeaking();
  }

  /**
   * Check if SANA is currently speaking.
   */
  isSpeaking() {
    return this.speechSynthesisActive || !!this.currentAudio;
  }

  /**
   * Check if speech recognition is currently listening.
   */
  isListening() {
    return this.isListeningActive;
  }
}

const sanaVoiceService = new SanaVoiceService();
export default sanaVoiceService;
