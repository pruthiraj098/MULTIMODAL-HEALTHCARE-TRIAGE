import { useState } from "react";
import { API_URL } from "./config";

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">+</div>
          <span>HealthTriage AI</span>
        </div>

        <h1>{title}</h1>

        <p className="auth-subtitle">
          {subtitle}
        </p>

        {children}
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
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed."
        );
      }

      setMessage(
        "Registration successful. You can now login."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "PATIENT",
      });
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join HealthTriage AI and manage your health assessments securely."
    >
      <div style={{ marginBottom: "14px", textAlign: "left" }}>
        <button
          type="button"
          onClick={() => goTo("/welcome")}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "12.5px",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: "600",
          }}
        >
          ← Back to Welcome Overview
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <label>Full Name</label>
        <input
          type="text"
          name="full_name"
          placeholder="Enter your full name"
          value={form.full_name}
          onChange={handleChange}
          autoComplete="name"
        />

        <label>Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
        />

        <label>Healthcare Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "13px",
            marginBottom: "14px",
            outline: "none",
          }}
        >
          <option value="PATIENT">👤 Patient (Individual Health Portal)</option>
          <option value="HEALTH_WORKER">🩺 Healthcare Worker (Field & Screening)</option>
          <option value="NURSE">👩‍⚕️ Nurse (Intake, Vitals & Queue Triage)</option>
          <option value="DOCTOR">👨‍⚕️ Doctor / Physician (Clinical Workspace & Plans)</option>
          <option value="MEDICAL_OFFICER">🛡️ Medical Officer (Facility Clinical Command)</option>
          <option value="FACILITY_ADMIN">🏢 Facility Administrator (Operations & Staff)</option>
          <option value="SYSTEM_ADMIN">⚙️ System Administrator (Platform & Governance)</option>
        </select>

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Create a password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm your password"
          value={form.confirm_password}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
        >
          Login
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
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to process the request."
        );
      }

      setMessage(
        data.message ||
        "If an account exists with this email, a password reset link has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your registered email and we will send you a password reset link."
    >
      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          autoComplete="email"
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>
      </form>

      <div className="auth-footer">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
        >
          Back to Login
        </button>
      </div>
    </AuthCard>
  );
}


export function ResetPasswordPage({ goTo }) {
  const params = new URLSearchParams(
    window.location.search
  );

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
      setError(
        "Password reset token is missing or invalid."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            new_password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Password reset failed."
        );
      }

      setMessage(
        data.message ||
        "Your password has been reset successfully. You can now login."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create a new password"
      subtitle="Choose a new secure password for your HealthTriage AI account."
    >
      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter your new password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="new-password"
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading
            ? "Updating Password..."
            : "Reset Password"}
        </button>
      </form>

      <div className="auth-footer">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => goTo("/login")}
        >
          Back to Login
        </button>
      </div>
    </AuthCard>
  );
}