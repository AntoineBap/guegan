import React, { useState } from "react";
import "../styles/style.scss";
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Modal3D from "../components/Modal3D";
import Header from "../components/Header";
import Cart from "../components/Cart";
import { useCart } from "../contexts/CartContext";

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
  sinks: null,
  anchorId: null
};

const Main = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showModal, setShowModal] = useState(false);
  const [configKey, setConfigKey] = useState(0); 

  const { cartItems, isCartOpen, setIsCartOpen, updateCartItem, removeFromCart } = useCart();

  const handleReset = () => {
      setConfig(INITIAL_CONFIG);
      setConfigKey((prev) => prev + 1);
  };

  // --- NOUVELLE FONCTION : Charger une config depuis le panier ---
  const handleLoadFromCart = (cartItem) => {
      // On demande confirmation car cela va écraser la config en cours
      if(window.confirm("Voulez-vous charger cette configuration dans l'éditeur ? (La configuration actuelle non sauvegardée sera perdue)")) {
          
          // On crée une copie propre sans les propriétés du panier (id, prix, qty)
          // On garde 'id' du cartItem temporairement si on voulait faire une mise à jour, 
          // mais ici on veut juste visualiser, donc on traite comme une nouvelle config.
          const { id, unitPrice, totalPrice, quantity, ...configData } = cartItem;
          
          // Mise à jour de la config
          setConfig(configData);
          
          // Force le re-render du Panel pour bien afficher les valeurs
          setConfigKey(prev => prev + 1);
          
          // Ferme le panier
          setIsCartOpen(false);
      }
  };

  return (
    <div className="layout">
      <Header toggleCart={() => setIsCartOpen(true)} cartCount={cartItems.length} />

      {isCartOpen && (
        <Cart 
            cartItems={cartItems} 
            updateItem={updateCartItem} 
            removeItem={removeFromCart} 
            closeCart={() => setIsCartOpen(false)}
            // On passe la nouvelle fonction ici
            onLoadConfig={handleLoadFromCart} 
        />
      )}

      <main className="main-content">
        <ConfigPanel
          key={configKey} 
          config={config}
          setConfig={setConfig}
          setShowModal={setShowModal}
          onReset={handleReset} 
        />

        <div className="visualizer-container">
           <Visualizer config={config} />
        </div>
      </main>
      
      <Modal3D config={config} showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Main;