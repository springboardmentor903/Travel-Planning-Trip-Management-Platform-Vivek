import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import { getDestinationImageUrl, handleImageError } from "../utils/destinationImages";

function Destinations() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [error, setError] = useState("");

  // Destination search states for autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [searchingDestinations, setSearchingDestinations] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDestinations();
  }, []);

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

  const fetchDestinations = async () => {
    try {
      setLoadingDestinations(true);
      setError("");

      const [allResponse, popularResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/destinations`, getAuthConfig()),
        axios.get(`${API_BASE_URL}/api/destinations/popular`, getAuthConfig()),
      ]);

      setDestinations(Array.isArray(allResponse.data) ? allResponse.data : []);
      setPopularDestinations(
        Array.isArray(popularResponse.data) ? popularResponse.data : []
      );
    } catch (err) {
      console.error("Error loading destinations:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Unable to load destinations.");
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handleInputChange = (value) => {
    setQuery(value);
    setError("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setPlaces([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingDestinations(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/api/destinations/search`,
          {
            params: { query: value.trim() },
            ...getAuthConfig(),
          }
        );

        const fetchedPlaces = response.data?.places || [];
        setSuggestions(fetchedPlaces);
      } catch (err) {
        console.error("Destination suggestions error:", err);
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

  const handleSelectSuggestion = (place) => {
    const name = place?.displayName?.text || place?.displayName || "";
    setQuery(name);
    setSuggestions([]);
    setPlaces([place]);
    setError("");
  };

  const searchDestinations = async () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSuggestions([]);

    if (!query.trim()) {
      setError("Please enter a destination name to search.");
      setPlaces([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/api/destinations/search`,
        {
          params: { query: query.trim() },
          ...getAuthConfig(),
        }
      );

      console.log("GOOGLE PLACES RESPONSE:", response.data);
      const fetchedPlaces = response.data?.places || [];
      setPlaces(fetchedPlaces);
      if (fetchedPlaces.length === 0) {
        setError("No destinations found for your search. Try another city or landmark.");
      }
    } catch (err) {
      console.error("Destination search error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      setError("Unable to search destinations.");
      setPlaces([]);
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

  const handleDestinationClick = (destination) => {
    if (!destination?.id) return;
    navigate(`/destination-details/${destination.id}`, {
      state: { destination },
    });
  };

  return (
    <div style={styles.page}>
      <Navbar activePage="/destinations" />

      <main style={styles.container}>
        {/* Hero Search Section */}
        <section style={styles.heroSection}>
          <span style={styles.badge}>🌍 DISCOVER THE WORLD</span>
          <h1 style={styles.heroHeading}>Explore Dream Destinations</h1>
          <p style={styles.heroSub}>
            Search worldwide cities, natural wonders, landmarks, and top attractions powered by Google Places.
          </p>

          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchDestinations();
              }}
              placeholder="Search city, island, landmark (e.g. Kyoto, Banff, Santorini, Dubai)..."
              style={styles.searchInput}
              autoComplete="off"
            />
            {searchingDestinations && (
              <span style={{ fontSize: "16px", marginRight: "8px" }}>⏳</span>
            )}
            <button
              style={styles.searchBtn}
              onClick={searchDestinations}
              disabled={loading}
            >
              {loading ? "Searching..." : "Explore"}
            </button>

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
                      onClick={() => handleSelectSuggestion(place)}
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

          {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
        </section>

        {/* SEARCH RESULTS */}
        {places.length > 0 && (
          <section style={styles.sectionBlock}>
            <div style={styles.sectionTitleRow}>
              <h2 style={styles.sectionTitle}>
                Search Results for "{query}" 🔍
              </h2>
              <span style={styles.resultCountBadge}>{places.length} Places Found</span>
            </div>

            <div style={styles.placesGrid}>
              {places.map((place, idx) => {
                const name =
                  place?.displayName?.text || place?.displayName || "Unknown";
                const address = place?.formattedAddress || "";
                const rating = place?.rating;

                return (
                  <div
                    key={place.id || idx}
                    style={styles.placeCard}
                    className="trip-card-hover"
                    onClick={() => handlePlaceClick(place)}
                  >
                    <div style={styles.placeCardThumbWrap}>
                      <img
                        src={getDestinationImageUrl(name)}
                        alt={name}
                        loading="lazy"
                        style={styles.placeCardThumbImg}
                        onError={handleImageError}
                      />
                    </div>
                    <div style={styles.placeCardContent}>
                      <h3 style={styles.placeCardName}>{name}</h3>
                      {address && <p style={styles.placeCardAddr}>{address}</p>}
                      {rating && (
                        <div style={styles.ratingBadge}>
                          ⭐ {rating} / 5.0
                        </div>
                      )}
                    </div>
                    <button style={styles.viewPlaceBtn}>
                      View Guide →
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* POPULAR DESTINATIONS */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionTitle}>Trending & Popular Destinations ⭐</h2>
              <p style={styles.sectionDesc}>Top picks curated by fellow travelers</p>
            </div>
          </div>

          {loadingDestinations ? (
            <div style={styles.destGrid}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={styles.skeletonCard} />
              ))}
            </div>
          ) : popularDestinations.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No popular destinations found.</p>
            </div>
          ) : (
            <div style={styles.destGrid}>
              {popularDestinations.map((dest) => (
                <div
                  key={dest.id || dest.name}
                  style={styles.destCard}
                  className="trip-card-hover"
                  onClick={() => handleDestinationClick(dest)}
                >
                  <img
                    src={dest.imageUrl || getDestinationImageUrl(dest.name)}
                    alt={dest.name}
                    loading="lazy"
                    style={styles.destImage}
                    onError={handleImageError}
                  />
                  <div style={styles.destOverlay}>
                    <h3 style={styles.destName}>{dest.name}</h3>
                    <p style={styles.destExcerpt}>
                      {dest.description
                        ? `${dest.description.slice(0, 65)}...`
                        : "Discover sights, food, and culture."}
                    </p>
                    <span style={styles.destLinkText}>Explore Details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ALL DESTINATIONS DIRECTORY */}
        <section style={styles.sectionBlock}>
          <div style={styles.sectionTitleRow}>
            <div>
              <h2 style={styles.sectionTitle}>Destination Directory 🗺️</h2>
              <p style={styles.sectionDesc}>Browse all destinations saved in your TripNest platform</p>
            </div>
          </div>

          {loadingDestinations ? (
            <div style={styles.destGrid}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={styles.skeletonCard} />
              ))}
            </div>
          ) : destinations.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No destinations found in directory.</p>
            </div>
          ) : (
            <div style={styles.destDirectoryGrid}>
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  style={styles.destDirectoryCard}
                  className="trip-card-hover"
                  onClick={() => handleDestinationClick(dest)}
                >
                  <div style={styles.destDirThumbWrap}>
                    <img
                      src={getDestinationImageUrl(dest.name)}
                      alt={dest.name}
                      loading="lazy"
                      style={styles.destDirThumbImg}
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <h4 style={styles.destDirName}>{dest.name}</h4>
                    <p style={styles.destDirText}>Plan your visit to {dest.name}</p>
                  </div>
                  <span style={styles.arrowIcon}>→</span>
                </div>
              ))}
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
    padding: "36px 0 60px",
  },

  heroSection: {
    background: "linear-gradient(135deg, #075985 0%, #0369a1 40%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "44px 40px",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: "40px",
    boxShadow: "0 12px 32px rgba(3, 105, 161, 0.16)",
  },

  badge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "12px",
  },

  heroHeading: {
    margin: "0 0 10px",
    fontSize: "clamp(26px, 4vw, 38px)",
    fontWeight: "800",
    color: "#ffffff",
  },

  heroSub: {
    margin: "0 auto 28px",
    fontSize: "15px",
    color: "#e0f2fe",
    maxWidth: "600px",
    lineHeight: "1.5",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "6px 8px 6px 18px",
    maxWidth: "640px",
    margin: "0 auto",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    gap: "10px",
    position: "relative",
  },

  searchIcon: {
    fontSize: "18px",
    color: "#94a3b8",
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
    textAlign: "left",
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

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "15px",
    padding: "10px 0",
    color: "#0f172a",
  },

  searchBtn: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
  },

  errorAlert: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: "10px",
    maxWidth: "500px",
    margin: "18px auto 0",
    fontSize: "13px",
    fontWeight: "600",
  },

  sectionBlock: {
    marginBottom: "48px",
  },

  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },

  sectionDesc: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  resultCountBadge: {
    background: "#e0f2fe",
    color: "#0284c7",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  placesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  placeCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "22px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },

  placeCardIcon: {
    fontSize: "28px",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f0f9ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  placeCardThumbWrap: {
    width: "100%",
    height: "140px",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },

  placeCardThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  placeCardContent: {
    flex: 1,
  },

  placeCardName: {
    margin: "0 0 6px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  placeCardAddr: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.4",
  },

  ratingBadge: {
    display: "inline-block",
    marginTop: "8px",
    background: "#fffbeb",
    color: "#b45309",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },

  viewPlaceBtn: {
    background: "#f0f9ff",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  destGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },

  destCard: {
    position: "relative",
    height: "280px",
    borderRadius: "18px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },

  destImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  destOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "24px 20px 18px",
    background: "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)",
    color: "#ffffff",
  },

  destName: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
  },

  destExcerpt: {
    margin: "0 0 10px",
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.4",
  },

  destLinkText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#38bdf8",
  },

  destDirectoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  destDirectoryCard: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    gap: "14px",
  },

  destDirIcon: {
    fontSize: "20px",
  },

  destDirThumbWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#e2e8f0",
  },

  destDirThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  destDirName: {
    margin: "0 0 2px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  destDirText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },

  arrowIcon: {
    fontSize: "16px",
    color: "#94a3b8",
  },

  skeletonCard: {
    height: "280px",
    borderRadius: "18px",
    background: "#e2e8f0",
  },

  emptyCard: {
    padding: "36px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    textAlign: "center",
    color: "#64748b",
  },
};

export default Destinations;