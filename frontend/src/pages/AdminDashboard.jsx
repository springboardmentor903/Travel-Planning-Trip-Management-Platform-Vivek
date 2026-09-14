import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function AdminDashboard() {
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    userAnalytics: { totalUsers: 0 },
    tripAnalytics: { totalTrips: 0, activeTrips: 0, completedTrips: 0 },
    destinationAnalytics: [],
    platformStats: { totalExpenses: 0, totalNotifications: 0, totalExpenseAmount: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const adminName = localStorage.getItem("userName") || "Administrator";

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

    fetchAdminDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      setUnauthorized(false);

      const response = await axios.get(
        `${API_BASE_URL}/api/dashboard/admin`,
        getAuthConfig()
      );

      console.log("Admin Dashboard Data:", response.data);

      if (response.data) {
        setAdminData({
          userAnalytics: response.data.userAnalytics || { totalUsers: 0 },
          tripAnalytics: response.data.tripAnalytics || { totalTrips: 0, activeTrips: 0, completedTrips: 0 },
          destinationAnalytics: response.data.destinationAnalytics || [],
          platformStats: response.data.platformStats || { totalExpenses: 0, totalNotifications: 0, totalExpenseAmount: 0 },
        });
      }
    } catch (err) {
      console.error("Error fetching admin dashboard:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setUnauthorized(true);
        setError("Access Denied: You do not have administrator permissions to view this dashboard.");
        return;
      }
      setError("Unable to load platform administration metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (unauthorized) {
    return (
      <div style={styles.page}>
        <Navbar activePage="/admin" />
        <main style={styles.container}>
          <div style={styles.unauthorizedCard}>
            <div style={styles.lockIcon}>🛡️</div>
            <h2 style={styles.unauthorizedTitle}>Administrator Access Required</h2>
            <p style={styles.unauthorizedText}>
              This area is restricted to users with the ADMINISTRATOR role. If you believe this is in error, please contact your system administrator.
            </p>
            <div style={styles.unauthorizedActions}>
              <Link to="/dashboard" style={styles.primaryBtn}>
                ← Return to Traveler Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar activePage="/admin" />

      <main style={styles.container}>
        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        {/* ── Admin Header Banner ── */}
        <section style={styles.headerBanner}>
          <div style={styles.headerContent}>
            <span style={styles.adminBadge}>ADMINISTRATIVE CONSOLE</span>
            <h1 style={styles.headerTitle}>Platform Analytics</h1>
            <p style={styles.headerSubtitle}>
              Overview of registered users, active trips, platform destinations, and operational metrics.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={styles.refreshBtn}
              onClick={fetchAdminDashboard}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh Metrics"}
            </button>
            <Link to="/dashboard" style={styles.secondaryBtn}>
              Traveler View →
            </Link>
          </div>
        </section>

        {/* ── Key Analytics Cards ── */}
        <section style={styles.statsGrid}>
          {/* Total Registered Users */}
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, background: "#e0f2fe", color: "#0284c7" }}>
              👥
            </div>
            <div>
              <div style={styles.statLabel}>Registered Users</div>
              <div style={styles.statNumber}>
                {loading ? "..." : (adminData.userAnalytics?.totalUsers ?? 0)}
              </div>
            </div>
          </div>

          {/* Total Platform Trips */}
          <div style={{ ...styles.statCard, borderLeft: "4px solid #0284c7" }}>
            <div style={{ ...styles.statIconBox, background: "#eff6ff", color: "#2563eb" }}>
              ✈️
            </div>
            <div>
              <div style={styles.statLabel}>Total Trips Created</div>
              <div style={styles.statNumber}>
                {loading ? "..." : (adminData.tripAnalytics?.totalTrips ?? 0)}
              </div>
            </div>
          </div>

          {/* Active Trips */}
          <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
            <div style={{ ...styles.statIconBox, background: "#ecfdf5", color: "#059669" }}>
              🟢
            </div>
            <div>
              <div style={styles.statLabel}>Active Trips</div>
              <div style={{ ...styles.statNumber, color: "#059669" }}>
                {loading ? "..." : (adminData.tripAnalytics?.activeTrips ?? 0)}
              </div>
            </div>
          </div>

          {/* Completed Trips */}
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, background: "#f1f5f9", color: "#475569" }}>
              🏁
            </div>
            <div>
              <div style={styles.statLabel}>Completed Trips</div>
              <div style={styles.statNumber}>
                {loading ? "..." : (adminData.tripAnalytics?.completedTrips ?? 0)}
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Dashboard Content Columns ── */}
        <div style={styles.twoColGrid}>
          {/* Column 1: Destination Analytics */}
          <section style={styles.cardBox}>
            <div style={styles.cardBoxHeader}>
              <div style={styles.cardBoxIconWrap}>🌍</div>
              <div>
                <h3 style={styles.cardBoxTitle}>Popular Destinations</h3>
                <p style={styles.cardBoxSub}>Most booked destinations across all users</p>
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingBox}>
                <p>Loading destination analytics...</p>
              </div>
            ) : adminData.destinationAnalytics.length === 0 ? (
              <div style={styles.emptyCardMini}>
                <p>No trip destinations logged across the platform yet.</p>
              </div>
            ) : (
              <div style={styles.destList}>
                {adminData.destinationAnalytics.slice(0, 10).map((item, idx) => (
                  <div key={item.destination || idx} style={styles.destListItem}>
                    <div style={styles.destRankWrap}>
                      <span style={styles.rankNumber}>#{idx + 1}</span>
                      <div style={styles.destAvatarWrap}>
                        <img
                          src={getDestinationImageUrl(item.destination)}
                          alt={item.destination}
                          style={styles.destAvatarImg}
                          onError={handleImageError}
                        />
                      </div>
                      <span style={styles.destTitle}>{item.destination}</span>
                    </div>
                    <div style={styles.destCountPill}>
                      <strong>{item.tripCount}</strong> {item.tripCount === 1 ? "trip" : "trips"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Column 2: Platform Stats */}
          <section style={styles.cardBox}>
            <div style={styles.cardBoxHeader}>
              <div style={styles.cardBoxIconWrap}>📈</div>
              <div>
                <h3 style={styles.cardBoxTitle}>Platform Operational Stats</h3>
                <p style={styles.cardBoxSub}>System-wide activity and expense records</p>
              </div>
            </div>

            <div style={styles.platformStatsGrid}>
              <div style={styles.platformMetricCard}>
                <div style={styles.platformMetricIcon}>💳</div>
                <div>
                  <div style={styles.platformMetricLabel}>Total Expenses Logged</div>
                  <div style={styles.platformMetricValue}>
                    {loading ? "..." : (adminData.platformStats?.totalExpenses ?? 0)}
                  </div>
                  <div style={styles.platformMetricDesc}>Individual expense entries across all trips</div>
                </div>
              </div>

              <div style={styles.platformMetricCard}>
                <div style={styles.platformMetricIcon}>🔔</div>
                <div>
                  <div style={styles.platformMetricLabel}>Notifications Sent</div>
                  <div style={styles.platformMetricValue}>
                    {loading ? "..." : (adminData.platformStats?.totalNotifications ?? 0)}
                  </div>
                  <div style={styles.platformMetricDesc}>System invitations & collaboration alerts</div>
                </div>
              </div>

              <div style={styles.platformMetricCard}>
                <div style={styles.platformMetricIcon}>💵</div>
                <div>
                  <div style={styles.platformMetricLabel}>Platform Expense Volume</div>
                  <div style={{ ...styles.platformMetricValue, color: "#0284c7" }}>
                    {loading ? "..." : `₹${Number(adminData.platformStats?.totalExpenseAmount || 0).toLocaleString()}`}
                  </div>
                  <div style={styles.platformMetricDesc}>Cumulative expenditures recorded</div>
                </div>
              </div>
            </div>
          </section>
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

  headerBanner: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "20px",
    padding: "36px 40px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
    flexWrap: "wrap",
    gap: "24px",
  },

  headerContent: {
    maxWidth: "640px",
  },

  adminBadge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    color: "#38bdf8",
    marginBottom: "12px",
  },

  headerTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(24px, 3.5vw, 32px)",
    fontWeight: "800",
    color: "#ffffff",
  },

  headerSubtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  refreshBtn: {
    background: "#0284c7",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
  },

  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
    cursor: "pointer",
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
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
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
    marginBottom: "4px",
  },

  statNumber: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },

  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
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
    paddingBottom: "14px",
    borderBottom: "1px solid #f1f5f9",
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
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  cardBoxSub: {
    margin: "3px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  loadingBox: {
    padding: "36px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  emptyCardMini: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    fontSize: "14px",
  },

  destList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  destListItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  destRankWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  rankNumber: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#0284c7",
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    background: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  destAvatarWrap: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#e2e8f0",
  },

  destAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  destTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },

  destCountPill: {
    fontSize: "13px",
    color: "#334155",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "4px 12px",
    borderRadius: "20px",
  },

  platformStatsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  platformMetricCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  platformMetricIcon: {
    fontSize: "24px",
    flexShrink: 0,
    marginTop: "2px",
  },

  platformMetricLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },

  platformMetricValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "2px",
  },

  platformMetricDesc: {
    fontSize: "12px",
    color: "#64748b",
  },

  unauthorizedCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "50px 30px",
    maxWidth: "520px",
    margin: "60px auto",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
  },

  lockIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },

  unauthorizedTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 10px",
  },

  unauthorizedText: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.6",
    marginBottom: "24px",
  },

  unauthorizedActions: {
    display: "flex",
    justifyContent: "center",
  },

  primaryBtn: {
    background: "#0284c7",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
  },
};

export default AdminDashboard;
