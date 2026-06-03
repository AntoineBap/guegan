import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/contact.scss";
import { Helmet } from 'react-helmet-async';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.51 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    objet: "",
    message: "",
    consent: false,
  });
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState(null); // 'sending', 'success', 'error'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent) {
      alert("Veuillez accepter le traitement de vos données.");
      return;
    }

    setStatus("sending");

    // Création d'un FormData pour envoyer le fichier + les textes
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (attachment) {
      data.append("attachment", attachment);
    }

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        body: data, // Fetch gère automatiquement le Content-Type pour FormData
      });

      if (response.ok) {
        setStatus("success");
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          phone: "",
          objet: "",
          message: "",
          consent: false,
        });
        setAttachment(null);
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="contact-page">
      <Helmet>
        <title>Contact — Guégan Shop</title>
        <meta name="description" content="Contactez l'équipe Guégan Shop pour toute question sur vos commandes de plans vasque, robinetterie ou sanitaire. Réponse rapide garantie." />
        <link rel="canonical" href="https://guegan-shop.fr/contact" />
        <meta property="og:title" content="Contact — Guégan Shop" />
        <meta property="og:url" content="https://guegan-shop.fr/contact" />
      </Helmet>
      <div className="contact-container">
        {/* --- COLONNE GAUCHE : FORMULAIRE --- */}
        <div className="contact-form-section">
          {/* BOUTON RETOUR */}
          <button
            className="back-btn"
            onClick={() => navigate("/configurator")}
          >
            ← Retour au configurateur
          </button>

          <h1>Contactez-nous</h1>
          <p>
            Une question sur nos plans vasques ou une demande spécifique ?
            Écrivez-nous.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Objet *</label>
              <input
                type="text"
                name="objet"
                value={formData.objet}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Message *</label>
              <textarea
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="input-group">
              <label>Pièce jointe (optionnel)</label>
              <input type="file" onChange={handleFileChange} />
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                />
                J’accepte le traitement de mes données personnelles pour le
                suivi de ma demande.
              </label>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={status === "sending"}
            >
              {status === "sending"
                ? "Envoi en cours..."
                : "Envoyer le message"}
            </button>

            {status === "success" && (
              <p className="success-msg">Message envoyé avec succès !</p>
            )}
            {status === "error" && (
              <p className="error-msg">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            )}
          </form>
        </div>

        {/* --- COLONNE DROITE : INFO --- */}
        <div className="contact-info-section">
          <div className="info-box">
            <h2>Nos Coordonnées</h2>
            <div className="info-item">
              <span className="icon"><IconPin /></span>
              <p>
                1 rue de l’industrie,
                <br />
                93000 Bobigny
              </p>
            </div>
            <div className="info-item">
              <span className="icon"><IconPhone /></span>
              <p>01.48.40.05.05</p>
            </div>
            <div className="info-item">
              <span className="icon"><IconMail /></span>
              <p>contact@etsguegan.com</p>
            </div>
          </div>

          <div className="info-box hours-box">
            <h2>Horaires d'ouverture</h2>
            <ul>
              <li>
                <span>Lundi – Jeudi :</span>
                <span>8h30 – 12h / 14h – 18h</span>
              </li>
              <li>
                <span>Vendredi :</span>
                <span>8h30 – 12h</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;