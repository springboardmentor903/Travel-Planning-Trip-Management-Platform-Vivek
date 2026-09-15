import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";

function Navbar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 868);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 868;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");
  const rawUserName = localStorage.getItem("userName") || "Traveler";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "";
  const isAdmin = userRole === "ADMINISTRATOR";
  const userName =
    rawUserName.toLowerCase().startsWith("default") || isAdmin
      ? "Admin"
      : rawUserName;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const navLinks = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "My Trips", path: "/trips", icon: "🧳" },
    { label: "Destinations", path: "/destinations", icon: "🌍" },
    { label: "Profile", path: "/profile", icon: "👤" },
    ...(userRole === "ADMINISTRATOR"
      ? [{ label: "Admin", path: "/admin", icon: "🛡️" }]
      : []),
  ];

  const currentPath = activePage || location.pathname;

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Brand */}
        <div style={styles.brand} onClick={() => navigate(token ? "/dashboard" : "/")}>
          <span style={styles.brandIcon}>✈️</span>
          <span className="tripnest-logo-text" style={styles.brandName}>
            TripNest
          </span>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav style={styles.desktopNav}>
            {token ? (
              <>
                <div style={styles.navLinksWrapper}>
                  {navLinks.map((link) => {
                    const isActive =
                      currentPath === link.path ||
                      (link.path === "/trips" && currentPath.startsWith("/trips"));

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        style={{
                          ...styles.navLink,
                          ...(isActive ? styles.navLinkActive : {}),
                        }}
                      >
                        <span style={styles.linkIcon}>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div style={styles.userSection}>
                  <NotificationDropdown />

                  {!isAdmin && (
                    <Link to="/trips/create" style={styles.createTripBtn} id="nav-create-trip-btn">
                      <span>＋</span>
                      <span>Create Trip</span>
                    </Link>
                  )}

                  <div
                    style={styles.userBadge}
                    onClick={() => navigate("/profile")}
                    title={`Signed in as ${userName} (${userEmail})`}
                  >
                    <div style={styles.avatar}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span style={styles.userNameText}>{userName.split(" ")[0]}</span>
                  </div>

                  <button
                    style={styles.logoutBtn}
                    onClick={handleLogout}
                    title="Log out of TripNest"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.guestSection}>
                <Link to="/login" style={styles.loginLink}>
                  Log In
                </Link>
                <Link to="/register" style={styles.registerBtn}>
                  Get Started Free
                </Link>
              </div>
            )}
          </nav>
        )}

        {/* Mobile Actions: Notification Bell + Hamburger Toggle */}
        {isMobile && (
          <div style={styles.mobileRightActions}>
            {token && <NotificationDropdown />}
            <button
              style={styles.hamburgerBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isMobile && mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {token ? (
            <>
              <div style={styles.mobileUserHeader}>
                <div style={styles.mobileAvatar}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.mobileUserName}>{userName}</div>
                  <div style={styles.mobileUserEmail}>{userEmail}</div>
                </div>
              </div>

              <div style={styles.mobileLinksList}>
                {navLinks.map((link) => {
                  const isActive =
                    currentPath === link.path ||
                    (link.path === "/trips" && currentPath.startsWith("/trips"));

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        ...styles.mobileNavLink,
                        ...(isActive ? styles.mobileNavLinkActive : {}),
                      }}
                    >
                      <span style={styles.mobileLinkIcon}>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {!isAdmin && (
                  <Link
                    to="/trips/create"
                    onClick={() => setMobileMenuOpen(false)}
                    style={styles.mobileCreateBtn}
                    id="mobile-nav-create-trip-btn"
                  >
                    ＋ Create New Trip
                  </Link>
                )}
              </div>

              <div style={styles.mobileLogoutWrapper}>
                <button
                  style={styles.mobileLogoutBtn}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  🚪 Log Out
                </button>
              </div>
            </>
          ) : (
            <div style={styles.mobileGuestActions}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={styles.mobileLoginBtn}
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={styles.mobileRegisterBtn}
              >
                Create Free Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none",
  },

  brandIcon: {
    fontSize: "24px",
  },

  brandName: {
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  desktopNav: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  navLinksWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    textDecoration: "none",
    transition: "all 0.15s ease",
  },

  navLinkActive: {
    color: "#0284c7",
    background: "#f0f9ff",
  },

  linkIcon: {
    fontSize: "16px",
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    borderLeft: "1px solid #e2e8f0",
    paddingLeft: "20px",
  },

  createTripBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#0284c7",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
  },

  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "4px 10px 4px 4px",
    borderRadius: "24px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    transition: "background 0.15s",
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
  },

  userNameText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },

  logoutBtn: {
    padding: "7px 13px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s",
  },

  guestSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  loginLink: {
    padding: "8px 16px",
    color: "#334155",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
  },

  registerBtn: {
    padding: "8px 18px",
    background: "#0284c7",
    color: "#ffffff",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
  },

  mobileRightActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  hamburgerBtn: {
    fontSize: "20px",
    color: "#0f172a",
    background: "#f1f5f9",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  mobileMenu: {
    padding: "16px 20px 24px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  mobileUserHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "16px",
    marginBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },

  mobileAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#0284c7",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
  },

  mobileUserName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  mobileUserEmail: {
    fontSize: "12px",
    color: "#64748b",
  },

  mobileLinksList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  mobileNavLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#334155",
    textDecoration: "none",
  },

  mobileNavLinkActive: {
    background: "#f0f9ff",
    color: "#0284c7",
  },

  mobileLinkIcon: {
    fontSize: "18px",
  },

  mobileCreateBtn: {
    display: "block",
    textAlign: "center",
    background: "#0284c7",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    textDecoration: "none",
    marginTop: "10px",
  },

  mobileLogoutWrapper: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #f1f5f9",
  },

  mobileLogoutBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  mobileGuestActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  mobileLoginBtn: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    fontWeight: "600",
    textDecoration: "none",
  },

  mobileRegisterBtn: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    borderRadius: "10px",
    background: "#0284c7",
    color: "#ffffff",
    fontWeight: "700",
    textDecoration: "none",
  },
};

export default Navbar;
