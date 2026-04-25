import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // 1. Initialisation depuis le localStorage
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [userId, setUserId] = useState(
    () => localStorage.getItem("userId") || null,
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("role") || "client",
  );
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const isAuthenticated = !!token;
  const isAdmin = isAuthenticated && role === "admin";

  const login = (newToken, newUserId, newUserInfo, newRole) => {
    setToken(newToken);
    setUserId(newUserId);
    setUser(newUserInfo);
    setRole(newRole || "client");

    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("user", JSON.stringify(newUserInfo));
    localStorage.setItem("role", newRole || "client");
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUser(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("guest_cart");
  };

  // --- NOUVEAU : VÉRIFICATION DU TOKEN AU CHARGEMENT ---
  useEffect(() => {
    const verifyToken = async () => {
      // Si pas de token, rien à vérifier
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/auth/check-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Si le serveur répond par une erreur (ex: 401 Token invalide/expiré)
        if (!response.ok) {
          console.warn("Session expirée ou token invalide. Déconnexion...");
          logout();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token", error);
        // Optionnel : on peut décider de déconnecter si le serveur est injoignable
        // mais c'est souvent mieux de laisser l'utilisateur réessayer.
      }
    };

    verifyToken();
  }, []); // Le tableau vide [] assure que cela ne s'exécute qu'une fois au lancement du site

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        user,
        role,
        isAdmin,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};