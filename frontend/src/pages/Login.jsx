import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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

const EyeIcon = ({ visible }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    {!visible && <line x1="2" y1="2" x2="22" y2="22" />}
  </svg>
);

const PasswordRequirements = ({ password }) => {
  const reqs = [
    { label: "8 caractères minimum", valid: password.length >= 8 },
    { label: "une majuscule", valid: /[A-Z]/.test(password) },
    { label: "sans espace", valid: password.length > 0 && !/\s/.test(password) },
  ];
  return (
    <ul className="password-reqs" aria-label="Règles du mot de passe">
      {reqs.map((r) => (
        <li key={r.label} className={r.valid ? "valid" : ""}>
          {r.label}
        </li>
      ))}
    </ul>
  );
};

const Field = ({ label, error, hint, children }) => (
  <div className={`field ${error ? "has-error" : ""}`}>
    <label>
      <span>{label}</span>
      {children}
    </label>
    {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useContext(AuthContext);
  const { mergeCartAfterLogin, cartItems, clearCart } = useCart();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [acceptedCookies, setAcceptedCookies] = useState(false);

  const [globalError, setGlobalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // --- REDIRECTION SI DÉJÀ CONNECTÉ ---
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from;
      if (from) navigate(from, { replace: true });
      else navigate(isAdmin ? "/admin" : "/configurator", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, location.state]);

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

  // --- GESTION SIRET ---
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
            message: "Entreprise trouvée, informations remplies.",
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
            message: "SIRET introuvable ou établissement fermé.",
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
          message: "Vérification impossible pour le moment, réessayez.",
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

    // Les règles ne s'appliquent qu'à la création : un compte plus ancien
    // avec un mot de passe ne respectant pas ces règles doit pouvoir se connecter.
    if (!formData.password) newErrors.password = "Mot de passe requis";
    else if (isSignUp) {
      if (formData.password.length < 8) newErrors.password = "8 caractères minimum";
      else if (!/[A-Z]/.test(formData.password))
        newErrors.password = "Une majuscule minimum";
      else if (/\s/.test(formData.password))
        newErrors.password = "Pas d'espaces";
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
    const payload = isSignUp
      ? { ...formData, cart: cartItems }
      : { email: formData.email, password: formData.password };

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
            {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
              companyName: data.companyName,
              tvaNumber: data.tvaNumber,
              companyAddress: data.companyAddress,
              siret: data.siret,
              lastPasswordChange: data.lastPasswordChange,
            },
            data.role,
          );
          if (mergeCartAfterLogin) mergeCartAfterLogin(data.cart || []);
          // Retour à la page demandée avant la connexion (ex. : le paiement)
          const from = location.state?.from;
          if (from) navigate(from, { replace: true });
          else if (data.role === "admin") navigate("/admin");
          else navigate("/configurator");
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

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setGlobalError(null);
    setSuccessMessage(null);
    setAcceptedCookies(false);
  };

  const aside = (
    <aside className="login-aside">
      <Link to="/" className="logo">
        GUEGAN <span>Shop</span>
      </Link>
      <div>
        <h2>Espace professionnel</h2>
        <ul>
          <li>Tarifs HT affichés pendant la configuration</li>
          <li>Devis PDF générés en un clic, valables un mois</li>
          <li>Suivi des commandes, de la fabrication à l'expédition</li>
        </ul>
      </div>
      <p>
        Une question ? <a href="tel:0148400505">01 48 40 05 05</a>
      </p>
    </aside>
  );

  if (waitingForValidation) {
    return (
      <div className="login-page">
        <Helmet><title>Vérifiez vos emails — Guegan Shop</title></Helmet>
        {aside}
        <main className="login-main">
          <div className="login-card">
            <p className="eyebrow">Dernière étape</p>
            <h1>Vérifiez votre boîte mail</h1>
            <p className="lead">
              Un lien d'activation a été envoyé à <strong>{pendingEmail}</strong>. Pensez à regarder dans
              les courriers indésirables.
            </p>
            {globalError && <div className="alert-box error">{globalError}</div>}
            {successMessage && <div className="alert-box success">{successMessage}</div>}
            <button
              className="btn btn-outline btn-block"
              onClick={handleResendEmail}
              disabled={resendTimer > 0 || isResending}
            >
              {isResending
                ? "Envoi…"
                : resendTimer > 0
                  ? `Renvoyer le lien dans ${resendTimer} s`
                  : "Renvoyer le lien"}
            </button>
            <button
              className="text-link"
              onClick={() => {
                setWaitingForValidation(false);
                setIsSignUp(false);
              }}
            >
              Retour à la connexion
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Helmet>
        <title>{isSignUp ? "Créer un compte" : "Connexion"} — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      {aside}

      <main className="login-main">
        <div className={`login-card ${isSignUp ? "is-wide" : ""}`}>
          <Link to="/" className="back-link">← Accueil</Link>
          <h1>{isSignUp ? "Créer un compte professionnel" : "Connexion"}</h1>
          <p className="lead">
            {isSignUp
              ? "Votre SIRET suffit à remplir les informations de l'entreprise."
              : "Accédez à vos tarifs, devis et commandes."}
          </p>

          {globalError && <div className="alert-box error" role="alert">{globalError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {isSignUp && (
              <div className="form-row">
                <Field label="Prénom" error={errors.firstName}>
                  <input type="text" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} />
                </Field>
                <Field label="Nom" error={errors.lastName}>
                  <input type="text" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} />
                </Field>
              </div>
            )}

            <Field label="Email professionnel" error={errors.email}>
              <input
                type="email"
                name="email"
                placeholder="vous@entreprise.fr"
                value={formData.email}
                onChange={handleChange}
                autoComplete={isSignUp ? "email" : "username"}
                inputMode="email"
              />
            </Field>

            {isSignUp && (
              <>
                <Field label="Téléphone" error={errors.phone}>
                  <input type="tel" name="phone" placeholder="0612345678" maxLength="10" inputMode="numeric" autoComplete="tel" value={formData.phone} onChange={handleChange} />
                </Field>

                <div className="form-row">
                  <Field
                    label="SIRET"
                    error={errors.siret}
                    hint={isSiretLoading ? "Recherche de l'entreprise…" : siretStatus.message ? null : "14 chiffres"}
                  >
                    <input type="text" name="siret" inputMode="numeric" placeholder="123 456 789 00012" value={formData.siret} onChange={handleSiretChange} />
                  </Field>
                  <Field label="N° de TVA">
                    <input type="text" name="tvaNumber" placeholder="Calculé automatiquement" value={formData.tvaNumber} readOnly tabIndex={-1} />
                  </Field>
                </div>
                {siretStatus.message && (
                  <p className={`siret-status ${siretStatus.type}`}>{siretStatus.message}</p>
                )}

                <Field label="Entreprise" error={errors.companyName}>
                  <input type="text" name="companyName" placeholder="Rempli depuis le SIRET" value={formData.companyName} readOnly tabIndex={-1} />
                </Field>
                <Field label="Adresse" error={errors.companyAddress}>
                  <input type="text" name="companyAddress" placeholder="Rempli depuis le SIRET" value={formData.companyAddress} readOnly tabIndex={-1} />
                </Field>
              </>
            )}

            <Field label="Mot de passe" error={errors.password}>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </Field>
            {isSignUp && <PasswordRequirements password={formData.password} />}

            {isSignUp && (
              <>
                <Field label="Confirmer le mot de passe" error={errors.confirmPassword}>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" />
                </Field>

                <label className={`consent ${errors.cookies ? "has-error" : ""}`}>
                  <input
                    type="checkbox"
                    checked={acceptedCookies}
                    onChange={(e) => {
                      setAcceptedCookies(e.target.checked);
                      if (errors.cookies) setErrors({ ...errors, cookies: null });
                    }}
                  />
                  <span>
                    J'ai lu la <Link to="/politique-confidentialite" target="_blank">politique de confidentialité</Link> et
                    j'accepte le stockage nécessaire au fonctionnement du site.
                  </span>
                </label>
                {errors.cookies && <span className="field-error">{errors.cookies}</span>}
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block">
              {isSignUp ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Déjà un compte ?" : "Pas encore de compte professionnel ?"}{" "}
            <button type="button" className="text-link" onClick={switchMode}>
              {isSignUp ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
