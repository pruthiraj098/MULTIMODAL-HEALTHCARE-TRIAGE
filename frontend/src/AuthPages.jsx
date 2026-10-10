import React, { useState } from "react";
import { API_URL } from "./config";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Bot,
  FileText,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export function AuthCard({ title, subtitle, children, goTo, currentTab = "register" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F7FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Plus Jakarta Sans', 'Outfit', Inter, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          background: "#FFFFFF",
          border: "1px solid #E0E6ED",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(21, 52, 91, 0.08)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          minHeight: "580px"
        }}
      >
        {/* Left Side: Deep Navy Professional Healthcare Brand Panel */}
        <div
          style={{
            background: "#15345B",
            color: "#ffffff",
            padding: "44px 38px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          <div>
            {/* Exact HealthTriage AI Logo Asset */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", marginBottom: "32px" }}
              onClick={() => goTo && goTo("/welcome")}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: "#ffffff",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  overflow: "hidden"
                }}
              >
                <img
                  src="/logo.png"
                  alt="HealthTriage AI"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
              <div>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px", display: "block" }}>
                  HealthTriage AI
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.75)",
                    fontWeight: "500",
                    letterSpacing: "0.2px"
                  }}
                >
                  Healthcare Intelligence Platform
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "800", lineHeight: 1.3, marginBottom: "12px", color: "#ffffff" }}>
              Clinical-Grade Healthcare Support, <br />
              <span style={{ color: "#53D8F5" }}>Powered by AI</span>
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6, marginBottom: "36px" }}>
              Empowering patients and clinicians with verified AI symptom triage, physiological vital monitoring, and rapid care coordination.
            </p>

            {/* 4 Feature Indicator Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#53D8F5",
                    flexShrink: 0
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#ffffff" }}>AI Voice Assistant (SANA)</div>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>Multilingual speech triage and real-time medical guidance</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#53D8F5",
                    flexShrink: 0
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#ffffff" }}>Clinical Report Analysis</div>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>Upload lab results and obtain structured AI explanations</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#53D8F5",
                    flexShrink: 0
                  }}
                >
                  <Activity size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#ffffff" }}>Physiological Vitals Tracking</div>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>Continuous monitoring of heart rate, SpO2, and blood pressure</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#159C98",
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#ffffff" }}>Role-Based Hospital Security</div>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>Dedicated workspaces for patients, doctors, nurses & admins</div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "12.5px",
              color: "rgba(255, 255, 255, 0.75)",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>🔒 HIPAA & Privacy Safe</span>
            <span>24/7 Clinical Emergency Support</span>
          </div>
        </div>

        {/* Right Side: Clean White Professional Healthcare Form */}
        <div style={{ padding: "40px 38px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#FFFFFF" }}>
          {goTo && (
            <div style={{ marginBottom: "18px" }}>
              <button
                type="button"
                onClick={() => goTo("/welcome")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#596579",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: 0
                }}
              >
                <ArrowLeft size={16} /> Back to Hospital Overview
              </button>
            </div>
          )}

          {/* Login / Register Toggle Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #E0E6ED",
              marginBottom: "24px",
              gap: "28px"
            }}
          >
            <button
              type="button"
              onClick={() => goTo && goTo("/login")}
              style={{
                background: "none",
                border: "none",
                padding: "8px 0 12px",
                fontSize: "16px",
                fontWeight: currentTab === "login" ? "700" : "600",
                color: currentTab === "login" ? "#1769D2" : "#596579",
                borderBottom: currentTab === "login" ? "2px solid #1769D2" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => goTo && goTo("/register")}
              style={{
                background: "none",
                border: "none",
                padding: "8px 0 12px",
                fontSize: "16px",
                fontWeight: currentTab === "register" ? "700" : "600",
                color: currentTab === "register" ? "#1769D2" : "#596579",
                borderBottom: currentTab === "register" ? "2px solid #1769D2" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#15345B", letterSpacing: "-0.3px", margin: 0 }}>
              {title}
            </h1>
            <p style={{ fontSize: "15px", color: "#596579", marginTop: "6px" }}>{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ goTo }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "PATIENT",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm_password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role || "PATIENT",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setMessage("Registration successful. You can now log in.");

      setForm({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "PATIENT",
      });
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join HealthTriage AI and access your clinical health assessments securely."
      goTo={goTo}
      currentTab="register"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#FDF2F4",
              border: "1px solid #F5C6CB",
              color: "#C83D4D",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#E8F5E9",
              border: "1px solid #C8E6C9",
              color: "#198754",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            placeholder="e.g. Riya Sharma"
            value={form.full_name}
            onChange={handleChange}
            autoComplete="name"
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="e.g. patient@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            Healthcare Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          >
            <option value="PATIENT">Patient (Personal Health Portal)</option>
            <option value="HEALTH_WORKER">Healthcare Worker (Field & Screening)</option>
            <option value="NURSE">Nurse (Intake, Vitals & Queue Triage)</option>
            <option value="DOCTOR">Doctor / Physician (Clinical Workspace & Plans)</option>
            <option value="MEDICAL_OFFICER">Medical Officer (Facility Clinical Command)</option>
            <option value="FACILITY_ADMIN">Facility Administrator (Operations & Staff)</option>
            <option value="SYSTEM_ADMIN">System Administrator (Platform & Governance)</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 6 chars"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #E0E6ED",
                  borderRadius: "10px",
                  padding: "11px 38px 11px 14px",
                  fontSize: "16px",
                  color: "#202B3C",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#596579",
                  cursor: "pointer",
                  padding: "4px"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              placeholder="Re-enter password"
              value={form.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #E0E6ED",
                borderRadius: "10px",
                padding: "11px 14px",
                fontSize: "16px",
                color: "#202B3C",
                outline: "none"
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            width: "100%",
            background: "#1769D2",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "13px 20px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(23, 105, 210, 0.2)",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "15px", color: "#596579" }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
          style={{ background: "none", border: "none", color: "#1769D2", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}
        >
          Sign in
        </button>
      </div>
    </AuthCard>
  );
}

export function ForgotPasswordPage({ goTo }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to process the request.");
      }

      setMessage(
        data.message ||
        "If an account exists with this email, a password reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your registered email and we will send you a secure password reset link."
      goTo={goTo}
      currentTab="login"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#FDF2F4",
              border: "1px solid #F5C6CB",
              color: "#C83D4D",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#E8F5E9",
              border: "1px solid #C8E6C9",
              color: "#198754",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            width: "100%",
            background: "#1769D2",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "13px 20px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(23, 105, 210, 0.2)",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "15px", color: "#596579" }}>
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
          style={{ background: "none", border: "none", color: "#1769D2", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}
        >
          Back to Sign In
        </button>
      </div>
    </AuthCard>
  );
}

export function ResetPasswordPage({ goTo }) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Password reset token is missing or invalid.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed.");
      }

      setMessage("Your password has been reset successfully. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create a new password"
      subtitle="Choose a new secure password for your HealthTriage AI account."
      goTo={goTo}
      currentTab="login"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#FDF2F4",
              border: "1px solid #F5C6CB",
              color: "#C83D4D",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#E8F5E9",
              border: "1px solid #C8E6C9",
              color: "#198754",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            New Password
          </label>
          <input
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#15345B", marginBottom: "6px" }}>
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E6ED",
              borderRadius: "10px",
              padding: "11px 14px",
              fontSize: "16px",
              color: "#202B3C",
              outline: "none"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "8px",
            width: "100%",
            background: "#1769D2",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "13px 20px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(23, 105, 210, 0.2)",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Updating Password..." : "Reset Password"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "15px", color: "#596579" }}>
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
          style={{ background: "none", border: "none", color: "#1769D2", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}
        >
          Back to Sign In
        </button>
      </div>
    </AuthCard>
  );
}