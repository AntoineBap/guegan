import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import "../styles/header.scss";

// ── Icônes SVG minimalistes ────────────────────────────────────────────────
const IconOrders = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8H3l1.5 12h15L21 8z"/>
    <path d="M1 8h22"/>
    <path d="M10 8V4h4v4"/>
    <path d="M10 13h4"/>
  </svg>
);

const IconQuotes = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconAccount = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, isAdmin } = useContext(AuthContext);
  const { cartItems, setIsCartOpen, isCartOpen } = useCart();

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const showDropdown = isHovered || isClicked;

  const isInternalAdminPage = location.pathname.startsWith("/admin");

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 500);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setIsClicked(!isClicked);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClicked(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsClicked(false);
    navigate("/");
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navigateTo = (path) => {
    navigate(path);
    setIsClicked(false);
  };

  return (
    <header className="header">
      <div className="social-links">
        <a
          href="https://www.instagram.com/etablissementsguegan/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn instagram"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        <a
          href="https://www.facebook.com/EtablissementsGUEGAN/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn"
        >
          <svg viewBox="0 0 24 24" fill="black">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/company/etablissementsguegan/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn"
        >
          <svg viewBox="0 0 24 24" fill="black">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
        </a>
      </div>

      <div className="logo" onClick={() => navigate("/")}>
        GUEGAN <span className="subtitle">Shop</span>
      </div>

      <div className="header-actions">
        <button className="contact-btn" onClick={() => navigate("/contact")}>
          <span className="text">Contact</span>
        </button>

        {isAdmin &&
          (isInternalAdminPage ? (
            <button className="config-btn" onClick={() => navigate("/configurator")}>
              <span className="text">Configurateur</span>
            </button>
          ) : (
            <button className="admin-btn" onClick={() => navigate("/admin")}>
              <span className="text">Admin</span>
            </button>
          ))}

        {isAuthenticated ? (
          <div className="profile-container" ref={dropdownRef}>
            <div
              className="dropdown-trigger"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`profile-btn ${showDropdown ? "active" : ""}`}
                onClick={handleProfileClick}
              >
                <span className="text">Mon Profil</span>
              </button>

              <div className={`dropdown-content ${showDropdown ? "visible" : ""}`}>

                {/* ── Section principale ── */}
                <button className="menu-item" onClick={() => navigateTo("/my-account")}>
                  <IconAccount />
                  <span>Mon Compte</span>
                </button>

                <div className="dropdown-divider" />

                {/* ── Commandes & Devis ── */}
                <button className="menu-item" onClick={() => navigateTo("/my-orders")}>
                  <IconOrders />
                  <span>Mes Commandes</span>
                </button>
                <button className="menu-item" onClick={() => navigateTo("/my-quotes")}>
                  <IconQuotes />
                  <span>Mes Devis</span>
                </button>

                <div className="dropdown-divider" />

                {/* ── Déconnexion ── */}
                <button className="logout-item" onClick={handleLogout}>
                  <IconLogout />
                  <span>Se déconnecter</span>
                </button>

              </div>
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            <span className="text">Connexion</span>
          </button>
        )}

        <button className="cart-btn" onClick={toggleCart}>
          <span className="text">Panier</span>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
};

export default Header;