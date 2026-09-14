import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";

function TripInvitation() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const autoActionExecuted = useRef(false);

  const authToken = localStorage.getItem("token");
  const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${API_BASE_URL}/api/trip-invitations/public/${token}`
      );
      setInvitation(response.data);
    } catch (err) {
      console.error("Error fetching invitation:", err);
      setError(
        err.response?.data?.message ||
        "This trip invitation is invalid, expired, or could not be found."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (
      invitation &&
      invitation.status === "PENDING" &&
      !invitation.isExpired &&
      authToken &&
      isEmailMatching() &&
      !autoActionExecuted.current
    ) {
      const action = searchParams.get("action");
      if (action === "accept") {
        autoActionExecuted.current = true;
        handleAccept();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation, authToken]);

  // Handle Accept
  const handleAccept = async () => {
    if (!authToken) {
      localStorage.setItem("invitationRedirect", `/trip-invitation/${token}?action=accept`);
      navigate("/login");
      return;
    }

    try {
      setProcessing(true);
      setActionError("");
      setActionSuccess("");

      const response = await axios.post(
        `${API_BASE_URL}/api/trip-invitations/${token}/accept`,
        {},
        getAuthConfig()
      );

      setInvitation(response.data);
      setActionSuccess("You've joined the trip successfully! 🎉");
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setActionError(
        err.response?.data?.message || "Unable to accept invitation. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!authToken) {
      localStorage.setItem("invitationRedirect", `/trip-invitation/${token}?action=reject`);
      navigate("/login");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to decline this trip invitation?");
    if (!confirmed) return;

    try {
      setProcessing(true);
      setActionError("");
      setActionSuccess("");

      const response = await axios.post(
        `${API_BASE_URL}/api/trip-invitations/${token}/reject`,
        {},
        getAuthConfig()
      );

      setInvitation(response.data);
      setActionSuccess("You have declined this invitation.");
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      setActionError(
        err.response?.data?.message || "Unable to decline invitation. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isEmailMatching = () => {
    if (!invitation || !currentUserEmail) return false;
    return (invitation.inviteeEmail || "").toLowerCase().trim() === currentUserEmail;
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        {loading ? (
          <div style={styles.card}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading trip invitation...</p>
          </div>
        ) : error ? (
          <div style={styles.card}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.title}>Invitation Unavailable</h2>
            <p style={styles.description}>{error}</p>
            <Link to="/dashboard" style={styles.primaryButton}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div style={styles.card}>
            {/* Header Badge */}
            <div style={styles.badgeContainer}>
              <span style={styles.badge}>✈️ TRIP INVITATION</span>
            </div>

            <h1 style={styles.title}>
              You're Invited to Join <br />
              <span style={styles.tripHighlight}>
                {invitation.tripName || invitation.destination || "Trip"}
              </span>
            </h1>

            <p style={styles.inviterNote}>
              <strong>{invitation.inviterName || "A friend"}</strong> (
              {invitation.inviterEmail}) invited you to collaborate on this trip.
            </p>

            {/* Trip Details Card */}
            <div style={styles.tripInfoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>🌍 Destination:</span>
                <span style={styles.infoValue}>
                  {invitation.destination || "Custom Destination"}
                </span>
              </div>

              {(invitation.startDate || invitation.endDate) && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📅 Travel Dates:</span>
                  <span style={styles.infoValue}>
                    {formatDate(invitation.startDate)} — {formatDate(invitation.endDate)}
                  </span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>👤 Invited Role:</span>
                <span style={styles.infoValue}>
                  {invitation.role || "MEMBER"}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>✉️ Invited Account:</span>
                <span style={styles.infoValue}>
                  {invitation.inviteeEmail}
                </span>
              </div>
            </div>

            {/* Action Feedback Alerts */}
            {actionSuccess && (
              <div style={styles.successAlert}>
                <span>✅ {actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div style={styles.errorAlert}>
                <span>⚠️ {actionError}</span>
              </div>
            )}

            {/* Status-specific content */}
            {invitation.status === "ACCEPTED" ? (
              <div style={styles.resolvedContainer}>
                <div style={styles.successIcon}>🎉</div>
                <h3 style={styles.resolvedTitle}>You are a member of this trip!</h3>
                <p style={styles.resolvedText}>
                  You can now view itineraries, manage shared expenses, and collaborate with other members.
                </p>
                <Link
                  to={`/trips/${invitation.tripId}`}
                  style={styles.primaryButton}
                  id="view-trip-btn"
                >
                  View Trip Details →
                </Link>
              </div>
            ) : invitation.status === "REJECTED" ? (
              <div style={styles.resolvedContainer}>
                <div style={styles.neutralIcon}>❌</div>
                <h3 style={styles.resolvedTitle}>Invitation Declined</h3>
                <p style={styles.resolvedText}>
                  You have declined this invitation. If this was a mistake, please contact the trip owner to send a new invitation.
                </p>
                <Link to="/dashboard" style={styles.secondaryButton}>
                  Back to Dashboard
                </Link>
              </div>
            ) : invitation.isExpired || invitation.status === "EXPIRED" ? (
              <div style={styles.resolvedContainer}>
                <div style={styles.neutralIcon}>⏰</div>
                <h3 style={styles.resolvedTitle}>Invitation Expired</h3>
                <p style={styles.resolvedText}>
                  This invitation link has expired. Please ask the trip owner ({invitation.inviterEmail}) to send a fresh invitation.
                </p>
                <Link to="/dashboard" style={styles.secondaryButton}>
                  Back to Dashboard
                </Link>
              </div>
            ) : (
              /* PENDING STATUS */
              <div style={styles.pendingSection}>
                {!authToken ? (
                  /* Not Logged In */
                  <div style={styles.authPrompt}>
                    <p style={styles.authPromptText}>
                      Please log in with <strong>{invitation.inviteeEmail}</strong> to accept this invitation.
                    </p>
                    <div style={styles.buttonGroup}>
                      <button
                        style={styles.primaryButton}
                        onClick={() => {
                          localStorage.setItem(
                            "invitationRedirect",
                            `/trip-invitation/${token}`
                          );
                          navigate("/login");
                        }}
                        id="login-to-accept-btn"
                      >
                        Log In to Respond
                      </button>
                      <button
                        style={styles.secondaryButton}
                        onClick={() => {
                          localStorage.setItem(
                            "invitationRedirect",
                            `/trip-invitation/${token}`
                          );
                          navigate("/register");
                        }}
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                ) : !isEmailMatching() ? (
                  /* Logged In with Wrong Email */
                  <div style={styles.mismatchBox}>
                    <p style={styles.mismatchText}>
                      ⚠️ You are currently signed in as <strong>{currentUserEmail}</strong>, but this invitation was sent to <strong>{invitation.inviteeEmail}</strong>.
                    </p>
                    <p style={styles.mismatchSubText}>
                      Please switch accounts to accept or decline this invitation.
                    </p>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("userId");
                        localStorage.removeItem("userName");
                        localStorage.removeItem("userEmail");
                        localStorage.setItem(
                          "invitationRedirect",
                          `/trip-invitation/${token}`
                        );
                        navigate("/login");
                      }}
                    >
                      Log in as {invitation.inviteeEmail}
                    </button>
                  </div>
                ) : (
                  /* Logged In with Matching Email */
                  <div style={styles.actionControls}>
                    <p style={styles.readyText}>
                      Would you like to join this trip as a collaborator?
                    </p>
                    <div style={styles.buttonGroup}>
                      <button
                        style={{
                          ...styles.acceptButton,
                          opacity: processing ? 0.7 : 1,
                        }}
                        onClick={handleAccept}
                        disabled={processing}
                        id="accept-invitation-btn"
                      >
                        {processing ? "Processing..." : "✓ Accept Invitation"}
                      </button>

                      <button
                        style={{
                          ...styles.rejectButton,
                          opacity: processing ? 0.7 : 1,
                        }}
                        onClick={handleReject}
                        disabled={processing}
                        id="reject-invitation-btn"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },

  card: {
    maxWidth: "560px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px 36px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },

  badgeContainer: {
    marginBottom: "16px",
  },

  badge: {
    background: "#e0f2fe",
    color: "#0284c7",
    fontSize: "12px",
    fontWeight: "800",
    padding: "6px 14px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
  },

  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 12px",
    lineHeight: "1.3",
  },

  tripHighlight: {
    color: "#0284c7",
  },

  inviterNote: {
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "24px",
    lineHeight: "1.5",
  },

  tripInfoBox: {
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "18px 22px",
    marginBottom: "28px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },

  infoLabel: {
    color: "#64748b",
    fontWeight: "600",
  },

  infoValue: {
    color: "#0f172a",
    fontWeight: "700",
  },

  pendingSection: {
    marginTop: "20px",
  },

  authPrompt: {
    textAlign: "center",
  },

  authPromptText: {
    fontSize: "15px",
    color: "#475569",
    marginBottom: "20px",
  },

  mismatchBox: {
    background: "#fef3c7",
    border: "1px solid #fde68a",
    borderRadius: "10px",
    padding: "16px",
    textAlign: "center",
    marginBottom: "20px",
  },

  mismatchText: {
    fontSize: "14px",
    color: "#92400e",
    margin: "0 0 6px",
  },

  mismatchSubText: {
    fontSize: "13px",
    color: "#b45309",
    margin: "0 0 14px",
  },

  readyText: {
    fontSize: "15px",
    color: "#475569",
    fontWeight: "600",
    marginBottom: "20px",
  },

  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  acceptButton: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "12px 28px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
    transition: "all 0.15s ease",
  },

  rejectButton: {
    background: "#ffffff",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  primaryButton: {
    display: "inline-block",
    background: "#0284c7",
    color: "#ffffff",
    textDecoration: "none",
    border: "none",
    padding: "12px 28px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
  },

  secondaryButton: {
    display: "inline-block",
    background: "#ffffff",
    color: "#334155",
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  resolvedContainer: {
    padding: "20px 0",
  },

  successIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  neutralIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  resolvedTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 8px",
  },

  resolvedText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "24px",
    lineHeight: "1.5",
  },

  successAlert: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "600",
  },

  errorAlert: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "600",
  },

  errorIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  description: {
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "24px",
  },

  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },

  loadingText: {
    fontSize: "15px",
    color: "#64748b",
  },
};

export default TripInvitation;
