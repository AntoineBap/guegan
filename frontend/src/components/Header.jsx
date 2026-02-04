import React, { useContext } from 'react'; // <--- Import useContext
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // <--- Import AuthContext
import '../styles/header.scss';

const Header = ({ toggleCart, cartCount }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext); // <--- On récupère l'état

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
        GUEGAN <span style={{fontSize:'0.5em', color:'#888'}}>Configurator</span>
      </div>
      
      <div className="header-actions">
        {isAuthenticated ? (
            // SI CONNECTÉ : Bouton Profil / Déconnexion
            <div style={{display:'flex', gap:'10px'}}>
                <button className="auth-btn" style={{borderColor: 'green', color: 'green'}}>
                    <span className="icon">👤</span> Mon Profil
                </button>
                <button className="auth-btn" onClick={logout} style={{borderColor: '#e74c3c', color: '#e74c3c'}}>
                    Déconnexion
                </button>
            </div>
        ) : (
            // SI PAS CONNECTÉ : Bouton Login
            <button className="auth-btn" onClick={() => navigate('/login')}>
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