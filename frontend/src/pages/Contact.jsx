import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/contact.scss"; // Correction ici : 'c' minuscule

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
      // Assure-toi que l'URL correspond bien à ton backend
      const response = await fetch("http://localhost:3000/api/contact", {
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
              <span className="icon">📍</span>
              <p>
                1 rue de l’industrie,
                <br />
                93000 Bobigny
              </p>
            </div>
            <div className="info-item">
              <span className="icon">📞</span>
              <p>01.48.40.05.05</p>
            </div>
            <div className="info-item">
              <span className="icon">✉️</span>
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
