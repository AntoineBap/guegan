import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import "../styles/login.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- UTILITAIRE : Calcul de la TVA ---
const calculateTva = (siret) => {
  if (!siret || siret.length < 9) return "";
  const siren = siret.substring(0, 9);
  const sirenNb = parseInt(siren, 10);
  const key = (12 + 3 * (sirenNb % 97)) % 97;
  return `FR${key < 10 ? "0" + key : key}${siren}`;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { mergeCartAfterLogin, cartItems, clearCart } = useCart();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [acceptedCookies, setAcceptedCookies] = useState(false);

  const [globalError, setGlobalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // --- SIRET & API ---
  const [isSiretLoading, setIsSiretLoading] = useState(false);
  const [siretStatus, setSiretStatus] = useState({
    isValid: false,
    message: null,
    type: null,
  });

  // --- VALIDATION MAIL ---
  const [waitingForValidation, setWaitingForValidation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resendStep, setResendStep] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    companyAddress: "",
    siret: "",
    tvaNumber: "",
  });

  const [errors, setErrors] = useState({});

  // Timer renvoi email
  useEffect(() => {
    let interval;
    if (waitingForValidation && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [waitingForValidation, resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && value !== "" && !/^\d+$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  // 🚀 GESTION SIRET
  const handleSiretChange = async (e) => {
    const rawValue = e.target.value;

    // 1. Nettoyage
    let value = rawValue.replace(/\D/g, "");

    // 2. Limite 14 chiffres
    if (value.length > 14) {
      value = value.slice(0, 14);
    }

    setFormData((prev) => ({
      ...prev,
      siret: value,
      // Si le SIRET change (et n'est pas complet), on vide les champs liés pour forcer la re-validation
      ...(value.length < 14 && {
        companyName: "",
        companyAddress: "",
        tvaNumber: "",
      }),
    }));

    if (errors.siret) setErrors({ ...errors, siret: null });

    if (value.length !== 14) {
      setSiretStatus({ isValid: false, message: null, type: null });
    }

    // 3. Appel API
    if (value.length === 14) {
      setIsSiretLoading(true);
      try {
        const response = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${value}`,
        );
        const data = await response.json();

        const etablissement =
          data.results &&
          data.results.find((r) => r.siren === value.substring(0, 9));

        if (etablissement) {
          setSiretStatus({
            isValid: true,
            message: "✅ Entreprise trouvée !",
            type: "success",
          });

          const newAddress =
            etablissement.siege.geo_adresse || etablissement.siege.adresse;
          const newName = etablissement.nom_complet;
          const newTva = calculateTva(value);

          setFormData((prev) => ({
            ...prev,
            companyName: newName,
            companyAddress: newAddress,
            tvaNumber: newTva,
          }));
        } else {
          setSiretStatus({
            isValid: false,
            message: "❌ SIRET introuvable ou fermé.",
            type: "error",
          });
          // On vide si introuvable
          setFormData((prev) => ({
            ...prev,
            companyName: "",
            companyAddress: "",
            tvaNumber: "",
          }));
        }
      } catch (error) {
        console.error("Erreur API SIRET", error);
        setSiretStatus({
          isValid: false,
          message: "⚠️ Erreur vérification (Réessayez)",
          type: "error",
        });
      }
      setIsSiretLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Nouveau mail envoyé !");
        setResendStep((prev) => prev + 1);
        setResendTimer(60);
      } else {
        setGlobalError(data.message);
      }
    } catch (error) {
      setGlobalError("Erreur de connexion");
    }
    setIsResending(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) newErrors.email = "Email invalide";

    if (formData.password) {
      if (formData.password.length < 8) newErrors.password = "Trop court";
      if (!/[A-Z]/.test(formData.password))
        newErrors.password = "Manque une majuscule";
      if (/\s/.test(formData.password))
        newErrors.password = "Pas d'espaces autorisés";
    }

    if (isSignUp) {
      if (!formData.firstName) newErrors.firstName = "Requis";
      if (!formData.lastName) newErrors.lastName = "Requis";
      if (!formData.phone) newErrors.phone = "Requis";
      else if (!/^\d{10}$/.test(formData.phone))
        newErrors.phone = "10 chiffres requis";

      // Vérification simple car champs bloqués remplis par le SIRET
      if (!formData.companyName)
        newErrors.companyName = "Requis (Entrez un SIRET valide)";
      if (!formData.companyAddress)
        newErrors.companyAddress = "Requis (Entrez un SIRET valide)";

      // BLOCAGE SIRET INVALIDE
      if (!/^\d{14}$/.test(formData.siret)) {
        newErrors.siret = "14 chiffres requis";
      } else if (!siretStatus.isValid) {
        newErrors.siret = "Veuillez saisir un SIRET valide et reconnu.";
      }

      if (!/^[A-Z]{2}[A-Z0-9+*.]{8,15}$/.test(formData.tvaNumber))
        newErrors.tvaNumber = "Format invalide";

      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";

      // Validation de la case Cookies
      if (!acceptedCookies)
        newErrors.cookies = "Veuillez accepter la politique de cookies.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    const endpoint = isSignUp ? "signup" : "login";
    const payload = isSignUp ? { ...formData, cart: cartItems } : formData;

    try {
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignUp) {
          setPendingEmail(formData.email);
          setWaitingForValidation(true);
          setResendTimer(30);
          setResendStep(0);
          clearCart();
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            companyAddress: "",
            companyName: "",
            firstName: "",
            lastName: "",
            phone: "",
            siret: "",
            tvaNumber: "",
          });
          setSiretStatus({ isValid: false, message: null, type: null });
          setAcceptedCookies(false); // Reset cookies
          window.scrollTo(0, 0);
        } else {
          login(
            data.token,
            data.userId,
            { firstName: data.firstName, companyName: data.companyName },
            data.role,
          );
          if (mergeCartAfterLogin) mergeCartAfterLogin(data.cart || []);
          if (data.role === "admin") navigate("/admin");
          else navigate("/configurator"); // 👈 MODIFICATION ICI : Redirection vers le configurateur
        }
      } else {
        setGlobalError(
          data.message || data.error || "Une erreur est survenue.",
        );
      }
    } catch (error) {
      setGlobalError("Impossible de contacter le serveur.");
    }
  };

  const EyeIcon = ({ visible }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z">
          <circle cx="12" cy="12" r="3"></circle>
        </path>
      ) : (
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      )}
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  const PasswordRequirements = () => {
    const p = formData.password;
    const reqs = [
      { label: "8 caractères min.", valid: p.length >= 8 },
      { label: "1 Majuscule", valid: /[A-Z]/.test(p) },
      { label: "Pas d'espaces", valid: !/\s/.test(p) && p.length > 0 },
    ];
    return (
      <div className="password-reqs">
        {reqs.map((r, index) => (
          <div
            key={index}
            className={`req-item ${r.valid ? "valid" : "invalid"}`}
          >
            <span>{r.valid ? "✓" : "•"}</span> <span>{r.label}</span>
          </div>
        ))}
      </div>
    );
  };

  if (waitingForValidation) {
    return (
      <div className="login-page">
        <div className="login-card validation-screen">
          <h2>✉️ Vérifiez vos emails</h2>
          <p>
            Un lien de validation a été envoyé à <strong>{pendingEmail}</strong>
            .
          </p>
          {globalError && <div className="alert-box error">{globalError}</div>}
          {successMessage && (
            <div className="alert-box success">{successMessage}</div>
          )}
          <div className="resend-section">
            <button
              className="resend-btn"
              onClick={handleResendEmail}
              disabled={resendTimer > 0 || isResending}
            >
              {isResending
                ? "Envoi..."
                : resendTimer > 0
                  ? `Renvoyer dans ${resendTimer}s`
                  : "Renvoyer l'email"}
            </button>
          </div>
          <button
            className="back-link"
            onClick={() => {
              setWaitingForValidation(false);
              setIsSignUp(false);
            }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* 👈 Ce bouton ramène bien à Home (/) */}
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Retour
        </button>
        <h2>{isSignUp ? "Création de compte" : "Espace Client"}</h2>
        {globalError && <div className="alert-box error">⚠️ {globalError}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          {isSignUp && (
            <div className="form-row">
              <div className="form-col">
                <label>Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? "has-error" : ""}
                />
                {errors.firstName && <span className="error-msg">Requis</span>}
              </div>
              <div className="form-col">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "has-error" : ""}
                />
                {errors.lastName && <span className="error-msg">Requis</span>}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email professionnel</label>
            <input
              type="email"
              name="email"
              placeholder="contact@entreprise.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className={errors.email ? "has-error" : ""}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Numéro de téléphone</label>
              <input
                type="tel"
                name="phone"
                placeholder="0612345678"
                maxLength="10"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "has-error" : ""}
              />
              {errors.phone && (
                <span className="error-msg">{errors.phone}</span>
              )}
            </div>
          )}

          {isSignUp && (
            <>
              <div className="form-row">
                <div className="form-col" style={{ flex: 1 }}>
                  <label>SIRET (Auto-remplissage)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      name="siret"
                      placeholder="Collez votre SIRET ici"
                      value={formData.siret}
                      onChange={handleSiretChange}
                      className={errors.siret ? "has-error" : ""}
                      style={{ paddingRight: "30px" }}
                    />
                    {isSiretLoading && (
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        ⌛
                      </span>
                    )}
                  </div>
                  {errors.siret && (
                    <span className="error-msg">{errors.siret}</span>
                  )}
                  {siretStatus.message && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        marginTop: "5px",
                        color:
                          siretStatus.type === "success"
                            ? "#27ae60"
                            : "#e74c3c",
                      }}
                    >
                      {siretStatus.message}
                    </div>
                  )}
                </div>
                <div className="form-col">
                  <label>N° TVA </label>
                  <input
                    type="text"
                    name="tvaNumber"
                    placeholder="Remplissage automatique..."
                    value={formData.tvaNumber}
                    readOnly
                    style={{
                      backgroundColor: "#f9f9f9",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nom de l'entreprise</label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Remplissage automatique..."
                  value={formData.companyName}
                  readOnly // 🔒 BLOQUÉ
                  style={{ backgroundColor: "#f9f9f9", cursor: "not-allowed" }}
                  className={errors.companyName ? "has-error" : ""}
                />
                {errors.companyName && (
                  <span className="error-msg">{errors.companyName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Adresse de l'entreprise</label>
                <input
                  type="text"
                  name="companyAddress"
                  placeholder="Remplissage automatique..."
                  value={formData.companyAddress}
                  readOnly // 🔒 BLOQUÉ
                  style={{ backgroundColor: "#f9f9f9", cursor: "not-allowed" }}
                  className={errors.companyAddress ? "has-error" : ""}
                />
                {errors.companyAddress && (
                  <span className="error-msg">{errors.companyAddress}</span>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="8 car. min"
                value={formData.password}
                onChange={handleChange}
                style={{ paddingRight: "45px" }}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className={errors.password ? "has-error" : ""}
              />
              <div
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                <EyeIcon visible={showPassword} />
              </div>
            </div>
            {isSignUp && <PasswordRequirements />}
            {errors.password && !isSignUp && (
              <span className="error-msg">{errors.password}</span>
            )}
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Répétez"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={errors.confirmPassword ? "has-error" : ""}
                />
                {errors.confirmPassword && (
                  <span className="error-msg">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="cookieConsent"
                  checked={acceptedCookies}
                  onChange={(e) => {
                    setAcceptedCookies(e.target.checked);
                    if (errors.cookies) setErrors({ ...errors, cookies: null });
                  }}
                />
                <label htmlFor="cookieConsent">
                  J'accepte l'utilisation des cookies pour assurer le bon
                  fonctionnement du site et j'ai lu la politique de
                  confidentialité.
                </label>
              </div>
              {errors.cookies && (
                <span
                  className="error-msg"
                  style={{ display: "block", marginBottom: "10px" }}
                >
                  {errors.cookies}
                </span>
              )}
            </>
          )}

          <button type="submit" className="submit-btn">
            {isSignUp ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <div className="toggle-text">
          {isSignUp
            ? "Vous avez déjà un compte ?"
            : "Pas encore de compte professionnel ?"}
          <span
            className="link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrors({});
              setGlobalError(null);
              setSuccessMessage(null);
              setAcceptedCookies(false);
            }}
          >
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
