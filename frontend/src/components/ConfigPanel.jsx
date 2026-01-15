import React, { useState, useEffect } from 'react';
import "../styles/configPanel.scss";

const ConfigPanel = ({ config, setConfig, setShowModal }) => {
  
  // --- PRIX ET SPECS DES CUVES ---
  const SINK_SPECS = {
    "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300, price: 513 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200, price: 486 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180, price: 540 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139, price: 324 },
  };

  // Sécurité : Si config.sink est undefined, on considère "Aucune cuve"
  const currentSink = config.sink || "Aucune cuve";
  const isNoSink = currentSink === "Aucune cuve";
  
  // --- LIMITES ---
  const minPlanDepth = isNoSink ? 400 : (config.basinWidth + 160);
  const maxPlanDepth = 700;
  const minPlanLength = isNoSink ? 600 : (config.basinLength + 200);
  const maxPlanLength = 3600;

  const isSidePosition = config.position === "left" || config.position === "right";
  const calculatedMaxOffset = (config.length - config.basinLength) / 2;
  const maxOffset = Math.max(10, Math.floor(calculatedMaxOffset)); 
  const maxTapOffset = Math.floor((config.basinLength / 2) - 25);

  // --- CALCUL DU PRIX ---
  const calculatePrice = () => {
    let total = 0;

    // 1. Prix Cuve (Utilisation de currentSink sécurisé)
    const selectedSinkSpec = SINK_SPECS[currentSink];
    if (selectedSinkSpec) {
        total += selectedSinkSpec.price;
    }

    // 2. Prix Perçage Robinetterie
    if (config.hasTapHole && config.tapHole !== "none") {
        total += 15;
    }

    // 3. Fonction Prix Linéaire (Dosserets/Retombées)
    const getLinearPartPrice = (heightMm, lengthMm) => {
        if (!heightMm || heightMm <= 17.6) return 0;
        const pricePerMeter = 53.6 * Math.log(heightMm - 17.6) - 86.4;
        const safePricePerMeter = Math.max(0, pricePerMeter);
        const lengthM = lengthMm / 1000;
        return Math.round(safePricePerMeter * lengthM);
    };

    // Prix Dosserets
    if (config.rims) {
        if (config.rimLeft) total += getLinearPartPrice(config.rimHeigh, config.width);
        if (config.rimRight) total += getLinearPartPrice(config.rimHeigh, config.width);
        if (config.rimBack) total += getLinearPartPrice(config.rimHeigh, config.length);
    }

    // Prix Retombées
    if (config.aprons) {
        const h = config.apronHeight || 40;
        if (config.apronFront) total += getLinearPartPrice(h, config.length);
        if (config.apronLeft) total += getLinearPartPrice(h, config.width);
        if (config.apronRight) total += getLinearPartPrice(h, config.width);
        if (config.apronBack) total += getLinearPartPrice(h, config.length);
    }
    
    return total;
  };

  const totalPrice = calculatePrice();

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "number" ? parseFloat(value) : value;

    if (name === "hasTapHole") {
        setConfig(prev => ({
            ...prev,
            hasTapHole: checked,
            tapHole: checked ? "center" : "none",
            tapHoleOffset: 0
        }));
    }
    else if (name === "tapHolePosition") {
        setConfig(prev => ({
            ...prev,
            tapHole: val,
            tapHoleOffset: val === 'center' ? 0 : (prev.tapHoleOffset || 50)
        }));
    }
    else if (name === "rims") {
        if (checked) {
            setConfig((prev) => ({ ...prev, rims: true, rimHeigh: 100, rimLeft: !prev.apronLeft, rimBack: !prev.apronBack, rimRight: !prev.apronRight }));
        } else {
            setConfig((prev) => ({ ...prev, rims: false, rimLeft: false, rimBack: false, rimRight: false }));
        }
    }
    else if (name === "aprons") {
        if (checked) {
            setConfig((prev) => ({ ...prev, aprons: true, apronHeight: 40, apronFront: true, apronLeft: !prev.rimLeft, apronRight: !prev.rimRight, apronBack: !prev.rimBack }));
        } else {
             setConfig((prev) => ({ ...prev, aprons: false, apronFront: false, apronLeft: false, apronRight: false, apronBack: false }));
        }
    } 
    else {
        setConfig((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : val }));
    }
  };

  const toggleRimSide = (sideKey) => { setConfig((prev) => ({ ...prev, [sideKey]: !prev[sideKey] })); };
  const toggleApronSide = (sideKey) => { setConfig((prev) => ({ ...prev, [sideKey]: !prev[sideKey] })); };

  const handleBlur = (e) => {
    const { name, value, min, max } = e.target;
    const val = parseFloat(value);
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    if (isNaN(val)) { setConfig((prev) => ({ ...prev, [name]: minVal })); return; }
    if (val < minVal) { setConfig((prev) => ({ ...prev, [name]: minVal })); } 
    else if (val > maxVal) { setConfig((prev) => ({ ...prev, [name]: maxVal })); }
  };

  const handleSinkSelect = (sinkName) => {
    const specs = SINK_SPECS[sinkName];
    if (specs) {
      const requiredMinDepth = (sinkName === "Aucune cuve") ? 400 : (specs.w + 160);
      const requiredMinLength = (sinkName === "Aucune cuve") ? 600 : (specs.l + 200);
      setConfig((prev) => {
        const currentPlanDepth = prev.width;
        const newPlanDepth = currentPlanDepth < requiredMinDepth ? requiredMinDepth : currentPlanDepth;
        const currentPlanLength = prev.length;
        const newPlanLength = currentPlanLength < requiredMinLength ? requiredMinLength : currentPlanLength;
        return { ...prev, sink: sinkName, basinLength: specs.l, basinWidth: specs.w, depth: specs.d, width: newPlanDepth, length: newPlanLength };
      });
    }
  };

  const handleAddToCart = () => {
      alert(`Produit ajouté au panier pour ${totalPrice} € TTC`);
  };

  const surfaceM2 = (config.length * config.width) / 1000000;
  const showWeightAlert = surfaceM2 >= 2;

  return (
    <div className="page-layout">
        
      {/* COLONNE GAUCHE */}
      <div className="config-panel">
        <h1>Votre Plan-Vasque <span className="gold-text">Sur Mesure</span></h1>
        
        <div className="form-group">
          <label>Couleur du Solid Surface</label>
          <div className="corian-color">
            <button className={config.color === "white" ? "active" : ""} onClick={() => setConfig({ ...config, color: "white" })}>Blanc Pur</button>
          </div>
        </div>

        <div className="form-group section-box">
          <label className="section-title">Dimensions du Plan</label>
          <div className="inputs-row">
            <div>
              <span>Largeur (mm) (min: {minPlanLength})</span>
              <input type="number" name="length" value={config.length} onChange={handleChange} onBlur={handleBlur} min={minPlanLength} max={maxPlanLength} step="10" />
            </div>
            <div>
              <span>Profondeur (mm) (min: {minPlanDepth})</span>
              <input type="number" name="width" value={config.width} onChange={handleChange} onBlur={handleBlur} min={minPlanDepth} max={maxPlanDepth} step="10" />
            </div>
          </div>
          {showWeightAlert && <div className="weight-alert"><span className="icon">⚠️</span><div className="text"><strong>Attention : Poids Élevé</strong><p>Votre plan fait {surfaceM2.toFixed(2)}m².</p></div></div>}
        </div>

        <div className="form-group section-box">
          <label className="section-title">Choix de la cuve</label>
          <div className="sink-options-list">
              {Object.keys(SINK_SPECS).map(opt => (
                  <button key={opt} className={currentSink === opt ? "active-small" : ""} onClick={() => handleSinkSelect(opt)}>
                      {opt === "Aucune cuve" ? "Aucune" : opt.replace("Cuve ", "")}
                      <span style={{display:'block', fontSize:'0.75rem', marginTop:'2px', opacity: 0.8}}>
                          {SINK_SPECS[opt].price === 0 ? "Inclus" : `+${SINK_SPECS[opt].price}€`}
                      </span>
                  </button>
              ))}
          </div>
        </div>

        <div className="form-group section-box">
          <label className="section-title">Position de la cuve</label>
          <div className="inputs-row" style={{ alignItems: "flex-end" }}>
              <select name="position" value={config.position} onChange={handleChange}>
                  <option value="center">Centré</option>
                  <option value="left">Gauche</option>
                  <option value="right">Droite</option>
              </select>
              {isSidePosition && (
              <div style={{ display: "flex", flexDirection: "column", marginLeft: "15px", flex: 1 }}>
                  <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>Décalage bord (min: 100 / max: {maxOffset})</span>
                  <input type="number" name="sinkOffset" value={config.sinkOffset || 100} onChange={handleChange} onBlur={handleBlur} min="100" max={maxOffset} />
              </div>
              )}
          </div>
        </div>

        <div className="form-group section-box checkbox-group"> 
          <label style={{marginBottom: '15px'}}>
              <input type="checkbox" name="hasTapHole" checked={config.hasTapHole} onChange={handleChange} /> 
              Perçage pour robinetterie (+15€)
          </label>
          {config.hasTapHole && (
              <div className="fade-in">
                  <div className="drilling-options" style={{ marginBottom: "15px" }}>
                      {["left", "center", "right"].map((opt) => (
                      <button key={opt} className={config.tapHole === opt ? "active-small" : ""} onClick={() => handleChange({ target: { name: 'tapHolePosition', value: opt } })}>
                          {opt === "center" ? "Centre" : (opt === "left" ? "Gauche" : "Droite")}
                      </button>
                      ))}
                  </div>
                  {(config.tapHole === "left" || config.tapHole === "right") && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>Décalage (mm) (max: {maxTapOffset})</span>
                          <input type="number" name="tapHoleOffset" value={config.tapHoleOffset || 50} onChange={handleChange} onBlur={handleBlur} min="30" max={maxTapOffset} step="5" />
                      </div>
                  )}
              </div>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label><input type="checkbox" name="splashback" checked={config.splashback} onChange={handleChange} /> Ajouter Goutte d'eau (Anti-débordement)</label>
        </div>
        
        <div className="form-group checkbox-group">
          <label><input type="checkbox" name="rims" checked={config.rims} onChange={handleChange} /> Ajouter dosserets</label>
          {config.rims && (
            <div className="rims-options-container" style={{marginTop: '10px', width: '100%'}}>
              <div style={{marginBottom: '10px'}}>
                   <span style={{fontSize: '0.9rem', marginRight: '10px'}}>Hauteur :</span>
                   <input type="number" className="small-input" name="rimHeigh" value={config.rimHeigh} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="50" max="550" step="5" />
              </div>
              <div className="drilling-options">
                  <button className={config.rimLeft ? "active-small" : ""} onClick={() => toggleRimSide('rimLeft')} disabled={config.apronLeft}>Gauche</button>
                  <button className={config.rimBack ? "active-small" : ""} onClick={() => toggleRimSide('rimBack')} disabled={config.apronBack}>Fond</button>
                  <button className={config.rimRight ? "active-small" : ""} onClick={() => toggleRimSide('rimRight')} disabled={config.apronRight}>Droite</button>
              </div>
            </div>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label><input type="checkbox" name="aprons" checked={config.aprons} onChange={handleChange} /> Ajouter Retombées</label>
          {config.aprons && (
            <div className="rims-options-container" style={{marginTop: '10px', width: '100%'}}>
              <div style={{marginBottom: '10px'}}>
                   <span style={{fontSize: '0.9rem', marginRight: '10px'}}>Hauteur :</span>
                   <input type="number" className="small-input" name="apronHeight" value={config.apronHeight || 40} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="40" max="200" step="5" />
              </div>
              <div className="drilling-options">
                  <button className={config.apronFront ? "active-small" : ""} disabled title="Obligatoire">Avant</button>
                  <button className={config.apronLeft ? "active-small" : ""} onClick={() => toggleApronSide('apronLeft')} disabled={config.rimLeft}>Gauche</button>
                  <button className={config.apronBack ? "active-small" : ""} onClick={() => toggleApronSide('apronBack')} disabled={config.rimBack}>Fond</button>
                  <button className={config.apronRight ? "active-small" : ""} onClick={() => toggleApronSide('apronRight')} disabled={config.rimRight}>Droite</button>
              </div>
            </div>
          )}
        </div>

        <div className="actions">
          <button className="btn-secondary" onClick={() => setShowModal(true)}>
            Voir Rendu 3D
          </button>
        </div>
      </div>

      {/* COLONNE DROITE : RÉSUMÉ & PRIX */}
      <div className="summary-panel">
          <div className="summary-card">
              <h2>Résumé de votre configuration</h2>
              
              <div className="summary-section">
                  <h3>Dimensions</h3>
                  <p>{config.length / 10} cm × {config.width / 10} cm</p>
              </div>

              <div className="summary-section">
                  <h3>Cuve</h3>
                  <p>
                    {/* Correction ICI : utilisation de la variable sécurisée currentSink */}
                    {currentSink === "Aucune cuve" ? "Aucune" : currentSink.replace("Cuve ", "")}
                  </p>
                  <p className="summary-detail">Pos: {config.position}</p>
              </div>

              {config.hasTapHole && (
                  <div className="summary-section">
                      <h3>Perçage robinet</h3>
                      <p>Oui (Ø35mm)</p>
                  </div>
              )}

              <div className="price-section">
                  <span>Prix Total TTC</span>
                  <span className="price-value">{totalPrice} €</span>
              </div>

              <button className="btn-primary" onClick={handleAddToCart}>
                  Ajouter au panier
              </button>
          </div>
      </div>
    </div>
  );
};

export default ConfigPanel;