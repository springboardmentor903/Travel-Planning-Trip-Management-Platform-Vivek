import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// ─── Inline SVG Icons ──────────────────────────────────────────────────────

const IconMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCloud = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconWind = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>
);

const IconDroplet = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

// Destination category icons
const IconMonument = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="18" width="18" height="3" rx="1" />
    <rect x="6" y="10" width="3" height="8" />
    <rect x="15" y="10" width="3" height="8" />
    <rect x="10.5" y="6" width="3" height="12" />
    <path d="M3 10h18M12 3l-9 7h18L12 3z" />
  </svg>
);

const IconBeach = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21H7" />
    <path d="M12 21V12" />
    <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

const IconMountain = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 20 9 4 15 14 18 10 22 20" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconDestination = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Pick icon by destination name keyword
function getDestinationIcon(name = "") {
  const n = name.toLowerCase();
  if (["delhi", "jaipur", "agra", "mumbai", "lucknow", "bhopal", "patna", "indore"].some((k) => n.includes(k)))
    return <IconMonument />;
  if (["goa", "beach", "puri", "rameshwaram", "mahabalipuram", "pondicherry"].some((k) => n.includes(k)))
    return <IconBeach />;
  if (["manali", "shimla", "leh", "kedarnath", "dharamshala", "mussoorie", "ooty", "kodaikanal", "nainital", "pachmarhi"].some((k) => n.includes(k)))
    return <IconMountain />;
  return <IconDestination />;
}

// Destination taglines
function getDestinationTagline(name = "", description = "") {
  const n = name.toLowerCase();
  if (n.includes("delhi")) return "Capital of India";
  if (n.includes("goa")) return "Beaches & Beyond";
  if (n.includes("manali")) return "Mountains & Adventure";
  if (n.includes("jaipur")) return "The Pink City";
  if (n.includes("agra")) return "Land of the Taj Mahal";
  if (n.includes("shimla")) return "Queen of Hill Stations";
  if (n.includes("mumbai")) return "City of Dreams";
  if (n.includes("varanasi") || n.includes("banaras")) return "The Spiritual Capital";
  if (n.includes("leh") || n.includes("ladakh")) return "Land of High Passes";
  if (n.includes("ooty")) return "Queen of the Nilgiris";
  if (n.includes("nainital")) return "Lake District of India";
  if (n.includes("pachmarhi")) return "Queen of Satpura";
  if (n.includes("mathura") || n.includes("vrindavan")) return "Land of Lord Krishna";
  if (description) return description.slice(0, 45) + (description.length > 45 ? "…" : "");
  return "Explore this destination";
}

// ─── Extract weather fields from any API response shape ────────────────────
function extractWeatherFields(data) {
  if (!data) return null;
  const temp =
    data.temperature != null ? data.temperature
    : data.temp != null ? data.temp
    : data.main?.temp != null ? Math.round(data.main.temp)
    : null;

  const humidity =
    data.humidity != null ? data.humidity
    : data.main?.humidity != null ? data.main.humidity
    : null;

  const windSpeedVal =
    data.windSpeed != null ? data.windSpeed
    : data.wind != null
      ? (typeof data.wind === "object" ? (data.wind.speed ?? null) : data.wind)
      : null;

  const condition =
    data.condition || data.description
    || (Array.isArray(data.weather) ? data.weather[0]?.description : null)
    || "—";

  const city = data.city || data.name || "";

  return { temp, humidity, windSpeed: windSpeedVal, condition, city };
}

// Category icons
function getCategoryIcon(cat = "") {
  const c = (cat || "").toUpperCase();
  if (c.includes("FOOD")) return "🍽️";
  if (c.includes("ACCOMMODATION") || c.includes("HOTEL")) return "🏨";
  if (c.includes("TRANSPORT")) return "🚗";
  if (c.includes("ACTIVITIES") || c.includes("ACTIVITY")) return "🎟️";
  if (c.includes("SHOPPING")) return "🛍️";
  return "🏷️";
}

