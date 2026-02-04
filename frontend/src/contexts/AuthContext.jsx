import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Vérifier au chargement si l'utilisateur est déjà connecté (via localStorage)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (token && userId) {
            setIsAuthenticated(true);
            setUser({ userId }); // Tu pourras stocker plus d'infos ici (nom, etc.)
        }
        setLoading(false);
    }, []);

    // Fonction appelée après le Login réussi
    const login = (token, userId, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        setIsAuthenticated(true);
        setUser({ userId, ...userData });
    };

    // Fonction de déconnexion
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setUser(null);
        // Optionnel : rediriger vers l'accueil
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};