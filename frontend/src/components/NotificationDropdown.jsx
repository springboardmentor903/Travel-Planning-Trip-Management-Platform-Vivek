import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function NotificationDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: "success"|"error" }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);
  const dropdownRef = useRef(null);
  const toastTimerRef = useRef(null);

  const token = localStorage.getItem("token");

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
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://localhost:8080/api/notifications",
        getAuthConfig()
      );
      if (Array.isArray(response.data)) {
        // Use isRead exactly as returned by backend — never override it
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleFocus = () => {
      fetchNotifications();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setConfirmDeleteId(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Unread count derived purely from persisted isRead from backend
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark as Read — persisted in backend, frontend updated only on success
  const handleMarkAsRead = async (notificationId) => {
    if (markingReadId === notificationId) return;

    try {
      setMarkingReadId(notificationId);

      const response = await axios.put(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {},
        getAuthConfig()
      );

      // Update state only on confirmed backend success, using backend's returned value
      const updated = response.data;
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
      const msg =
        err.response?.data?.message || "Failed to mark notification as read.";
      showToast(msg, "error");
      // Do NOT optimistically update read state on failure
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
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      showToast("Failed to mark all as read.", "error");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.tripId) {
      setIsOpen(false);
      navigate(`/trips/${notification.tripId}`);
    }
  };

  // Delete — shows inline confirmation first
  const handleDeleteClick = (e, notificationId) => {
    e.stopPropagation();
    setConfirmDeleteId(notificationId);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (e, notificationId) => {
    e.stopPropagation();
    setConfirmDeleteId(null);

    const wasUnread = notifications.find((n) => n.id === notificationId && !n.isRead);

    try {
      setDeletingId(notificationId);

      await axios.delete(
        `http://localhost:8080/api/notifications/${notificationId}`,
        getAuthConfig()
      );

      // Remove from list only after confirmed deletion
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
      const msg =
        err.response?.data?.message || "Failed to delete notification.";
      showToast(msg, "error");
      // Do NOT remove it from the list on failure
    } finally {
      setDeletingId(null);
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
      default:
        return "🔔";
    }
  };

  if (!token) return null;

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        style={{
          ...styles.bellButton,
          ...(isOpen ? styles.bellButtonActive : {}),
        }}
        onClick={() => {
          navigate("/notifications");
        }}
        title="Notifications"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge} id="notification-unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={styles.dropdownPanel} id="notification-dropdown-panel">
          {/* Panel Header */}
          <div style={styles.panelHeader}>
            <div style={styles.headerTitleRow}>
              <span style={styles.headerTitle}>Notifications</span>
              {unreadCount > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={styles.unreadCountBadge}>
                    {unreadCount} new
                  </span>
                  <button
                    style={styles.markAllReadBtn}
                    onClick={handleMarkAllAsRead}
                    title="Mark all notifications as read"
                    id="notification-mark-all-btn"
                  >
                    Mark all read
                  </button>
                </div>
              ) : (
                <span style={styles.allReadText}>All caught up</span>
              )}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              style={{
                ...styles.toast,
                ...(toast.type === "error" ? styles.toastError : styles.toastSuccess),
              }}
            >
              {toast.type === "error" ? "⚠️" : "✅"} {toast.message}
            </div>
          )}

          {/* Panel Content */}
          <div style={styles.notificationsList}>
            {loading && notifications.length === 0 && (
              <div style={styles.stateContainer}>
                <div style={styles.loadingSpinner}></div>
                <span style={styles.stateText}>Loading notifications...</span>
              </div>
            )}

            {error && notifications.length === 0 && (
              <div style={styles.stateContainer}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
                <button
                  style={styles.retryBtn}
                  onClick={fetchNotifications}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && notifications.length === 0 && !error && (
              <div style={styles.stateContainer}>
                <span style={styles.emptyIcon}>📭</span>
                <span style={styles.emptyTitle}>No notifications yet</span>
                <span style={styles.emptySubtitle}>
                  We'll notify you when exciting trip updates happen!
                </span>
              </div>
            )}

            {notifications.map((notification) => {
              const isUnread = !notification.isRead;
              const isDeleting = deletingId === notification.id;
              const isMarkingRead = markingReadId === notification.id;
              const isConfirmingDelete = confirmDeleteId === notification.id;

              return (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(isUnread ? styles.notificationItemUnread : {}),
                    ...(isDeleting ? styles.notificationItemFading : {}),
                    cursor: "pointer",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Status Indicator */}
                  <div style={styles.indicatorCol}>
                    {isUnread ? (
                      <span style={styles.unreadDot} title="Unread">●</span>
                    ) : (
                      <span style={styles.readDot}>○</span>
                    )}
                  </div>

                  {/* Icon & Details */}
                  <div style={styles.contentCol}>
                    <div style={styles.messageRow}>
                      <span style={styles.typeEmoji}>
                        {getTypeIcon(notification.type)}
                      </span>
                      <span
                        style={{
                          ...styles.messageText,
                          ...(isUnread ? styles.messageTextUnread : {}),
                        }}
                      >
                        {notification.message}
                      </span>
                    </div>

                    {/* Meta row: time + mark-read hint */}
                    <div style={styles.metaRow}>
                      <span style={styles.timeText}>
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {isUnread && !isMarkingRead && (
                        <button
                          style={styles.markReadBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          ✓ Mark read
                        </button>
                      )}
                      {isMarkingRead && (
                        <span style={styles.processingText}>Updating...</span>
                      )}
                    </div>

                    {/* Inline delete confirmation */}
                    {isConfirmingDelete && (
                      <div style={styles.confirmBox}>
                        <span style={styles.confirmText}>Delete this notification?</span>
                        <div style={styles.confirmBtns}>
                          <button
                            style={styles.confirmCancelBtn}
                            onClick={handleCancelDelete}
                          >
                            Cancel
                          </button>
                          <button
                            style={styles.confirmDeleteBtn}
                            onClick={(e) => handleConfirmDelete(e, notification.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div style={styles.actionsCol}>
                    <button
                      style={{
                        ...styles.deleteBtn,
                        ...(isConfirmingDelete ? styles.deleteBtnActive : {}),
                      }}
                      onClick={(e) => handleDeleteClick(e, notification.id)}
                      title="Delete notification"
                      aria-label="Delete notification"
                      disabled={isDeleting}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },

  bellButton: {
    position: "relative",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    padding: 0,
    outline: "none",
  },

  bellButtonActive: {
    background: "#f0f9ff",
    borderColor: "#bae6fd",
    boxShadow: "0 0 0 3px rgba(2, 132, 199, 0.15)",
  },

  bellIcon: {
    fontSize: "18px",
    lineHeight: 1,
    userSelect: "none",
  },

  badge: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    background: "#ef4444",
    color: "#ffffff",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "800",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #ffffff",
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.35)",
  },

  dropdownPanel: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: "380px",
    maxWidth: "92vw",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 12px 36px rgba(15, 23, 42, 0.15), 0 2px 8px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0",
    zIndex: 2000,
    overflow: "hidden",
    animation: "fadeInDown 0.2s ease-out",
  },

  panelHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff",
  },

  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.2px",
  },

  unreadCountBadge: {
    background: "#e0f2fe",
    color: "#0284c7",
    fontSize: "12px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "12px",
  },

  markAllReadBtn: {
    background: "none",
    border: "none",
    padding: "2px 6px",
    fontSize: "11px",
    color: "#0284c7",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "6px",
    lineHeight: 1,
    transition: "background 0.15s ease",
  },

  allReadText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },

  toast: {
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  toastError: {
    background: "#fef2f2",
    color: "#b91c1c",
    borderBottom: "1px solid #fecaca",
  },

  toastSuccess: {
    background: "#ecfdf5",
    color: "#065f46",
    borderBottom: "1px solid #a7f3d0",
  },

  notificationsList: {
    maxHeight: "400px",
    overflowY: "auto",
  },

  notificationItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px 12px 16px",
    borderBottom: "1px solid #f8fafc",
    background: "#ffffff",
    transition: "background 0.15s ease, opacity 0.2s ease",
  },

  notificationItemUnread: {
    background: "#f0f9ff",
    borderLeft: "3px solid #0284c7",
  },

  notificationItemFading: {
    opacity: 0.5,
    pointerEvents: "none",
  },

  indicatorCol: {
    paddingTop: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  unreadDot: {
    color: "#0284c7",
    fontSize: "14px",
    lineHeight: 1,
  },

  readDot: {
    color: "#cbd5e1",
    fontSize: "12px",
    lineHeight: 1,
  },

  contentCol: {
    flex: 1,
    minWidth: 0,
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "4px",
  },

  typeEmoji: {
    fontSize: "15px",
    lineHeight: "1.3",
    flexShrink: 0,
  },

  messageText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.4",
    wordBreak: "break-word",
  },

  messageTextUnread: {
    color: "#0f172a",
    fontWeight: "600",
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
    flexWrap: "wrap",
    gap: "4px",
  },

  timeText: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },

  markReadBtn: {
    background: "none",
    border: "none",
    padding: "0",
    fontSize: "10px",
    color: "#0284c7",
    fontWeight: "600",
    cursor: "pointer",
    lineHeight: 1,
  },

  processingText: {
    fontSize: "10px",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  actionsCol: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-start",
    paddingTop: "1px",
  },

  deleteBtn: {
    background: "none",
    border: "none",
    padding: "4px 6px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    color: "#94a3b8",
    lineHeight: 1,
    transition: "all 0.15s ease",
    opacity: 0.6,
    outline: "none",
  },

  deleteBtnActive: {
    background: "#fef2f2",
    color: "#ef4444",
    opacity: 1,
  },

  confirmBox: {
    marginTop: "8px",
    padding: "8px 10px",
    background: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },

  confirmText: {
    fontSize: "12px",
    color: "#7f1d1d",
    fontWeight: "600",
    display: "block",
    marginBottom: "6px",
  },

  confirmBtns: {
    display: "flex",
    gap: "6px",
  },

  confirmCancelBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
  },

  confirmDeleteBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#ffffff",
    cursor: "pointer",
  },

  stateContainer: {
    padding: "36px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "8px",
  },

  loadingSpinner: {
    width: "24px",
    height: "24px",
    border: "2px solid #e2e8f0",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  stateText: {
    fontSize: "13px",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "32px",
    marginBottom: "4px",
  },

  emptyTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },

  emptySubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    maxWidth: "240px",
  },

  errorIcon: {
    fontSize: "24px",
  },

  errorText: {
    fontSize: "13px",
    color: "#ef4444",
  },

  retryBtn: {
    marginTop: "4px",
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "12px",
    fontWeight: "600",
    color: "#0f172a",
    cursor: "pointer",
  },
};

export default NotificationDropdown;
