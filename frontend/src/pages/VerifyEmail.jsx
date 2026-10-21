import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "../styles/login.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  // Évite la double exécution en mode strict (le lien n'est valable qu'une fois)
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (hasCalledAPI.current || !token) return;
    hasCalledAPI.current = true;

    fetch(`${API_URL}/api/auth/verify/${encodeURIComponent(token)}`)
      .then((response) => {
        if (response.ok) {
          setStatus("success");
          setTimeout(() => navigate("/login"), 4000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token, navigate]);

  return (
    <div className="login-page">
      <Helmet>
        <title>Activation du compte — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <aside className="login-aside">
        <Link to="/" className="logo">
          GUEGAN <span>Shop</span>
        </Link>
        <div />
        <p>
          Une question ? <a href="tel:0148400505">01 48 40 05 05</a>
        </p>
      </aside>

      <main className="login-main">
        <div className="login-card" aria-live="polite">
          {status === "loading" && (
            <>
              <p className="eyebrow">Activation</p>
              <h1>Validation en cours…</h1>
              <p className="lead">Merci de patienter quelques instants.</p>
            </>
          )}

          {status === "success" && (
            <>
              <p className="eyebrow">Compte activé</p>
              <h1>Bienvenue chez Guegan Shop</h1>
              <p className="lead">
                Votre compte professionnel est actif. Vous allez être redirigé vers la page de connexion.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg btn-block">
                Se connecter
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="eyebrow">Lien expiré</p>
              <h1>Ce lien n'est plus valable</h1>
              <p className="lead">
                Il a peut-être déjà été utilisé : dans ce cas votre compte est déjà actif et vous pouvez
                vous connecter directement.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg btn-block">
                Aller à la connexion
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
