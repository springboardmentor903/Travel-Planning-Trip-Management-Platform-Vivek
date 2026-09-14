import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";

function CreateItinerary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dayNumber: "",
    date: "",
    title: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.dayNumber) {
      setError("Please enter a valid day number.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter the activity title.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        dayNumber: Number(formData.dayNumber),
        date: formData.date || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      await axios.post(
        `${API_BASE_URL}/api/trips/${id}/itineraries`,
        payload,
        getAuthConfig()
      );

      alert("Itinerary activity created successfully! 🎉");
      navigate(`/trips/${id}`);
    } catch (err) {
      console.error("Error creating itinerary:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          "Unable to create itinerary. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar activePage="/trips" />

      <main style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.headerIcon}>🗓️</div>
            <div>
              <span style={styles.badge}>ACTIVITY PLANNER</span>
              <h1 style={styles.title}>Add Itinerary Activity</h1>
              <p style={styles.subtitle}>
                Schedule a new stop, tour, sightseeing activity, or dinner plan.
              </p>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.grid2Col}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Day Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="dayNumber"
                  min="1"
                  value={formData.dayNumber}
                  onChange={handleChange}
                  placeholder="e.g. 1"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date (optional)</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Activity Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Morning Scuba Diving at Grand Island"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description & Notes</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add meeting spots, timings, dress codes, or booking reference numbers..."
                rows="4"
                style={styles.textarea}
              />
            </div>

            <div style={styles.actions}>
              <Link to={`/trips/${id}`} style={styles.cancelBtn}>
                Cancel
              </Link>

              <button
                type="submit"
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Adding..." : "＋ Add to Itinerary"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    maxWidth: "680px",
    width: "92%",
    margin: "36px auto 60px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    padding: "36px 40px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "28px",
    paddingBottom: "24px",
    borderBottom: "1px solid #f1f5f9",
  },

  headerIcon: {
    fontSize: "32px",
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  badge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "800",
    color: "#0284c7",
    letterSpacing: "1px",
    marginBottom: "4px",
  },

  title: {
    margin: "0 0 4px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "22px",
    fontSize: "14px",
    fontWeight: "600",
  },

  formGroup: {
    marginBottom: "20px",
  },

  grid2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "8px",
  },

  required: {
    color: "#ef4444",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9",
  },

  cancelBtn: {
    padding: "11px 20px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
  },

  submitBtn: {
    padding: "11px 26px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
  },
};

export default CreateItinerary;