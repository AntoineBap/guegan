import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/configurator.scss";
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Header from "../components/Header";
import Carousel from "../components/Carousel";
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

// Photos optimisées (WebP 1000 / 2000 px) générées depuis img3 à img6
const SLIDES = [1, 2, 3, 4].map((n) => `/photos/realisation-${n}`);

const CAROUSEL_OPTIONS = { loop: true };

const Configurator = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [configKey, setConfigKey] = useState(0);
  const [editIndex, setEditIndex] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.loadConfig) {
      setConfig(location.state.loadConfig);
      setConfigKey((prev) => prev + 1);
      setEditIndex(location.state.editIndex ?? null);
      window.scrollTo(0, 0);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleReset = () => {
    setConfig(INITIAL_CONFIG);
    setConfigKey((prev) => prev + 1);
    setEditIndex(null);
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
      <Header />

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
            onReset={handleReset}
            editIndex={editIndex}
            onEditDone={() => setEditIndex(null)}
          />

          <div className="carousel-area mobile-only">
            <Carousel slides={SLIDES} options={CAROUSEL_OPTIONS} />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Configurator;