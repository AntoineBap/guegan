import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. On initialise DIRECTEMENT depuis le localStorage pour ne rien perdre au refresh
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || null);
    
    // Pour les infos utilisateur (nom, entreprise...), on gère le JSON.parse
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    // 2. isAuthenticated est simplement "est-ce qu'on a un token ?"
    const isAuthenticated = !!token;

    const login = (newToken, newUserId, newUserInfo) => {
        // Mise à jour du State (pour l'affichage immédiat)
        setToken(newToken);
        setUserId(newUserId);
        setUser(newUserInfo);

        // Mise à jour du Storage (pour la persistance au refresh)
        localStorage.setItem('token', newToken);
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('user', JSON.stringify(newUserInfo));
    };

    const logout = () => {
        setToken(null);
        setUserId(null);
        setUser(null);

        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        
        // Optionnel : on nettoie aussi le panier local par sécurité
        localStorage.removeItem('guest_cart');
    };

    return (
        <AuthContext.Provider value={{ 
            token, 
            userId, 
            user, 
            isAuthenticated, 
            login, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};