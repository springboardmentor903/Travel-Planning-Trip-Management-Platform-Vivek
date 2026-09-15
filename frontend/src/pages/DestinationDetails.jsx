import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function DestinationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { placeId, id } = useParams();
  const targetId = placeId || id;

  const passedPlace = location.state?.place;
  const passedDest = location.state?.destination;

  const initialDestination =
    passedDest ||
    (passedPlace
      ? {
          name:
            passedPlace.displayName?.text ||
            passedPlace.displayName ||
            passedPlace.formattedAddress ||
            passedPlace.name ||
            "",
          id: passedPlace.id,
        }
      : null);

  const [destination, setDestination] = useState(initialDestination);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "ADMINISTRATOR";

  useEffect(() => {
    loadDestinationPlaces();
  }, [targetId]);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  };

  const loadDestinationPlaces = async () => {
    try {
      setLoading(true);
      setError("");

      let destinationName = destination?.name;

      if (!destinationName && targetId) {
        if (/^\d+$/.test(targetId)) {
          // Numeric database ID
          const response = await axios.get(
            `${API_BASE_URL}/api/destinations/${targetId}`,
            getAuthConfig()
          );
          destinationName = response.data?.name;
          setDestination(response.data);
        } else {
          // Google Places alphanumeric ID
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/destinations/place-details`,
              {
                params: { placeId: targetId },
                ...getAuthConfig(),
              }
            );
            destinationName =
              response.data?.displayName?.text ||
              response.data?.displayName ||
              response.data?.name ||
              targetId;
            setDestination({ name: destinationName, id: targetId });
          } catch (placeErr) {
            console.warn("Place details lookup fallback to ID as name:", placeErr);
            destinationName = targetId;
            setDestination({ name: destinationName, id: targetId });
          }
        }
      }

      if (!destinationName) {
        setError("Destination information not found.");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/destinations/search`,
        {
          params: {
            query: `${destinationName} tourist attractions places to visit`,
          },
          ...getAuthConfig(),
        }
      );

      console.log("TOURIST PLACES:", response.data);
      setPlaces(response.data?.places || []);
    } catch (err) {
      console.error("Error loading destination places:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Unable to load tourist attractions for this destination.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceClick = (place) => {
    if (!place?.id) return;
    navigate(`/destination-details/${encodeURIComponent(place.id)}`, {
      state: { place },
    });
  };

  const destinationName = destination?.name || "Destination";

  return (
    <div style={styles.page}>
      <Navbar activePage="/destinations" />

      <main style={styles.container}>
        {/* Destination Header Banner */}
        <section
          style={{
            ...styles.hero,
            backgroundImage: `linear-gradient(135deg, rgba(7, 89, 133, 0.88) 0%, rgba(15, 23, 42, 0.92) 100%), url(${getDestinationImageUrl(destinationName)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={styles.heroTop}>
            <span style={styles.heroBadge}>📍 DESTINATION GUIDE</span>
            <h1 style={styles.heroTitle}>{destinationName}</h1>
            <p style={styles.heroDescription}>
              Discover top-rated sights, attractions, and cultural landmarks to explore in {destinationName}.
            </p>
          </div>

          <div style={styles.heroActions}>
            {!isAdmin && (
              <Link to="/trips/create" style={styles.planTripBtn} id="dest-plan-trip-btn">
                <span>＋</span>
                <span>Plan Trip to {destinationName}</span>
              </Link>
            )}

            <Link to="/destinations" style={styles.backBtn} id="dest-back-btn">
              ← Back to Destinations
            </Link>
          </div>
        </section>

        {/* Error Alert */}
        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.loadingEmoji}>🌍</div>
            <h3>Finding top attractions...</h3>
            <p>Searching Google Places for the best highlights in {destinationName}.</p>
          </div>
        )}

        {/* Places Grid */}
        {!loading && !error && (
          <section style={styles.placesSection}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionTitle}>Top Places & Sights to Visit 🏛️</h2>
                <p style={styles.sectionSubtitle}>
                  Recommended tourist attractions and highlights
                </p>
              </div>

              <span style={styles.placesCountBadge}>
                {places.length} Attractions Found
              </span>
            </div>

            {places.length === 0 ? (
              <div style={styles.emptyBox}>
                <p>No specific tourist spots returned. Try exploring related destinations.</p>
              </div>
            ) : (
              <div style={styles.placesGrid}>
                {places.map((place, idx) => {
                  const name =
                    place.displayName?.text || place.displayName || "Attraction";
                  const address =
                    place.formattedAddress || "Address details available in guide";
                  const rating = place.rating;
                  const reviewCount = place.userRatingCount;

                  return (
                    <div
                      key={place.id || idx}
                      style={styles.card}
                      className="trip-card-hover"
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div style={styles.cardImageWrap}>
                        <img
                          src={getDestinationImageUrl(name)}
                          alt={name}
                          loading="lazy"
                          style={styles.cardImage}
                          onError={handleImageError}
                        />
                      </div>

                      <div style={styles.cardBody}>
                        <h3 style={styles.placeName}>{name}</h3>
                        <p style={styles.address}>{address}</p>

                        {rating && (
                          <div style={styles.ratingRow}>
                            <span style={styles.ratingBadge}>⭐ {rating}</span>
                            {reviewCount && (
                              <span style={styles.reviewText}>
                                ({reviewCount.toLocaleString()} ratings)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={styles.cardFooter}>
                        <button style={styles.exploreBtn}>
                          Explore Sight →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
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
  },

  hero: {
    background: "linear-gradient(135deg, #075985 0%, #0369a1 40%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "40px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "36px",
    boxShadow: "0 12px 32px rgba(3, 105, 161, 0.16)",
    flexWrap: "wrap",
    gap: "24px",
  },

  heroTop: {
    maxWidth: "640px",
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "10px",
  },

  heroTitle: {
    margin: "0 0 10px",
    fontSize: "clamp(26px, 4vw, 38px)",
    fontWeight: "800",
    color: "#ffffff",
  },

  heroDescription: {
    margin: 0,
    fontSize: "15px",
    color: "#e0f2fe",
    lineHeight: "1.5",
  },

  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  planTripBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#ffffff",
    color: "#0284c7",
    padding: "12px 22px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },

  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
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

  loadingBox: {
    padding: "70px 20px",
    textAlign: "center",
    color: "#64748b",
  },

  loadingEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },

  placesSection: {
    marginTop: "10px",
  },

  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "14px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  placesCountBadge: {
    background: "#e0f2fe",
    color: "#0284c7",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  placesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    cursor: "pointer",
  },

  cardImageWrap: {
    width: "100%",
    height: "160px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2e8f0",
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  cardIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f0f9ff",
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: {
    padding: "16px 20px",
    flex: 1,
  },

  placeName: {
    margin: "0 0 6px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  address: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.4",
  },

  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
  },

  ratingBadge: {
    background: "#fffbeb",
    color: "#b45309",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },

  reviewText: {
    fontSize: "12px",
    color: "#94a3b8",
  },

  cardFooter: {
    padding: "0 20px 20px",
  },

  exploreBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
  },

  emptyBox: {
    padding: "40px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    textAlign: "center",
    color: "#64748b",
  },
};

export default DestinationDetails;