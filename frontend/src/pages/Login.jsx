import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; 
import '../styles/login.scss'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const { mergeCartAfterLogin, cartItems, clearCart } = useCart(); 

    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [globalError, setGlobalError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- VALIDATION MAIL ---
    const [waitingForValidation, setWaitingForValidation] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [resendTimer, setResendTimer] = useState(30); 
    const [resendStep, setResendStep] = useState(0); 
    const [isResending, setIsResending] = useState(false);

    // --- ADRESSE ---
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isAddressSelected, setIsAddressSelected] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', firstName: '',
        lastName: '', companyName: '', companyAddress: '', siret: '', tvaNumber: ''
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

    // Fermer suggestions adresse
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
        if (globalError) setGlobalError(null);
    };

    const handleAddressChange = async (e) => {
        const value = e.target.value;
        setFormData({ ...formData, companyAddress: value });
        setIsAddressSelected(false); 
        if (errors.companyAddress) setErrors({ ...errors, companyAddress: null });

        if (value.length > 3) {
            try {
                const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`);
                const data = await response.json();
                setAddressSuggestions(data.features || []);
                setShowSuggestions(true);
            } catch (error) { console.error("Erreur API Adresse", error); }
        } else {
            setAddressSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectAddress = (feature) => {
        const label = feature.properties.label;
        setFormData({ ...formData, companyAddress: label });
        setIsAddressSelected(true);
        setShowSuggestions(false);
        setAddressSuggestions([]);
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/resend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail })
            });
            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage("Nouveau mail envoyé !");
                const nextStep = resendStep + 1;
                setResendStep(nextStep);
                setResendTimer(nextStep === 1 ? 60 : 120); 
            } else {
                setGlobalError(data.message);
                if(response.status === 404) {
                    setTimeout(() => {
                        setWaitingForValidation(false);
                        setIsSignUp(true);
                    }, 3000);
                }
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
            if (!/[A-Z]/.test(formData.password)) newErrors.password = "Manque une majuscule";
            if (/\s/.test(formData.password)) newErrors.password = "Pas d'espaces autorisés";
        }

        if (isSignUp) {
            if (!formData.firstName) newErrors.firstName = "Requis";
            if (!formData.lastName) newErrors.lastName = "Requis";
            if (!formData.companyName) newErrors.companyName = "Requis";
            if (!formData.companyAddress) {
                newErrors.companyAddress = "Requis";
            } else if (!isAddressSelected) {
                newErrors.companyAddress = "Veuillez sélectionner une adresse dans la liste proposée";
            }
            if (!/^\d{14}$/.test(formData.siret)) newErrors.siret = "14 chiffres requis";
            if (!/^[A-Z]{2}[A-Z0-9+*.]{8,15}$/.test(formData.tvaNumber)) newErrors.tvaNumber = "Format invalide";
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(null);
        setSuccessMessage(null);
        
        if (!validateForm()) return;

        const endpoint = isSignUp ? 'signup' : 'login';
        const payload = isSignUp ? { ...formData, cart: cartItems } : formData;

        try {
            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
                        email: '', password: '', confirmPassword: '', companyAddress: '',
                        companyName: '', firstName: '', lastName: '', siret: '', tvaNumber: ''
                    });
                    setIsAddressSelected(false);
                    window.scrollTo(0, 0);
                } else {
                    // --- CONNEXION REUSSIE ---
                    // On passe le RÔLE (data.role) à la fonction login
                    login(
                        data.token, 
                        data.userId, 
                        { 
                            firstName: data.firstName, 
                            companyName: data.companyName 
                        },
                        data.role // <-- AJOUT DU ROLE
                    );
                    
                    if (mergeCartAfterLogin) {
                        mergeCartAfterLogin(data.cart || []); 
                    }

                    // --- REDIRECTION INTELLIGENTE ---
                    if (data.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/'); 
                    }
                }
            } else {
                setGlobalError(data.message || data.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error("Erreur:", error);
            setGlobalError("Impossible de contacter le serveur.");
        }
    };

    // --- SOUS-COMPOSANTS ---
    const EyeIcon = ({ visible }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {visible ? (
                <> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path> <circle cx="12" cy="12" r="3"></circle> </>
            ) : (
                <> <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> <line x1="1" y1="1" x2="23" y2="23"></line> </>
            )}
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
                    <div key={index} className={`req-item ${r.valid ? 'valid' : 'invalid'}`}>
                        <span>{r.valid ? '✓' : '•'}</span> <span>{r.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    // --- VUE : VALIDATION EMAIL ---
    if (waitingForValidation) {
        return (
            <div className="login-page">
                <div className="login-card validation-screen">
                    <h2>✉️ Vérifiez vos emails</h2>
                    <p>
                        Un lien de validation a été envoyé à <strong>{pendingEmail}</strong>.<br/>
                        Ce lien est valide pendant <strong>5 minutes</strong>.
                    </p>
                    
                    {globalError && <div className="alert-box error">{globalError}</div>}
                    {successMessage && <div className="alert-box success">{successMessage}</div>}

                    <div className="resend-section">
                        <p>Vous n'avez rien reçu ?</p>
                        <button 
                            className="resend-btn"
                            onClick={handleResendEmail} 
                            disabled={resendTimer > 0 || isResending}
                        >
                            {isResending ? "Envoi..." : resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : "Renvoyer l'email"}
                        </button>
                    </div>
                    <button className="back-link" onClick={() => { setWaitingForValidation(false); setIsSignUp(false); }}>
                        Retour à la connexion
                    </button>
                </div>
            </div>
        );
    }

    // --- VUE : LOGIN / SIGNUP ---
    return (
        <div className="login-page">
            <div className="login-card">
                <button className="back-btn" onClick={() => navigate('/')}>
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
                                    type="text" name="firstName" placeholder="Jean" 
                                    value={formData.firstName} onChange={handleChange} 
                                    className={errors.firstName ? 'has-error' : ''}
                                />
                                {errors.firstName && <span className="error-msg">Requis</span>}
                            </div>
                            <div className="form-col">
                                <label>Nom</label>
                                <input 
                                    type="text" name="lastName" placeholder="Dupont" 
                                    value={formData.lastName} onChange={handleChange} 
                                    className={errors.lastName ? 'has-error' : ''}
                                />
                                {errors.lastName && <span className="error-msg">Requis</span>}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email professionnel</label>
                        <input 
                            type="email" name="email" placeholder="contact@entreprise.com" 
                            value={formData.email} onChange={handleChange} autoComplete="username"
                            className={errors.email ? 'has-error' : ''}
                        />
                        {errors.email && <span className="error-msg">{errors.email}</span>}
                    </div>

                    {isSignUp && (
                        <>
                            <div className="form-group">
                                <label>Nom de l'entreprise</label>
                                <input 
                                    type="text" name="companyName" placeholder="Menuiserie Guegan" 
                                    value={formData.companyName} onChange={handleChange}
                                    className={errors.companyName ? 'has-error' : ''}
                                />
                                {errors.companyName && <span className="error-msg">Requis</span>}
                            </div>

                            <div className="form-group" ref={wrapperRef}>
                                <label>Adresse de l'entreprise</label>
                                <input 
                                    type="text" name="companyAddress" placeholder="Tapez pour rechercher..." 
                                    value={formData.companyAddress} onChange={handleAddressChange} autoComplete="off"
                                    className={errors.companyAddress ? 'has-error' : ''}
                                />
                                {errors.companyAddress && <span className="error-msg">{errors.companyAddress}</span>}
                                
                                {showSuggestions && addressSuggestions.length > 0 && (
                                    <ul className="suggestions-list">
                                        {addressSuggestions.map((feature, index) => (
                                            <li key={index} onClick={() => selectAddress(feature)}>{feature.properties.label}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-col">
                                    <label>SIRET</label>
                                    <input 
                                        type="text" name="siret" placeholder="14 chiffres" maxLength="14" 
                                        value={formData.siret} onChange={handleChange}
                                        className={errors.siret ? 'has-error' : ''}
                                    />
                                    {errors.siret && <span className="error-msg">Format invalide</span>}
                                </div>
                                <div className="form-col">
                                    <label>N° TVA</label>
                                    <input 
                                        type="text" name="tvaNumber" placeholder="FR..." 
                                        value={formData.tvaNumber} onChange={handleChange} autoComplete="off"
                                        className={errors.tvaNumber ? 'has-error' : ''}
                                    />
                                    {errors.tvaNumber && <span className="error-msg">Format invalide</span>}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showPassword ? "text" : "password"} name="password" placeholder="8 car. min" 
                                value={formData.password} onChange={handleChange} 
                                style={{ paddingRight: '45px' }}
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                className={errors.password ? 'has-error' : ''}
                            />
                            <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                <EyeIcon visible={showPassword} />
                            </div>
                        </div>
                        {isSignUp && <PasswordRequirements />}
                        {errors.password && !isSignUp && <span className="error-msg">{errors.password}</span>}
                    </div>

                    {isSignUp && (
                        <div className="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input 
                                type="password" name="confirmPassword" placeholder="Répétez" 
                                value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password"
                                className={errors.confirmPassword ? 'has-error' : ''}
                            />
                            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
                        </div>
                    )}

                    <button type="submit" className="submit-btn">
                        {isSignUp ? "Créer mon compte" : "Se connecter"}
                    </button>
                </form>

                <div className="toggle-text">
                    {isSignUp ? "Vous avez déjà un compte ?" : "Pas encore de compte professionnel ?"}
                    <span 
                        className="link"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setErrors({});
                            setGlobalError(null);
                            setSuccessMessage(null);
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