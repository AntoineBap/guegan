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
  
  // --- GESTION DU DROPDOWN PROFIL ---
  const [isHovered, setIsHovered] = useState(false); // État survol
  const [isClicked, setIsClicked] = useState(false); // État clic (persistant)
  const hoverTimeoutRef = useRef(null); // Référence pour le timer du hover
  const dropdownRef = useRef(null); // Référence pour détecter le clic hors zone

  // Est-ce que le menu doit être affiché ? (Soit survolé, soit cliqué)
  const showDropdown = isHovered || isClicked;

  // Gestion entrée souris (Annule la fermeture si on revient vite)
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  // Gestion sortie souris (Ferme après 0.5s)
  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 500); // 500ms de délai
  };

  // Gestion du clic sur le bouton "Mon Profil"
  const handleProfileClick = () => {
    setIsClicked(!isClicked); // Bascule l'état permanent
  };

  // Gestion du clic en dehors pour fermer (Perte de focus)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClicked(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // --- RESTE DU HEADER ---
  const cartCount = cartItems.length;
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      navigate('/'); 
    }
  };

  const isOnAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')}>
        GUEGAN <span className="subtitle">Shop</span>
      </div>
      
      <div className="header-actions">
        {isAuthenticated ? (
            <div className="auth-group">
                {isAdmin && (
                    <button 
                        className="admin-btn" 
                        onClick={() => navigate(isOnAdminPage ? '/' : '/admin')}
                    >
                        <span className="icon">{isOnAdminPage ? '🛠️' : '⚙️'}</span>
                        <span className="text">
                            {isOnAdminPage ? 'Configurateur' : 'Dashboard'}
                        </span>
                    </button>
                )}

                {/* CONTAINER DU DROPDOWN AVEC GESTION SOURIS */}
                <div 
                    className="profile-dropdown" 
                    ref={dropdownRef} // Pour détecter clic extérieur
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
                    
                    {/* LE CONTENU : La classe .visible gère l'affichage */}
                    <div className={`dropdown-content ${showDropdown ? 'visible' : ''}`}>
                        <button className="menu-item" onClick={() => navigate('/my-orders')}>
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