// ─── Component ─────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);

  const [travelerData, setTravelerData] = useState({
    upcomingTrips: [],
    budgetOverview: { totalBudget: 0, totalSpent: 0 },
    expenseSummary: [],
    favoriteDestinations: [],
    mostVisitedDestinations: [],
    travelStats: { totalTrips: 0, totalDestinations: 0, totalSpent: 0 },
  });

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GLOBAL WEATHER STATES (existing — untouched)
  // =====================================================

  const [weatherCity, setWeatherCity] = useState("Delhi");
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // =====================================================
  // PER-TRIP WEATHER CACHE
  // Key: lowercase city name
  // Value: { loading: bool, data: object|null, error: string|null }
  // =====================================================
  const [tripWeatherMap, setTripWeatherMap] = useState({});
  // Ref to prevent stale-closure double-fetching
  const tripWeatherFetchedRef = useRef(new Set());

  // Chart type selector for Expense Summary: "pie" | "bar"
  const [expenseChartType, setExpenseChartType] = useState("pie");

  const rawName = localStorage.getItem("userName") || "Traveler";
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "ADMINISTRATOR";
  const displayName =
    rawName.toLowerCase().startsWith("default") || isAdmin
      ? "Admin"
      : rawName.split(" ")[0];

  // =====================================================
  // AUTH CONFIG
  // =====================================================

  const getAuthConfig = () => {
    const currentToken = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    };
  };

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      navigate("/login");
      return;
    }

    fetchTravelerDashboard();
    fetchPopularDestinations();
    fetchWeather("Delhi");

    const handleFocus = () => {
      fetchTravelerDashboard();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // PER-TRIP WEATHER: fetch when trips load
  // =====================================================

  useEffect(() => {
    if (!trips || trips.length === 0) return;

    const uniqueCities = [];
    const seen = new Set();

    for (const trip of trips) {
      const raw =
        trip.destination?.name ||
        trip.destination?.destinationName ||
        "";
      if (!raw.trim()) continue;

      // Use only the first word/city part for API — avoids "Shree Somnath Temple" → tries "Shree"
      // Instead use the full name; the API handles it gracefully
      const city = raw.trim();
      const key = city.toLowerCase();

      if (!seen.has(key) && !tripWeatherFetchedRef.current.has(key)) {
        seen.add(key);
        uniqueCities.push(city);
      }
    }

    if (uniqueCities.length === 0) return;

    // Mark as fetching immediately to avoid double-fetch
    uniqueCities.forEach((city) => tripWeatherFetchedRef.current.add(city.toLowerCase()));

    // Set loading state for all new cities at once
    setTripWeatherMap((prev) => {
      const next = { ...prev };
      uniqueCities.forEach((city) => {
        next[city.toLowerCase()] = { loading: true, data: null, error: null };
      });
      return next;
    });

    // Fetch each city independently
    uniqueCities.forEach(async (city) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/weather/${encodeURIComponent(city.trim())}`,
          getAuthConfig()
        );
        const fields = extractWeatherFields(response.data);
        setTripWeatherMap((prev) => ({
          ...prev,
          [city.toLowerCase()]: { loading: false, data: fields, error: null },
        }));
      } catch (err) {
        // Silently fail — card still renders without weather
        setTripWeatherMap((prev) => ({
          ...prev,
          [city.toLowerCase()]: { loading: false, data: null, error: "unavailable" },
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  // =====================================================
  // GET AGGREGATED TRAVELER DASHBOARD
  // =====================================================

  const fetchTravelerDashboard = async () => {
    try {
      setLoadingTrips(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/traveler`,
        getAuthConfig()
      );

      console.log("Traveler Dashboard Data:", response.data);

      if (response.data) {
        setTravelerData({
          upcomingTrips: response.data.upcomingTrips || [],
          budgetOverview: response.data.budgetOverview || { totalBudget: 0, totalSpent: 0 },
          expenseSummary: response.data.expenseSummary || [],
          favoriteDestinations: response.data.favoriteDestinations || [],
          mostVisitedDestinations: response.data.mostVisitedDestinations || [],
          travelStats: response.data.travelStats || { totalTrips: 0, totalDestinations: 0, totalSpent: 0 },
        });

        if (Array.isArray(response.data.upcomingTrips)) {
          setTrips(response.data.upcomingTrips);
        } else {
          setTrips([]);
        }
      }
    } catch (err) {
      console.error("Error fetching traveler dashboard:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError("Unable to load traveler dashboard data.");
    } finally {
      setLoadingTrips(false);
    }
  };

  // =====================================================
  // GET POPULAR DESTINATIONS
  // =====================================================

  const fetchPopularDestinations = async () => {
    try {
      setLoadingDestinations(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/destinations/popular`,
        getAuthConfig(),
      );

      console.log("Popular Destinations:", response.data);

      if (Array.isArray(response.data)) {
        setPopularDestinations(response.data);
      } else {
        setPopularDestinations([]);
      }
    } catch (err) {
      console.error("Error fetching popular destinations:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setError("Unable to load popular destinations.");
    } finally {
      setLoadingDestinations(false);
    }
  };

  // =====================================================
  // WEATHER API (global widget — existing, untouched)
  // =====================================================

  const fetchWeather = async (city) => {
    if (!city || city.trim() === "") {
      setWeatherError("Please enter a city name.");
      return;
    }

    try {
      setLoadingWeather(true);
      setWeatherError("");

      const response = await axios.get(
        `${API_BASE_URL}/api/weather/${encodeURIComponent(city.trim())}`,
        getAuthConfig(),
      );

      console.log("Weather Response:", response.data);
      setWeather(response.data);
    } catch (err) {
      console.error("Error fetching weather:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setWeather(null);
      setWeatherError("Unable to load weather. Please check the city name.");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Status color helper
  const getStatusBadgeStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "IN_PROGRESS":
      case "ONGOING":
        return {
          background: "#ecfdf5",
          color: "#059669",
          border: "1px solid #a7f3d0",
        };
      case "COMPLETED":
        return {
          background: "#f1f5f9",
          color: "#475569",
          border: "1px solid #cbd5e1",
        };
      case "PLANNED":
      default:
        return {
          background: "#eff6ff",
          color: "#2563eb",
          border: "1px solid #bfdbfe",
        };
    }
  };

  return (
    <div style={styles.page}>
      {/* Shared Navbar */}
      <Navbar activePage="/dashboard" />

      <main style={styles.container}>
        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        {/* =================================================
            HERO WELCOME BANNER
        ================================================= */}
        <section style={styles.welcomeBanner}>
          <div style={styles.welcomeContent}>
            <span style={styles.welcomeBadge}>✈️ READY FOR ADVENTURE</span>
            <h1 style={styles.welcomeTitle}>
              Welcome back, {displayName}! 👋
            </h1>
            <p style={styles.welcomeSubtitle}>
              Here is an overview of your journeys, upcoming itineraries, and
              destination ideas.
            </p>
          </div>

          <div style={styles.welcomeActions}>
            {!isAdmin && (
              <Link to="/trips/create" style={styles.primaryActionButton} id="dashboard-create-trip-btn">
                <span>＋</span>
                <span>Create New Trip</span>
              </Link>
            )}
            <Link to="/destinations" style={styles.secondaryActionButton} id="dashboard-explore-places-btn">
              <span>🌍</span>
              <span>Explore Places</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" style={styles.primaryActionButton} id="dashboard-admin-console-btn">
                <span>🛡️</span>
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </section>

        {/* =================================================
            STATS OVERVIEW
        ================================================= */}
        <section style={styles.statsGrid}>
          {/* Card 1 */}
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIconBox,
                background: "#f0f9ff",
                color: "#0284c7",
              }}
            >
              ✈️
            </div>
            <div>
              <div style={styles.statLabel}>Total Trips</div>
              <div style={styles.statNumber}>{travelerData.travelStats?.totalTrips ?? 0}</div>
              <div style={styles.statSubText}>Your travel adventures</div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIconBox,
                background: "#ecfdf5",
                color: "#059669",
              }}
            >
              🗓️
            </div>
            <div>
              <div style={styles.statLabel}>Upcoming Trips</div>
              <div style={styles.statNumber}>
                {travelerData.upcomingTrips?.length ?? 0}
              </div>
              <div style={styles.statSubText}>Planned journeys</div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIconBox,
                background: "#f5f3ff",
                color: "#6d28d9",
              }}
            >
              🗺️
            </div>
            <div>
              <div style={styles.statLabel}>Destinations Visited</div>
              <div style={styles.statNumber}>{travelerData.travelStats?.totalDestinations ?? 0}</div>
              <div style={styles.statSubText}>Unique places</div>
            </div>
          </div>

          {/* Card 4 */}
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIconBox,
                background: "#fffbeb",
                color: "#b45309",
              }}
            >
              💰
            </div>
            <div>
              <div style={styles.statLabel}>Total Spent</div>
              <div style={styles.statNumber}>
                ₹{Number(travelerData.travelStats?.totalSpent || 0).toLocaleString()}
              </div>
              <div style={styles.statSubText}>Across all trips</div>
            </div>
          </div>
        </section>

        {/* =================================================
            FINANCIAL OVERVIEW (BUDGET & EXPENSES)
        ================================================= */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionHeading}>Financial Overview</h2>
              <p style={styles.sectionSub}>Budget tracking and expense distribution across all trips</p>
            </div>
          </div>

          <div style={styles.twoColGrid}>
            {/* Budget Overview Card */}
            <div style={styles.cardBox}>
              <div style={styles.cardBoxHeader}>
                <div style={styles.cardBoxIconWrap}>💰</div>
                <div>
                  <h3 style={styles.cardBoxTitle}>Budget Overview</h3>
                  <p style={styles.cardBoxSub}>Across all your journeys</p>
                </div>
              </div>

              <div style={styles.budgetMetricsRow}>
                <div style={styles.budgetMetricItem}>
                  <span style={styles.budgetMetricLabel}>Total Budget</span>
                  <span style={styles.budgetMetricVal}>
                    ₹{Number(travelerData.budgetOverview?.totalBudget || 0).toLocaleString()}
                  </span>
                </div>
                <div style={styles.budgetMetricItem}>
                  <span style={styles.budgetMetricLabel}>Total Spent</span>
                  <span style={{ ...styles.budgetMetricVal, color: "#0284c7" }}>
                    ₹{Number(travelerData.budgetOverview?.totalSpent || 0).toLocaleString()}
                  </span>
                </div>
                <div style={styles.budgetMetricItem}>
                  <span style={styles.budgetMetricLabel}>Remaining</span>
                  <span style={{
                    ...styles.budgetMetricVal,
                    color: (travelerData.budgetOverview?.totalBudget || 0) >= (travelerData.budgetOverview?.totalSpent || 0) ? "#10b981" : "#ef4444"
                  }}>
                    ₹{Number(Math.max(0, (travelerData.budgetOverview?.totalBudget || 0) - (travelerData.budgetOverview?.totalSpent || 0))).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const totalB = Number(travelerData.budgetOverview?.totalBudget || 0);
                const totalS = Number(travelerData.budgetOverview?.totalSpent || 0);
                const pct = totalB > 0 ? Math.min(100, Math.round((totalS / totalB) * 100)) : 0;
                return (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressLabelRow}>
                      <span>Budget Utilized</span>
                      <strong>{pct}%</strong>
                    </div>
                    <div style={styles.progressBarTrack}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${pct}%`,
                          background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#0284c7",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Expense Summary by Category Card */}
            <div style={styles.cardBox}>
              <div style={styles.cardBoxHeaderWithControl}>
                <div style={styles.cardBoxHeaderLeft}>
                  <div style={styles.cardBoxIconWrap}>📊</div>
                  <div>
                    <h3 style={styles.cardBoxTitle}>Expense Summary</h3>
                    <p style={styles.cardBoxSub}>Category breakdown across all trips</p>
                  </div>
                </div>

                {travelerData.expenseSummary.length > 0 && (
                  <div style={styles.chartControlWrap}>
                    <span style={styles.chartControlLabel}>Chart Type:</span>
                    <div style={styles.chartSegmentWrap}>
                      <button
                        type="button"
                        style={{
                          ...styles.chartSegmentBtn,
                          ...(expenseChartType === "pie" ? styles.chartSegmentBtnActive : {}),
                        }}
                        onClick={() => setExpenseChartType("pie")}
                        id="expense-chart-pie-btn"
                      >
                        🥧 Pie
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.chartSegmentBtn,
                          ...(expenseChartType === "bar" ? styles.chartSegmentBtnActive : {}),
                        }}
                        onClick={() => setExpenseChartType("bar")}
                        id="expense-chart-bar-btn"
                      >
                        📊 Bar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {travelerData.expenseSummary.length === 0 ? (
                <div style={styles.emptyCardMini}>
                  <p style={{ margin: "0 0 6px", fontWeight: "600", color: "#475569" }}>
                    No expenses recorded yet.
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#94a3b8" }}>
                    Start adding expenses in your trips to see your spending breakdown.
                  </p>
                  <Link to="/trips" style={styles.miniActionBtn}>
                    ＋ Add Expense
                  </Link>
                </div>
              ) : (
                (() => {
                  const expenseList = travelerData.expenseSummary;
                  const totalS = expenseList.reduce(
                    (sum, item) => sum + Number(item.amount || 0),
                    0
                  );
                  const labels = expenseList.map((item) => item.category || "Other");
                  const amounts = expenseList.map((item) => Number(item.amount || 0));
                  const colors = [
                    "#0284c7",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ec4899",
                    "#64748b",
                    "#06b6d4",
                  ];

                  const pieData = {
                    labels,
                    datasets: [
                      {
                        data: amounts,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: "#ffffff",
                      },
                    ],
                  };

                  const pieOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const val = context.raw || 0;
                            const pct = totalS > 0 ? Math.round((val / totalS) * 100) : 0;
                            return ` ₹${Number(val).toLocaleString()} (${pct}%)`;
                          },
                        },
                      },
                    },
                  };

                  const barData = {
                    labels,
                    datasets: [
                      {
                        label: "Expenses (₹)",
                        data: amounts,
                        backgroundColor: colors.slice(0, labels.length),
                        borderRadius: 8,
                      },
                    ],
                  };

                  const barOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            ` ₹${Number(context.parsed.y || 0).toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (val) => `₹${Number(val).toLocaleString()}`,
                          font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
                        },
                        grid: { color: "#f1f5f9" },
                      },
                      x: {
                        grid: { display: false },
                        ticks: {
                          font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
                        },
                      },
                    },
                  };

                  return (
                    <div>
                      {/* Dynamic Chart Container */}
                      <div style={styles.dashboardChartBox}>
                        {expenseChartType === "pie" ? (
                          <Pie data={pieData} options={pieOptions} />
                        ) : (
                          <Bar data={barData} options={barOptions} />
                        )}
                      </div>

                      {/* Total Metric Strip */}
                      <div style={styles.chartTotalStrip}>
                        <span style={styles.chartTotalLabel}>Total:</span>
                        <strong style={styles.chartTotalAmount}>
                          ₹{totalS.toLocaleString()}
                        </strong>
                      </div>

                      {/* Category Breakdown Progress Bars */}
                      <div style={styles.categoryList}>
                        {expenseList.map((item) => {
                          const amount = Number(item.amount || 0);
                          const pct =
                            totalS > 0 ? Math.round((amount / totalS) * 100) : 0;
                          return (
                            <div key={item.category} style={styles.categoryItem}>
                              <div style={styles.categoryHeaderRow}>
                                <div style={styles.categoryNameWrap}>
                                  <span>{getCategoryIcon(item.category)}</span>
                                  <span style={styles.categoryName}>{item.category}</span>
                                </div>
                                <span style={styles.categoryAmount}>
                                  ₹{amount.toLocaleString()} ({pct}%)
                                </span>
                              </div>
                              <div style={styles.categoryBarTrack}>
                                <div
                                  style={{
                                    ...styles.categoryBarFill,
                                    width: `${pct}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            DESTINATION INSIGHTS (FAVORITE & MOST-VISITED)
        ================================================= */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionHeading}>Destination Insights</h2>
              <p style={styles.sectionSub}>Your preferred locations and travel history</p>
            </div>
          </div>

          <div style={styles.twoColGrid}>
            {/* Favorite Destination */}
            <div style={styles.cardBox}>
              <div style={styles.cardBoxHeader}>
                <div style={styles.cardBoxIconWrap}>⭐</div>
                <div>
                  <h3 style={styles.cardBoxTitle}>Favorite Destination</h3>
                  <p style={styles.cardBoxSub}>Selected in your personal profile</p>
                </div>
              </div>

              {travelerData.favoriteDestinations && travelerData.favoriteDestinations.length > 0 ? (
                travelerData.favoriteDestinations.map((fav) => (
                  <div key={fav.id || fav.name} style={styles.favoriteHighlightCard}>
                    <div style={styles.favBadgeRow}>
                      <span style={styles.favBadge}>PROFILE FAVORITE</span>
                    </div>
                    <h4 style={styles.favDestName}>{fav.name}</h4>
                    <p style={styles.favDestSub}>Your designated top choice for upcoming journeys.</p>
                    <Link to="/destinations" style={styles.exploreLinkBtn}>
                      Explore Places →
                    </Link>
                  </div>
                ))
              ) : (
                <div style={styles.emptyCardMini}>
                  <p>No favorite destination saved yet.</p>
                  <Link to="/profile" style={styles.setFavoriteLink}>
                    Set Favorite in Profile →
                  </Link>
                </div>
              )}
            </div>

            {/* Most Visited Destinations */}
            <div style={styles.cardBox}>
              <div style={styles.cardBoxHeader}>
                <div style={styles.cardBoxIconWrap}>📍</div>
                <div>
                  <h3 style={styles.cardBoxTitle}>Most-Visited Destinations</h3>
                  <p style={styles.cardBoxSub}>Calculated from your trip records</p>
                </div>
              </div>

              {travelerData.mostVisitedDestinations && travelerData.mostVisitedDestinations.length > 0 ? (
                <div style={styles.visitedList}>
                  {travelerData.mostVisitedDestinations.slice(0, 5).map((dest, idx) => (
                    <div key={dest.destination || idx} style={styles.visitedItem}>
                      <div style={styles.visitedRankName}>
                        <span style={styles.rankBadge}>#{idx + 1}</span>
                        <span style={styles.visitedName}>{dest.destination}</span>
                      </div>
                      <span style={styles.tripCountPill}>
                        {dest.tripCount} {dest.tripCount === 1 ? "trip" : "trips"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyCardMini}>
                  <p>No trip records yet. Start traveling to build your history!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            UPCOMING TRIPS SECTION
        ================================================= */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionHeading}>Upcoming Trips</h2>
              <p style={styles.sectionSub}>Soonest upcoming journeys planned for you</p>
            </div>

            <Link to="/trips" style={styles.viewAllLink}>
              View All Trips →
            </Link>
          </div>

          {loadingTrips ? (
            <div style={styles.tripsGrid}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={styles.tripSkeletonCard}>
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "170px" }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div className="skeleton-shimmer" style={{ height: "20px", width: "65%", marginBottom: "8px" }} />
                    <div className="skeleton-shimmer" style={{ height: "14px", width: "40%", marginBottom: "20px" }} />
                    <div className="skeleton-shimmer" style={{ height: "60px", marginBottom: "16px" }} />
                    <div className="skeleton-shimmer" style={{ height: "40px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>✈️</div>
              <h3 style={styles.emptyTitle}>No upcoming trips found</h3>
              <p style={styles.emptySubtitle}>
                {isAdmin
                  ? "You are signed in as an Administrator. Monitor trips and platform metrics from the Admin Console."
                  : "You don't have any future journeys scheduled. Plan your next adventure now!"}
              </p>
              {!isAdmin ? (
                <Link to="/trips/create" style={styles.primaryActionButton} id="dashboard-empty-plan-trip-btn">
                  ＋ Plan Your Next Trip
                </Link>
              ) : (
                <Link to="/admin" style={styles.primaryActionButton} id="dashboard-empty-admin-console-btn">
                  🛡️ Open Admin Console
                </Link>
              )}
            </div>
          ) : (
            <div style={styles.tripsGrid}>
              {trips.slice(0, 6).map((trip) => {
                const destName =
                  trip.destination?.name ||
                  trip.destination?.destinationName ||
                  "Dream Destination";

                const tripName = trip.name || trip.tripName || destName;

                const weatherKey = destName.toLowerCase();
                const tripWx = tripWeatherMap[weatherKey];

                return (
                  <div
                    key={trip.id}
                    style={styles.tripCard}
                    className="trip-card-hover"
                  >
                    {/* ── Card Top: Real destination image + status badge overlay ── */}
                    <div style={styles.tripImageWrap}>
                      <img
                        src={getDestinationImageUrl(destName)}
                        alt={destName || tripName}
                        loading="lazy"
                        style={styles.tripImage}
                        onError={handleImageError}
                      />
                      <div style={styles.tripStatusOverlay}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...getStatusBadgeStyle(trip.status),
                            backdropFilter: "blur(6px)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
                          }}
                        >
                          {trip.status || "PLANNED"}
                        </span>
                      </div>
                    </div>

                    {/* ── Trip Name ── */}
                    <div style={styles.tripCardBody}>
                      <h3 style={styles.tripCardTitle}>{tripName}</h3>

                      {/* Destination row */}
                      <div style={styles.tripInfoRow}>
                        <span style={styles.tripInfoIcon}><IconLocation /></span>
                        <span style={styles.tripInfoText}>{destName}</span>
                      </div>

                      {/* Dates row */}
                      <div style={styles.tripInfoRow}>
                        <span style={styles.tripInfoIcon}><IconCalendar /></span>
                        <span style={styles.tripInfoText}>
                          {formatDate(trip.startDate)}
                          {trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""}
                        </span>
                      </div>

                      {/* ── Weather block ── */}
                      <div style={styles.tripWeatherBlock}>
                        <div style={styles.tripWeatherHeader}>
                          <span style={styles.tripWeatherIcon}><IconCloud /></span>
                          <span style={styles.tripWeatherLabel}>Weather</span>
                        </div>

                        {!tripWx || tripWx.loading ? (
                          <div style={styles.tripWeatherLoading}>
                            {!tripWx ? "—" : "Loading…"}
                          </div>
                        ) : tripWx.error || !tripWx.data ? (
                          <div style={styles.tripWeatherUnavailable}>
                            Weather unavailable
                          </div>
                        ) : (
                          <div>
                            <div style={styles.tripWeatherMain}>
                              {tripWx.data.temp != null && (
                                <span style={styles.tripWeatherTemp}>
                                  {tripWx.data.temp}°C
                                </span>
                              )}
                              {tripWx.data.condition && (
                                <span style={styles.tripWeatherCondition}>
                                  · {tripWx.data.condition}
                                </span>
                              )}
                            </div>
                            {(tripWx.data.humidity != null || tripWx.data.windSpeed != null) && (
                              <div style={styles.tripWeatherMeta}>
                                {tripWx.data.humidity != null && (
                                  <span style={styles.tripWeatherMetaItem}>
                                    <IconDroplet />
                                    <span>{tripWx.data.humidity}%</span>
                                  </span>
                                )}
                                {tripWx.data.windSpeed != null && (
                                  <span style={styles.tripWeatherMetaItem}>
                                    <IconWind />
                                    <span>{tripWx.data.windSpeed} km/h</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Footer: Budget + View Details ── */}
                      <div style={styles.tripCardFooter}>
                        <div style={styles.tripBudget}>
                          <span style={styles.budgetLabel}>Budget</span>
                          <span style={styles.budgetValue}>
                            {trip.budget
                              ? `₹${Number(trip.budget).toLocaleString()}`
                              : `${trip.travelers || 1} Traveler${(trip.travelers || 1) > 1 ? "s" : ""}`}
                          </span>
                        </div>

                        <button
                          style={styles.viewDetailsBtn}
                          className="view-details-btn-hover"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            TRENDING DESTINATIONS — REDESIGNED
        ================================================= */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionHeading}>Trending Destinations</h2>
              <p style={styles.sectionSub}>
                Popular places to inspire your next travel itinerary
              </p>
            </div>

            <Link to="/destinations" style={styles.viewAllLink}>
              Browse All Places →
            </Link>
          </div>

          {loadingDestinations ? (
            <div style={styles.destGrid}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={styles.destSkeletonCard}>
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "140px" }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div className="skeleton-shimmer" style={{ height: "18px", width: "55%", marginBottom: "8px" }} />
                    <div className="skeleton-shimmer" style={{ height: "13px", width: "75%", marginBottom: "20px" }} />
                    <div className="skeleton-shimmer" style={{ height: "32px", width: "90px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : popularDestinations.length === 0 ? (
            <div style={styles.emptyCardMini}>
              <p>
                Explore destinations to discover top travel recommendations.
              </p>
            </div>
          ) : (
            <div style={styles.destGrid}>
              {popularDestinations.slice(0, 4).map((dest) => {
                const tagline = getDestinationTagline(dest.name, dest.description);
                return (
                  <div
                    key={dest.id || dest.name}
                    style={styles.destCard}
                    className="trip-card-hover"
                    onClick={() => {
                      if (dest.placeId || dest.id) {
                        navigate(
                          `/destination-details/${dest.placeId || dest.id}`,
                        );
                      }
                    }}
                  >
                    <div style={styles.destImageWrap}>
                      <img
                        src={getDestinationImageUrl(dest.name)}
                        alt={dest.name}
                        loading="lazy"
                        style={styles.destImage}
                        onError={handleImageError}
                      />
                    </div>

                    <div style={styles.destCardBody}>
                      <h4 style={styles.destName}>{dest.name}</h4>
                      <p style={styles.destTagline}>{tagline}</p>

                      <button
                        style={styles.exploreBtn}
                        className="explore-btn-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dest.placeId || dest.id) {
                            navigate(
                              `/destination-details/${dest.placeId || dest.id}`,
                            );
                          }
                        }}
                      >
                        Explore →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
    maxWidth: "1240px",
    width: "92%",
    margin: "0 auto",
    padding: "32px 0 60px",
  },

  errorAlert: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "24px",
    fontWeight: "600",
  },

  welcomeBanner: {
    background: "linear-gradient(135deg, #075985 0%, #0369a1 40%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "36px 40px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    boxShadow: "0 12px 32px rgba(3, 105, 161, 0.16)",
    flexWrap: "wrap",
    gap: "24px",
  },

  welcomeContent: {
    maxWidth: "600px",
  },

  welcomeBadge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.16)",
    backdropFilter: "blur(8px)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },

  welcomeTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(22px, 3.5vw, 32px)",
    fontWeight: "800",
    color: "#ffffff",
  },

  welcomeSubtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#e0f2fe",
    lineHeight: "1.5",
  },

  welcomeActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryActionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#0284c7",
    color: "#ffffff",
    padding: "12px 22px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  secondaryActionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  statIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
    marginBottom: "2px",
  },

  statNumber: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1.2",
  },

  statSubText: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },

  weatherCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "26px 30px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
    marginBottom: "36px",
  },

  weatherHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  cardHeading: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },

  cardSubheading: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  weatherSearchWrapper: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  weatherInput: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    width: "240px",
  },

  weatherBtn: {
    background: "#0284c7",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
  },

  weatherErrorAlert: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "14px",
  },

  weatherLoadingBox: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },

  spinnerEmoji: {
    fontSize: "28px",
    marginBottom: "6px",
  },

  weatherDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr",
    gap: "24px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "14px",
    padding: "22px 26px",
    alignItems: "center",
  },

  weatherMain: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  weatherIconLarge: {
    fontSize: "46px",
  },

  weatherTemp: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#0369a1",
  },

  weatherCondition: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0284c7",
    textTransform: "capitalize",
  },

  weatherCityName: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },

  weatherMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    borderLeft: "1px solid #bae6fd",
    paddingLeft: "24px",
  },

  metricItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  metricLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
  },

  metricValue: {
    fontSize: "16px",
    color: "#0f172a",
  },

  metricValueTip: {
    fontSize: "13px",
    color: "#0369a1",
    lineHeight: "1.4",
  },

  sectionBlock: {
    marginBottom: "40px",
  },

  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },

  sectionHeading: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },

  sectionSub: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  viewAllLink: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0284c7",
    textDecoration: "none",
  },

  // ─── TRIP CARD (redesigned) ──────────────────────────────────────────────

  tripsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "22px",
  },

  tripCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
  },

  tripImageWrap: {
    width: "100%",
    height: "175px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },

  tripImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  tripStatusOverlay: {
    position: "absolute",
    top: "12px",
    left: "12px",
    zIndex: 2,
  },

  tripCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 18px 0",
  },

  tripCardIcon: {
    width: "36px",
    height: "36px",
    background: "#eff6ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    flexShrink: 0,
  },

  statusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
  },

  tripCardBody: {
    padding: "14px 18px 18px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  tripCardTitle: {
    margin: "10px 0 12px",
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.3",
  },

  tripInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "7px",
  },

  tripInfoIcon: {
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },

  tripInfoText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.4",
  },

  // Weather block inside trip card
  tripWeatherBlock: {
    marginTop: "14px",
    marginBottom: "4px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "11px 13px",
  },

  tripWeatherHeader: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "7px",
  },

  tripWeatherIcon: {
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },

  tripWeatherLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  tripWeatherLoading: {
    fontSize: "13px",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  tripWeatherUnavailable: {
    fontSize: "13px",
    color: "#94a3b8",
  },

  tripWeatherMain: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    flexWrap: "wrap",
  },

  tripWeatherTemp: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0369a1",
    lineHeight: 1,
  },

  tripWeatherCondition: {
    fontSize: "13px",
    color: "#475569",
    textTransform: "capitalize",
    lineHeight: 1,
  },

  tripWeatherMeta: {
    display: "flex",
    gap: "14px",
    marginTop: "6px",
    flexWrap: "wrap",
  },

  tripWeatherMetaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748b",
  },

  tripCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "14px",
    marginTop: "10px",
    borderTop: "1px solid #f1f5f9",
    gap: "10px",
    flexWrap: "wrap",
  },

  tripBudget: {
    display: "flex",
    flexDirection: "column",
  },

  budgetLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600",
  },

  budgetValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  viewDetailsBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  },

  tripSkeletonCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },

  // ─── EMPTY STATES ───────────────────────────────────────────────────────

  emptyCard: {
    background: "#ffffff",
    border: "2px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "48px 24px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "0 auto",
  },

  emptyIcon: {
    fontSize: "44px",
    marginBottom: "14px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    fontWeight: "700",
  },

  emptySubtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: "1.5",
  },

  emptyCardMini: {
    padding: "24px 20px",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  miniActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "#0284c7",
    color: "#ffffff",
    padding: "7px 16px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.2)",
    transition: "background 0.15s ease",
  },

  // ─── DESTINATION CARD (redesigned) ────────────────────────────────────

  destGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },

  destCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: 0,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    alignItems: "stretch",
  },

  destSkeletonCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },

  destImageWrap: {
    width: "100%",
    height: "140px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },

  destImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  destCardBody: {
    padding: "16px 18px 18px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  destName: {
    margin: "0 0 6px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },

  destTagline: {
    margin: "0 0 18px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.45",
    flex: 1,
  },

  exploreBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "7px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    alignSelf: "flex-start",
  },

  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    marginBottom: "12px",
  },

  cardBox: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
  },

  cardBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },

  cardBoxIconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  cardBoxTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
  },

  cardBoxSub: {
    margin: "3px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  budgetMetricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "18px",
  },

  budgetMetricItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  budgetMetricLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  budgetMetricVal: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },

  progressContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "auto",
  },

  progressLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
  },

  progressBarTrack: {
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.4s ease",
  },

  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  categoryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  categoryHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
  },

  categoryNameWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
    color: "#334155",
  },

  categoryName: {
    textTransform: "capitalize",
  },

  categoryAmount: {
    fontWeight: "700",
    color: "#0f172a",
  },

  categoryBarTrack: {
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden",
  },

  categoryBarFill: {
    height: "100%",
    background: "#0284c7",
    borderRadius: "3px",
    transition: "width 0.4s ease",
  },

  favoriteHighlightCard: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    border: "1px solid #bae6fd",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
  },

  favBadgeRow: {
    marginBottom: "2px",
  },

  favBadge: {
    background: "#0284c7",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
  },

  favDestName: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#0c4a6e",
  },

  favDestSub: {
    margin: 0,
    fontSize: "13px",
    color: "#0369a1",
    lineHeight: "1.4",
  },

  exploreLinkBtn: {
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0284c7",
    textDecoration: "none",
  },

  setFavoriteLink: {
    display: "inline-block",
    marginTop: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0284c7",
    textDecoration: "none",
  },

  visitedList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  visitedItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  visitedRankName: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  rankBadge: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#0284c7",
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    background: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  visitedName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },

  tripCountPill: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "3px 10px",
    borderRadius: "20px",
  },
};

export default Dashboard;
