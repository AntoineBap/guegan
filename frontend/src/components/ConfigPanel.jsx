import React, { useEffect, useMemo } from "react";
import ConfigResume from "./ConfigResume";
import "../styles/style.scss";

const ConfigPanel = ({ config, setConfig, setShowModal }) => {
  const DRAINER_PRICE = 50;
  const DRAINER_WIDTH_MM = 350; 
  const MIN_GAP_BETWEEN_SINKS = 40; 
  const MARGIN_PLAN_EDGE = 100; 
  const SINK_DEFAULT_SIZE = 400; 

  const SINK_SPECS = {
    "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300, price: 520 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200, price: 490 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180, price: 540 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139, price: 330 },
  };

  useEffect(() => {
    // Initialisation Retombées (Aprons)
    if (!config.aprons || !config.apronFront) {
      setConfig((prev) => ({
        ...prev,
        aprons: true,
        apronFront: true,
        apronHeight: prev.apronHeight && prev.apronHeight >= 40 ? prev.apronHeight : 40,
      }));
    }

    // Initialisation Dosserets (Rims)
    if (config.rims && (!config.rimHeigh || config.rimHeigh < 100)) {
       setConfig((prev) => ({ ...prev, rimHeigh: 100 }));
    }

    if (!config.sinks) {
        const firstId = Date.now();
        setConfig((prev) => ({
          ...prev,
          anchorId: firstId,
          sinks: [
            {
              id: firstId,
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
    } else if (!config.anchorId && config.sinks.length > 0) {
        setConfig(prev => ({ ...prev, anchorId: prev.sinks[0].id }));
    }
  }, [config.sinks, config.aprons, config.apronFront, config.rims, config.rimHeigh, config.apronHeight, config.anchorId, setConfig]);

  const currentSinks = config.sinks || [];
  const hasAtLeastOneSink = currentSinks.some((s) => s.type !== "Aucune cuve");

  // --- 1. CALCUL DE L'ENCOMBREMENT RELATIF ---
  const layoutDimensions = useMemo(() => {
      const items = currentSinks.map(s => ({ ...s, width: SINK_SPECS[s.type]?.l || 0 }));
      if (items.length === 0 || items[0].type === "Aucune cuve") {
          return { leftWidth: 0, rightWidth: 0, totalWidth: 0 };
      }

      const anchorIndex = currentSinks.findIndex(s => s.id === config.anchorId);
      const effectiveAnchorIndex = anchorIndex === -1 ? 0 : anchorIndex;

      const positions = new Array(items.length).fill(null);

      // A. Place l'Ancre
      const anchorItem = items[effectiveAnchorIndex];
      let lbAnchor = -anchorItem.width / 2;
      let rbAnchor = anchorItem.width / 2;
      
      if (anchorItem.hasDrainer && anchorItem.drainerPosition === 'left') lbAnchor -= DRAINER_WIDTH_MM;
      if (anchorItem.hasDrainer && anchorItem.drainerPosition === 'right') rbAnchor += DRAINER_WIDTH_MM;
      
      positions[effectiveAnchorIndex] = { centerX: 0, lb: lbAnchor, rb: rbAnchor };

      // B. Propagation vers la DROITE
      for (let i = effectiveAnchorIndex + 1; i < items.length; i++) {
          const prev = (i === effectiveAnchorIndex + 1) ? positions[effectiveAnchorIndex] : positions[i-1];
          const prevItem = items[i-1];
          const currItem = items[i];
          
          let extraDrainerGap = 0;
          if (prevItem.hasDrainer && prevItem.drainerPosition === 'right') extraDrainerGap += DRAINER_WIDTH_MM;
          if (currItem.hasDrainer && currItem.drainerPosition === 'left') extraDrainerGap += DRAINER_WIDTH_MM;

          const structuralGap = (currItem.offset !== undefined && currItem.offset !== null) ? currItem.offset : MIN_GAP_BETWEEN_SINKS;

          const dist = (prevItem.width / 2) + structuralGap + extraDrainerGap + (currItem.width / 2);
          const x = prev.centerX + dist;
          
          let lb = x - currItem.width/2;
          let rb = x + currItem.width/2;
          if (currItem.hasDrainer && currItem.drainerPosition === 'left') lb -= DRAINER_WIDTH_MM;
          if (currItem.hasDrainer && currItem.drainerPosition === 'right') rb += DRAINER_WIDTH_MM;

          positions[i] = { centerX: x, lb, rb };
      }

      // C. Propagation vers la GAUCHE
      for (let i = effectiveAnchorIndex - 1; i >= 0; i--) {
          const nextPos = positions[i+1]; 
          const nextItem = items[i+1];    
          const currItem = items[i];      

          const structuralGap = (currItem.offset !== undefined && currItem.offset !== null) ? currItem.offset : MIN_GAP_BETWEEN_SINKS;

          let extraDrainerGap = 0;
          if (currItem.hasDrainer && currItem.drainerPosition === 'right') extraDrainerGap += DRAINER_WIDTH_MM;
          if (nextItem.hasDrainer && nextItem.drainerPosition === 'left') extraDrainerGap += DRAINER_WIDTH_MM;

          const dist = (currItem.width / 2) + structuralGap + extraDrainerGap + (nextItem.width / 2);
          const x = nextPos.centerX - dist;

          let lb = x - currItem.width/2;
          let rb = x + currItem.width/2;
          if (currItem.hasDrainer && currItem.drainerPosition === 'left') lb -= DRAINER_WIDTH_MM;
          if (currItem.hasDrainer && currItem.drainerPosition === 'right') rb += DRAINER_WIDTH_MM;

          positions[i] = { centerX: x, lb, rb };
      }

      const minX = Math.min(...positions.map(p => p.lb));
      const maxX = Math.max(...positions.map(p => p.rb));

      const leftWidth = Math.abs(minX);
      const rightWidth = maxX;

      return { leftWidth, rightWidth, totalWidth: leftWidth + rightWidth, positionsRelative: positions };
  }, [currentSinks, config.anchorId]);

  // --- 2. LAYOUT VISUEL ---
  const layout = useMemo(() => {
      const { positionsRelative } = layoutDimensions;
      if (!positionsRelative) return { items: [], groupMinX: 0, groupMaxX: 0 };

      const planHalfL = config.length / 2;
      const anchorIndex = currentSinks.findIndex(s => s.id === config.anchorId);
      const anchorItem = currentSinks[anchorIndex !== -1 ? anchorIndex : 0];
      
      let anchorAbsX = 0;

      if (anchorItem && anchorItem.type !== "Aucune cuve") {
          const w = SINK_SPECS[anchorItem.type]?.l || 0;
          if (anchorItem.position === "center") {
              anchorAbsX = 0;
          } else if (anchorItem.position === "left") {
              anchorAbsX = -planHalfL + (anchorItem.offset || 100) + w / 2;
          } else if (anchorItem.position === "right") {
              anchorAbsX = planHalfL - (anchorItem.offset || 100) - w / 2;
          }
      }

      const items = positionsRelative.map((pos, idx) => ({
          ...currentSinks[idx], 
          width: SINK_SPECS[currentSinks[idx].type]?.l || 0,
          centerX: pos.centerX + anchorAbsX,
          leftBound: pos.lb + anchorAbsX,
          rightBound: pos.rb + anchorAbsX
      }));

      const groupMinX = items.length > 0 ? items[0].leftBound : 0;
      const groupMaxX = items.length > 0 ? items[items.length - 1].rightBound : 0;

      return { items, groupMinX, groupMaxX };
  }, [currentSinks, config.length, layoutDimensions, config.anchorId]);

  // --- 3. LIMITES D'AJOUT ---
  const planHalfLength = config.length / 2;
  const absLimitLeft = -planHalfLength + MARGIN_PLAN_EDGE;
  const absLimitRight = planHalfLength - MARGIN_PLAN_EDGE;
  const spaceAvailableLeft = layout.groupMinX - absLimitLeft;
  const spaceAvailableRight = absLimitRight - layout.groupMaxX;
  const SPACE_REQ_NEW = SINK_DEFAULT_SIZE + MIN_GAP_BETWEEN_SINKS;
  const canAddSinkLeft = spaceAvailableLeft >= SPACE_REQ_NEW;
  const canAddSinkRight = spaceAvailableRight >= SPACE_REQ_NEW;

  // --- 4. CALCUL MIN PLAN ---
  const { minPlanLength, minPlanDepth } = useMemo(() => {
    const mechanicalMinLen = layoutDimensions.totalWidth + MARGIN_PLAN_EDGE * 2;
    const anchorIndex = currentSinks.findIndex(s => s.id === config.anchorId);
    const anchorItem = currentSinks[anchorIndex !== -1 ? anchorIndex : 0];
    
    let situationalMinLen = mechanicalMinLen;

    if (anchorItem && anchorItem.type !== "Aucune cuve") {
        if (anchorItem.position === "center") {
            const maxSideFromCenter = Math.max(layoutDimensions.leftWidth, layoutDimensions.rightWidth);
            situationalMinLen = (maxSideFromCenter + MARGIN_PLAN_EDGE) * 2;
        } else if (anchorItem.position === "left") {
            const currentOffset = anchorItem.offset || MARGIN_PLAN_EDGE;
            situationalMinLen = currentOffset + layoutDimensions.rightWidth + MARGIN_PLAN_EDGE;
        } else if (anchorItem.position === "right") {
            const currentOffset = anchorItem.offset || MARGIN_PLAN_EDGE;
            situationalMinLen = currentOffset + layoutDimensions.leftWidth + MARGIN_PLAN_EDGE;
        }
    }

    const computedMinLen = Math.max(600, mechanicalMinLen, situationalMinLen);
    
    let maxW = 0;
    currentSinks.forEach(s => {
       if (s.type === "Aucune cuve") return;
       const spec = SINK_SPECS[s.type];
       if (spec.w > maxW) maxW = spec.w;
    });
    const computedMinDep = Math.max(400, maxW + 160);

    return { minPlanLength: computedMinLen, minPlanDepth: computedMinDep };
  }, [currentSinks, layoutDimensions, config.anchorId]);

  const maxPlanLength = 3600;
  const maxPlanDepth = 700;

  // HANDLERS
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

  const handlePositionChange = (sinkId, newPosition, sinkSpecWidth) => {
      const { leftWidth, rightWidth } = layoutDimensions;
      const halfW = sinkSpecWidth / 2;
      let newOffset = 100;

      if (newPosition === 'left') {
           newOffset = MARGIN_PLAN_EDGE + (leftWidth - halfW);
      } else if (newPosition === 'right') {
           newOffset = MARGIN_PLAN_EDGE + (rightWidth - halfW);
      } else {
           newOffset = 100;
      }
      
      if(isNaN(newOffset)) newOffset = 100;
      newOffset = Math.ceil(newOffset);

      setConfig(prev => ({
          ...prev,
          sinks: prev.sinks.map(s => s.id === sinkId ? { ...s, position: newPosition, offset: newOffset } : s)
      }));
  };

  const handleDrainerCheck = (id, isChecked, index) => {
      if (!isChecked) {
          updateSink(id, "hasDrainer", false);
          return;
      }
      const myPos = layout.items[index];
      if (!myPos) return;
      const obstacleL = index === 0 ? absLimitLeft : layout.items[index-1].rightBound;
      const distL = myPos.leftBound - obstacleL;
      const canL = distL >= DRAINER_WIDTH_MM;
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

  const addNewSink = (side) => {
      const newSink = {
          id: Date.now(),
          type: "Cuve Labo 400x400x300", 
          hasTapHole: false,
          tapHolePosition: "center",
          tapHoleOffset: 0,
          hasDrainer: false,
          drainerPosition: "right",
          offset: MIN_GAP_BETWEEN_SINKS 
      };
      
      setConfig(prev => {
          let newSinks = [...prev.sinks];
          if (side === "left") {
            newSinks = [newSink, ...newSinks];
          } else {
            newSinks = [...newSinks, newSink];
          }
          return { ...prev, sinks: newSinks };
      });
  };

  const removeSink = (id) => {
      setConfig(prev => {
          const newSinks = prev.sinks.filter(s => s.id !== id);
          let newAnchorId = prev.anchorId;

          if (id === prev.anchorId) {
              if (newSinks.length > 0) {
                  newAnchorId = newSinks[0].id;
                  newSinks[0] = { ...newSinks[0], position: "center", offset: 100 };
              } else {
                  const newId = Date.now();
                  newSinks.push({ id: newId, type: "Aucune cuve", position: "center", offset: 100 });
                  newAnchorId = newId;
              }
          }
          return { ...prev, sinks: newSinks, anchorId: newAnchorId };
      });
  };

  const toggleRimSide = (side) => {
      setConfig(prev => ({ ...prev, [side]: !prev[side] }));
  };

  const toggleApronSide = (side) => {
      setConfig(prev => ({ ...prev, [side]: !prev[side] }));
  };

  const isRimDisabled = (side) => {
      if (side === "rimLeft") return config.apronLeft;
      if (side === "rimRight") return config.apronRight;
      if (side === "rimBack") return config.apronBack;
      return false;
  };

  const isApronDisabled = (side) => {
      if (side === "apronLeft") return config.rimLeft;
      if (side === "apronRight") return config.rimRight;
      if (side === "apronBack") return config.rimBack;
      return false;
  };

  const calculatePrice = () => {
    const surfaceM2 = (config.length * config.width) / 1000000;
    let total = Math.round(219.3 * surfaceM2 + 447.37);
    currentSinks.forEach(sink => {
        const spec = SINK_SPECS[sink.type];
        if (spec) total += spec.price;
        if (sink.hasTapHole && sink.tapHolePosition !== "none") total += 15;
        if (sink.hasDrainer) total += DRAINER_PRICE;
    });
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
          const isAnchor = sink.id === config.anchorId;
          const isNoSink = sink.type === "Aucune cuve";
          const isMulti = currentSinks.length > 1;
          const currentPos = layout.items[index];
          const currentSinkOffset = (sink.offset !== undefined && sink.offset !== null) ? sink.offset : (isAnchor ? 100 : MIN_GAP_BETWEEN_SINKS);

          const sinkSpec = SINK_SPECS[sink.type] || { l: 0 };
          const sinkWidth = sinkSpec.l;
          const halfW = sinkWidth / 2;

          let minOffset = 0; 
          let maxOffset = 0;
          
          // Variables de blocage pour l'ancre
          let canCenter = true;
          let canAnchorLeft = true;
          let canAnchorRight = true;

          if (isAnchor) {
              const { leftWidth, rightWidth, totalWidth } = layoutDimensions;
              const halfL = config.length / 2;
              
              // 1. Est-ce qu'on peut Centrer ? (Symétrie)
              const maxWing = Math.max(leftWidth, rightWidth);
              canCenter = (maxWing + MARGIN_PLAN_EDGE) <= halfL;

              // 2. Est-ce qu'on peut Ancrer à Gauche ? 
              // La position minimale valide de l'ancre en mode "Gauche" est: MARGIN + leftWidth.
              // Si cette position dépasse le milieu du plan (halfL), alors "Ancrer à Gauche" 
              // placerait en réalité l'ancre sur la moitié DROITE du plan. On bloque.
              const minAnchorX_LeftMode = MARGIN_PLAN_EDGE + (leftWidth - halfW); // -halfW car offset est au bord
              // Correction: Offset Left est "Bord Gauche Plan -> Bord Gauche Cuve".
              // Centre Cuve = Offset + halfW.
              // Encombrement Gauche (depuis centre) = leftWidth.
              // Donc Offset minimal = MARGIN + (leftWidth - halfW).
              // Position Centre Ancre minimale = MARGIN + leftWidth.
              const absCenterMinX = MARGIN_PLAN_EDGE + leftWidth;
              canAnchorLeft = absCenterMinX <= halfL;

              // 3. Est-ce qu'on peut Ancrer à Droite ?
              // La position minimale valide de l'ancre en mode "Droite" (donc le plus à droite possible)
              // est contrainte par la gauche du groupe.
              // Non, en mode "Droite", on pousse vers la gauche.
              // La limite est quand on tape le mur gauche.
              // Max Offset Right = Length - MARGIN - leftWidth - halfW.
              // Position Centre Ancre = Length - Offset - halfW.
              // Position Centre Ancre la plus à GAUCHE possible en mode "Right" = MARGIN + leftWidth.
              // Position Centre Ancre la plus à DROITE possible en mode "Right" = Length - MARGIN - rightWidth.
              // On veut savoir si l'ancrage "Droite" a du sens, c-à-d si l'ancre peut être dans la moitié droite.
              // Position la plus à droite possible : Length - MARGIN - rightWidth.
              const absCenterMaxX = config.length - MARGIN_PLAN_EDGE - rightWidth;
              canAnchorRight = absCenterMaxX >= halfL;


              if (sink.position === 'left') {
                   minOffset = MARGIN_PLAN_EDGE + (leftWidth - halfW);
                   const wallLimit = config.length - MARGIN_PLAN_EDGE - rightWidth - halfW;
                   const centerLimit = (config.length / 2) - halfW;
                   maxOffset = Math.min(wallLimit, centerLimit);

              } else if (sink.position === 'right') {
                   minOffset = MARGIN_PLAN_EDGE + (rightWidth - halfW);
                   const wallLimit = config.length - MARGIN_PLAN_EDGE - leftWidth - halfW;
                   const centerLimit = (config.length / 2) - halfW;
                   maxOffset = Math.min(wallLimit, centerLimit);

              } else {
                   maxOffset = (config.length/2) - halfW;
              }

              if (isNaN(minOffset)) minOffset = 0;
              if (isNaN(maxOffset)) maxOffset = 0;
              if (maxOffset < minOffset) maxOffset = minOffset; 

          } else {
              // RELATIF
              minOffset = MIN_GAP_BETWEEN_SINKS;
              const globalSlackRight = absLimitRight - layout.groupMaxX; 
              const globalSlackLeft = layout.groupMinX - absLimitLeft;
              
              const anchorIndex = currentSinks.findIndex(s => s.id === config.anchorId);
              if (index > anchorIndex) {
                  maxOffset = currentSinkOffset + globalSlackRight;
              } else {
                  maxOffset = currentSinkOffset + globalSlackLeft;
              }
              
              if(isNaN(maxOffset)) maxOffset = 0;
          }

          const obstacleL = index === 0 ? absLimitLeft : layout.items[index-1].rightBound;
          const distL = currentPos ? (currentPos.leftBound - obstacleL) : 0;
          const canL = distL >= (DRAINER_WIDTH_MM - 10); 
          const obstacleR = index === currentSinks.length-1 ? absLimitRight : layout.items[index+1].leftBound;
          const distR = currentPos ? (obstacleR - currentPos.rightBound) : 0;
          const canR = distR >= (DRAINER_WIDTH_MM - 10);

          return (
            <div key={sink.id} className="form-group section-box" style={{borderLeft: isAnchor ? "4px solid #d4af37" : "4px solid #ccc"}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label className="section-title">
                        {isMulti ? `Cuve #${index + 1}` : "Choix de la cuve"} 
                        {isAnchor && isMulti && <span style={{fontSize:'0.7em', color:'#d4af37', marginLeft:'5px'}}>(Ancre)</span>}
                    </label>
                    {isMulti && !isAnchor && (
                        <button onClick={() => removeSink(sink.id)} style={{fontSize:'0.8rem', color:'red', border:'none', background:'transparent', cursor:'pointer'}}>Supprimer 🗑️</button>
                    )}
                </div>

                <div className="sink-options-list">
                  {Object.keys(SINK_SPECS).map((opt) => (
                    <button key={opt} className={sink.type === opt ? "active-small" : ""} onClick={() => handleSinkTypeSelect(sink.id, opt)}>
                      {opt === "Aucune cuve" ? "Aucune" : `${opt.replace("Cuve ", "")} (${SINK_SPECS[opt].price}€)`}
                    </button>
                  ))}
                </div>

                {!isNoSink && (
                  <>
                    <div style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}></div>

                    {isAnchor ? (
                        <>
                        <label className="section-title">Positionnement (Ancrage)</label>
                        <div className="inputs-row" style={{ alignItems: "flex-end" }}>
                            <div className="drilling-options" style={{ marginRight: "15px", marginBottom: "5px" }}>
                                <button 
                                    className={sink.position === "left" ? "active-small" : ""} 
                                    onClick={() => canAnchorLeft && handlePositionChange(sink.id, "left", sinkWidth)}
                                    disabled={!canAnchorLeft}
                                    style={!canAnchorLeft ? {opacity:0.5, cursor:'not-allowed'} : {}}
                                >Gauche</button>
                                
                                <button 
                                    className={sink.position === "center" ? "active-small" : ""} 
                                    onClick={() => canCenter && handlePositionChange(sink.id, "center", sinkWidth)}
                                    disabled={!canCenter}
                                    style={!canCenter ? {opacity:0.5, cursor:'not-allowed'} : {}}
                                >Centré</button>
                                
                                <button 
                                    className={sink.position === "right" ? "active-small" : ""} 
                                    onClick={() => canAnchorRight && handlePositionChange(sink.id, "right", sinkWidth)}
                                    disabled={!canAnchorRight}
                                    style={!canAnchorRight ? {opacity:0.5, cursor:'not-allowed'} : {}}
                                >Droite</button>
                            </div>
                            {(sink.position !== "center") && (
                                <div style={{ display: "flex", flexDirection: "column", marginLeft: "15px", flex: 1 }}>
                                    <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>
                                        Décalage Bord (min: {Math.ceil(minOffset)})
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
                                        min={Math.ceil(minOffset)} max={Math.floor(maxOffset)} step="10"
                                    />
                                    <span style={{fontSize:'0.65rem', color:'#999'}}>Max: {Math.floor(maxOffset)} (Centré)</span>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <>
                        <label className="section-title">Positionnement Relatif</label>
                        <div style={{ display: "flex", flexDirection: "column", marginTop:'10px' }}>
                             <span style={{ fontSize: "0.9rem", color: "#333", marginBottom: "5px" }}>
                                Espace total depuis cuve précédente
                             </span>
                             <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                 <input
                                    type="number"
                                    style={{width:'100px'}}
                                    value={currentSinkOffset}
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value);
                                        if (val < minOffset) val = minOffset;
                                        if (val > maxOffset) val = maxOffset;
                                        updateSink(sink.id, "offset", val);
                                    }}
                                    min={minOffset} max={Math.floor(maxOffset)} step="10"
                                />
                             </div>
                             <span style={{fontSize:'0.65rem', color:'#999', marginTop:'4px'}}>Max possible: {Math.floor(maxOffset)} (Bloqué par la fin du plan)</span>
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

      {/* OPTIONS DOSSERETS (RIMS) */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="rims" checked={config.rims} onChange={handleGlobalChange} /> Ajouter dosserets</label>
        {config.rims && (
          <div className="rims-options-container" style={{ marginTop: "10px" }}>
            <div style={{marginBottom:'5px'}}>
              <input type="number" className="small-input" name="rimHeigh" value={config.rimHeigh} onChange={handleGlobalChange} onBlur={handleBlur} min="100" max="550" />
              <span style={{fontSize:'0.7rem', color:'#666', marginLeft:'10px'}}>(Min 100mm - Max 550mm)</span>
            </div>
            <div className="drilling-options">
              <button 
                className={config.rimLeft ? "active-small" : ""} 
                onClick={() => !isRimDisabled("rimLeft") && toggleRimSide("rimLeft")}
                disabled={isRimDisabled("rimLeft")}
                style={isRimDisabled("rimLeft") ? {opacity:0.5, cursor:'not-allowed'} : {}}
              >Gauche</button>
              
              <button 
                className={config.rimBack ? "active-small" : ""} 
                onClick={() => !isRimDisabled("rimBack") && toggleRimSide("rimBack")}
                disabled={isRimDisabled("rimBack")}
                style={isRimDisabled("rimBack") ? {opacity:0.5, cursor:'not-allowed'} : {}}
              >Arrière</button>
              
              <button 
                className={config.rimRight ? "active-small" : ""} 
                onClick={() => !isRimDisabled("rimRight") && toggleRimSide("rimRight")}
                disabled={isRimDisabled("rimRight")}
                style={isRimDisabled("rimRight") ? {opacity:0.5, cursor:'not-allowed'} : {}}
              >Droite</button>
            </div>
          </div>
        )}
      </div>

      {/* OPTIONS RETOMBEES (APRONS) */}
      <div className="form-group checkbox-group">
        <label><input type="checkbox" name="aprons" checked={true} disabled readOnly /> Retombées (Obligatoire)</label>
        <div className="rims-options-container" style={{ marginTop: "10px" }}>
          <div style={{marginBottom:'5px'}}>
            <input type="number" className="small-input" name="apronHeight" value={config.apronHeight || 40} onChange={handleGlobalChange} onBlur={handleBlur} min="40" max="200" />
            <span style={{fontSize:'0.7rem', color:'#666', marginLeft:'10px'}}>(Min 40mm - Max 200mm)</span>
          </div>
          <div className="drilling-options">
            <button className={config.apronFront ? "active-small" : ""} disabled>Avant</button>
            
            <button 
                className={config.apronLeft ? "active-small" : ""} 
                onClick={() => !isApronDisabled("apronLeft") && toggleApronSide("apronLeft")}
                disabled={isApronDisabled("apronLeft")}
                style={isApronDisabled("apronLeft") ? {opacity:0.5, cursor:'not-allowed'} : {}}
            >Gauche</button>

            <button 
                className={config.apronBack ? "active-small" : ""} 
                onClick={() => !isApronDisabled("apronBack") && toggleApronSide("apronBack")}
                disabled={isApronDisabled("apronBack")}
                style={isApronDisabled("apronBack") ? {opacity:0.5, cursor:'not-allowed'} : {}}
            >Arrière</button>

            <button 
                className={config.apronRight ? "active-small" : ""} 
                onClick={() => !isApronDisabled("apronRight") && toggleApronSide("apronRight")}
                disabled={isApronDisabled("apronRight")}
                style={isApronDisabled("apronRight") ? {opacity:0.5, cursor:'not-allowed'} : {}}
            >Droite</button>
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