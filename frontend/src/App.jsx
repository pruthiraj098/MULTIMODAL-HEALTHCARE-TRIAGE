import { useEffect, useState } from "react";

import {
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./AuthPages";

import TriagePage from "./TriagePage";
import HealthMonitor from "./components/health/HealthMonitor";
import HealthRiskIndicator from "./components/health/HealthRiskIndicator";
import ReportAnalyzer from "./components/reports/ReportAnalyzer";
import MedicationTracker from "./components/medication/MedicationTracker";
import SelfCareGuide from "./components/selfcare/SelfCareGuide";
import NearbyHealthcareFinder from "./components/healthcare/NearbyHealthcareFinder";
import PatientDashboard from "./components/dashboard/PatientDashboard";
import HealthcareWorkerDashboard from "./components/reviewer/HealthcareWorkerDashboard";
import ReferralGeneratorModal from "./components/reviewer/ReferralGeneratorModal";
import DoctorVisitCopilot from "./components/copilot/DoctorVisitCopilot";
import FacilityAdminDashboard from "./components/admin/FacilityAdminDashboard";
import PublicHealthDashboard from "./components/publichealth/PublicHealthDashboard";
import DemoScenariosModal from "./components/demo/DemoScenariosModal";
import HealthIntelligenceHub from "./components/intelligence/HealthIntelligenceHub";
import WelcomePage from "./components/welcome";
import DoctorWorkspace from "./components/doctor";
import NurseDashboard from "./components/nurse";
import MedicalOfficerDashboard from "./components/medicalofficer";
import AppLayout from "./components/layout/AppLayout";
import { API_URL } from "./config";


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function LoginPage({ goTo }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (event) => {

    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail || "Login failed."
        );

      }


      if (!data.access_token || !data.user) {

        throw new Error(
          "Invalid login response from server."
        );

      }


      localStorage.setItem(
        "healthtriage_token",
        data.access_token
      );


      localStorage.setItem(
        "healthtriage_user",
        JSON.stringify(data.user)
      );


      if (["ADMIN", "SYSTEM_ADMIN", "FACILITY_ADMIN"].includes(data.user.role)) {
        goTo("/facility-admin");
      } else if (data.user.role === "DOCTOR") {
        goTo("/doctor");
      } else if (data.user.role === "NURSE") {
        goTo("/nurse");
      } else if (data.user.role === "MEDICAL_OFFICER") {
        goTo("/medical-officer");
      } else if (data.user.role === "HEALTH_WORKER") {
        goTo("/queue");
      } else {
        goTo("/dashboard");
      }

    } catch (err) {

      setError(
        err.message ||
        "Unable to connect to the HealthTriage AI server."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="auth-page">

      <div className="auth-card">

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

        <div className="auth-logo">

          <div className="auth-logo-icon">
            +
          </div>

          <span>
            HealthTriage AI
          </span>

        </div>


        <h1>
          Welcome back
        </h1>


        <p className="auth-subtitle">
          Login to continue to your HealthTriage AI account.
        </p>


        <form
          onSubmit={handleLogin}
          className="auth-form"
        >

          {error && (

            <div className="auth-error">
              {error}
            </div>

          )}


          <label>
            Email Address
          </label>


          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
          />


          <label>
            Password
          </label>


          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
          />


          <div className="forgot-link-container">

            <button
              type="button"
              className="text-button"
              onClick={() =>
                goTo("/forgot-password")
              }
            >
              Forgot Password?
            </button>

          </div>


          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>


        <div className="auth-footer">

          Don't have an account?{" "}

          <button
            type="button"
            onClick={() =>
              goTo("/register")
            }
          >
            Create Account
          </button>

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard({ goTo }) {

  const [dashboard, setDashboard] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const token = localStorage.getItem(
    "healthtriage_token"
  );


  const user = JSON.parse(
    localStorage.getItem(
      "healthtriage_user"
    ) || "null"
  );


  const fetchAdminData = async () => {

    try {

      setLoading(true);
      setError("");


      if (!token) {

        goTo("/login");
        return;

      }


      const headers = {
        Authorization: `Bearer ${token}`,
      };


      const [
        dashboardResponse,
        usersResponse,
        historyResponse,
      ] = await Promise.all([

        fetch(
          `${API_URL}/api/admin/dashboard`,
          {
            headers,
          }
        ),

        fetch(
          `${API_URL}/api/admin/users`,
          {
            headers,
          }
        ),

        fetch(
          `${API_URL}/api/admin/triage-history`,
          {
            headers,
          }
        ),

      ]);


      if (
        dashboardResponse.status === 401 ||
        dashboardResponse.status === 403
      ) {

        handleLogout();
        return;

      }


      if (!dashboardResponse.ok) {

        const data =
          await dashboardResponse.json();

        throw new Error(
          data.detail ||
          "Unable to load admin dashboard."
        );

      }


      if (!usersResponse.ok) {

        const data =
          await usersResponse.json();

        throw new Error(
          data.detail ||
          "Unable to load users."
        );

      }


      if (!historyResponse.ok) {

        const data =
          await historyResponse.json();

        throw new Error(
          data.detail ||
          "Unable to load triage history."
        );

      }


      const dashboardData =
        await dashboardResponse.json();

      const usersData =
        await usersResponse.json();

      const historyData =
        await historyResponse.json();


      setDashboard(
        dashboardData
      );

      setUsers(
        usersData.users || []
      );

      setHistory(
        historyData.history || []
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


  useEffect(() => {

    if (
      !user ||
      user.role !== "ADMIN"
    ) {

      goTo("/login");
      return;

    }

    fetchAdminData();

  }, []);


  const handleLogout = () => {

    localStorage.removeItem(
      "healthtriage_token"
    );

    localStorage.removeItem(
      "healthtriage_user"
    );

    goTo("/login");

  };


  const updateUserStatus = async (
    userId,
    isActive
  ) => {

    try {

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            is_active: isActive,
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to update user status."
        );

      }


      await fetchAdminData();


    } catch (err) {

      setError(
        err.message ||
        "Unable to update user status."
      );

    }

  };


  if (loading) {

    return (

      <div className="dashboard-page">

        <div className="dashboard-loading">
          Loading Admin Dashboard...
        </div>

      </div>

    );

  }


  return (

    <div className="admin-page-content" style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>

      <main className="dashboard-main">

        {error && (

          <div className="auth-error dashboard-error">
            {error}
          </div>

        )}


        <section className="dashboard-welcome">

          <div>

            <h2>
              Welcome,{" "}
              {dashboard?.admin?.full_name ||
                "Administrator"}
            </h2>

            <p>
              Monitor users, triage activity,
              and system health from one place.
            </p>

          </div>


          <div className="system-status">

            <span className="status-dot"></span>

            System Healthy

          </div>

        </section>


        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              👥
            </div>

            <div>

              <span>
                Total Users
              </span>

              <strong>
                {dashboard?.statistics
                  ?.total_users ?? 0}
              </strong>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🛡️
            </div>

            <div>

              <span>
                Total Admins
              </span>

              <strong>
                {dashboard?.statistics
                  ?.total_admins ?? 0}
              </strong>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              ✓
            </div>

            <div>

              <span>
                Active Accounts
              </span>

              <strong>
                {dashboard?.statistics
                  ?.active_users ?? 0}
              </strong>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              📋
            </div>

            <div>

              <span>
                Triage Cases
              </span>

              <strong>
                {dashboard?.statistics
                  ?.total_triage_cases ?? 0}
              </strong>

            </div>

          </div>

        </section>


        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                User Management
              </h2>

              <p>
                Manage registered user accounts.
              </p>

            </div>


            <button
              className="refresh-button"
              onClick={fetchAdminData}
            >
              ↻ Refresh
            </button>

          </div>


          <div className="table-wrapper">

            <table className="users-table">

              <thead>

                <tr>

                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>

                </tr>

              </thead>


              <tbody>

                {users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-table"
                    >
                      No users found.
                    </td>

                  </tr>

                ) : (

                  users.map((item) => (

                    <tr key={item.id}>

                      <td>
                        {item.id}
                      </td>

                      <td>
                        <strong>
                          {item.full_name}
                        </strong>
                      </td>

                      <td>
                        {item.email}
                      </td>

                      <td>

                        <span
                          className={`role-badge ${
                            item.role === "ADMIN"
                              ? "role-admin"
                              : "role-user"
                          }`}
                        >
                          {item.role}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            item.is_active
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {item.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td>

                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleDateString()
                          : "-"}

                      </td>

                      <td>

                        {item.role === "USER" ? (

                          <button
                            className={
                              item.is_active
                                ? "table-action deactivate"
                                : "table-action activate"
                            }

                            onClick={() =>
                              updateUserStatus(
                                item.id,
                                !item.is_active
                              )
                            }
                          >

                            {item.is_active
                              ? "Deactivate"
                              : "Activate"}

                          </button>

                        ) : (

                          <span className="admin-protected">
                            Protected
                          </span>

                        )}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>


        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Triage History
              </h2>

              <p>
                Recent HealthTriage AI assessments.
              </p>

            </div>

          </div>


          <div className="table-wrapper">

            <table className="users-table">

              <thead>

                <tr>

                  <th>ID</th>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Symptoms</th>
                  <th>Created</th>

                </tr>

              </thead>


              <tbody>

                {history.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty-table"
                    >
                      No triage records found.
                    </td>

                  </tr>

                ) : (

                  history.map((item) => (

                    <tr key={item.id}>

                      <td>
                        {item.id}
                      </td>

                      <td>
                        {item.patient_name || "-"}
                      </td>

                      <td>
                        {item.age ?? "-"}
                      </td>

                      <td>
                        {item.gender || "-"}
                      </td>

                      <td className="symptoms-cell">
                        {item.symptoms || "-"}
                      </td>

                      <td>

                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "-"}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>

  );
}


/* =========================================================
   USER DASHBOARD
   ========================================================= */

function UserDashboard({ goTo }) {
  return <PatientDashboard goTo={goTo} />;
}


/* =========================================================
   GLOBAL PORTAL NAVIGATION HEADER
   ========================================================= */

function GlobalPortalHeader({ currentPath, goTo, onOpenDemo }) {
  const token = localStorage.getItem("healthtriage_token");
  if (!token) return null;
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("healthtriage_user") || "null");
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("healthtriage_token");
    localStorage.removeItem("healthtriage_user");
    goTo("/login");
  };

  const navItems = [
    { label: "🏠 Patient Care", path: "/dashboard" },
    { label: "🎙️ SANA Triage", path: "/triage" },
    { label: "👨‍⚕️ Doctor", path: "/doctor" },
    { label: "👩‍⚕️ Nurse", path: "/nurse" },
    { label: "🛡️ Med Officer", path: "/medical-officer" },
    { label: "🩺 Clinical Queue", path: "/queue" },
    { label: "🧠 Health Intel", path: "/intelligence" },
    { label: "🏥 Facilities", path: "/facilities" },
    { label: "🏢 Facility Admin", path: "/facility-admin" },
    { label: "🏛️ Public Health", path: "/public-health" },
  ];

  return (
    <header
      className="global-portal-bar"
      style={{
        background: "#0f172a",
        color: "#ffffff",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        onClick={() => goTo("/dashboard")}
      >
        <div
          style={{
            background: "#2563eb",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          +
        </div>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", letterSpacing: "0.5px" }}>HealthTriage AI</div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Facility Intelligence Platform</div>
        </div>
      </div>

      <nav style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              style={{
                background: isActive ? "#2563eb" : "transparent",
                color: isActive ? "#ffffff" : "#cbd5e1",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: isActive ? "700" : "500",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={onOpenDemo}
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(217, 119, 6, 0.3)",
          }}
        >
          🚀 10 Demo Scenarios
        </button>

        <span
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            display: "inline-block",
            maxWidth: "130px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user?.full_name || "User"} ({user?.role || "PATIENT"})
        </span>

        <button
          onClick={handleLogout}
          style={{
            background: "#334155",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Exit
        </button>
      </div>
    </header>
  );
}


/* =========================================================
   MAIN APP ROUTER
   ========================================================= */

function App() {

  const [path, setPath] =
    useState(
      window.location.pathname
    );


  const goTo = (newPath) => {

    window.history.pushState(
      {},
      "",
      newPath
    );

    setPath(newPath);

  };

  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [referralSession, setReferralSession] = useState(null);

  const handleSwitchRole = (newRole, targetPath) => {
    try {
      const userObj = JSON.parse(localStorage.getItem("healthtriage_user") || "{}");
      userObj.role = newRole;
      if (!userObj.full_name) userObj.full_name = `Demo ${newRole}`;
      localStorage.setItem("healthtriage_user", JSON.stringify(userObj));
      goTo(targetPath || "/dashboard");
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {

    const handlePopState = () => {

      setPath(
        window.location.pathname
      );

    };


    window.addEventListener(
      "popstate",
      handlePopState
    );


    return () => {

      window.removeEventListener(
        "popstate",
        handlePopState
      );

    };

  }, []);

  // Shared Modals rendered across the app
  const sharedModals = (
    <>
      <DemoScenariosModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSwitchRole={handleSwitchRole}
        onSelectScenario={(sc) => {
          sessionStorage.setItem("healthtriage_demo_scenario", JSON.stringify(sc));
          goTo("/triage");
        }}
      />
      {referralSession && (
        <ReferralGeneratorModal
          isOpen={!!referralSession}
          onClose={() => setReferralSession(null)}
          sessionData={referralSession}
          onReferralCreated={() => {
            setReferralSession(null);
            goTo("/queue");
          }}
        />
      )}
    </>
  );

  /* -------------------------------------------------------------
     UNAUTHENTICATED PUBLIC PAGES
     ------------------------------------------------------------- */
  if (path === "/register") {
    return (
      <>
        <RegisterPage goTo={goTo} />
        {sharedModals}
      </>
    );
  }

  if (path === "/forgot-password") {
    return (
      <>
        <ForgotPasswordPage goTo={goTo} />
        {sharedModals}
      </>
    );
  }

  if (path === "/reset-password") {
    return (
      <>
        <ResetPasswordPage goTo={goTo} />
        {sharedModals}
      </>
    );
  }

  if (path === "/login") {
    return (
      <>
        <LoginPage goTo={goTo} />
        {sharedModals}
      </>
    );
  }

  if (path === "/welcome") {
    return (
      <>
        <WelcomePage goTo={goTo} onOpenDemo={() => setIsDemoOpen(true)} />
        {sharedModals}
      </>
    );
  }

  /* -------------------------------------------------------------
     AUTHENTICATED / PROTECTED APPLICATION SHELL
     ------------------------------------------------------------- */
  const token = localStorage.getItem("healthtriage_token");
  if (!token) {
    return (
      <>
        <WelcomePage goTo={goTo} onOpenDemo={() => setIsDemoOpen(true)} />
        {sharedModals}
      </>
    );
  }

  const renderPageContent = () => {
    switch (path) {
      case "/dashboard":
        return <PatientDashboard goTo={goTo} />;
      case "/health":
        return <HealthMonitor goTo={goTo} />;
      case "/reports":
        return <ReportAnalyzer goTo={goTo} />;
      case "/medications":
        return <MedicationTracker goTo={goTo} />;
      case "/self-care":
        return <SelfCareGuide goTo={goTo} />;
      case "/facilities":
      case "/nearby":
        return <NearbyHealthcareFinder goTo={goTo} />;
      case "/queue":
        return (
          <HealthcareWorkerDashboard
            goTo={goTo}
            onOpenReferral={(caseDetail) => setReferralSession(caseDetail)}
          />
        );
      case "/facility-admin":
        return <FacilityAdminDashboard goTo={goTo} />;
      case "/public-health":
        return <PublicHealthDashboard goTo={goTo} />;
      case "/intelligence":
        return <HealthIntelligenceHub goTo={goTo} />;
      case "/copilot":
        return <DoctorVisitCopilot goTo={goTo} />;
      case "/triage":
        return <TriagePage goTo={goTo} />;
      case "/doctor":
        return (
          <DoctorWorkspace
            goTo={goTo}
            onOpenReferral={(caseDetail) => setReferralSession(caseDetail)}
          />
        );
      case "/nurse":
        return (
          <NurseDashboard
            goTo={goTo}
            onOpenReferral={(caseDetail) => setReferralSession(caseDetail)}
          />
        );
      case "/medical-officer":
        return <MedicalOfficerDashboard goTo={goTo} />;
      case "/admin":
        return <AdminDashboard goTo={goTo} />;
      default:
        return <PatientDashboard goTo={goTo} />;
    }
  };

  return (
    <>
      <AppLayout
        currentPath={path}
        goTo={goTo}
        onOpenDemo={() => setIsDemoOpen(true)}
        showContextPanel={path === "/dashboard"}
      >
        {renderPageContent()}
      </AppLayout>
      {sharedModals}
    </>
  );
}

export default App;
