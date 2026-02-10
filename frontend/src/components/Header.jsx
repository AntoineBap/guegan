import React, { useContext } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/header.scss'; // Import du SCSS

const Header = ({ toggleCart, cartCount }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')}>
        GUEGAN <span className="subtitle">Configurator</span>
      </div>
      
      <div className="header-actions">
        {isAuthenticated ? (
            // SI CONNECTÉ : Bouton Profil / Déconnexion
            <div className="auth-group">
                <button className="profile-btn">
                    <span className="icon">👤</span> 
                    <span className="text">Mon Profil</span>
                </button>
                <button className="logout-btn" onClick={logout}>
                    <span className="icon">🚪</span> 
                    <span className="text">Déconnexion</span>
                </button>
            </div>
        ) : (
            // SI PAS CONNECTÉ : Bouton Login
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