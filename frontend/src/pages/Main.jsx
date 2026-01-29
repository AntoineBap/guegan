import React, { useState } from "react";
import "../styles/style.scss";
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Modal3D from "../components/Modal3D";
import Header from "../components/Header";
import Cart from "../components/Cart"; // Assurez-vous d'avoir créé le fichier Cart.js donné précédemment

// État initial pour le Reset
const INITIAL_CONFIG = {
  color: "white",
  length: 1200,
  width: 600,
  splashback: false,
  rims: false,
  rimHeigh: 100,
  aprons: true,
  apronFront: true,
  apronHeight: 40,
  // Laisser sinks vide ou null permet au useEffect du ConfigPanel de régénérer la config par défaut
  sinks: null, 
  anchorId: null
};

const Main = () => {
  // --- STATE CONFIG ---
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showModal, setShowModal] = useState(false);
  // configKey sert à forcer le re-rendu complet du ConfigPanel pour le reset visuel
  const [configKey, setConfigKey] = useState(0); 

  // --- STATE PANIER ---
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- LOGIQUE PANIER ---
  
  // Ajouter au panier
  const handleAddToCart = (finalConfig) => {
    const newItem = {
      ...finalConfig,
      id: Date.now(), // ID unique
    };

    setCartItems((prev) => [...prev, newItem]);

    if (window.confirm("Configuration ajoutée au panier ! Voulez-vous créer une nouvelle configuration ?")) {
      // 1. Reset du state de config
      setConfig(INITIAL_CONFIG);
      // 2. Incrémenter la clé pour forcer React à détruire et recréer le ConfigPanel
      setConfigKey((prev) => prev + 1);
    }
    
    setIsCartOpen(true);
  };

  // Mettre à jour quantité
  const updateCartItem = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) => prev.map((item) => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Supprimer du panier
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="layout">
      {/* HEADER : Reçoit les props pour ouvrir le panier et afficher le compteur */}
      <Header 
        toggleCart={() => setIsCartOpen(true)} 
        cartCount={cartItems.length} 
      />

      {/* PANIER (Overlay) */}
      {isCartOpen && (
        <Cart 
          cartItems={cartItems} 
          updateItem={updateCartItem} 
          removeItem={removeFromCart} 
          closeCart={() => setIsCartOpen(false)} 
        />
      )}

      <main className="main-content">
        
        {/* BLOC 1 : CONFIG */}
        {/* La prop 'key' est cruciale ici pour le reset */}
        <ConfigPanel
          key={configKey} 
          config={config}
          setConfig={setConfig}
          setShowModal={setShowModal}
          onAddToCart={handleAddToCart} // Passe la fonction au ConfigPanel -> ConfigResume
        />

        {/* BLOC 2 : VISUALIZER */}
        <div className="visualizer-container">
           <Visualizer config={config} />
        </div>

      </main>
      
      {/* MODAL 3D */}
      <Modal3D
        config={config}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
};

export default Main;