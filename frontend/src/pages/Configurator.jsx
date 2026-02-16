import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/configurator.scss";
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
  anchorId: null,
};

const SLIDES = ["img3.jpg", "img4.jpg", "img5.jpg", "img6.jpg"];

const CAROUSEL_OPTIONS = { loop: true };

const Configurator = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showModal, setShowModal] = useState(false);
  const [configKey, setConfigKey] = useState(0);

  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateCartItem,
    removeFromCart,
  } = useCart();

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.state && location.state.loadConfig) {
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
    if (
      window.confirm("Voulez-vous charger cette configuration dans l'éditeur ?")
    ) {
      const { id, unitPrice, totalPrice, quantity, ...configData } = cartItem;
      setConfig(configData);
      setConfigKey((prev) => prev + 1);
      setIsCartOpen(false);
    }
  };

  return (
    <div className="layout">
      <Header
        toggleCart={() => setIsCartOpen(true)}
        cartCount={cartItems.length}
      />

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
        <div className="visualizer-area">
          <div className="canvas-wrapper">
            <Visualizer config={config} />
          </div>

          <div className="desktop-carousel-wrapper">
            <Carousel slides={SLIDES} options={CAROUSEL_OPTIONS} />
          </div>
        </div>

        <div className="scrollable-area">
          <ConfigPanel
            key={configKey}
            config={config}
            setConfig={setConfig}
            setShowModal={setShowModal}
            onReset={handleReset}
          />

          <div className="carousel-area mobile-only">
            <Carousel slides={SLIDES} options={CAROUSEL_OPTIONS} />
          </div>
        </div>
      </main>

      <Modal3D
        config={config}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
};

export default Configurator;
