import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.scss";

// DÉFINITION DE LA SÉQUENCE
// type: 'video' ou 'image'
// src: chemin du fichier
// duration: temps d'affichage pour les images (en ms). Pour la vidéo, on attend la fin.
const MEDIA_SEQUENCE = [
  { type: "video", src: "/videos/video_vasque.mp4" },
  { type: "image", src: "img1.jpeg", duration: 3000 }, // 3 secondes
  { type: "image", src: "img2.png", duration: 3000 },
];

const Home = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // Fonction pour passer à l'étape suivante
  const nextStep = () => {
    setCurrentIndex((prev) => (prev + 1) % MEDIA_SEQUENCE.length);
  };

  // GESTION DU TIMING ET DE LA VIDÉO
  useEffect(() => {
    const currentMedia = MEDIA_SEQUENCE[currentIndex];

    // Si c'est une IMAGE
    if (currentMedia.type === "image") {
      const timer = setTimeout(nextStep, currentMedia.duration);
      return () => clearTimeout(timer);
    }

    // Si c'est une VIDÉO
    if (currentMedia.type === "video" && videoRef.current) {
      const video = videoRef.current;
      video.currentTime = 0;
      video.play().catch((e) => console.log(e));

      // On passe à la suite seulement quand la vidéo est finie
      // Note : Assurez-vous de NE PAS mettre l'attribut 'loop' sur la balise video HTML
      const onEnded = () => nextStep();
      video.addEventListener("ended", onEnded);

      return () => {
        video.removeEventListener("ended", onEnded);
        video.pause();
      };
    }
  }, [currentIndex]);

  return (
    <div className="home-page">
      {/* CONTAINER DES MÉDIAS (BACKGROUND) */}
      <div className="background-container">
        <div className="overlay"></div> {/* Filtre sombre constant */}
        {MEDIA_SEQUENCE.map((item, index) => {
          const isActive = index === currentIndex;

          if (item.type === "video") {
            return (
              <video
                key={index}
                ref={videoRef}
                className={`media-item ${isActive ? "active" : ""}`}
                muted
                playsInline
                // Pas de 'loop', pas d'autoPlay ici (géré par le useEffect)
              >
                <source src={item.src} type="video/mp4" />
              </video>
            );
          } else {
            return (
              <div
                key={index}
                className={`media-item ${isActive ? "active" : ""}`}
                style={{ backgroundImage: `url(${item.src})` }}
              />
            );
          }
        })}
      </div>

      <nav className="home-nav">
        <div className="logo">GUEGAN <span className="subtitle">Shop</span></div>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <h1>
            Créez votre Plan-Vasque <br />
            <span className="gold-text">Sur Mesure</span>
          </h1>
          <p>
            Configurez, visualisez en 3D et commandez vos plans-vasques en
            résine Solid Surface® directement en ligne.
          </p>

          <div className="cta-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("/configurator")}
            >
              Commencer une configuration →
            </button>
            <button
              className="secondary-btn"
              onClick={() => navigate("/login")}
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Home;
