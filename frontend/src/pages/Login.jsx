import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.id) localStorage.setItem("userId", response.data.id);
        if (response.data.name) localStorage.setItem("userName", response.data.name);
        if (response.data.email) localStorage.setItem("userEmail", response.data.email);
        if (response.data.role) localStorage.setItem("userRole", response.data.role);

        const redirectUrl = localStorage.getItem("invitationRedirect");
        if (redirectUrl) {
          localStorage.removeItem("invitationRedirect");
          navigate(redirectUrl);
        } else if (response.data.role === "ADMINISTRATOR") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left Hero Visual */}
      <div style={styles.leftSection}>
        <div style={styles.leftOverlay}>
          <Link to="/" style={styles.brandLink}>
            <span style={styles.brandIcon}>✈️</span>
            <span className="tripnest-logo-text" style={styles.brandText}>
              TripNest
            </span>
          </Link>

          <div style={styles.leftContent}>
            <span style={styles.leftBadge}>YOUR JOURNEY STARTS HERE</span>
            <h1 style={styles.leftTitle}>
              Plan smarter.
              <br />
              <span style={styles.gradientText}>Travel further.</span>
            </h1>
            <p style={styles.leftSub}>
              Collaborate on itineraries, manage shared budgets, and discover breathtaking destinations in one unified workspace.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>🗺️</span>
                <span>Day-by-day itineraries</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>💰</span>
                <span>Real-time budget & expense tracking</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>👥</span>
                <span>Seamless group collaboration</span>
              </div>
            </div>
          </div>

          <div style={styles.leftFooter}>
            © {new Date().getFullYear()} TripNest Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div style={styles.rightSection}>
        <div style={styles.formCard}>
          <div style={styles.mobileBrand}>
            <Link to="/" style={styles.mobileBrandLink}>
              ✈️ TripNest
            </Link>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back 👋</h2>
            <p style={styles.formSub}>
              Enter your account credentials to access your trips.
            </p>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggleBtn}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Log In to Account →"}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          <p style={styles.switchAuthText}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.switchAuthLink}>
              Create a free account
            </Link>
          </p>

          <div style={styles.homeBackLinkWrapper}>
            <Link to="/" style={styles.homeBackLink}>
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#F7F5FF",
    fontFamily: "var(--font-sans, sans-serif)",
  },

  leftSection: {
    flex: "1.1",
    background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)",
    display: "flex",
    position: "relative",
    overflow: "hidden",
  },

  leftOverlay: {
    width: "100%",
    padding: "48px 56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 1,
  },

  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#ffffff",
  },

  brandIcon: {
    fontSize: "26px",
  },

  brandText: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  leftContent: {
    maxWidth: "520px",
  },

  leftBadge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "5px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    color: "#ffffff",
    marginBottom: "16px",
  },

  leftTitle: {
    fontSize: "clamp(32px, 4vw, 44px)",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.2",
    marginBottom: "16px",
  },

  gradientText: {
    color: "#7dd3fc",
  },

  leftSub: {
    fontSize: "16px",
    color: "#e0f2fe",
    lineHeight: "1.6",
    marginBottom: "32px",
  },

  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },

  featureIcon: {
    fontSize: "18px",
  },

  leftFooter: {
    fontSize: "12px",
    color: "#93c5fd",
  },

  rightSection: {
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: "#F7F5FF",
  },

  formCard: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    padding: "40px 36px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  },

  mobileBrand: {
    display: "none",
    marginBottom: "20px",
    textAlign: "center",
  },

  mobileBrandLink: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    textDecoration: "none",
  },

  formHeader: {
    marginBottom: "24px",
  },

  formTitle: {
    margin: "0 0 6px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },

  formSub: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0 14px",
  },

  inputIcon: {
    fontSize: "14px",
    color: "#94a3b8",
    marginRight: "8px",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px 0",
    fontSize: "14px",
    color: "#0f172a",
    background: "transparent",
  },

  passwordToggleBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px",
  },

  submitBtn: {
    marginTop: "8px",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
    gap: "12px",
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0",
  },

  dividerText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600",
  },

  switchAuthText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },

  switchAuthLink: {
    color: "#0284c7",
    fontWeight: "700",
    textDecoration: "none",
  },

  homeBackLinkWrapper: {
    textAlign: "center",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },

  homeBackLink: {
    fontSize: "13px",
    color: "#64748b",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Login;