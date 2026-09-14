import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [preferences, setPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const [editingPreferences, setEditingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");

  const [travelType, setTravelType] = useState("");
  const [preferredDestinationId, setPreferredDestinationId] = useState("");
  const [favouriteDestinationId, setFavouriteDestinationId] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
    fetchTrips();
    fetchDestinations();
  }, []);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/users/profile`,
        getAuthConfig()
      );

      console.log("PROFILE RESPONSE:", response.data);
      setProfile(response.data);
      if (response.data?.role) {
        localStorage.setItem("userRole", response.data.role);
      }
      setEditName(response.data?.name || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/users/preferences`,
        getAuthConfig()
      );

      console.log("PREFERENCES RESPONSE:", response.data);
      setPreferences(response.data);
      setTravelType(response.data?.preferredTravelType || "");
      setPreferredDestinationId(
        response.data?.preferredDestination?.id
          ? String(response.data.preferredDestination.id)
          : ""
      );
      setFavouriteDestinationId(
        response.data?.favouriteDestination?.id
          ? String(response.data.favouriteDestination.id)
          : ""
      );
    } catch (err) {
      console.error("Error fetching preferences:", err);
      setPreferences(null);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/destinations`,
        getAuthConfig()
      );
      setDestinations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching destinations:", err);
    }
  };

  const fetchTrips = async () => {
    try {
      setTripsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/trips/my`,
        getAuthConfig()
      );
      setTrips(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setTrips([]);
    } finally {
      setTripsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSavingPreferences(true);
      setPreferenceMessage("");

      await axios.put(
        `${API_BASE_URL}/api/users/preferences`,
        {
          preferredTravelType: travelType,
          preferredDestinationId: preferredDestinationId
            ? Number(preferredDestinationId)
            : null,
          favouriteDestinationId: favouriteDestinationId
            ? Number(favouriteDestinationId)
            : null,
        },
        getAuthConfig()
      );

      setPreferenceMessage("Travel preferences updated successfully! ✅");
      setEditingPreferences(false);
      await fetchPreferences();
    } catch (err) {
      console.error("Error updating preferences:", err);
      setPreferenceMessage(
        err.response?.data?.message || "Unable to update travel preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setSuccess("");

      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { name: editName.trim() },
        getAuthConfig()
      );

      setProfile(response.data);
      localStorage.setItem("userName", editName.trim());
      setSuccess("Profile updated successfully! ✅");
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar activePage="/profile" />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingEmoji}>⏳</div>
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  const userInitial = (profile?.name || "T").charAt(0).toUpperCase();

  return (
    <div style={styles.page}>
      <Navbar activePage="/profile" />

      <main style={styles.container}>
        {/* Profile Hero Header */}
        <section style={styles.profileHero}>
          <div style={styles.avatarCircle}>{userInitial}</div>
          <div style={styles.profileHeaderInfo}>
            <div style={styles.badgeRow}>
              <span style={styles.roleBadge}>👑 {profile?.role || "USER"}</span>
              <span style={styles.verifiedBadge}>✓ Verified Member</span>
            </div>
            <h1 style={styles.profileName}>{profile?.name || "Traveler"}</h1>
            <p style={styles.profileEmail}>📧 {profile?.email}</p>
          </div>
        </section>

        {/* Alerts */}
        {success && <div style={styles.successAlert}>{success}</div>}
        {preferenceMessage && (
          <div style={styles.successAlert}>{preferenceMessage}</div>
        )}
        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        <div style={styles.grid2Col}>
          {/* LEFT: Personal Info & Stats */}
          <div style={styles.column}>
            {/* Account Details Card */}
            <div style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <h3 style={styles.cardHeading}>👤 Account Information</h3>
                {!editing && (
                  <button
                    style={styles.editLinkBtn}
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Name
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdateName} style={styles.editForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.editFormActions}>
                    <button
                      type="button"
                      style={styles.cancelBtn}
                      onClick={() => {
                        setEditing(false);
                        setEditName(profile?.name || "");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.saveBtn}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Name"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>Full Name</span>
                    <strong style={styles.infoItemValue}>
                      {profile?.name || "N/A"}
                    </strong>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>Email Address</span>
                    <strong style={styles.infoItemValue}>
                      {profile?.email || "N/A"}
                    </strong>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>Account Role</span>
                    <strong style={styles.infoItemValue}>
                      {profile?.role || "USER"}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Travel Stats Card */}
            <div style={styles.card}>
              <h3 style={styles.cardHeading}>📊 Travel Statistics</h3>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <span style={styles.statNumber}>{trips.length}</span>
                  <span style={styles.statLabel}>Total Trips</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statNumber}>
                    {trips.filter((t) => t.status === "ACTIVE").length}
                  </span>
                  <span style={styles.statLabel}>Active Trips</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statNumber}>
                    {trips.filter((t) => t.status === "COMPLETED").length}
                  </span>
                  <span style={styles.statLabel}>Past Trips</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Travel Preferences & Security */}
          <div style={styles.column}>
            {/* Travel Preferences Card */}
            <div style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <h3 style={styles.cardHeading}>🌍 Travel Preferences</h3>
                {!editingPreferences && (
                  <button
                    style={styles.editLinkBtn}
                    onClick={() => setEditingPreferences(true)}
                  >
                    ✏️ Edit Preferences
                  </button>
                )}
              </div>

              {editingPreferences ? (
                <div style={styles.editForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Preferred Travel Style</label>
                    <select
                      value={travelType}
                      onChange={(e) => setTravelType(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select style...</option>
                      <option value="SOLO">🎒 Solo Explorer</option>
                      <option value="FAMILY">👨‍👩‍👧‍👦 Family Vacation</option>
                      <option value="FRIENDS">🎉 Friends Roadtrip</option>
                      <option value="COUPLE">💑 Romantic Getaway</option>
                      <option value="ADVENTURE">🏔️ Adventure & Trekking</option>
                      <option value="LUXURY">✨ Luxury & Relaxation</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Preferred Destination</label>
                    <select
                      value={preferredDestinationId}
                      onChange={(e) => setPreferredDestinationId(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select destination...</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Favourite Destination</label>
                    <select
                      value={favouriteDestinationId}
                      onChange={(e) => setFavouriteDestinationId(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select destination...</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.editFormActions}>
                    <button
                      type="button"
                      style={styles.cancelBtn}
                      onClick={() => setEditingPreferences(false)}
                      disabled={savingPreferences}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={styles.saveBtn}
                      onClick={savePreferences}
                      disabled={savingPreferences}
                    >
                      {savingPreferences ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>Travel Style</span>
                    <strong style={styles.infoItemValue}>
                      {preferences?.preferredTravelType || "Not specified"}
                    </strong>
                  </div>

                  <div style={styles.infoItemDest}>
                    <div style={styles.destInfoMeta}>
                      <span style={styles.infoItemLabel}>Preferred Destination</span>
                      <strong style={styles.infoItemValue}>
                        {preferences?.preferredDestination?.name || "Not specified"}
                      </strong>
                    </div>
                    {preferences?.preferredDestination?.name && (
                      <div style={styles.profileDestThumbWrap}>
                        <img
                          src={getDestinationImageUrl(preferences.preferredDestination.name)}
                          alt={preferences.preferredDestination.name}
                          style={styles.profileDestThumbImg}
                          onError={handleImageError}
                        />
                      </div>
                    )}
                  </div>

                  <div style={styles.infoItemDest}>
                    <div style={styles.destInfoMeta}>
                      <span style={styles.infoItemLabel}>Favourite Destination</span>
                      <strong style={styles.infoItemValue}>
                        {preferences?.favouriteDestination?.name || "Not specified"}
                      </strong>
                    </div>
                    {preferences?.favouriteDestination?.name && (
                      <div style={styles.profileDestThumbWrap}>
                        <img
                          src={getDestinationImageUrl(preferences.favouriteDestination.name)}
                          alt={preferences.favouriteDestination.name}
                          style={styles.profileDestThumbImg}
                          onError={handleImageError}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Actions & Danger Zone */}
            <div style={styles.card}>
              <h3 style={styles.cardHeading}>⚙️ Account Management</h3>
              <p style={styles.accountDesc}>
                Manage your active session or log out of your TripNest account across this browser.
              </p>

              <button style={styles.logoutActionBtn} onClick={handleLogout}>
                🚪 Log Out of TripNest
              </button>
            </div>
          </div>
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
    maxWidth: "1100px",
    width: "92%",
    margin: "0 auto",
    padding: "36px 0 60px",
  },

  loadingContainer: {
    padding: "80px 20px",
    textAlign: "center",
    color: "#64748b",
  },

  loadingEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  profileHero: {
    background: "linear-gradient(135deg, #075985 0%, #0369a1 40%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "36px 40px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginBottom: "28px",
    boxShadow: "0 12px 32px rgba(3, 105, 161, 0.16)",
    flexWrap: "wrap",
  },

  avatarCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#0284c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "800",
    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
    flexShrink: 0,
  },

  profileHeaderInfo: {
    flex: 1,
  },

  badgeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },

  roleBadge: {
    background: "rgba(255, 255, 255, 0.2)",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  verifiedBadge: {
    background: "#ecfdf5",
    color: "#059669",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  profileName: {
    margin: "0 0 4px",
    fontSize: "26px",
    fontWeight: "800",
    color: "#ffffff",
  },

  profileEmail: {
    margin: 0,
    fontSize: "14px",
    color: "#e0f2fe",
  },

  successAlert: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#059669",
    padding: "12px 18px",
    borderRadius: "12px",
    marginBottom: "22px",
    fontWeight: "600",
    fontSize: "14px",
  },

  errorAlert: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "12px 18px",
    borderRadius: "12px",
    marginBottom: "22px",
    fontWeight: "600",
    fontSize: "14px",
  },

  grid2Col: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "24px",
  },

  column: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    padding: "26px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },

  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  cardHeading: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
  },

  editLinkBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
  },

  infoItemDest: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    gap: "14px",
  },

  destInfoMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },

  profileDestThumbWrap: {
    width: "56px",
    height: "56px",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    flexShrink: 0,
    border: "1px solid #cbd5e1",
  },

  profileDestThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  infoItemLabel: {
    fontSize: "13px",
    color: "#64748b",
  },

  infoItemValue: {
    color: "#0f172a",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },

  statBox: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "12px",
    padding: "16px 10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  statNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0284c7",
  },

  statLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
  },

  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
  },

  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#ffffff",
    outline: "none",
  },

  editFormActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },

  cancelBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  saveBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#0284c7",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  accountDesc: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.5",
    marginBottom: "18px",
  },

  logoutActionBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.15s",
  },
};

export default Profile;