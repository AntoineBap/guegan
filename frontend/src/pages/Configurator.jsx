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
import { Helmet } from 'react-helmet-async';

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
      <Helmet>
        <title>Configurateur plans vasque Guégan — Personnalisez votre commande</title>
        <meta name="description" content="Utilisez notre configurateur pour personnaliser et commander vos plans vasque Guégan : choisissez dimensions, finitions et options. Devis immédiat en ligne." />
        <meta name="keywords" content="configurateur plan vasque, commander plan vasque Guégan, plan vasque sur mesure, robinetterie personnalisée Guégan" />
        <link rel="canonical" href="https://guegan-shop.fr/configurator" />
        <meta property="og:title" content="Configurateur plans vasque Guégan" />
        <meta property="og:description" content="Personnalisez et commandez vos plans vasque Guégan en quelques clics." />
        <meta property="og:url" content="https://guegan-shop.fr/configurator" />

        {/* Schema.org — Page produit/service */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Configurateur plans vasque Guégan",
            "description": "Configurez et commandez vos plans vasque et robinetterie Guégan en ligne",
            "url": "https://guegan-shop.fr/configurator",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://guegan-shop.fr/" },
                { "@type": "ListItem", "position": 2, "name": "Configurateur", "item": "https://guegan-shop.fr/configurator" }
              ]
            }
          }
        `}</script>
      </Helmet>
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