import React, { useEffect } from "react";
import ConfigResume from "./ConfigResume";
import "../styles/style.scss";

const ConfigPanel = ({ config, setConfig, setShowModal }) => {
  // --- CONSTANTES ---
  const DRAINER_PRICE = 50;
  const DRAINER_MIN_SPACE = 400; // 350mm largeur + 50mm marge min

  const SINK_SPECS = {
    "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300, price: 520 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200, price: 490 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180, price: 540 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139, price: 330 },
  };

  const currentSink = config.sink || "Aucune cuve";
  const isNoSink = currentSink === "Aucune cuve";

  // --- LIMITES DYNAMIQUES ---
  const minPlanDepth = isNoSink ? 400 : config.basinWidth + 160;
  const maxPlanDepth = 700;
  const minPlanLength = isNoSink ? 600 : config.basinLength + 200;
  const maxPlanLength = 3600;

  const isSidePosition = config.position === "left" || config.position === "right";
  const calculatedMaxOffset = (config.length - config.basinLength) / 2;
  const maxOffset = Math.max(10, Math.floor(calculatedMaxOffset));
  const maxTapOffset = Math.floor(config.basinLength / 2 - 25);

  // --- CALCUL DES ESPACES LIBRES POUR L'ÉGOUTTOIR ---
  // On calcule l'espace disponible à gauche et à droite de la cuve
  let spaceLeft = 0;
  let spaceRight = 0;

  if (!isNoSink) {
    if (config.position === "center") {
      const margin = (config.length - config.basinLength) / 2;
      spaceLeft = margin;
      spaceRight = margin;
    } else if (config.position === "left") {
      const offset = config.sinkOffset || 100;
      spaceLeft = offset;
      spaceRight = config.length - offset - config.basinLength;
    } else if (config.position === "right") {
      const offset = config.sinkOffset || 100;
      spaceRight = offset;
      spaceLeft = config.length - offset - config.basinLength;
    }
  }

  const canAddLeft = spaceLeft >= DRAINER_MIN_SPACE;
  const canAddRight = spaceRight >= DRAINER_MIN_SPACE;

  // --- MISE EN PLACE DES CONTRAINTES ---
  useEffect(() => {
    // Force Retombées
    if (!config.aprons || !config.apronFront) {
      setConfig((prev) => ({
        ...prev,
        aprons: true,
        apronFront: true,
        apronHeight: prev.apronHeight || 40,
      }));
    }

    // Vérification Égouttoir si l'espace change
    if (config.hasDrainer) {
        if (config.drainerPosition === 'left' && !canAddLeft) {
             // Si plus de place à gauche, on essaye à droite, sinon on désactive
             if (canAddRight) setConfig(prev => ({...prev, drainerPosition: 'right'}));
             else setConfig(prev => ({...prev, hasDrainer: false}));
        }
        else if (config.drainerPosition === 'right' && !canAddRight) {
             if (canAddLeft) setConfig(prev => ({...prev, drainerPosition: 'left'}));
             else setConfig(prev => ({...prev, hasDrainer: false}));
        }
    }
  }, [config.aprons, config.apronFront, config.length, config.basinLength, config.position, config.sinkOffset, canAddLeft, canAddRight, config.hasDrainer, config.drainerPosition, setConfig]);


  // --- CALCUL DU PRIX ---
  const calculatePrice = () => {
    // 1. Surface
    const surfaceM2 = (config.length * config.width) / 1000000;
    const baseMaterialPrice = 219.3 * surfaceM2 + 447.37;
    let total = Math.round(baseMaterialPrice);

    // 2. Cuve
    const selectedSinkSpec = SINK_SPECS[currentSink];
    if (selectedSinkSpec) total += selectedSinkSpec.price;

    // 3. Perçage Robinetterie
    if (config.hasTapHole && config.tapHole !== "none") total += 15;

    // 4. Égouttoir
    if (config.hasDrainer) total += DRAINER_PRICE;

    // 5. Linéaire (Retombées & Dosserets)
    const getLinearPartPrice = (heightMm, lengthMm) => {
      if (!heightMm || heightMm <= 17.6) return 0;
      const pricePerMeter = 53.6 * Math.log(heightMm - 17.6) - 86.4;
      const safePricePerMeter = Math.max(0, pricePerMeter);
      return Math.round(safePricePerMeter * (lengthMm / 1000));
    };

    if (config.rims) {
      if (config.rimLeft) total += getLinearPartPrice(config.rimHeigh, config.width);
      if (config.rimRight) total += getLinearPartPrice(config.rimHeigh, config.width);
      if (config.rimBack) total += getLinearPartPrice(config.rimHeigh, config.length);
    }

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
      setConfig((prev) => ({
        ...prev,
        hasTapHole: checked,
        tapHole: checked ? "center" : "none",
        tapHoleOffset: 0,
      }));
    } else if (name === "tapHolePosition") {
      setConfig((prev) => ({
        ...prev,
        tapHole: val,
        tapHoleOffset: val === "center" ? 0 : prev.tapHoleOffset || 50,
      }));
    } else if (name === "rims") {
      if (checked)
        setConfig((prev) => ({
          ...prev,
          rims: true,
          rimHeigh: 100,
          rimLeft: !prev.apronLeft,
          rimBack: !prev.apronBack,
          rimRight: !prev.apronRight,
        }));
      else
        setConfig((prev) => ({ ...prev, rims: false, rimLeft: false, rimBack: false, rimRight: false }));
    } else if (name === "hasDrainer") {
        // Initialisation intelligente de la position
        let defaultPos = 'right';
        if (!canAddRight && canAddLeft) defaultPos = 'left';
        
        setConfig(prev => ({
            ...prev,
            hasDrainer: checked,
            drainerPosition: checked ? (prev.drainerPosition || defaultPos) : null
        }));
    } else if (name === "drainerPosition") {
        setConfig(prev => ({ ...prev, drainerPosition: value }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : val }));
    }
  };

  const toggleRimSide = (sideKey) => setConfig((prev) => ({ ...prev, [sideKey]: !prev[sideKey] }));
  const toggleApronSide = (sideKey) => setConfig((prev) => ({ ...prev, [sideKey]: !prev[sideKey] }));

  const handleBlur = (e) => {
    const { name, value, min, max } = e.target;
    const val = parseFloat(value);
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    if (isNaN(val)) { setConfig((prev) => ({ ...prev, [name]: minVal })); return; }
    if (val < minVal) setConfig((prev) => ({ ...prev, [name]: minVal }));
    else if (val > maxVal) setConfig((prev) => ({ ...prev, [name]: maxVal }));
  };

  const handleSinkSelect = (sinkName) => {
    const specs = SINK_SPECS[sinkName];
    if (specs) {
      const requiredMinDepth = sinkName === "Aucune cuve" ? 400 : specs.w + 160;
      const requiredMinLength = sinkName === "Aucune cuve" ? 600 : specs.l + 200;
      setConfig((prev) => {
        const currentPlanDepth = prev.width < requiredMinDepth ? requiredMinDepth : prev.width;
        const currentPlanLength = prev.length < requiredMinLength ? requiredMinLength : prev.length;
        return {
          ...prev,
          sink: sinkName,
          basinLength: specs.l,
          basinWidth: specs.w,
          depth: specs.d,
          width: currentPlanDepth,
          length: currentPlanLength,
          hasTapHole: sinkName === "Aucune cuve" ? false : prev.hasTapHole,
          tapHole: sinkName === "Aucune cuve" ? "none" : prev.tapHole,
          // Reset drainer si plus de place
          hasDrainer: sinkName === "Aucune cuve" ? false : prev.hasDrainer
        };
      });
    }
  };

  const handleAddToCart = () => alert(`Produit ajouté au panier pour ${totalPrice} € TTC`);
  const surfaceM2 = (config.length * config.width) / 1000000;
  const showWeightAlert = surfaceM2 >= 2;

  return (
    <div className="config-panel">
      <h1>Votre Plan-Vasque <span className="gold-text">Sur Mesure</span></h1>

      {/* COULEUR */}
      <div className="form-group">
        <label>Couleur du Solid Surface</label>
        <div className="corian-color">
          <button className={config.color === "white" ? "active" : ""} onClick={() => setConfig({ ...config, color: "white" })}>Blanc Pur</button>
        </div>
      </div>

      {/* DIMENSIONS */}
      <div className="form-group section-box">
        <label className="section-title">Dimensions du Plan</label>
        <div className="inputs-row">
          <div>
            <span>Largeur (mm) (min: {minPlanLength} / max: 3600)</span>
            <input type="number" name="length" value={config.length} onChange={handleChange} onBlur={handleBlur} min={minPlanLength} max={maxPlanLength} step="10" />
          </div>
          <div>
            <span>Profondeur (mm) (min: {minPlanDepth} / max: 700)</span>
            <input type="number" name="width" value={config.width} onChange={handleChange} onBlur={handleBlur} min={minPlanDepth} max={maxPlanDepth} step="10" />
          </div>
        </div>
        {showWeightAlert && <div className="weight-alert"><span className="icon">⚠️</span><div className="text"><strong>Attention : Poids Élevé</strong><p>Votre plan fait {surfaceM2.toFixed(2)}m².</p></div></div>}
      </div>

      {/* CUVE & OPTIONS */}
      <div className="form-group section-box">
        <label className="section-title">Choix de la cuve</label>
        <div className="sink-options-list">
          {Object.keys(SINK_SPECS).map((opt) => (
            <button key={opt} className={currentSink === opt ? "active-small" : ""} onClick={() => handleSinkSelect(opt)}>
              {opt === "Aucune cuve" ? "Aucune" : opt.replace("Cuve ", "")}
              <span style={{ display: "block", fontSize: "0.75rem", marginTop: "2px", opacity: 0.8 }}>
                {SINK_SPECS[opt].price === 0 ? "Inclus" : `+${SINK_SPECS[opt].price}€`}
              </span>
            </button>
          ))}
        </div>

        {!isNoSink && (
          <>
            <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>
            
            {/* POSITION */}
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

            {/* ROBINETTERIE */}
            <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>
            <div className="checkbox-group">
              <label style={{ marginBottom: "15px", fontWeight: "bold" }}>
                <input type="checkbox" name="hasTapHole" checked={config.hasTapHole} onChange={handleChange} /> Perçage pour robinetterie (+15€)
              </label>
              {config.hasTapHole && (
                <div className="fade-in">
                  <div className="drilling-options" style={{ marginBottom: "15px" }}>
                    {["left", "center", "right"].map((opt) => (
                      <button key={opt} className={config.tapHole === opt ? "active-small" : ""} onClick={() => handleChange({ target: { name: "tapHolePosition", value: opt } })}>
                        {opt === "center" ? "Centre" : opt === "left" ? "Gauche" : "Droite"}
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

            {/* EGOUTTOIR */}
            <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>
            <div className="checkbox-group">
                <label style={{ marginBottom: "10px", fontWeight: "bold" }}>
                    <input type="checkbox" name="hasDrainer" checked={config.hasDrainer} onChange={handleChange} disabled={!canAddLeft && !canAddRight} /> 
                    Rainurage Égouttoir (+50€)
                </label>
                {!canAddLeft && !canAddRight && <div style={{fontSize: "0.8rem", color: "orange", marginLeft: "25px", marginBottom: "10px"}}>Espace insuffisant pour l'égouttoir.</div>}
                
                {config.hasDrainer && (
                    <div className="fade-in drilling-options" style={{marginTop: "10px", marginLeft: "25px"}}>
                        <button 
                            className={config.drainerPosition === 'left' ? "active-small" : ""} 
                            onClick={() => handleChange({ target: { name: "drainerPosition", value: "left" } })}
                            disabled={!canAddLeft}
                            title={!canAddLeft ? "Pas assez de place à gauche" : ""}
                        >
                            À Gauche
                        </button>
                        <button 
                            className={config.drainerPosition === 'right' ? "active-small" : ""} 
                            onClick={() => handleChange({ target: { name: "drainerPosition", value: "right" } })}
                            disabled={!canAddRight}
                            title={!canAddRight ? "Pas assez de place à droite" : ""}
                        >
                            À Droite
                        </button>
                    </div>
                )}
            </div>
          </>
        )}
      </div>

      {/* DOSSERETS */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="rims" checked={config.rims} onChange={handleChange} /> Ajouter dosserets</label>
        {config.rims && (
          <div className="rims-options-container" style={{ marginTop: "10px", width: "100%" }}>
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontSize: "0.9rem", marginRight: "10px" }}>Hauteur :</span>
              <input type="number" className="small-input" name="rimHeigh" value={config.rimHeigh} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="50" max="550" step="5" />
            </div>
            <div className="drilling-options">
              <button className={config.rimLeft ? "active-small" : ""} onClick={() => toggleRimSide("rimLeft")} disabled={config.apronLeft}>Gauche</button>
              <button className={config.rimBack ? "active-small" : ""} onClick={() => toggleRimSide("rimBack")} disabled={config.apronBack}>Fond</button>
              <button className={config.rimRight ? "active-small" : ""} onClick={() => toggleRimSide("rimRight")} disabled={config.apronRight}>Droite</button>
            </div>
          </div>
        )}
      </div>

      {/* RETOMBÉES */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="aprons" checked={true} disabled={true} readOnly /> Ajouter Retombées (Obligatoire)</label>
        <div className="rims-options-container" style={{ marginTop: "10px", width: "100%" }}>
          <div style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "0.9rem", marginRight: "10px" }}>Hauteur :</span>
            <input type="number" className="small-input" name="apronHeight" value={config.apronHeight || 40} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="40" max="200" step="5" />
          </div>
          <div className="drilling-options">
            <button className={config.apronFront ? "active-small" : ""} disabled title="Obligatoire">Avant</button>
            <button className={config.apronLeft ? "active-small" : ""} onClick={() => toggleApronSide("apronLeft")} disabled={config.rimLeft}>Gauche</button>
            <button className={config.apronBack ? "active-small" : ""} onClick={() => toggleApronSide("apronBack")} disabled={config.rimBack}>Fond</button>
            <button className={config.apronRight ? "active-small" : ""} onClick={() => toggleApronSide("apronRight")} disabled={config.rimRight}>Droite</button>
          </div>
        </div>
      </div>

      {/* GOUTTE D'EAU */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="splashback" checked={config.splashback} onChange={handleChange} /> Ajouter Goutte d'eau (Anti-débordement)</label>
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={() => setShowModal(true)}>Voir Rendu 3D</button>
      </div>

      <ConfigResume config={config} totalPrice={totalPrice} handleAddToCart={handleAddToCart} currentSink={currentSink} />
    </div>
  );
};

export default ConfigPanel;