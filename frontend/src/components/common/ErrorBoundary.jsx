import React from "react";
import { AlertCircle, RotateCcw, MessageSquare } from "lucide-react";

/**
 * Robust React Error Boundary for HealthTriage AI components.
 * Prevents runtime exceptions (e.g. voice initialization, API parsing, or rendering errors)
 * from crashing the entire React DOM tree and leaving a blank white page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({
              error: this.state.error,
              reset: this.handleReset,
            })
          : this.props.fallback;
      }

      const isVoiceError = this.props.context === "voice";

      return (
        <div
          role="alert"
          style={{
            padding: "24px",
            margin: "16px auto",
            maxWidth: "600px",
            background: "#FFFFFF",
            border: "1px solid #F5C6CB",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(200, 61, 77, 0.08)",
            textAlign: "center",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#FDF2F4",
              color: "#C83D4D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertCircle size={26} />
          </div>

          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              fontWeight: "700",
              color: "#15345B",
            }}
          >
            {this.props.title ||
              (isVoiceError
                ? "Unable to start SANA voice mode"
                : "An unexpected issue occurred")}
          </h3>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: "14px",
              color: "#596579",
              lineHeight: 1.5,
            }}
          >
            {this.props.message ||
              (isVoiceError
                ? "Unable to start SANA voice mode. Check your microphone permission and browser compatibility, then try again."
                : "A component encountered a problem while rendering. You can retry or continue your clinical consultation.")}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#1769D2",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(23, 105, 210, 0.25)",
              }}
            >
              <RotateCcw size={16} />
              <span>{this.props.retryText || "Retry"}</span>
            </button>

            {this.props.onClose && (
              <button
                type="button"
                onClick={this.props.onClose}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#F5F7FA",
                  color: "#15345B",
                  border: "1px solid #CBD5E1",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <MessageSquare size={16} />
                <span>Continue with Text Chat</span>
              </button>
            )}
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: "20px",
                textAlign: "left",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#64748B",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "600" }}>
                Technical Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: "8px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "#C83D4D",
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
