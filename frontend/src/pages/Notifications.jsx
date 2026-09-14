import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [toast, setToast] = useState(null); // { message, type: "success" | "error" }
  const [markingReadId, setMarkingReadId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const toastTimerRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchNotifications();

    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [token]);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const showToast = (message, type = "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://localhost:8080/api/notifications",
        getAuthConfig()
      );
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Unable to load notifications. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isNotificationRead = (n) => Boolean(n.isRead || n.read);

  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !isNotificationRead(n);
    return true;
  });

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    if (markingReadId === notificationId) return;

    try {
      setMarkingReadId(notificationId);
      const response = await axios.put(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {},
        getAuthConfig()
      );
      const updated = response.data;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, ...(updated || {}), isRead: true, read: true }
            : item
        )
      );
      showToast("Notification marked as read.", "success");
    } catch (err) {
      console.error("Error marking notification as read:", err);
      const msg = err.response?.data?.message || "Failed to mark as read.";
      showToast(msg, "error");
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.put(
        "http://localhost:8080/api/notifications/read-all",
        {},
        getAuthConfig()
      );
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, read: true }))
      );
      showToast("All notifications marked as read.", "success");
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      const msg = err.response?.data?.message || "Failed to mark all as read.";
      showToast(msg, "error");
    }
  };

  const handleDelete = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      setDeletingId(notificationId);
      setConfirmDeleteId(null);
      await axios.delete(
        `http://localhost:8080/api/notifications/${notificationId}`,
        getAuthConfig()
      );
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      showToast("Notification deleted.", "success");
    } catch (err) {
      console.error("Error deleting notification:", err);
      const msg = err.response?.data?.message || "Failed to delete notification.";
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!isNotificationRead(notification)) {
      handleMarkAsRead(notification.id);
    }
    if (notification.tripId) {
      navigate(`/trips/${notification.tripId}`);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "MEMBER_ADDED":
        return "👥";
      case "JOIN_REQUEST":
        return "📩";
      case "JOIN_REQUEST_APPROVED":
        return "✅";
      case "JOIN_REQUEST_REJECTED":
        return "❌";
      case "BUDGET_ALERT":
        return "💰";
      case "TRIP_REMINDER":
        return "🗓️";
      case "ACTIVITY_REMINDER":
        return "⏰";
      case "TRAVEL_UPDATE":
        return "✈️";
      default:
        return "🔔";
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.mainContainer}>
        {/* Toast Alert */}
        {toast && (
          <div
            style={{
              ...styles.toast,
              ...(toast.type === "error" ? styles.toastError : styles.toastSuccess),
            }}
          >
            <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <section style={styles.headerSection}>
          <div style={styles.headerTextWrap}>
            <div style={styles.headerTitleRow}>
              <h1 style={styles.pageTitle}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={styles.unreadBadge}>{unreadCount} unread</span>
              )}
            </div>
            <p style={styles.pageSubtitle}>
              Stay updated on your trip invitations, budget updates, reminders and travel activities.
            </p>
          </div>

          <div style={styles.headerActionWrap}>
            <button
              style={{
                ...styles.markAllBtn,
                opacity: unreadCount === 0 ? 0.6 : 1,
                cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              }}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              id="mark-all-notifications-btn"
            >
              ✓ Mark all as read
            </button>
          </div>
        </section>

        {/* Filter Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{
              ...styles.tabBtn,
              ...(filter === "all" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setFilter("all")}
            id="tab-all-notifications"
          >
            All Notifications
            <span style={styles.tabCountPill}>{notifications.length}</span>
          </button>

          <button
            style={{
              ...styles.tabBtn,
              ...(filter === "unread" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setFilter("unread")}
            id="tab-unread-notifications"
          >
            Unread
            <span
              style={{
                ...styles.tabCountPill,
                background: unreadCount > 0 ? "#0284c7" : "#e2e8f0",
                color: unreadCount > 0 ? "#ffffff" : "#64748b",
              }}
            >
              {unreadCount}
            </span>
          </button>
        </div>

        {/* Notification List Container */}
        <div style={styles.contentCard}>
          {loading && (
            <div style={styles.stateBox}>
              <div style={styles.spinner}></div>
              <p style={styles.stateText}>Loading your notifications...</p>
            </div>
          )}

          {error && !loading && (
            <div style={styles.stateBox}>
              <span style={styles.stateEmoji}>⚠️</span>
              <p style={styles.errorText}>{error}</p>
              <button style={styles.retryBtn} onClick={fetchNotifications}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIconCircle}>
                {filter === "unread" ? "🎉" : "📭"}
              </div>
              <h3 style={styles.emptyTitle}>
                {filter === "unread"
                  ? "You're all caught up!"
                  : "No notifications yet"}
              </h3>
              <p style={styles.emptyDesc}>
                {filter === "unread"
                  ? "You have no unread notifications. Check the 'All Notifications' tab to view past activities."
                  : "When you receive trip invitations, itinerary updates, or budget alerts, they'll appear here."}
              </p>
            </div>
          )}

          {!loading && !error && filteredNotifications.length > 0 && (
            <div style={styles.list}>
              {filteredNotifications.map((notification) => {
                const isUnread = !isNotificationRead(notification);
                const isDeleting = deletingId === notification.id;
                const isMarking = markingReadId === notification.id;
                const isConfirmingDelete = confirmDeleteId === notification.id;

                return (
                  <div
                    key={notification.id}
                    style={{
                      ...styles.item,
                      ...(isUnread ? styles.itemUnread : {}),
                      ...(isDeleting ? styles.itemFading : {}),
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Status dot indicator */}
                    <div style={styles.dotCol}>
                      <span
                        style={{
                          ...styles.statusDot,
                          background: isUnread ? "#0284c7" : "#cbd5e1",
                          boxShadow: isUnread
                            ? "0 0 0 3px rgba(2, 132, 199, 0.2)"
                            : "none",
                        }}
                        title={isUnread ? "Unread" : "Read"}
                      />
                    </div>

                    {/* Icon Column */}
                    <div style={styles.iconCol}>
                      <div
                        style={{
                          ...styles.iconCircle,
                          background: isUnread ? "#e0f2fe" : "#f1f5f9",
                        }}
                      >
                        {getTypeIcon(notification.type)}
                      </div>
                    </div>

                    {/* Message & Details Column */}
                    <div style={styles.infoCol}>
                      <div style={styles.msgRow}>
                        <p
                          style={{
                            ...styles.messageText,
                            ...(isUnread ? styles.messageTextUnread : {}),
                          }}
                        >
                          {notification.message}
                        </p>
                      </div>

                      <div style={styles.metaRow}>
                        <span style={styles.timeText}>
                          🕒 {formatRelativeTime(notification.createdAt)}
                        </span>
                        {notification.trip && (
                          <span style={styles.tripTag}>
                            📍 {notification.trip.destination?.name || "Trip"}
                          </span>
                        )}
                      </div>

                      {/* Inline Delete Confirmation */}
                      {isConfirmingDelete && (
                        <div
                          style={styles.confirmBox}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={styles.confirmPrompt}>
                            Delete this notification permanently?
                          </span>
                          <div style={styles.confirmBtns}>
                            <button
                              style={styles.cancelConfirmBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              style={styles.deleteConfirmBtn}
                              onClick={(e) => handleDelete(notification.id, e)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div
                      style={styles.actionsCol}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isUnread && (
                        <button
                          style={styles.markReadActionBtn}
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          disabled={isMarking}
                          title="Mark as read"
                        >
                          {isMarking ? "Updating..." : "Mark as read"}
                        </button>
                      )}

                      {!isConfirmingDelete && (
                        <button
                          style={styles.deleteActionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(notification.id);
                          }}
                          disabled={isDeleting}
                          title="Delete notification"
                          aria-label="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  mainContainer: {
    maxWidth: "960px",
    width: "100%",
    margin: "0 auto",
    padding: "32px 20px 60px",
    flex: 1,
  },

  toast: {
    position: "fixed",
    top: "84px",
    right: "24px",
    zIndex: 9999,
    padding: "12px 20px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
    animation: "fadeIn 0.2s ease-out",
  },

  toastSuccess: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },

  toastError: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  headerSection: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  headerTextWrap: {
    flex: 1,
    minWidth: "260px",
  },

  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
  },

  pageTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },

  unreadBadge: {
    background: "#e0f2fe",
    color: "#0284c7",
    fontSize: "12px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "14px",
    border: "1px solid #bae6fd",
  },

  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5",
  },

  headerActionWrap: {
    display: "flex",
    alignItems: "center",
  },

  markAllBtn: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },

  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
  },

  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  tabBtnActive: {
    background: "#ffffff",
    color: "#0284c7",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    fontWeight: "700",
  },

  tabCountPill: {
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "10px",
  },

  contentCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
  },

  list: {
    display: "flex",
    flexDirection: "column",
  },

  item: {
    display: "flex",
    alignItems: "flex-start",
    padding: "18px 20px",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff",
    cursor: "pointer",
    transition: "background 0.15s ease",
    gap: "14px",
  },

  itemUnread: {
    background: "#f0f9ff",
    borderLeft: "4px solid #0284c7",
  },

  itemFading: {
    opacity: 0.4,
    pointerEvents: "none",
  },

  dotCol: {
    paddingTop: "6px",
    flexShrink: 0,
  },

  statusDot: {
    display: "block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },

  iconCol: {
    flexShrink: 0,
  },

  iconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  infoCol: {
    flex: 1,
    minWidth: 0,
  },

  msgRow: {
    marginBottom: "6px",
  },

  messageText: {
    fontSize: "14px",
    color: "#334155",
    margin: 0,
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  messageTextUnread: {
    color: "#0f172a",
    fontWeight: "700",
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  timeText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },

  tripTag: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#0284c7",
    background: "#e0f2fe",
    padding: "2px 8px",
    borderRadius: "6px",
  },

  confirmBox: {
    marginTop: "12px",
    padding: "10px 14px",
    background: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },

  confirmPrompt: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#991b1b",
  },

  confirmBtns: {
    display: "flex",
    gap: "8px",
  },

  cancelConfirmBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  deleteConfirmBtn: {
    background: "#ef4444",
    border: "none",
    color: "#ffffff",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  actionsCol: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "8px",
  },

  markReadActionBtn: {
    background: "#ffffff",
    border: "1px solid #bae6fd",
    color: "#0284c7",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },

  deleteActionBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    padding: "6px 8px",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  stateBox: {
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  stateText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },

  stateEmoji: {
    fontSize: "32px",
  },

  errorText: {
    fontSize: "14px",
    color: "#ef4444",
    margin: 0,
  },

  retryBtn: {
    padding: "6px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    cursor: "pointer",
  },

  emptyState: {
    padding: "60px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  emptyIconCircle: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px",
  },

  emptyDesc: {
    fontSize: "14px",
    color: "#64748b",
    maxWidth: "380px",
    margin: 0,
    lineHeight: "1.5",
  },
};

export default Notifications;
