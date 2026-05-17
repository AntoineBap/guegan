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

  // --- MISE À JOUR DU COMPTE UTILISATEUR ---
  // Gère 3 cas selon les champs passés :
  //   1. Mise à jour du profil          → { firstName, lastName, email, phone, address }
  //   2. Changement de mot de passe     → { currentPassword, newPassword }
  //   3. Suppression du compte          → { deleteAccount: true }
  const updateUser = async (payload) => {
    // ── Cas 1 : Suppression du compte ──────────────────────────────────────
    if (payload.deleteAccount) {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Impossible de supprimer le compte.");
      }

      logout();
      return;
    }

    // ── Cas 2 : Changement de mot de passe ─────────────────────────────────
    if (payload.newPassword) {
      const response = await fetch(`${API_URL}/api/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Mot de passe actuel incorrect.");
      }

      // Met à jour lastPasswordChange dans le state et le localStorage
      const data = await response.json();
      const updatedUser = {
        ...user,
        lastPasswordChange: data.lastPasswordChange || new Date().toISOString(),
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return;
    }

    // ── Cas 3 : Mise à jour du profil ──────────────────────────────────────
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Impossible de mettre à jour le profil.");
    }

    const updatedUser = await response.json();
    // Fusionne les nouvelles données avec l'état courant
    const mergedUser = { ...user, ...updatedUser };
    setUser(mergedUser);
    localStorage.setItem("user", JSON.stringify(mergedUser));
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
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};