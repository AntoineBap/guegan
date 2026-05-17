import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../styles/my-account.scss";

export const ACCOUNT_RULES = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_CHANGE_DELAY_DAYS: 14,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
  PASSWORD_HINT:
    "12 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.",
};

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconEye = ({ open }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

const IconSpinner = () => (
  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const canChangePassword = (lastChangedIso) => {
  if (!lastChangedIso) return true;
  const last = new Date(lastChangedIso);
  const now = new Date();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays >= ACCOUNT_RULES.PASSWORD_CHANGE_DELAY_DAYS;
};

const daysUntilAllowed = (lastChangedIso) => {
  if (!lastChangedIso) return 0;
  const last = new Date(lastChangedIso);
  const now = new Date();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return Math.ceil(ACCOUNT_RULES.PASSWORD_CHANGE_DELAY_DAYS - diffDays);
};

// Calcul TVA intracommunautaire (identique à Login)
const calculateTva = (siret) => {
  if (!siret || siret.length < 9) return "";
  const siren = siret.substring(0, 9);
  const sirenNb = parseInt(siren, 10);
  const key = (12 + 3 * (sirenNb % 97)) % 97;
  return `FR${key < 10 ? "0" + key : key}${siren}`;
};

const MyAccount = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    siret: "",
    companyName: "",
    companyAddress: "",
    tvaNumber: "",
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Siret lookup state
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretError, setSiretError] = useState("");

  // Pre-fill form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        siret: user.siret || "",
        companyName: user.companyName || "",
        companyAddress: user.companyAddress || "",
        tvaNumber: user.tvaNumber || "",
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const lastPasswordChange = user?.lastPasswordChange || null;
  const passwordAllowed = canChangePassword(lastPasswordChange);
  const daysLeft = daysUntilAllowed(lastPasswordChange);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const DELETE_KEYWORD = "SUPPRIMER";

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileError("");
    setProfileSuccess(false);
  };

  // Identique à Login : nettoyage + appel API dès 14 chiffres, sans maxLength sur l'input
  const handleSiretChange = async (e) => {
    const rawValue = e.target.value;

    // 1. Nettoyage
    let value = rawValue.replace(/\D/g, "");

    // 2. Limite 14 chiffres
    if (value.length > 14) value = value.slice(0, 14);

    setProfileForm((prev) => ({
      ...prev,
      siret: value,
      // Vide les champs liés si le SIRET n'est pas encore complet
      ...(value.length < 14 && {
        companyName: "",
        companyAddress: "",
        tvaNumber: "",
      }),
    }));
    setSiretError("");
    setProfileError("");
    setProfileSuccess(false);

    if (value.length !== 14) {
      setSiretLoading(false);
      return;
    }

    // 3. Appel API (même endpoint que Login)
    setSiretLoading(true);
    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${value}`
      );
      const data = await response.json();

      const etablissement =
        data.results &&
        data.results.find((r) => r.siren === value.substring(0, 9));

      if (etablissement) {
        const newAddress =
          etablissement.siege.geo_adresse || etablissement.siege.adresse;
        const newName = etablissement.nom_complet;
        const newTva = calculateTva(value);

        setProfileForm((prev) => ({
          ...prev,
          companyName: newName,
          companyAddress: newAddress,
          tvaNumber: newTva,
        }));
        setSiretError("");
      } else {
        setSiretError("SIRET introuvable ou fermé.");
        setProfileForm((prev) => ({
          ...prev,
          companyName: "",
          companyAddress: "",
          tvaNumber: "",
        }));
      }
    } catch {
      setSiretError("Erreur de vérification. Réessayez.");
    } finally {
      setSiretLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      return setProfileError("Le prénom et le nom sont obligatoires.");
    }
    if (profileForm.phone && !/^\d+$/.test(profileForm.phone)) {
      return setProfileError("Le numéro de téléphone ne doit contenir que des chiffres.");
    }
    try {
      await updateUser(profileForm);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordSuccess(false);
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordAllowed) {
      return setPasswordError(
        `Vous devez attendre encore ${daysLeft} jour(s) avant de pouvoir changer votre mot de passe.`
      );
    }
    if (!ACCOUNT_RULES.PASSWORD_REGEX.test(passwordForm.next)) {
      return setPasswordError(ACCOUNT_RULES.PASSWORD_HINT);
    }
    if (passwordForm.next !== passwordForm.confirm) {
      return setPasswordError("Les deux mots de passe ne correspondent pas.");
    }
    if (passwordForm.next === passwordForm.current) {
      return setPasswordError(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );
    }
    try {
      await updateUser({ newPassword: passwordForm.next, currentPassword: passwordForm.current });
      setPasswordSuccess(true);
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPasswordError(
        err?.message || "Mot de passe actuel incorrect ou erreur serveur."
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== DELETE_KEYWORD) {
      return setDeleteError(`Veuillez saisir exactement « ${DELETE_KEYWORD} » pour confirmer.`);
    }
    try {
      await updateUser({ deleteAccount: true });
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError("Une erreur est survenue. Veuillez contacter le support.");
    }
  };

  return (
    <div className="layout">
      <Header />
      <div className="account-page">
        <div className="account-container">

          <div className="account-header">
            <h1>Mon Compte</h1>
            <p className="account-subtitle">
              Gérez vos informations personnelles et la sécurité de votre compte.
            </p>
          </div>

          <div className="account-tabs">
            <button
              className={`account-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <IconUser />
              <span>Informations</span>
            </button>
            <button
              className={`account-tab ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <IconLock />
              <span>Mot de passe</span>
            </button>
            <button
              className={`account-tab danger-tab ${activeTab === "delete" ? "active" : ""}`}
              onClick={() => setActiveTab("delete")}
            >
              <IconTrash />
              <span>Supprimer le compte</span>
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="account-panel">
              <h2>Informations personnelles</h2>
              <p className="panel-desc">
                Ces informations sont utilisées pour vos commandes et votre facturation.
              </p>

              <form className="account-form" onSubmit={handleProfileSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">Prénom</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      autoComplete="given-name"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Nom</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      autoComplete="family-name"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      autoComplete="tel"
                      placeholder="0600000000"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="siret">
                      SIRET
                      {siretLoading && <IconSpinner />}
                    </label>
                    <input
                      id="siret"
                      name="siret"
                      type="text"
                      value={profileForm.siret}
                      onChange={handleSiretChange}
                      placeholder="Collez votre SIRET ici"
                    />
                    {siretError && (
                      <span className="field-error">{siretError}</span>
                    )}
                  </div>
                </div>

                {/* Company fields: read-only, populated via SIRET lookup */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="companyName">
                      Nom de l'entreprise
                      <span className="label-hint">via SIRET</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={profileForm.companyName}
                      readOnly
                      tabIndex={-1}
                      className="readonly-field"
                      placeholder="Renseignez votre SIRET"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tvaNumber">
                      Numéro de TVA
                      <span className="label-hint">via SIRET</span>
                    </label>
                    <input
                      id="tvaNumber"
                      name="tvaNumber"
                      type="text"
                      value={profileForm.tvaNumber}
                      readOnly
                      tabIndex={-1}
                      className="readonly-field"
                      placeholder="Renseignez votre SIRET"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="companyAddress">
                    Adresse de l'entreprise
                    <span className="label-hint">via SIRET</span>
                  </label>
                  <input
                    id="companyAddress"
                    name="companyAddress"
                    type="text"
                    value={profileForm.companyAddress}
                    readOnly
                    tabIndex={-1}
                    className="readonly-field"
                    placeholder="Renseignez votre SIRET"
                  />
                </div>

                {profileError && <p className="form-error">{profileError}</p>}
                {profileSuccess && (
                  <p className="form-success">
                    <IconCheck /> Informations mises à jour avec succès.
                  </p>
                )}

                <button type="submit" className="btn-primary">
                  Enregistrer les modifications
                </button>
              </form>
            </div>
          )}

          {activeTab === "password" && (
            <div className="account-panel">
              <h2>Changer le mot de passe</h2>
              <p className="panel-desc">
                {ACCOUNT_RULES.PASSWORD_HINT}
              </p>

              {!passwordAllowed && (
                <div className="info-banner">
                  <IconLock />
                  <span>
                    Vous avez récemment modifié votre mot de passe. Vous pourrez
                    en changer à nouveau dans <strong>{daysLeft} jour(s)</strong>.
                  </span>
                </div>
              )}

              <form
                className="account-form"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <div className="form-group">
                  <label htmlFor="current">Mot de passe actuel</label>
                  <div className="input-with-toggle">
                    <input
                      id="current"
                      name="current"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.current}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                      disabled={!passwordAllowed}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => toggleShowPassword("current")}
                      tabIndex={-1}
                    >
                      <IconEye open={showPasswords.current} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="next">Nouveau mot de passe</label>
                  <div className="input-with-toggle">
                    <input
                      id="next"
                      name="next"
                      type={showPasswords.next ? "text" : "password"}
                      value={passwordForm.next}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      disabled={!passwordAllowed}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => toggleShowPassword("next")}
                      tabIndex={-1}
                    >
                      <IconEye open={showPasswords.next} />
                    </button>
                  </div>
                  {passwordForm.next && (
                    <PasswordStrength value={passwordForm.next} />
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm">Confirmer le nouveau mot de passe</label>
                  <div className="input-with-toggle">
                    <input
                      id="confirm"
                      name="confirm"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      disabled={!passwordAllowed}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => toggleShowPassword("confirm")}
                      tabIndex={-1}
                    >
                      <IconEye open={showPasswords.confirm} />
                    </button>
                  </div>
                </div>

                {passwordError && <p className="form-error">{passwordError}</p>}
                {passwordSuccess && (
                  <p className="form-success">
                    <IconCheck /> Mot de passe modifié avec succès.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!passwordAllowed}
                >
                  Modifier le mot de passe
                </button>
              </form>
            </div>
          )}

          {activeTab === "delete" && (
            <div className="account-panel danger-panel">
              <h2>Supprimer le compte</h2>
              <p className="panel-desc">
                Cette action est <strong>irréversible</strong>. L'ensemble de
                vos données personnelles, commandes et devis seront
                définitivement supprimés, conformément à notre{" "}
                <a href="/politique-confidentialite">politique de confidentialité</a>.
              </p>

              <div className="danger-card">
                <p className="danger-warning">
                  Pour confirmer la suppression, saisissez{" "}
                  <strong>{DELETE_KEYWORD}</strong> dans le champ ci-dessous.
                </p>
                <div className="form-group">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => {
                      setDeleteConfirm(e.target.value);
                      setDeleteError("");
                    }}
                    placeholder={DELETE_KEYWORD}
                    className="delete-input"
                  />
                </div>

                {deleteError && <p className="form-error">{deleteError}</p>}

                <button
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== DELETE_KEYWORD}
                >
                  <IconTrash />
                  <span>Supprimer définitivement mon compte</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const PasswordStrength = ({ value }) => {
  const checks = [
    { label: "8 caractères", ok: value.length >= 8 },
    { label: "Majuscule", ok: /[A-Z]/.test(value) },
    { label: "Minuscule", ok: /[a-z]/.test(value) },,
  ];
  const score = checks.filter((c) => c.ok).length;
  const levels = ["", "Très faible", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = ["", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];

  return (
    <div className="password-strength">
      <div className="strength-bar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="strength-segment"
            style={{ background: i <= score ? colors[score] : "#e0e0e0" }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[score] }}>
        {levels[score]}
      </span>
      <ul className="strength-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "ok" : "nok"}>
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyAccount;