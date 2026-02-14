import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/style.scss";
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Modal3D from "../components/Modal3D";
import Header from "../components/Header";
import Cart from "../components/Cart";
import Carousel from "../components/Carousel";
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

// 👇 MODIFICATION : On utilise des images réelles pour le slider
const SLIDES = [
    "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1358900/pexels-photo-1358900.jpeg?auto=compress&cs=tinysrgb&w=800"
];

// 👇 MODIFICATION : Loop true pour tourner en rond
const CAROUSEL_OPTIONS = { loop: true };

const Configurator = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showModal, setShowModal] = useState(false);
  const [configKey, setConfigKey] = useState(0); 

  const { cartItems, isCartOpen, setIsCartOpen, updateCartItem, removeFromCart } = useCart();
  
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.loadConfig) {
        console.log("📥 Chargement configuration Admin:", location.state.loadConfig);
        setConfig(location.state.loadConfig);
        setConfigKey((prev) => prev + 1);
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleReset = () => {
      setConfig(INITIAL_CONFIG);
      setConfigKey((prev) => prev + 1);
  };

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
           {/* Partie Haute : 3D */}
           <div className="canvas-wrapper">
              <Visualizer config={config} />
           </div>

           {/* Partie Basse : Carousel */}
           <div className="carousel-wrapper">
              <Carousel slides={SLIDES} options={CAROUSEL_OPTIONS} />
           </div>
        </div>
      </main>
      
      <Modal3D config={config} showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Configurator;