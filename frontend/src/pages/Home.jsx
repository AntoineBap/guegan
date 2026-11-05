import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import { SettingsContext } from "../contexts/SettingsContext";
import "../styles/home.scss";

// Le site n'utilise que le stockage nécessaire à son fonctionnement (session, panier) :
// pas de consentement requis, une simple information suffit.
const NOTICE_KEY = "guegan_cookie_consent";

// type: 'video' ou 'image' · duration en ms pour les images (la vidéo va jusqu'au bout)
// Les anciennes images (img1/img2) faisaient 320 px de large : floues en plein écran.
const photo = (n) =>
  `/photos/realisation-${n}-${typeof window !== "undefined" && window.innerWidth < 900 ? 1000 : 2000}.webp`;

const MEDIA_SEQUENCE = [
  { type: "video", src: "/videos/video_vasque.mp4" },
  { type: "image", src: photo(1), duration: 5000 },
  { type: "image", src: photo(2), duration: 5000 },
];

const readNotice = () => {
  try {
    return !localStorage.getItem(NOTICE_KEY);
  } catch {
    return false;
  }
};

const Home = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotice, setShowNotice] = useState(readNotice);
  const videoRef = useRef(null);

  const leadTime = settings?.constraints?.leadTime || 15;

  const dismissNotice = () => {
    try {
      localStorage.setItem(NOTICE_KEY, "acknowledged");
    } catch {
      /* stockage indisponible : on masque quand même */
    }
    setShowNotice(false);
  };

  useEffect(() => {
    const media = MEDIA_SEQUENCE[currentIndex];
    const next = () => setCurrentIndex((i) => (i + 1) % MEDIA_SEQUENCE.length);

    if (media.type === "image") {
      const timer = setTimeout(next, media.duration);
      return () => clearTimeout(timer);
    }

    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    // La vidéo n'était jamais lancée : seul son premier plan s'affichait
    video.play().catch(() => setTimeout(next, 4000));
    video.addEventListener("ended", next);
    return () => {
      video.removeEventListener("ended", next);
      video.pause();
    };
  }, [currentIndex]);

  return (
    <div className="home-page">
      <Helmet>
        <title>Guegan Shop — Plans-vasques sur mesure en Solid Surface</title>
        <meta
          name="description"
          content="Configurez en 3D et commandez en ligne vos plans-vasques sur mesure en résine Solid Surface, fabriqués par les Établissements Guegan à Bobigny."
        />
        <link rel="canonical" href="https://guegan-shop.fr/" />
        <meta property="og:title" content="Guegan Shop — Plans-vasques sur mesure en Solid Surface" />
        <meta property="og:description" content="Configurez en 3D et commandez en ligne vos plans-vasques sur mesure." />
        <meta property="og:url" content="https://guegan-shop.fr/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://guegan-shop.fr/photos/realisation-1-2000.webp" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Guegan Shop",
            "url": "https://guegan-shop.fr",
            "description": "Plans-vasques sur mesure en résine Solid Surface, fabriqués à Bobigny",
            "address": { "@type": "PostalAddress", "streetAddress": "1 rue de l'Industrie", "postalCode": "93000", "addressLocality": "Bobigny", "addressCountry": "FR" },
            "telephone": "+33148400505",
            "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "url": "https://guegan-shop.fr/contact" }
          }
        `}</script>
      </Helmet>

      <div className="background-container" aria-hidden="true">
        {MEDIA_SEQUENCE.map((item, index) => {
          const isActive = index === currentIndex;
          return item.type === "video" ? (
            <video
              key={index}
              ref={videoRef}
              className={`media-item ${isActive ? "active" : ""}`}
              muted
              playsInline
              autoPlay
              preload="auto"
            >
              <source src={item.src} type="video/mp4" />
            </video>
          ) : (
            <div
              key={index}
              className={`media-item ${isActive ? "active" : ""}`}
              style={{ backgroundImage: `url(${item.src})` }}
            />
          );
        })}
        <div className="overlay" />
      </div>

      <nav className="home-nav" aria-label="Navigation">
        <Link to="/" className="logo">
          GUEGAN <span className="subtitle">Shop</span>
        </Link>
        <div className="nav-links">
          <Link to="/contact">Contact</Link>
          {isAuthenticated ? (
            <Link to="/my-orders">
              {user?.firstName && <span className="nav-user">{user.firstName} · </span>}
              Mon espace
            </Link>
          ) : (
            <Link to="/login">Espace pro</Link>
          )}
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Établissements Guegan · Bobigny</p>
          <h1>
            Plans-vasques sur mesure,
            <br />
            <span className="gold-text">au millimètre près.</span>
          </h1>
          <p className="hero-lead">
            Dimensions, cuves, dosserets, retombées : configurez votre plan en résine Solid Surface®,
            visualisez-le en 3D et commandez-le directement en ligne.
          </p>

          <div className="cta-buttons">
            <Link to="/configurator" className="btn btn-gold btn-lg">
              Configurer mon plan
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-lg hero-secondary">
                Se connecter
              </Link>
            )}
          </div>
        </div>

        <ul className="hero-facts">
          <li>
            <strong>Fabriqué dans nos ateliers</strong>
            <span>à partir de votre configuration exacte</span>
          </li>
          <li>
            <strong>Prix immédiat</strong>
            <span>chiffrage en direct pendant la configuration</span>
          </li>
          <li>
            <strong>Environ {leadTime} jours</strong>
            <span>de délai de livraison indicatif</span>
          </li>
        </ul>
      </main>

      {showNotice && (
        <div className="storage-notice" role="note">
          <p>
            Ce site n'utilise que le stockage nécessaire à son fonctionnement (session, panier). Aucun
            traceur publicitaire ni outil de mesure d'audience.{" "}
            <Link to="/politique-confidentialite">En savoir plus</Link>
          </p>
          <button className="btn btn-sm btn-gold" onClick={dismissNotice}>
            Compris
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
