import React, { createContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Valeurs par défaut (Configuration actuelle)
    const defaultSettings = {
        sinkPrices: {
            "Cuve Labo 400x400x300": 520,
            "Cuve Détente 400x400x200": 490,
            "Cuve Cuisine 500x400x180": 540,
            "Cuve Sanitaire 422x336x139": 330
        },
        prices: {
            tapHole: 15,      // Prix robinetterie
            drainer: 50,      // Prix égouttoir
            waterDrip: 50     // Prix mètre linéaire anti-goutte
        },
        // Formule logarithmique: Prix = A * ln(hauteur - B) - C
        linearFormula: {
            rims: { a: 53.6, b: 17.6, c: 86.4 },   // Dosserets
            aprons: { a: 53.6, b: 17.6, c: 86.4 }  // Retombées
        },
        constraints: {
            maxLength: 3600,
            maxDepth: 700
        }
    };

    const [settings, setSettings] = useState(defaultSettings);

    useEffect(() => {
        // On change la clé pour récupérer 'global_settings' au lieu de 'sink_prices'
        fetch(`${apiUrl}/api/admin/settings/global_settings`)
            .then(res => res.json())
            .then(data => {
                if (data && data.value) {
                    // On fusionne avec les défauts pour éviter les bugs si des champs manquent
                    setSettings(prev => ({
                        ...prev,
                        ...data.value,
                        // Assure que les sous-objets existent aussi
                        sinkPrices: { ...prev.sinkPrices, ...(data.value.sinkPrices || {}) },
                        prices: { ...prev.prices, ...(data.value.prices || {}) },
                        linearFormula: { ...prev.linearFormula, ...(data.value.linearFormula || {}) },
                        constraints: { ...prev.constraints, ...(data.value.constraints || {}) }
                    }));
                }
            })
            .catch(err => console.error("Erreur chargement settings:", err));
    }, []);

    // Fonction helper pour sauvegarder (utilisée par AdminVariables)
    const saveSettings = async (newSettings, token) => {
        try {
            const response = await fetch(`${apiUrl}/api/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // On sauvegarde sous une clé unique 'global_settings'
                body: JSON.stringify({ key: 'global_settings', value: newSettings })
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