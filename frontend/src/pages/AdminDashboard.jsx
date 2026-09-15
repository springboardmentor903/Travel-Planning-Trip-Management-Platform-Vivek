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

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

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
    fetchUsersList();
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

  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, getAuthConfig());
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Error fetching registered users list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingRoleId(userId);
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/role`,
        { roleName: newRole },
        getAuthConfig()
      );
      if (res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: res.data.role || newRole } : u))
        );
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser((prev) => ({ ...prev, role: res.data.role || newRole }));
        }
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(err.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole =
      roleFilter === "ALL" || (u.role && u.role.toUpperCase() === roleFilter.toUpperCase());
    return matchesSearch && matchesRole;
  });

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

        {/* ── Admin Header Banner (NO Create Trip button) ── */}
        <section style={styles.headerBanner}>
          <div style={styles.headerContent}>
            <span style={styles.adminBadge}>🛡️ ADMINISTRATIVE CONSOLE</span>
            <h1 style={styles.headerTitle}>Platform Analytics & Management</h1>
            <p style={styles.headerSubtitle}>
              System overview of registered users, platform trips, destination activity, and user permissions.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link to="/destinations" style={styles.exploreBtn} id="admin-explore-places-btn">
              🌍 Explore Places
            </Link>
            <button
              style={styles.refreshBtn}
              onClick={() => {
                fetchAdminDashboard();
                fetchUsersList();
              }}
              disabled={loading}
              id="admin-refresh-metrics-btn"
            >
              {loading ? "Refreshing..." : "↻ Refresh Metrics"}
            </button>
            <Link to="/dashboard" style={styles.secondaryBtn} id="admin-traveler-view-btn">
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
              <div style={styles.statLabel}>Total Registered Users</div>
              <div style={styles.statNumber}>
                {loading ? "..." : (adminData.userAnalytics?.totalUsers ?? users.length)}
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
                {adminData.destinationAnalytics.slice(0, 8).map((item, idx) => (
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

        {/* ── User Management Section ── */}
        <section style={styles.userManagementSection} id="admin-user-management-section">
          <div style={styles.userSectionHeader}>
            <div>
              <div style={styles.userSectionBadge}>👥 USER ADMINISTRATION</div>
              <h2 style={styles.userSectionTitle}>Registered Travelers & User Management</h2>
              <p style={styles.userSectionSub}>
                Inspect registered users, manage platform roles, and view user details securely without exposing sensitive credentials.
              </p>
            </div>

            <div style={styles.userSearchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={styles.searchInput}
                id="admin-user-search-input"
              />
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div style={styles.filterTabsRow}>
            {["ALL", "TRAVELER", "GROUP_ADMIN", "ADMINISTRATOR"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  ...styles.filterTab,
                  ...(roleFilter === r ? styles.filterTabActive : {}),
                }}
              >
                {r === "ALL" ? "All Users" : r.replace("_", " ")}
                <span style={styles.filterCountBadge}>
                  {r === "ALL"
                    ? users.length
                    : users.filter((u) => u.role?.toUpperCase() === r).length}
                </span>
              </button>
            ))}
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div style={styles.loadingBox}>
              <p>Loading user management data...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyCardMini}>
              <p>No registered users found matching the search criteria.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.userTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email Address</th>
                    <th style={styles.th}>Platform Role</th>
                    <th style={styles.th}>Account Status</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isCurrentUser =
                      u.email === localStorage.getItem("userEmail");
                    const roleColor =
                      u.role === "ADMINISTRATOR"
                        ? { bg: "#fef3c7", text: "#92400e", border: "#fde68a" }
                        : u.role === "GROUP_ADMIN"
                        ? { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" }
                        : { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };

                    return (
                      <tr key={u.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.userNameCell}>
                            <div style={styles.userAvatar}>
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <div style={styles.userNameText}>
                                {u.name || "Unnamed User"}
                                {isCurrentUser && (
                                  <span style={styles.youBadge}>You</span>
                                )}
                              </div>
                              <div style={styles.userIdText}>ID: #{u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.emailText}>{u.email}</span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              backgroundColor: roleColor.bg,
                              color: roleColor.text,
                              borderColor: roleColor.border,
                            }}
                          >
                            {u.role || "TRAVELER"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.statusPill}>
                            <span style={styles.statusDot}>●</span> Active
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={styles.actionRow}>
                            <select
                              value={u.role || "TRAVELER"}
                              disabled={updatingRoleId === u.id || isCurrentUser}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              style={styles.roleSelect}
                              title="Change user platform role"
                            >
                              <option value="TRAVELER">TRAVELER</option>
                              <option value="GROUP_ADMIN">GROUP_ADMIN</option>
                              <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                            </select>

                            <button
                              style={styles.viewDetailBtn}
                              onClick={() => setSelectedUser(u)}
                              title="View user details"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── User Details Modal ── */}
        {selectedUser && (
          <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderTitleWrap}>
                  <div style={styles.modalAvatar}>
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 style={styles.modalUserName}>{selectedUser.name || "User Details"}</h3>
                    <p style={styles.modalUserSub}>Registered TripNest Account Details</p>
                  </div>
                </div>
                <button
                  style={styles.modalCloseBtn}
                  onClick={() => setSelectedUser(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>User ID</span>
                    <span style={styles.detailValue}>#{selectedUser.id}</span>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Email Address</span>
                    <span style={styles.detailValue}>{selectedUser.email}</span>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Phone</span>
                    <span style={styles.detailValueMuted}>Not provided</span>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Assigned Role</span>
                    <span style={styles.detailValue}>{selectedUser.role || "TRAVELER"}</span>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Account Status</span>
                    <span style={styles.detailValueGreen}>● Active</span>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Authentication Type</span>
                    <span style={styles.detailValue}>Standard Email / JWT</span>
                  </div>
                </div>

                <div style={styles.securityNotice}>
                  <span>🔒</span>
                  <span>
                    Sensitive security credentials (passwords, password hashes, auth tokens) are strictly hidden and not accessible.
                  </span>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={styles.modalCloseFooterBtn}
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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
    padding: "36px 0 60px",
    flex: 1,
  },

  errorAlert: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "14px 20px",
    borderRadius: "12px",
    marginBottom: "24px",
    fontWeight: "600",
    fontSize: "14px",
  },

  headerBanner: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "20px",
    padding: "36px 40px",
    marginBottom: "32px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  },

  headerContent: {
    maxWidth: "600px",
  },

  adminBadge: {
    display: "inline-block",
    background: "rgba(2, 132, 199, 0.25)",
    border: "1px solid rgba(56, 189, 248, 0.4)",
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    padding: "4px 10px",
    borderRadius: "6px",
    marginBottom: "12px",
  },

  headerTitle: {
    fontSize: "30px",
    fontWeight: "800",
    margin: "0 0 10px",
    letterSpacing: "-0.5px",
    color: "#ffffff",
  },

  headerSubtitle: {
    fontSize: "15px",
    color: "#94a3b8",
    margin: 0,
    lineHeight: "1.6",
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  exploreBtn: {
    background: "rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    padding: "11px 20px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  },

  refreshBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },

  secondaryBtn: {
    background: "#0284c7",
    color: "#ffffff",
    padding: "11px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
  },

  statIconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  statLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "4px",
  },

  statNumber: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },

  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },

  cardBox: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
  },

  cardBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },

  cardBoxIconWrap: {
    fontSize: "26px",
    background: "#f0f9ff",
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBoxTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 2px",
  },

  cardBoxSub: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
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

  /* ── User Management Styles ── */
  userManagementSection: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "32px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    marginBottom: "32px",
  },

  userSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "24px",
  },

  userSectionBadge: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#0284c7",
    letterSpacing: "0.8px",
    marginBottom: "6px",
  },

  userSectionTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 6px",
  },

  userSectionSub: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    maxWidth: "680px",
    lineHeight: "1.5",
  },

  userSearchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "8px 14px",
    minWidth: "280px",
  },

  searchIcon: {
    fontSize: "14px",
    color: "#94a3b8",
  },

  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "13px",
    color: "#0f172a",
    width: "100%",
  },

  filterTabsRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  filterTab: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  filterTabActive: {
    background: "#0284c7",
    color: "#ffffff",
    borderColor: "#0284c7",
  },

  filterCountBadge: {
    fontSize: "11px",
    padding: "1px 6px",
    borderRadius: "10px",
    background: "rgba(0, 0, 0, 0.1)",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  userTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "12px 16px",
    borderBottom: "2px solid #f1f5f9",
  },

  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s ease",
  },

  td: {
    padding: "14px 16px",
    fontSize: "13px",
    verticalAlign: "middle",
  },

  userNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e0f2fe",
    color: "#0284c7",
    fontWeight: "800",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  userNameText: {
    fontWeight: "700",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  youBadge: {
    fontSize: "10px",
    fontWeight: "700",
    background: "#dcfce7",
    color: "#15803d",
    padding: "2px 6px",
    borderRadius: "4px",
  },

  userIdText: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  emailText: {
    color: "#475569",
    fontFamily: "monospace",
    fontSize: "12px",
  },

  roleBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid",
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#16a34a",
  },

  statusDot: {
    fontSize: "10px",
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
  },

  roleSelect: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    outline: "none",
  },

  viewDetailBtn: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  /* ── User Details Modal ── */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  modalContent: {
    background: "#ffffff",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalHeaderTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  modalAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#0284c7",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalUserName: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 2px",
  },

  modalUserSub: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },

  modalCloseBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
  },

  modalBody: {
    padding: "24px",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  detailLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },

  detailValueMuted: {
    fontSize: "13px",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  detailValueGreen: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#16a34a",
  },

  securityNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "12px",
    color: "#166534",
    lineHeight: "1.5",
  },

  modalFooter: {
    padding: "14px 24px",
    background: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "flex-end",
  },

  modalCloseFooterBtn: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },

  loadingBox: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  emptyCardMini: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
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
