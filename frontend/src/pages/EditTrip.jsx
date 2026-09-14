import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function EditTrip() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [trip, setTrip] = useState(null);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: "",
    budget: "",
    status: "PLANNED",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/api/trips/${id}`,
        getAuthConfig()
      );

      console.log("EDIT TRIP DATA:", response.data);
      const data = response.data;
      setTrip(data);

      setFormData({
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        travelers: data.travelers ?? "",
        budget: data.budget ?? "",
        status: data.status || "PLANNED",
      });
    } catch (err) {
      console.error("Error fetching trip:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message || "Unable to load trip details."
      );
    } finally {
      setLoading(false);
    }
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

    if (!formData.startDate || !formData.endDate) {
      alert("Please select start and end dates.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    if (formData.travelers === "" || Number(formData.travelers) < 1) {
      alert("Please enter a valid number of travelers.");
      return;
    }

    if (formData.budget === "" || Number(formData.budget) < 0) {
      alert("Please enter a valid budget.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        destination: trip.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        travelers: Number(formData.travelers),
        budget: Number(formData.budget),
        status: formData.status,
      };

      console.log("UPDATING TRIP:", payload);

      await axios.put(
        `${API_BASE_URL}/api/trips/${id}`,
        payload,
        getAuthConfig()
      );

      alert("Trip updated successfully! ✅");
      navigate(`/trips/${id}`);
    } catch (err) {
      console.error("Error updating trip:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      alert(
        err.response?.data?.message ||
          "Unable to update trip. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar activePage="/trips" />
        <div style={styles.centerBox}>
          <div style={styles.loadingEmoji}>⏳</div>
          <h2>Loading trip details...</h2>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={styles.page}>
        <Navbar activePage="/trips" />
        <div style={styles.centerBox}>
          <div style={styles.errorEmoji}>⚠️</div>
          <h2>Unable to load trip</h2>
          <p style={styles.errorText}>{error || "Trip not found."}</p>
          <Link to="/trips" style={styles.primaryBtn}>
            ← Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const destinationName =
    trip.destination?.name ||
    trip.destination?.destinationName ||
    "Destination";

  return (
    <div style={styles.page}>
      <Navbar activePage="/trips" />

      <main style={styles.container}>
        <div style={styles.card}>
          {/* Destination Header Banner */}
          <div style={styles.destBannerWrap}>
            <img
              src={getDestinationImageUrl(destinationName)}
              alt={destinationName}
              style={styles.destBannerImg}
              onError={handleImageError}
            />
            <div style={styles.destBannerOverlay}>
              <span style={styles.badge}>TRIP SETTINGS</span>
              <h1 style={styles.titleWhite}>Edit {destinationName} Trip</h1>
              <p style={styles.subtitleWhite}>
                Update travel dates, guest count, status, or overall budget.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.formBody}>
            {/* DATES GRID */}
            <div style={styles.grid2Col}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Start Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  End Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* TRAVELERS & BUDGET GRID */}
            <div style={styles.grid2Col}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Travelers Count <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="travelers"
                  value={formData.travelers}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Trip Budget (₹) <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* STATUS */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Trip Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="PLANNED">Planned (Upcoming)</option>
                <option value="ACTIVE">Active (In Progress)</option>
                <option value="COMPLETED">Completed (Past)</option>
              </select>
            </div>

            {/* ACTIONS */}
            <div style={styles.actions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate(`/trips/${id}`)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.submitBtn}
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "✓ Update Trip"}
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
    background: "#F7F5FF",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    maxWidth: "760px",
    width: "92%",
    margin: "36px auto 60px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  },

  destBannerWrap: {
    position: "relative",
    width: "100%",
    height: "170px",
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },

  destBannerImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  destBannerOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.45) 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "24px 36px",
    color: "#ffffff",
  },

  titleWhite: {
    margin: "4px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitleWhite: {
    margin: 0,
    fontSize: "13px",
    color: "#e0f2fe",
    lineHeight: "1.4",
  },

  formBody: {
    padding: "32px 36px 36px",
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

  centerBox: {
    padding: "80px 20px",
    textAlign: "center",
    maxWidth: "460px",
    margin: "0 auto",
  },

  loadingEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  errorEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  errorText: {
    color: "#dc2626",
    fontSize: "14px",
    marginBottom: "16px",
  },

  primaryBtn: {
    display: "inline-block",
    background: "#0284c7",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    textDecoration: "none",
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

  select: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    boxSizing: "border-box",
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
    cursor: "pointer",
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

export default EditTrip;