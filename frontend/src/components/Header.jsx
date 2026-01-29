import React from 'react';
import '../styles/header.scss';

const Header = ({ toggleCart, cartCount }) => {
  return (
    <header className="header">
      <div className="logo">GUEGAN <span style={{fontSize:'0.5em', color:'#888'}}>Configurator</span></div>
      
      <button className="cart-btn" onClick={toggleCart}>
        <span className="icon">🛒</span> 
        <span className="text">Panier</span>
        {cartCount > 0 && <span className="badge">{cartCount}</span>}
      </button>
    </header>
  );
};

export default Header;