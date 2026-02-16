import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/verifyEmail.scss"; // Import du fichier SCSS

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  // Création d'un verrou pour empêcher la double exécution
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (hasCalledAPI.current) return;

    hasCalledAPI.current = true;

    const verifyAccount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify/${token}`);

        if (response.ok) {
          setStatus("success");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };

    if (token) verifyAccount();
  }, [token, navigate]);

  return (
    <div className="verify-email-page">
      <div className="verify-card">
        {status === "loading" && (
          <div className="loading-content">
            <h2>🔄 Validation en cours...</h2>
            <p>Veuillez patienter quelques instants.</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-content">
            <span className="icon">✅</span>
            <h1>Compte validé !</h1>
            <p>Votre compte professionnel est désormais actif.</p>
            <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>
              Redirection automatique vers la connexion...
            </p>
            <button onClick={() => navigate("/login")} className="btn-primary">
              Se connecter maintenant
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="error-content">
            <h1>Une erreur est survenue</h1>
            <div className="error-box">
              <p>
                Le lien est invalide ou a peut-être{" "}
                <strong>déjà été utilisé</strong>.
              </p>
            </div>
            <p>
              Essayez de vous connecter directement, votre compte est peut-être
              déjà actif.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-secondary"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
