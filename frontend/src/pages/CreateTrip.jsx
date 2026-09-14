import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function CreateTrip() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Destination search states
  const [destinationSearch, setDestinationSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchingDestinations, setSearchingDestinations] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const searchTimeoutRef = useRef(null);

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    travelers: 1,
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
    }
  }, [navigate]);

  const searchDestinations = (query) => {
    setDestinationSearch(query);
    setSelectedDestination(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingDestinations(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/api/destinations/search`,
          {
            params: { query: query.trim() },
            ...getAuthConfig(),
          }
        );

        const places = response.data?.places || [];
        setSuggestions(places);
      } catch (err) {
        console.error("Destination search error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setSuggestions([]);
        setError("Unable to search destinations.");
      } finally {
        setSearchingDestinations(false);
      }
    }, 400);
  };

  const handleSelectDestination = (place) => {
    const name = place?.displayName?.text || place?.displayName || "";
    const address = place?.formattedAddress || "";

    setSelectedDestination({
      name,
      address,
      googlePlaceId: place?.id || "",
    });

    setDestinationSearch(name);
    setSuggestions([]);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDestination) {
      setError("Please search and select a destination from the suggestions.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select start and end dates.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (!form.travelers || Number(form.travelers) < 1) {
      setError("Travelers count must be at least 1.");
      return;
    }

    if (!form.budget || Number(form.budget) < 0) {
      setError("Please enter a valid estimated budget.");
      return;
    }

    try {
      setSaving(true);

      const destinationResponse = await axios.post(
        `${API_BASE_URL}/api/destinations/create-or-get`,
        { name: selectedDestination.name },
        getAuthConfig()
      );

      const destination = destinationResponse.data;

      const tripData = {
        destination: { id: destination.id },
        startDate: form.startDate,
        endDate: form.endDate,
        travelers: Number(form.travelers),
        budget: Number(form.budget),
        status: form.status,
      };

      await axios.post(`${API_BASE_URL}/api/trips`, tripData, getAuthConfig());

      alert("Trip created successfully! 🎉");
      navigate("/trips");
    } catch (err) {
      console.error("Error creating trip:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          "Unable to create trip. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar activePage="/trips" />

      <main style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>✈️</div>
            <div>
              <h1 style={styles.title}>Create a New Trip</h1>
              <p style={styles.subtitle}>
                Start planning your next adventure by setting your destination, dates, and budget.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* DESTINATION SEARCH */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Search Destination <span style={styles.required}>*</span>
              </label>

              <div style={styles.searchContainer}>
                <input
                  type="text"
                  value={destinationSearch}
                  onChange={(e) => searchDestinations(e.target.value)}
                  placeholder="Type city or place (e.g. Goa, Paris, Tokyo, Manali)"
                  style={styles.input}
                  autoComplete="off"
                  required
                />
                {searchingDestinations && (
                  <span style={styles.searchSpinner}>⏳</span>
                )}

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div style={styles.dropdown}>
                    {suggestions.map((place, index) => {
                      const name =
                        place?.displayName?.text || place?.displayName || "Unknown";
                      const address = place?.formattedAddress || "";

                      return (
                        <div
                          key={place?.id || index}
                          style={styles.dropdownItem}
                          onClick={() => handleSelectDestination(place)}
                        >
                          <div style={styles.placeName}>📍 {name}</div>
                          {address && (
                            <div style={styles.placeAddress}>{address}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedDestination && (
                <div style={styles.selectedDestPreview}>
                  <div style={styles.destPreviewWrap}>
                    <img
                      src={getDestinationImageUrl(selectedDestination.name)}
                      alt={selectedDestination.name}
                      style={styles.destPreviewImg}
                      onError={handleImageError}
                    />
                  </div>
                  <div style={styles.selectedBadge}>
                    ✅ Selected: <strong>{selectedDestination.name}</strong>
                    {selectedDestination.address && (
                      <span style={styles.selectedAddr}> — {selectedDestination.address}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DATES GRID */}
            <div style={styles.grid2Col}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Start Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
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
                  value={form.endDate}
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
                  Number of Travelers <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="travelers"
                  value={form.travelers}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="1"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Total Estimated Budget (₹) <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g. 50000"
                  required
                />
              </div>
            </div>

            {/* STATUS */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Trip Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="PLANNED">Planned (Upcoming)</option>
                <option value="ACTIVE">Active (In Progress)</option>
                <option value="COMPLETED">Completed (Past)</option>
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div style={styles.actions}>
              <Link to="/trips" style={styles.cancelBtn}>
                Cancel
              </Link>

              <button
                type="submit"
                style={styles.submitBtn}
                disabled={saving}
              >
                {saving ? "Creating Trip..." : "＋ Create Trip"}
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
    fontSize: "36px",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  title: {
    margin: "0 0 6px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
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
    transition: "border-color 0.15s",
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

  searchContainer: {
    position: "relative",
  },

  searchSpinner: {
    position: "absolute",
    right: "14px",
    top: "12px",
    fontSize: "16px",
  },

  dropdown: {
    position: "absolute",
    top: "105%",
    left: 0,
    right: 0,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 100,
    maxHeight: "240px",
    overflowY: "auto",
  },

  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s",
  },

  placeName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },

  placeAddress: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },

  selectedDestPreview: {
    marginTop: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  destPreviewWrap: {
    width: "100%",
    height: "150px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    backgroundColor: "#e2e8f0",
  },

  destPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  selectedBadge: {
    padding: "10px 14px",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#065f46",
  },

  selectedAddr: {
    color: "#047857",
    fontWeight: "400",
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

export default CreateTrip;