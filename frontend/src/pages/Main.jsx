import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // 👈 IMPORT IMPORTANT
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
  
  // 1. RÉCUPÉRATION DES DONNÉES ENVOYÉES PAR L'ADMIN
  const location = useLocation();

  useEffect(() => {
    // Si on arrive ici avec un "state" contenant "loadConfig" (depuis l'admin)
    if (location.state && location.state.loadConfig) {
        console.log("📥 Chargement configuration Admin:", location.state.loadConfig);
        
        // On met à jour la config avec les données reçues
        setConfig(location.state.loadConfig);
        
        // On force le rafraîchissement des inputs
        setConfigKey((prev) => prev + 1);

        // Optionnel : On nettoie l'historique pour ne pas recharger la config si on fait F5
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleReset = () => {
      setConfig(INITIAL_CONFIG);
      setConfigKey((prev) => prev + 1);
  };

  // Charger une config depuis le panier
  const handleLoadFromCart = (cartItem) => {
      if(window.confirm("Voulez-vous charger cette configuration dans l'éditeur ? (La configuration actuelle non sauvegardée sera perdue)")) {
          const { id, unitPrice, totalPrice, quantity, ...configData } = cartItem;
          setConfig(configData);
          setConfigKey(prev => prev + 1);
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