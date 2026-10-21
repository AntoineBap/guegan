import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const SettingsContext = createContext();

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Valeurs de repli. Les prix ne sont pas écrits ici : l'API ne les envoie
// qu'aux comptes connectés (les visiteurs voient « ** € »).
const DEFAULT_SETTINGS = {
  sinkPrices: {
    "Cuve Labo 400x400x300": undefined,
    "Cuve Détente 400x400x200": undefined,
    "Cuve Cuisine 500x400x180": undefined,
    "Cuve Sanitaire 422x336x139": undefined,
  },
  prices: {},
  linearFormula: {},
  constraints: {
    maxLength: 3600,
    maxDepth: 700,
  },
};

const merge = (value = {}) => ({
  ...DEFAULT_SETTINGS,
  ...value,
  sinkPrices: { ...DEFAULT_SETTINGS.sinkPrices, ...(value.sinkPrices || {}) },
  prices: { ...DEFAULT_SETTINGS.prices, ...(value.prices || {}) },
  linearFormula: { ...DEFAULT_SETTINGS.linearFormula, ...(value.linearFormula || {}) },
  constraints: { ...DEFAULT_SETTINGS.constraints, ...(value.constraints || {}) },
});

export const SettingsProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Rechargé à la connexion / déconnexion pour obtenir (ou retirer) les tarifs
  useEffect(() => {
    let cancelled = false;
    fetch(`${apiUrl}/api/config/global`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSettings(merge(data?.value));
      })
      .catch((err) => console.error("Erreur chargement settings:", err));
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Utilisé par la page admin des tarifs
  const saveSettings = async (newSettings, authToken) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ key: "global_settings", value: newSettings }),
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
