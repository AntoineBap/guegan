import React, { useEffect, useMemo } from "react";
import ConfigResume from "./ConfigResume";
import "../styles/style.scss";

const ConfigPanel = ({ config, setConfig, setShowModal }) => {
  const DRAINER_PRICE = 50;
  const DRAINER_WIDTH_MM = 350; 
  const MIN_GAP_BETWEEN_SINKS = 40; 
  const MARGIN_PLAN_EDGE = 100; // Marge minimale aux extrémités du plan
  const SINK_DEFAULT_SIZE = 400; // Pour tester si une nouvelle cuve rentre

  const SINK_SPECS = {
    "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300, price: 520 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200, price: 490 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180, price: 540 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139, price: 330 },
  };

  // --- INITIALISATION ---
  useEffect(() => {
    if (!config.aprons || !config.apronFront) {
      setConfig((prev) => ({
        ...prev,
        aprons: true,
        apronFront: true,
        apronHeight: prev.apronHeight || 40,
      }));
    }

    if (!config.sinks) {
      setConfig((prev) => ({
        ...prev,
        sinks: [
          {
            id: Date.now(),
            type: prev.sink || "Aucune cuve",
            position: prev.position || "center",
            offset: prev.sinkOffset || 100,
            hasTapHole: prev.hasTapHole || false,
            tapHolePosition: prev.tapHole || "none",
            tapHoleOffset: prev.tapHoleOffset || 50,
            hasDrainer: prev.hasDrainer || false,
            drainerPosition: prev.drainerPosition || "right",
          },
        ],
      }));
    }
  }, [config.sinks, config.aprons, config.apronFront, setConfig]);

  const currentSinks = config.sinks || [];
  const hasAtLeastOneSink = currentSinks.some((s) => s.type !== "Aucune cuve");

  // --- 1. CALCUL PRÉCIS DE LA POSITION DES CUVES (LAYOUT ENGINE) ---
  const layout = useMemo(() => {
      const items = currentSinks.map(s => {
         const w = SINK_SPECS[s.type]?.l || 0;
         return { ...s, width: w };
      });

      const positions = [];
      const planHalfL = config.length / 2;

      // Positionnement Cuve 1 (Ancre)
      let firstItem = items[0];
      let x1 = 0; 

      if (firstItem) {
          if (firstItem.position === "center") {
              x1 = 0;
          } else if (firstItem.position === "left") {
              // Bord Gauche Cuve = -Plan/2 + Offset
              // Centre = Bord Gauche + W/2
              x1 = -planHalfL + (firstItem.offset || 100) + firstItem.width / 2;
          } else if (firstItem.position === "right") {
              // Bord Droit Cuve = Plan/2 - Offset
              // Centre = Bord Droit - W/2
              x1 = planHalfL - (firstItem.offset || 100) - firstItem.width / 2;
          }
          
          let lb = x1 - firstItem.width/2;
          let rb = x1 + firstItem.width/2;
          // Extension si égouttoir
          if (firstItem.hasDrainer && firstItem.drainerPosition === 'left') lb -= DRAINER_WIDTH_MM;
          if (firstItem.hasDrainer && firstItem.drainerPosition === 'right') rb += DRAINER_WIDTH_MM;

          positions.push({ ...firstItem, centerX: x1, leftBound: lb, rightBound: rb });
      }

      // Positionnement Chaîne (Cuves suivantes)
      for (let i = 1; i < items.length; i++) {
          const prev = positions[i-1];
          const curr = items[i];
          
          let minGap = MIN_GAP_BETWEEN_SINKS;
          if (prev.hasDrainer && prev.drainerPosition === 'right') minGap += DRAINER_WIDTH_MM;
          if (curr.hasDrainer && curr.drainerPosition === 'left') minGap += DRAINER_WIDTH_MM;

          // Centre = CentrePrec + DemiWPrec + Gap + OffsetUtilisateur + DemiWCurr
          const dist = (prev.width / 2) + minGap + (curr.offset || 0) + (curr.width / 2);
          const x = prev.centerX + dist;

          let lb = x - curr.width/2;
          let rb = x + curr.width/2;
          if (curr.hasDrainer && curr.drainerPosition === 'left') lb -= DRAINER_WIDTH_MM;
          if (curr.hasDrainer && curr.drainerPosition === 'right') rb += DRAINER_WIDTH_MM;

          positions.push({ ...curr, centerX: x, leftBound: lb, rightBound: rb });
      }

      const groupMinX = positions.length > 0 ? positions[0].leftBound : 0;
      const groupMaxX = positions.length > 0 ? positions[positions.length - 1].rightBound : 0;

      return { items: positions, groupMinX, groupMaxX };
  }, [currentSinks, config.length]);

  // --- 2. CALCUL DISPONIBILITÉ AJOUT (INTELLIGENT) ---
  const planHalfLength = config.length / 2;
  // Limites physiques utilisables (Bornes du plan - Marge de sécurité)
  const absLimitLeft = -planHalfLength + MARGIN_PLAN_EDGE;
  const absLimitRight = planHalfLength - MARGIN_PLAN_EDGE;

  // Espace libre à gauche du groupe
  // (Bord Gauche Groupe) - (Limite Gauche Plan)
  const spaceAvailableLeft = layout.groupMinX - absLimitLeft;
  
  // Espace libre à droite du groupe
  // (Limite Droite Plan) - (Bord Droit Groupe)
  const spaceAvailableRight = absLimitRight - layout.groupMaxX;

  // Espace requis pour ajouter une nouvelle cuve standard + son gap technique
  const SPACE_REQ_NEW = SINK_DEFAULT_SIZE + MIN_GAP_BETWEEN_SINKS;

  const canAddSinkLeft = spaceAvailableLeft >= SPACE_REQ_NEW;
  const canAddSinkRight = spaceAvailableRight >= SPACE_REQ_NEW;

  // --- MIN / MAX PLAN (UNCHANGED) ---
  const { minPlanLength, minPlanDepth } = useMemo(() => {
    let totalL = 0;
    let maxW = 0;
    currentSinks.forEach((s, i) => {
        if (s.type === "Aucune cuve") return;
        const spec = SINK_SPECS[s.type];
        if (spec.w > maxW) maxW = spec.w;
        let itemL = spec.l;
        if (s.hasDrainer) itemL += DRAINER_WIDTH_MM;
        totalL += itemL;
        if (i < currentSinks.length - 1) totalL += MIN_GAP_BETWEEN_SINKS;
    });
    const computedMinLen = Math.max(600, totalL + MARGIN_PLAN_EDGE * 2);
    const computedMinDep = Math.max(400, maxW + 160);
    return { minPlanLength: computedMinLen, minPlanDepth: computedMinDep };
  }, [currentSinks]);

  const maxPlanLength = 3600;
  const maxPlanDepth = 700;

  // --- HANDLERS ---
  const handleGlobalChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "rims" && checked) {
        setConfig(prev => ({ ...prev, rims: true, rimHeigh: 100 }));
        return;
    }
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) : value),
    }));
  };

  const handleBlur = (e) => {
      const { name, value, min, max } = e.target;
      const val = parseFloat(value);
      if (isNaN(val)) return;
      if (min && val < parseFloat(min)) setConfig(p => ({...p, [name]: parseFloat(min)}));
      if (max && val > parseFloat(max)) setConfig(p => ({...p, [name]: parseFloat(max)}));
  };

  const updateSink = (id, field, value) => {
    setConfig(prev => ({
        ...prev,
        sinks: prev.sinks.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // HANDLER EGOUTTOIR INTELLIGENT (CHECK SPACE PER SINK)
  const handleDrainerCheck = (id, isChecked, index) => {
      if (!isChecked) {
          updateSink(id, "hasDrainer", false);
          return;
      }

      // Check spécifique pour CETTE cuve
      const myPos = layout.items[index];
      if (!myPos) return;

      // Espace Gauche dispo pour cette cuve = (Bord Gauche Cuve) - (Obstacle Gauche)
      const obstacleL = index === 0 ? absLimitLeft : layout.items[index-1].rightBound;
      const distL = myPos.leftBound - obstacleL;
      const canL = distL >= DRAINER_WIDTH_MM;

      // Espace Droite dispo
      const obstacleR = index === currentSinks.length-1 ? absLimitRight : layout.items[index+1].leftBound;
      const distR = obstacleR - myPos.rightBound;
      const canR = distR >= DRAINER_WIDTH_MM;

      if (canL && canR) updateSink(id, "drainerPosition", "left");
      else if (canL) updateSink(id, "drainerPosition", "left");
      else if (canR) updateSink(id, "drainerPosition", "right");
      else {
          alert("Pas assez de place (350mm requis) à gauche ou à droite de cette cuve.");
          return;
      }
      updateSink(id, "hasDrainer", true);
  };

  const handleSinkTypeSelect = (id, typeName) => {
      const specs = SINK_SPECS[typeName];
      if(id === currentSinks[0].id) {
         const requiredMinDepth = typeName === "Aucune cuve" ? 400 : specs.w + 160;
         setConfig(prev => ({ ...prev, width: prev.width < requiredMinDepth ? requiredMinDepth : prev.width }));
      }
      updateSink(id, "type", typeName);
      if (typeName === "Aucune cuve") {
          setConfig(prev => ({
             ...prev,
             sinks: prev.sinks.map(s => s.id === id ? { ...s, type: typeName, hasTapHole: false, hasDrainer: false } : s)
          }));
      }
  };

  // --- SMART ADD NEW SINK ---
  const addNewSink = (side) => {
      const newSink = {
          id: Date.now(),
          type: "Cuve Labo 400x400x300", 
          hasTapHole: false,
          tapHolePosition: "center",
          tapHoleOffset: 0,
          hasDrainer: false,
          drainerPosition: "right",
          offset: 0 
      };
      
      setConfig(prev => {
          let newSinks = [...prev.sinks];
          
          if (side === "left") {
            // AJOUT GAUCHE : On insère au début.
            // On veut que l'ancienne cuve 1 (qui devient 2) ne BOUGE PAS visuellement.
            // Pour ça, il faut que la nouvelle cuve (Ancre) soit positionnée 
            // exactement là où elle doit être pour que le gap soit respecté.
            
            const oldHead = newSinks[0]; // Ancienne ancre
            
            // Calcul de la position actuelle du bord gauche de l'ancienne ancre
            // Note : layoutMetrics est calculé AVANT cet ajout. On peut s'en servir.
            const oldHeadLayout = layout.items[0]; 
            const oldHeadLeftEdge = oldHeadLayout.leftBound; // Position absolue du bord gauche actuel (ex: -200)

            // On veut placer la nouvelle cuve à gauche de ça.
            // Nouvelle Cuve Droite = OldHeadLeftEdge - GAP
            // Nouvelle Cuve Gauche = Nouvelle Cuve Droite - NewWidth
            // Nouvelle Cuve Center = ...
            
            // Gap requis entre nouvelle et ancienne
            // (On suppose pas d'égouttoir sur la nouvelle par défaut)
            let gap = MIN_GAP_BETWEEN_SINKS;
            if (oldHead.hasDrainer && oldHead.drainerPosition === 'left') gap += DRAINER_WIDTH_MM;

            // Position Bord Gauche de la NOUVELLE cuve
            // = (Bord Gauche Ancienne) - gap - (Largeur Nouvelle)
            const newSinkWidth = SINK_SPECS[newSink.type].l;
            let targetLeftEdge = oldHeadLeftEdge - gap - newSinkWidth;

            // Sécurité : Est-ce que ça sort du plan ?
            // absLimitLeft est la limite gauche (-L/2 + Marge)
            // Si targetLeftEdge < absLimitLeft, on doit coller au bord gauche (et l'autre bougera tant pis, ou c'est impossible)
            // Mais canAddSinkLeft a déjà vérifié l'espace global. Donc normalement ça rentre.
            if (targetLeftEdge < absLimitLeft) targetLeftEdge = absLimitLeft;

            // Maintenant on configure la nouvelle cuve comme ANCRE (Position Left)
            // Offset = Distance(Bord Plan Gauche, Bord Gauche Nouvelle Cuve)
            // Bord Plan Gauche = -L/2
            // Offset = targetLeftEdge - (-L/2)
            const newOffset = targetLeftEdge - (-config.length/2);

            const newHead = { 
                ...newSink, 
                position: "left", 
                offset: Math.max(newOffset, MARGIN_PLAN_EDGE)
            };
            
            // L'ancienne ancre perd son statut absolu et devient relative (offset 0 par défaut)
            const oldHeadRel = { ...oldHead, offset: 0 };
            
            newSinks = [newHead, oldHeadRel, ...newSinks.slice(1)];

          } else {
            // AJOUT DROITE : Simple push, pas de changement d'ancre
            newSinks = [...newSinks, newSink];
          }
          return { ...prev, sinks: newSinks };
      });
  };

  const removeSink = (id) => {
      setConfig(prev => {
          const newSinks = prev.sinks.filter(s => s.id !== id);
          if(prev.sinks[0].id === id && newSinks.length > 0) {
             // Si on supprime l'ancre, le suivant devient ancre.
             // On lui donne un offset par défaut ou on essaie de garder sa pos ?
             // Par simplicité : centré par défaut ou left 100
             newSinks[0] = { ...newSinks[0], position: "center", offset: 100 };
          }
          if (newSinks.length === 0) return { ...prev, sinks: [{ id: Date.now(), type: "Aucune cuve", position: "center", offset: 100 }] };
          return { ...prev, sinks: newSinks };
      });
  };

  const toggleRimSide = (k) => setConfig(p => ({ ...p, [k]: !p[k] }));
  const toggleApronSide = (k) => setConfig(p => ({ ...p, [k]: !p[k] }));

  const calculatePrice = () => {
    const surfaceM2 = (config.length * config.width) / 1000000;
    let total = Math.round(219.3 * surfaceM2 + 447.37);
    currentSinks.forEach(sink => {
        const spec = SINK_SPECS[sink.type];
        if (spec) total += spec.price;
        if (sink.hasTapHole && sink.tapHolePosition !== "none") total += 15;
        if (sink.hasDrainer) total += DRAINER_PRICE;
    });
    // ... calculs linéaires inchangés
    const getLinearPartPrice = (heightMm, lengthMm) => {
        if (!heightMm || heightMm <= 17.6) return 0;
        const pricePerMeter = 53.6 * Math.log(heightMm - 17.6) - 86.4;
        return Math.round(Math.max(0, pricePerMeter) * (lengthMm / 1000));
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

  return (
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
            <div className="limit-label">Min: {minPlanLength} / Max: {maxPlanLength}</div>
            <span>Largeur (mm)</span>
            <input type="number" name="length" value={config.length} onChange={handleGlobalChange} onBlur={handleBlur} min={minPlanLength} max={maxPlanLength} step="10" />
          </div>
          <div>
            <div className="limit-label">Min: {minPlanDepth} / Max: {maxPlanDepth}</div>
            <span>Profondeur (mm)</span>
            <input type="number" name="width" value={config.width} onChange={handleGlobalChange} onBlur={handleBlur} min={minPlanDepth} max={maxPlanDepth} step="10" />
          </div>
        </div>
      </div>

      {currentSinks.map((sink, index) => {
          const isFirst = index === 0;
          const isNoSink = sink.type === "Aucune cuve";
          const isMulti = currentSinks.length > 1;
          const currentPos = layout.items[index];

          // -- LIMITES OFFSET --
          let minOffset = 0; 
          let maxOffset = 0;

          if (isFirst) {
              // ANCRE (Cuve 1)
              // Min = Marge + Égouttoir éventuel du côté ancré
              minOffset = MARGIN_PLAN_EDGE;
              if (sink.position === 'left' && sink.hasDrainer && sink.drainerPosition === 'left') minOffset += DRAINER_WIDTH_MM;
              if (sink.position === 'right' && sink.hasDrainer && sink.drainerPosition === 'right') minOffset += DRAINER_WIDTH_MM;
              
              // Max = Jusqu'au centre
              maxOffset = (config.length/2) - (sink.width || 400)/2;
              if (maxOffset < minOffset) maxOffset = minOffset; 
          } else {
              // RELATIF (Cuves suivantes)
              minOffset = 0;
              // Max = Espace dispo à droite jusqu'au bord
              // Bord Droit Plan - Bord Droit Actuel + Mon Offset
              const distToRightEdge = absLimitRight - (currentPos ? currentPos.rightBound : 0);
              maxOffset = (sink.offset || 0) + distToRightEdge;
          }

          // -- DISPONIBILITÉ EGOUTTOIR --
          const obstacleL = index === 0 ? absLimitLeft : layout.items[index-1].rightBound;
          const distL = currentPos ? (currentPos.leftBound - obstacleL) : 0;
          const canL = distL >= (DRAINER_WIDTH_MM - 10); // Tolérance de 10mm

          const obstacleR = index === currentSinks.length-1 ? absLimitRight : layout.items[index+1].leftBound;
          const distR = currentPos ? (obstacleR - currentPos.rightBound) : 0;
          const canR = distR >= (DRAINER_WIDTH_MM - 10);

          return (
            <div key={sink.id} className="form-group section-box" style={{borderLeft: "4px solid #d4af37"}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label className="section-title">{isMulti ? `Cuve #${index + 1}` : "Choix de la cuve"}</label>
                    {isMulti && (
                        <button onClick={() => removeSink(sink.id)} style={{fontSize:'0.8rem', color:'red', border:'none', background:'transparent', cursor:'pointer'}}>Supprimer 🗑️</button>
                    )}
                </div>

                <div className="sink-options-list">
                  {Object.keys(SINK_SPECS).map((opt) => (
                    <button key={opt} className={sink.type === opt ? "active-small" : ""} onClick={() => handleSinkTypeSelect(sink.id, opt)}>
                      {opt === "Aucune cuve" ? "Aucune" : opt.replace("Cuve ", "")}
                    </button>
                  ))}
                </div>

                {!isNoSink && (
                  <>
                    <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>

                    {isFirst ? (
                        <>
                        <label className="section-title">Positionnement (Ancrage)</label>
                        <div className="inputs-row" style={{ alignItems: "flex-end" }}>
                            <div className="drilling-options" style={{ marginRight: "15px", marginBottom: "5px" }}>
                                <button className={sink.position === "left" ? "active-small" : ""} onClick={() => updateSink(sink.id, "position", "left")}>Gauche</button>
                                <button className={sink.position === "center" ? "active-small" : ""} onClick={() => updateSink(sink.id, "position", "center")}>Centré</button>
                                <button className={sink.position === "right" ? "active-small" : ""} onClick={() => updateSink(sink.id, "position", "right")}>Droite</button>
                            </div>
                            {(sink.position !== "center") && (
                                <div style={{ display: "flex", flexDirection: "column", marginLeft: "15px", flex: 1 }}>
                                    <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>
                                        Décalage Bord (min: {minOffset})
                                    </span>
                                    <input
                                        type="number"
                                        value={sink.offset}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value);
                                            if (val < minOffset) val = minOffset;
                                            if (val > maxOffset) val = maxOffset;
                                            updateSink(sink.id, "offset", val);
                                        }}
                                        min={minOffset} max={maxOffset} step="10"
                                    />
                                    <span style={{fontSize:'0.65rem', color:'#999'}}>Max: {Math.floor(maxOffset)}</span>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <>
                        <label className="section-title">Positionnement Relatif</label>
                        <div style={{ display: "flex", flexDirection: "column", marginTop:'10px' }}>
                             <span style={{ fontSize: "0.9rem", color: "#333", marginBottom: "5px" }}>
                                Espace supp. depuis cuve précédente
                             </span>
                             <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                 <input
                                    type="number"
                                    style={{width:'100px'}}
                                    value={sink.offset}
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value);
                                        if (val < minOffset) val = minOffset;
                                        if (val > maxOffset) val = maxOffset;
                                        updateSink(sink.id, "offset", val);
                                    }}
                                    min={minOffset} max={maxOffset} step="10"
                                />
                                <span style={{fontSize:'0.8rem', color:'#666'}}>
                                    (+ {MIN_GAP_BETWEEN_SINKS}mm technique)
                                </span>
                             </div>
                        </div>
                        </>
                    )}

                    <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>

                    <div className="checkbox-group">
                        <label style={{ marginBottom: "15px", fontWeight: "bold" }}>
                            <input type="checkbox" checked={sink.hasTapHole} onChange={(e) => updateSink(sink.id, "hasTapHole", e.target.checked)} /> Perçage robinetterie (+15€)
                        </label>
                        {sink.hasTapHole && (
                            <div className="drilling-options" style={{ marginBottom: "15px", marginLeft:'25px' }}>
                                {["left", "center", "right"].map((opt) => (
                                <button key={opt} className={sink.tapHolePosition === opt ? "active-small" : ""} onClick={() => updateSink(sink.id, "tapHolePosition", opt)}>{opt}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>
                    
                    <div className="checkbox-group">
                        <label style={{ marginBottom: "10px", fontWeight: "bold", opacity: (!canL && !canR && !sink.hasDrainer) ? 0.5 : 1 }}>
                            <input 
                                type="checkbox" 
                                checked={sink.hasDrainer} 
                                onChange={(e) => handleDrainerCheck(sink.id, e.target.checked, index)}
                                disabled={!canL && !canR && !sink.hasDrainer}
                            /> 
                            Rainurage Égouttoir (+50€)
                        </label>

                        {(!canL && !canR && !sink.hasDrainer) && (
                            <div style={{fontSize:'0.8rem', color:'#999', marginLeft:'25px'}}>
                                Pas assez d'espace (min 350mm) à gauche ou à droite.
                            </div>
                        )}

                        {sink.hasDrainer && (
                            <div className="fade-in drilling-options" style={{ marginTop: "10px", marginLeft: "25px" }}>
                                <button
                                    className={sink.drainerPosition === "left" ? "active-small" : ""}
                                    onClick={() => updateSink(sink.id, "drainerPosition", "left")}
                                    disabled={!canL}
                                    style={!canL ? {opacity:0.5, cursor:'not-allowed'} : {}}
                                >À Gauche</button>
                                <button
                                    className={sink.drainerPosition === "right" ? "active-small" : ""}
                                    onClick={() => updateSink(sink.id, "drainerPosition", "right")}
                                    disabled={!canR}
                                    style={!canR ? {opacity:0.5, cursor:'not-allowed'} : {}}
                                >À Droite</button>
                            </div>
                        )}
                    </div>
                  </>
                )}
            </div>
          );
      })}

      {hasAtLeastOneSink && (
          <div className="form-group" style={{textAlign:'center', margin:'20px 0'}}>
              <span style={{display:'block', marginBottom:'10px', fontWeight:'bold'}}>Ajouter une cuve ?</span>
              <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                <button 
                    className="btn-secondary" 
                    onClick={() => addNewSink('left')}
                    disabled={!canAddSinkLeft}
                    style={!canAddSinkLeft ? {opacity:0.5, cursor:'not-allowed'} : {}}
                    title={!canAddSinkLeft ? "Pas assez de place à gauche" : ""}
                >
                    + Ajouter à Gauche
                </button>
                <button 
                    className="btn-secondary" 
                    onClick={() => addNewSink('right')}
                    disabled={!canAddSinkRight}
                    style={!canAddSinkRight ? {opacity:0.5, cursor:'not-allowed'} : {}}
                    title={!canAddSinkRight ? "Pas assez de place à droite" : ""}
                >
                    + Ajouter à Droite
                </button>
              </div>
          </div>
      )}

      {/* OPTIONS GLOBALES */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="rims" checked={config.rims} onChange={handleGlobalChange} /> Ajouter dosserets</label>
        {config.rims && (
          <div className="rims-options-container" style={{ marginTop: "10px" }}>
            <input type="number" className="small-input" name="rimHeigh" value={config.rimHeigh} onChange={handleGlobalChange} onBlur={handleBlur} min="50" max="550" />
            <div className="drilling-options">
              <button className={config.rimLeft?"active-small":""} onClick={()=>toggleRimSide("rimLeft")}>G</button>
              <button className={config.rimBack?"active-small":""} onClick={()=>toggleRimSide("rimBack")}>Arr</button>
              <button className={config.rimRight?"active-small":""} onClick={()=>toggleRimSide("rimRight")}>D</button>
            </div>
          </div>
        )}
      </div>

      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="aprons" checked={true} disabled readOnly /> Retombées (Obligatoire)</label>
        <div className="rims-options-container" style={{ marginTop: "10px" }}>
          <input type="number" className="small-input" name="apronHeight" value={config.apronHeight || 40} onChange={handleGlobalChange} onBlur={handleBlur} min="40" max="200" />
          <div className="drilling-options">
            <button className={config.apronFront?"active-small":""} disabled>Av</button>
            <button className={config.apronLeft?"active-small":""} onClick={()=>toggleApronSide("apronLeft")}>G</button>
            <button className={config.apronBack?"active-small":""} onClick={()=>toggleApronSide("apronBack")}>Arr</button>
            <button className={config.apronRight?"active-small":""} onClick={()=>toggleApronSide("apronRight")}>D</button>
          </div>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="splashback" checked={config.splashback} onChange={handleGlobalChange} /> Goutte d'eau</label>
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={() => setShowModal(true)}>Voir Rendu 3D</button>
      </div>

      <ConfigResume
        config={config}
        handleAddToCart={() => alert(`Produit ajouté au panier pour ${totalPrice} € HT`)}
        currentSink={currentSinks.length > 1 ? "Composition Multi-cuves" : (currentSinks[0]?.type || "Aucune")}
      />
    </div>
  );
};

export default ConfigPanel;