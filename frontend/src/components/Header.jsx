import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import "../styles/header.scss";

const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconUser = () => (
  <Svg>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

const IconBag = () => (
  <Svg>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const IconChevron = () => (
  <Svg size={14}>
    <polyline points="6 9 12 15 18 9" />
  </Svg>
);

const IconMenu = () => (
  <Svg size={20}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </Svg>
);

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/etablissementsguegan/",
    icon: (
      <Svg size={16}>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </Svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/EtablissementsGUEGAN/",
    icon: (
      <Svg size={16}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </Svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/etablissementsguegan/",
    icon: (
      <Svg size={16}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </Svg>
    ),
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, isAdmin, user } = useContext(AuthContext);
  const { cartItems, setIsCartOpen, isCartOpen } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  // Ferme les menus au changement de page, au clic extérieur et sur Échap
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  return (
    <header className="header">
      <div className="header-inner">
        <button
          className="nav-toggle"
          aria-label="Menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <IconMenu />
        </button>

        <Link to="/" className="logo" aria-label="Guegan Shop — accueil">
          GUEGAN <span className="subtitle">Shop</span>
        </Link>

        <nav className={`main-nav ${mobileNavOpen ? "open" : ""}`} aria-label="Navigation principale">
          <NavLink to="/configurator">Configurateur</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="nav-admin">
              Administration
            </NavLink>
          )}
          <div className="social-links">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="account-menu" ref={menuRef}>
              <button
                className={`account-btn ${menuOpen ? "active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="avatar" aria-hidden="true">{initials || <IconUser />}</span>
                <span className="label">Mon compte</span>
                <IconChevron />
              </button>

              {menuOpen && (
                <div className="dropdown" role="menu">
                  {user && (
                    <div className="dropdown-head">
                      <strong>{user.firstName} {user.lastName}</strong>
                      {user.companyName && <span>{user.companyName}</span>}
                    </div>
                  )}
                  <Link role="menuitem" to="/my-account">Mes informations</Link>
                  <Link role="menuitem" to="/my-orders">Mes commandes</Link>
                  <Link role="menuitem" to="/my-quotes">Mes devis</Link>
                  <hr />
                  <button role="menuitem" className="logout" onClick={handleLogout}>
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-link">
              <IconUser />
              <span className="label">Connexion</span>
            </Link>
          )}

          <button
            className="cart-btn"
            onClick={() => setIsCartOpen(!isCartOpen)}
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
          >
            <IconBag />
            <span className="label">Panier</span>
            {cartCount > 0 && <span className="count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
