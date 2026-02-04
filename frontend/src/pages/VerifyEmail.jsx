import React, { useEffect, useState, useRef } from 'react'; // 1. Import useRef
import { useParams, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    
    // 2. Création d'un verrou pour empêcher la double exécution
    const hasCalledAPI = useRef(false);

    useEffect(() => {
        // 3. Si on a déjà appelé l'API, on ne fait rien
        if (hasCalledAPI.current) return;
        
        hasCalledAPI.current = true; // On verrouille immédiatement

        const verifyAccount = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/verify/${token}`);
                
                // On accepte 200 (OK) ou 201 (Created)
                if (response.ok) {
                    setStatus('success');
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    // Petit détail : Si le compte est déjà validé (erreur classique du double appel), 
                    // on pourrait considérer ça comme un succès, mais ici on gère le useRef.
                    setStatus('error');
                }
            } catch (error) {
                setStatus('error');
            }
        };

        if (token) verifyAccount();
    }, [token, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
            {status === 'loading' && <h2>Validation en cours...</h2>}
            
            {status === 'success' && (
                <div style={{color: 'green'}}>
                    <h1>✅ Compte validé !</h1>
                    <p>Votre compte professionnel est actif.</p>
                    <p>Redirection vers la connexion dans 3 secondes...</p>
                    <button onClick={() => navigate('/login')} className="btn-primary">Se connecter maintenant</button>
                </div>
            )}

            {status === 'error' && (
                <div style={{color: 'red'}}>
                    <h1>Une erreur est survenue</h1>
                    <p>Le lien est invalide ou a peut-être <strong>déjà été utilisé</strong>.</p>
                    <p>Essayez de vous connecter : votre compte est peut-être déjà actif.</p>
                    <button onClick={() => navigate('/login')} className="btn-secondary" style={{marginTop:'10px'}}>
                        Aller à la connexion
                    </button>
                </div>
            )}
        </div>
    );
};

export default VerifyEmail;