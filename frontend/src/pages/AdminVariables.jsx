import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';

const AdminVariables = () => {
    const { settings, setSettings, saveSettings } = useContext(SettingsContext);
    const { token } = useContext(AuthContext);
    const [localSettings, setLocalSettings] = useState(null);

    // Initialisation
    useEffect(() => {
        if (settings) {
            // Copie profonde pour éviter de muter le state directement
            setLocalSettings(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings]);

    // Helpers pour mettre à jour les objets imbriqués
    const updateSinkPrice = (name, val) => {
        setLocalSettings(prev => ({
            ...prev,
            sinkPrices: { ...prev.sinkPrices, [name]: Number(val) }
        }));
    };

    const updatePrice = (key, val) => {
        setLocalSettings(prev => ({
            ...prev,
            prices: { ...prev.prices, [key]: Number(val) }
        }));
    };

    const updateConstraint = (key, val) => {
        setLocalSettings(prev => ({
            ...prev,
            constraints: { ...prev.constraints, [key]: Number(val) }
        }));
    };

    const updateFormula = (type, param, val) => {
        setLocalSettings(prev => ({
            ...prev,
            linearFormula: {
                ...prev.linearFormula,
                [type]: { ...prev.linearFormula[type], [param]: Number(val) }
            }
        }));
    };

    const handleSave = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir appliquer ces changements sur le site ?")) return;

        const success = await saveSettings(localSettings, token);
        if (success) {
            setSettings(localSettings);
            alert("Configuration mise à jour avec succès !");
        } else {
            alert("Erreur lors de la sauvegarde.");
        }
    };

    if (!localSettings) return <div style={{ padding: '40px' }}>Chargement...</div>;

    return (
        <div className="admin-variables-page">
            <Header />
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '30px' }}>Configuration Globale</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                    
                    {/* --- BLOC 1 : PRIX DES CUVES --- */}
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>📦 Prix des Cuves (HT)</h3>
                        {Object.entries(localSettings.sinkPrices).map(([name, price]) => (
                            <div key={name} style={rowStyle}>
                                <label>{name}</label>
                                <input type="number" value={price} onChange={(e) => updateSinkPrice(name, e.target.value)} style={inputStyle} />
                            </div>
                        ))}
                    </div>

                    {/* --- BLOC 2 : OPTIONS & DIVERS --- */}
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>🛠️ Options & Accessoires</h3>
                        <div style={rowStyle}>
                            <label>Perçage Robinetterie (€)</label>
                            <input type="number" value={localSettings.prices.tapHole} onChange={(e) => updatePrice('tapHole', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={rowStyle}>
                            <label>Rainurage Égouttoir (€)</label>
                            <input type="number" value={localSettings.prices.drainer} onChange={(e) => updatePrice('drainer', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={rowStyle}>
                            <label>Anti-goutte /ml (€/m)</label>
                            <input type="number" value={localSettings.prices.waterDrip} onChange={(e) => updatePrice('waterDrip', e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    {/* --- BLOC 3 : CONTRAINTES & DÉLAIS --- */}
                    <div style={cardStyle}>
                        <h3 style={titleStyle}>📏 Contraintes & Délais</h3>
                        <div style={rowStyle}>
                            <label>Longueur Max Plan (mm)</label>
                            <input type="number" value={localSettings.constraints.maxLength} onChange={(e) => updateConstraint('maxLength', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={rowStyle}>
                            <label>Profondeur Max Plan (mm)</label>
                            <input type="number" value={localSettings.constraints.maxDepth} onChange={(e) => updateConstraint('maxDepth', e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{...rowStyle, borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px'}}>
                            <label style={{fontWeight: 'bold', color: '#d4af37'}}>Délai Livraison (jours)</label>
                            <input 
                                type="number" 
                                value={localSettings.constraints.leadTime || 15} 
                                onChange={(e) => updateConstraint('leadTime', e.target.value)} 
                                style={inputStyle} 
                            />
                        </div>
                    </div>

                    {/* --- BLOC 4 : FORMULES DOSSERETS/RETOMBÉES --- */}
                    <div style={{...cardStyle, gridColumn: '1 / -1'}}>
                        <h3 style={titleStyle}>🧮 Formules de Calcul Linéaire</h3>
                        <p style={{fontSize: '0.8em', color: '#666', marginBottom: '15px'}}>
                            Formule : <code>Prix = A * ln(Hauteur - B) - C</code>. Attention : modifier ces valeurs change la courbe de prix.
                        </p>
                        
                        <div style={{display: 'flex', gap: '40px', flexWrap: 'wrap'}}>
                            <div style={{flex: 1}}>
                                <h4 style={{marginBottom: '10px', color: '#d4af37'}}>Dosserets (Rims)</h4>
                                <div style={rowStyle}>
                                    <label>Coeff A (Multiplicateur)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.rims.a} onChange={(e) => updateFormula('rims', 'a', e.target.value)} style={inputStyle} />
                                </div>
                                <div style={rowStyle}>
                                    <label>Offset B (Seuil min)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.rims.b} onChange={(e) => updateFormula('rims', 'b', e.target.value)} style={inputStyle} />
                                </div>
                                <div style={rowStyle}>
                                    <label>Coeff C (Ajustement)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.rims.c} onChange={(e) => updateFormula('rims', 'c', e.target.value)} style={inputStyle} />
                                </div>
                            </div>

                            <div style={{flex: 1}}>
                                <h4 style={{marginBottom: '10px', color: '#d4af37'}}>Retombées (Aprons)</h4>
                                <div style={rowStyle}>
                                    <label>Coeff A (Multiplicateur)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.aprons.a} onChange={(e) => updateFormula('aprons', 'a', e.target.value)} style={inputStyle} />
                                </div>
                                <div style={rowStyle}>
                                    <label>Offset B (Seuil min)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.aprons.b} onChange={(e) => updateFormula('aprons', 'b', e.target.value)} style={inputStyle} />
                                </div>
                                <div style={rowStyle}>
                                    <label>Coeff C (Ajustement)</label>
                                    <input type="number" step="0.1" value={localSettings.linearFormula.aprons.c} onChange={(e) => updateFormula('aprons', 'c', e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button 
                        onClick={handleSave}
                        style={{ padding: '15px 40px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                    >
                        Enregistrer toute la configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

// Styles simples
const cardStyle = { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const titleStyle = { marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' };
const rowStyle = { marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inputStyle = { padding: '8px', width: '100px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' };

export default AdminVariables;