import React from 'react';
import '../styles/header.scss';

const Header = ({ toggleCart, cartCount }) => {
  return (
    <header className="header">
      <div className="logo">GUEGAN <span className="logo-sub">Configurator</span></div>
      
      <button className="cart-btn" onClick={toggleCart}>
        <span role="img" aria-label="cart">🛒</span> Mon Panier
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>
    </header>
  );
};

export default Header;