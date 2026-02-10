import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Initialisation depuis le localStorage
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || null);
    
    // NOUVEAU : On gère le rôle
    const [role, setRole] = useState(() => localStorage.getItem('role') || 'client');

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const isAuthenticated = !!token;
    // Helper pour savoir si c'est un admin
    const isAdmin = isAuthenticated && role === 'admin';

    // Mise à jour de login pour accepter le role
    const login = (newToken, newUserId, newUserInfo, newRole) => {
        setToken(newToken);
        setUserId(newUserId);
        setUser(newUserInfo);
        setRole(newRole || 'client');

        localStorage.setItem('token', newToken);
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('user', JSON.stringify(newUserInfo));
        localStorage.setItem('role', newRole || 'client');
    };

    const logout = () => {
        setToken(null);
        setUserId(null);
        setUser(null);
        setRole(null);

        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('guest_cart');
    };

    return (
        <AuthContext.Provider value={{ 
            token, 
            userId, 
            user, 
            role,      // On expose le rôle
            isAdmin,   // On expose le booléen pratique
            isAuthenticated, 
            login, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};