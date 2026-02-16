import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Chargement...</div>; // Ou un spinner
  }

  // 1. Si pas connecté -> Hop, page de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la page est réservée aux admins et que l'user n'est pas admin -> Hop, accueil
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 3. Sinon, on laisse passer (on affiche la page demandée)
  return children;
};

export default ProtectedRoute;
