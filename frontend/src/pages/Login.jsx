import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/header.scss';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // États pour les messages
    const [globalError, setGlobalError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- GESTION ADRESSE ---
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isAddressSelected, setIsAddressSelected] = useState(false); // Vérifie si sélectionné via module
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null); // Pour fermer la liste si on clique dehors

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        companyName: '',
        companyAddress: '', // NOUVEAU CHAMP
        siret: '',
        tvaNumber: ''
    });

    const [errors, setErrors] = useState({});

    // Fermer les suggestions si on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Mise à jour des champs standards
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
        if (globalError) setGlobalError(null);
    };

    // --- LOGIQUE AUTOCOMPLETE ADRESSE ---
    const handleAddressChange = async (e) => {
        const value = e.target.value;
        
        // On met à jour le champ, mais on invalide la sélection car l'utilisateur tape manuellement
        setFormData({ ...formData, companyAddress: value });
        setIsAddressSelected(false); 
        if (errors.companyAddress) setErrors({ ...errors, companyAddress: null });

        if (value.length > 3) {
            try {
                // Appel API Adresse Gouv
                const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`);
                const data = await response.json();
                setAddressSuggestions(data.features || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Erreur API Adresse", error);
            }
        } else {
            setAddressSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectAddress = (feature) => {
        // L'utilisateur clique sur une suggestion
        const label = feature.properties.label;
        setFormData({ ...formData, companyAddress: label });
        setIsAddressSelected(true); // C'est valide !
        setShowSuggestions(false);
        setAddressSuggestions([]);
    };

    // --- VALIDATION ---
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
            
            // Validation Adresse stricte
            if (!formData.companyAddress) {
                newErrors.companyAddress = "Requis";
            } else if (!isAddressSelected) {
                newErrors.companyAddress = "Veuillez sélectionner une adresse dans la liste proposée";
            }

            // Validation souple du SIRET
            if (!/^\d{14}$/.test(formData.siret)) {
                newErrors.siret = "Le SIRET doit contenir 14 chiffres";
            }
            if (!/^[A-Z]{2}[A-Z0-9+*.]{8,15}$/.test(formData.tvaNumber)) {
                newErrors.tvaNumber = "Format invalide";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- SOUMISSION ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(null);
        setSuccessMessage(null);
        
        if (!validateForm()) return;

        const endpoint = isSignUp ? 'signup' : 'login';
        
        try {
            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                if (isSignUp) {
                    // CAS INSCRIPTION
                    setIsSignUp(false); 
                    setSuccessMessage("Inscription réussie ! Veuillez vérifier vos emails pour valider votre compte avant de vous connecter.");
                    setFormData(prev => ({ 
                        ...prev, 
                        password: '', 
                        confirmPassword: '', 
                        companyAddress: '', // Reset adresse
                        companyName: '',
                        firstName: '',
                        lastName: '',
                        siret: '',
                        tvaNumber: ''
                    }));
                    setIsAddressSelected(false);
                    
                    window.scrollTo(0, 0);
                } else {
                    // CAS CONNEXION
                    login(data.token, data.userId, { 
                        firstName: data.firstName, 
                        companyName: data.companyName 
                    });
                    navigate('/'); 
                }
            } else {
                setGlobalError(data.message || data.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error("Erreur:", error);
            setGlobalError("Impossible de contacter le serveur.");
        }
    };

    // --- STYLES & COMPOSANTS ---
    
    const EyeIcon = ({ visible }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
            {visible ? (
                <> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path> <circle cx="12" cy="12" r="3"></circle> </>
            ) : (
                <> <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> <line x1="1" y1="1" x2="23" y2="23"></line> </>
            )}
        </svg>
    );

    const labelStyle = {
        display: 'block',
        textAlign: 'left',
        marginBottom: '6px',
        fontSize: '0.85rem',
        fontWeight: '700', 
        color: '#111'
    };

    const inputStyle = (fieldName) => ({
        padding: '12px',
        borderRadius: '6px',
        border: errors[fieldName] ? '1px solid #e74c3c' : '1px solid #ccc',
        outline: 'none',
        fontSize: '0.95rem',
        backgroundColor: errors[fieldName] ? '#fff5f5' : '#fff',
        width: '100%',
        boxSizing: 'border-box',
        color: '#333'
    });

    const PasswordRequirements = () => {
        const p = formData.password;
        const reqs = [
            { label: "8 caractères min.", valid: p.length >= 8 },
            { label: "1 Majuscule", valid: /[A-Z]/.test(p) },
            { label: "Pas d'espaces", valid: !/\s/.test(p) && p.length > 0 },
        ];
        return (
            <div style={{ fontSize: '0.8rem', textAlign: 'left', margin: '5px 0 15px 0', padding: '10px', background: '#f8f9fa', borderRadius: '5px', border:'1px solid #eee' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color:'#555' }}>Sécurité :</p>
                {reqs.map((r, index) => (
                    <div key={index} style={{ color: r.valid ? '#2ecc71' : '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{r.valid ? '✓' : '•'}</span> <span>{r.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            <style>
                {`
                    .login-page input::placeholder {
                        color: #b0b0b0; 
                        font-weight: 600; 
                        opacity: 1; 
                    }
                    /* Style des suggestions */
                    .suggestions-list {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: white;
                        border: 1px solid #ccc;
                        border-top: none;
                        border-radius: 0 0 6px 6px;
                        z-index: 1000;
                        list-style: none;
                        padding: 0;
                        margin: 0;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        max-height: 200px;
                        overflow-y: auto;
                        text-align: left;
                    }
                    .suggestions-list li {
                        padding: 10px 12px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .suggestions-list li:hover {
                        background-color: #f8f9fa;
                    }
                    .suggestions-list li:last-child {
                        border-bottom: none;
                    }
                `}
            </style>

            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '20px', fontSize: '0.9rem', display:'flex', alignItems:'center', gap:'5px' }}>
                    ← Retour
                </button>

                <h2 style={{ marginBottom: '25px', color: '#222' }}>{isSignUp ? "Création de compte" : "Espace Client"}</h2>

                {/* Messages Alertes */}
                {globalError && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #fecaca', fontSize: '0.9rem', textAlign: 'left' }}>
                        ⚠️ {globalError}
                    </div>
                )}
                {successMessage && (
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #bbf7d0', fontSize: '0.9rem', textAlign: 'left' }}>
                        ✅ {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} autoComplete="off">
                    
                    {/* NOM & PRÉNOM */}
                    {isSignUp && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Prénom</label>
                                <input type="text" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} style={inputStyle('firstName')} />
                                {errors.firstName && <small style={{color:'red', fontSize:'0.75rem', display:'block', textAlign:'left', marginTop:'2px'}}>Requis</small>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Nom</label>
                                <input type="text" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} style={inputStyle('lastName')} />
                                {errors.lastName && <small style={{color:'red', fontSize:'0.75rem', display:'block', textAlign:'left', marginTop:'2px'}}>Requis</small>}
                            </div>
                        </div>
                    )}

                    {/* EMAIL */}
                    <div>
                        <label style={labelStyle}>Email professionnel</label>
                        <input type="email" name="email" placeholder="contact@entreprise.com" value={formData.email} onChange={handleChange} style={inputStyle('email')} autoComplete="username" />
                        {errors.email && <small style={{ color: '#e74c3c', display: 'block', marginTop: '4px', textAlign: 'left', fontSize:'0.8rem' }}>{errors.email}</small>}
                    </div>

                    {/* INFOS ENTREPRISE */}
                    {isSignUp && (
                        <>
                            <div>
                                <label style={labelStyle}>Nom de l'entreprise</label>
                                <input type="text" name="companyName" placeholder="Menuiserie Guegan" value={formData.companyName} onChange={handleChange} style={inputStyle('companyName')} />
                                {errors.companyName && <small style={{color:'red', fontSize:'0.75rem', display:'block', textAlign:'left', marginTop:'2px'}}>Requis</small>}
                            </div>

                            {/* --- CHAMP ADRESSE AVEC AUTOCOMPLÉTION --- */}
                            <div style={{ position: 'relative' }} ref={wrapperRef}>
                                <label style={labelStyle}>Adresse de l'entreprise</label>
                                <input 
                                    type="text" 
                                    name="companyAddress" 
                                    placeholder="Tapez pour rechercher..." 
                                    value={formData.companyAddress} 
                                    onChange={handleAddressChange} // Utilise la fonction dédiée
                                    style={inputStyle('companyAddress')}
                                    autoComplete="off"
                                />
                                {errors.companyAddress && <small style={{ color: '#e74c3c', display: 'block', marginTop: '4px', textAlign: 'left', fontSize:'0.8rem' }}>{errors.companyAddress}</small>}
                                
                                {/* Liste déroulante des suggestions */}
                                {showSuggestions && addressSuggestions.length > 0 && (
                                    <ul className="suggestions-list">
                                        {addressSuggestions.map((feature, index) => (
                                            <li key={index} onClick={() => selectAddress(feature)}>
                                                {feature.properties.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>SIRET</label>
                                    <input type="text" name="siret" placeholder="12345678900012" maxLength="14" value={formData.siret} onChange={handleChange} style={inputStyle('siret')} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>N° TVA</label>
                                    <input type="text" name="tvaNumber" placeholder="FR12123456789" value={formData.tvaNumber} onChange={handleChange} style={inputStyle('tvaNumber')} autoComplete="off" />
                                </div>
                            </div>
                            {(errors.siret || errors.tvaNumber) && (
                                <div style={{textAlign:'left'}}>
                                    {errors.siret && <small style={{ color: '#e74c3c', display: 'block', fontSize:'0.8rem' }}>SIRET : {errors.siret}</small>}
                                    {errors.tvaNumber && <small style={{ color: '#e74c3c', display: 'block', fontSize:'0.8rem' }}>TVA : {errors.tvaNumber}</small>}
                                </div>
                            )}
                        </>
                    )}

                    {/* MOT DE PASSE */}
                    <div>
                        <label style={labelStyle}>Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                placeholder="8 caractères minimum" 
                                value={formData.password} onChange={handleChange} 
                                style={{...inputStyle('password'), paddingRight: '45px'}} 
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                            />
                            <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-40%)' }}>
                                <EyeIcon visible={showPassword} />
                            </div>
                        </div>
                    </div>

                    {isSignUp && <PasswordRequirements />}

                    {isSignUp && (
                        <div>
                            <label style={labelStyle}>Confirmer le mot de passe</label>
                            <input type="password" name="confirmPassword" placeholder="Répétez le mot de passe" value={formData.confirmPassword} onChange={handleChange} style={inputStyle('confirmPassword')} autoComplete="new-password" />
                            {errors.confirmPassword && <small style={{ color: '#e74c3c', display: 'block', marginTop: '4px', textAlign: 'left', fontSize:'0.8rem' }}>{errors.confirmPassword}</small>}
                        </div>
                    )}

                    <button type="submit" style={{ padding: '14px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', marginTop: '10px', transition: 'opacity 0.2s' }}>
                        {isSignUp ? "Créer mon compte" : "Se connecter"}
                    </button>
                </form>

                <p style={{ marginTop: '25px', color: '#666', fontSize: '0.9rem' }}>
                    {isSignUp ? "Vous avez déjà un compte ?" : "Pas encore de compte professionnel ?"}
                    <span 
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setErrors({});
                            setGlobalError(null);
                            setSuccessMessage(null);
                        }} 
                        style={{ color: '#007bff', cursor: 'pointer', marginLeft: '6px', fontWeight: '600', textDecoration:'underline' }}
                    >
                        {isSignUp ? "Se connecter" : "S'inscrire"}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;