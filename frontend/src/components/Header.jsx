import React, { useContext, useState, useRef, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; 
import '../styles/header.scss';

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

  // Détermine si on est sur une page admin
  const isInternalAdminPage = location.pathname.startsWith('/admin');

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
    navigate('/');
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="header">
      <div className="social-links">
        <a href="https://www.instagram.com/etablissementsguegan/" target="_blank" rel="noopener noreferrer" className="social-btn instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        <a href="https://www.facebook.com/EtablissementsGUEGAN/" target="_blank" rel="noopener noreferrer" className="social-btn">
          <svg viewBox="0 0 24 24" fill="black">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/etablissementsguegan/" target="_blank" rel="noopener noreferrer" className="social-btn">
          <svg viewBox="0 0 24 24" fill="black">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
        </a>
      </div>

      <div className="logo" onClick={() => navigate('/')}>
        GUEGAN <span className="subtitle">Shop</span>
      </div>

      <div className="header-actions">
        {/* --- NOUVEAU BOUTON CONTACT --- */}
        <button className="contact-btn" onClick={() => navigate('/contact')}>
            <span className="icon">✉️</span>
            <span className="text">Contact</span>
        </button>

        {/* LOGIQUE D'ALTERNANCE : Si Admin, on affiche soit le bouton Admin, soit le bouton Configurateur */}
        {isAdmin && (
            isInternalAdminPage ? (
                <button className="config-btn" onClick={() => navigate('/configurator')}>
                    <span className="icon">🛠️</span>
                    <span className="text">Configurateur</span>
                </button>
            ) : (
                <button className="admin-btn" onClick={() => navigate('/admin')}>
                    <span className="icon">⚙️</span>
                    <span className="text">Admin</span>
                </button>
            )
        )}

        {isAuthenticated ? (
            <div className="profile-container" ref={dropdownRef}>
                <div 
                    className="dropdown-trigger"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button 
                        className={`profile-btn ${showDropdown ? 'active' : ''}`}
                        onClick={handleProfileClick}
                    >
                        <span className="icon">👤</span> 
                        <span className="text">Mon Profil</span>
                    </button>
                    
                    <div className={`dropdown-content ${showDropdown ? 'visible' : ''}`}>
                        <button className="menu-item" onClick={() => {navigate('/my-orders'); setIsClicked(false);}}>
                          📦 Mes Commandes
                        </button>
                        <button className="logout-item" onClick={handleLogout}>
                            Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>
                <span className="icon">👤</span>
                <span className="text">Connexion</span>
            </button>
        )}

        <button className="cart-btn" onClick={toggleCart}>
          <span className="icon">🛒</span> 
          <span className="text">Panier</span>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
};

export default Header;