import "../styles/configPanel.scss";

const ConfigPanel = ({ config, setConfig, setShowModal }) => {
  
  const SINK_SPECS = {
    "Aucune cuve": { l: 0, w: 0, d: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139 },
  };

  const isNoSink = config.sink === "Aucune cuve" || !config.sink;
  
  // --- CALCULS LIMITES ---
  const minPlanDepth = isNoSink ? 400 : (config.basinWidth + 160);
  const maxPlanDepth = 700;
  const minPlanLength = isNoSink ? 600 : (config.basinLength + 200);
  const maxPlanLength = 3600;

  // Calcul Décalage Cuve
  const isSidePosition = config.position === "left" || config.position === "right";
  const calculatedMaxOffset = (config.length - config.basinLength) / 2;
  const maxOffset = Math.max(10, Math.floor(calculatedMaxOffset)); 

  // Calcul Décalage Robinet (Max = moitié largeur cuve - rayon trou (17.5mm) - marge sécurité)
  // On laisse 25mm de marge de sécurité par rapport au bord de la cuve
  const maxTapOffset = Math.floor((config.basinLength / 2) - 25);

  // --- GESTIONNAIRES D'ÉVÉNEMENTS ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "number" ? parseFloat(value) : value;

    // Gestion Perçage (Checkbox principale)
    if (name === "hasTapHole") {
        setConfig(prev => ({
            ...prev,
            hasTapHole: checked,
            tapHole: checked ? "center" : "none", // Reset à 'center' si on active, 'none' si on désactive
            tapHoleOffset: 0 // Reset offset
        }));
    }
    // Gestion Position Perçage (Boutons)
    else if (name === "tapHolePosition") {
        setConfig(prev => ({
            ...prev,
            tapHole: val, // 'left', 'center', 'right'
            tapHoleOffset: val === 'center' ? 0 : (prev.tapHoleOffset || 50) // Reset offset si centre, sinon defaut
        }));
    }
    // ... (Rims/Aprons inchangés, je les garde pour la structure) ...
    else if (name === "rims") { /* ... code existant ... */ 
        if (checked) {
            setConfig((prev) => ({ ...prev, rims: true, rimHeigh: 100, rimLeft: !prev.apronLeft, rimBack: !prev.apronBack, rimRight: !prev.apronRight }));
        } else {
            setConfig((prev) => ({ ...prev, rims: false, rimLeft: false, rimBack: false, rimRight: false }));
        }
    }
    else if (name === "aprons") { /* ... code existant ... */ 
        if (checked) {
            setConfig((prev) => ({ ...prev, aprons: true, apronHeight: 40, apronFront: true, apronLeft: !prev.rimLeft, apronRight: !prev.rimRight, apronBack: !prev.rimBack }));
        } else {
             setConfig((prev) => ({ ...prev, aprons: false, apronFront: false, apronLeft: false, apronRight: false, apronBack: false }));
        }
    } 
    else {
        setConfig((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : val,
        }));
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

  const handleCheckout = async () => { /* ... */ };
  const surfaceM2 = (config.length * config.width) / 1000000;
  const showWeightAlert = surfaceM2 >= 2;

  return (
    <div className="config-panel">
      <h1>
        Votre Plan-Vasque <span className="gold-text">Sur Mesure</span>
      </h1>
      
      {/* Couleur & Dimensions (Inchangés) */}
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
            {Object.keys(SINK_SPECS).map(opt => <button key={opt} className={config.sink === opt ? "active-small" : ""} onClick={() => handleSinkSelect(opt)}>{opt === "Aucune cuve" ? "Aucune" : opt.replace("Cuve ", "")}</button>)}
        </div>
      </div>

      {/* --- NOUVELLE SECTION : POSITION CUVE --- */}
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

      {/* --- NOUVELLE SECTION : PERÇAGE ROBINETTERIE --- */}
      <div className="form-group section-box checkbox-group"> {/* Ajout de section-box pour l'encadré */}
        <label style={{marginBottom: '15px'}}>
            <input 
                type="checkbox" 
                name="hasTapHole" 
                checked={config.hasTapHole} // Assure-toi d'avoir hasTapHole dans ton state initial
                onChange={handleChange} 
            /> 
            Perçage pour robinetterie
        </label>

        {config.hasTapHole && (
            <div className="fade-in">
                <div className="drilling-options" style={{ marginBottom: "15px" }}>
                    {["left", "center", "right"].map((opt) => (
                    <button
                        key={opt}
                        // name pour que handleChange le détecte si besoin, mais ici on utilise onClick direct
                        className={config.tapHole === opt ? "active-small" : ""}
                        onClick={() => handleChange({ target: { name: 'tapHolePosition', value: opt } })}
                    >
                        {opt === "center" ? "Centre" : (opt === "left" ? "Gauche" : "Droite")}
                    </button>
                    ))}
                </div>

                {/* Input Décalage Robinet (Si Gauche ou Droite) */}
                {(config.tapHole === "left" || config.tapHole === "right") && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>
                            Décalage par rapport au centre de la cuve (mm) (max: {maxTapOffset})
                        </span>
                        <input
                            type="number"
                            name="tapHoleOffset" // Ajoute tapHoleOffset: 50 dans ton state
                            value={config.tapHoleOffset || 50}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            min="30" // Min raisonnable pour ne pas être collé au centre
                            max={maxTapOffset}
                            step="5"
                        />
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Goutte d'eau */}
      <div className="form-group checkbox-group">
        <label>
            <input type="checkbox" name="splashback" checked={config.splashback} onChange={handleChange} /> 
            Ajouter Goutte d'eau (Anti-débordement)
        </label>
      </div>
      
      {/* ... [Sections Dosserets et Retombées (Rims/Aprons) inchangées] ... */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="rims" checked={config.rims} onChange={handleChange} /> Ajouter dosserets (Vers le haut)</label>
        {config.rims && (
          <div className="rims-options-container" style={{marginTop: '10px', width: '100%'}}>
            <div style={{marginBottom: '10px'}}>
                 <span style={{fontSize: '0.9rem', marginRight: '10px'}}>Hauteur :</span>
                 <input type="number" className="small-input" name="rimHeigh" value={config.rimHeigh} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="50" max="550" step="5" />
            </div>
            <div className="drilling-options">
                <button className={config.rimLeft ? "active-small" : ""} onClick={() => toggleRimSide('rimLeft')} disabled={config.apronLeft} title={config.apronLeft ? "Désactivé car une retombée est présente" : ""}>Gauche</button>
                <button className={config.rimBack ? "active-small" : ""} onClick={() => toggleRimSide('rimBack')} disabled={config.apronBack} title={config.apronBack ? "Désactivé car une retombée est présente" : ""}>Fond</button>
                <button className={config.rimRight ? "active-small" : ""} onClick={() => toggleRimSide('rimRight')} disabled={config.apronRight} title={config.apronRight ? "Désactivé car une retombée est présente" : ""}>Droite</button>
            </div>
          </div>
        )}
      </div>

      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="aprons" checked={config.aprons} onChange={handleChange} /> Ajouter Retombées (Vers le bas)</label>
        {config.aprons && (
          <div className="rims-options-container" style={{marginTop: '10px', width: '100%'}}>
            <div style={{marginBottom: '10px'}}>
                 <span style={{fontSize: '0.9rem', marginRight: '10px'}}>Hauteur :</span>
                 <input type="number" className="small-input" name="apronHeight" value={config.apronHeight || 40} onChange={handleChange} onBlur={handleBlur} placeholder="H (mm)" min="40" max="200" step="5" />
            </div>
            <div className="drilling-options">
                <button className={config.apronFront ? "active-small" : ""} disabled title="Obligatoire">Avant</button>
                <button className={config.apronLeft ? "active-small" : ""} onClick={() => toggleApronSide('apronLeft')} disabled={config.rimLeft} title={config.rimLeft ? "Désactivé car un dosseret est présent" : ""}>Gauche</button>
                <button className={config.apronBack ? "active-small" : ""} onClick={() => toggleApronSide('apronBack')} disabled={config.rimBack} title={config.rimBack ? "Désactivé car un dosseret est présent" : ""}>Fond</button>
                <button className={config.apronRight ? "active-small" : ""} onClick={() => toggleApronSide('apronRight')} disabled={config.rimRight} title={config.rimRight ? "Désactivé car un dosseret est présent" : ""}>Droite</button>
            </div>
            <p style={{fontSize:'0.75rem', color:'#888', marginTop:'5px'}}>* Une face ne peut avoir à la fois un dosseret et une retombée.</p>
          </div>
        )}
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={() => setShowModal(true)}>
          Voir Rendu 3D
        </button>
        <button className="btn-primary" onClick={handleCheckout}>
          Commander • 950.00 €
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;