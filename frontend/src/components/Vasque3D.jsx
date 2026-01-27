import React, { useMemo } from "react";
import * as THREE from "three";

const Vasque3D = ({ config }) => {
  const UNIT_SCALE = 100;

  // --- CONFIG GENERALE ---
  const totalW = config.width / UNIT_SCALE;
  const totalL = config.length / UNIT_SCALE;
  const thickness = 0.4;
  const grooveDepth = 0.3;
  const baseThickness = 0.1;
  const wallThickness = 0.12;
  const apronH = (config.aprons && config.apronHeight ? config.apronHeight : 40) / UNIT_SCALE;

  const SINK_SPECS_DIM = {
    "Aucune cuve": { l: 0, w: 0, d: 0 },
    "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300 },
    "Cuve détente 400x400x200": { l: 400, w: 400, d: 200 },
    "Cuve cuisine 500x400x180": { l: 500, w: 400, d: 180 },
    "Cuve sanitaire 422x336x139": { l: 422, w: 336, d: 139 },
  };

  const GAP = 0.4; // 40mm
  const DRAINER_LEN = 3.5; 
  const GROOVE_W = 0.1;
  const STD_GROOVE_COUNT = 7;
  const TOTAL_DRAINER_WIDTH_STD = 3.5;
  const GAP_DRAIN = (TOTAL_DRAINER_WIDTH_STD - STD_GROOVE_COUNT * GROOVE_W) / 6;

  const getDrainerSpec = (sinkType) => {
      const isSanitary = sinkType && sinkType.toLowerCase().includes("sanitaire");
      const count = isSanitary ? 5 : 7;
      const totalH = count * GROOVE_W + (count - 1) * GAP_DRAIN;
      return { count, totalH };
  };

  // --- CALCUL POSITIONS CUVES (NOUVELLE LOGIQUE : ANCRE CUVE 1 + CHAÎNE) ---
  const calculatedSinks = useMemo(() => {
    const sinks = config.sinks || [
       { type: config.sink || "Aucune cuve", position: config.position || "center", offset: config.sinkOffset || 100 }
    ];
    
    if (sinks.length === 0) return [];

    const items = sinks.map(s => {
        const spec = SINK_SPECS_DIM[s.type] || SINK_SPECS_DIM["Aucune cuve"];
        const offsetVal = (s.offset || 0) / UNIT_SCALE;
        return { 
            ...s, 
            width: spec.l / UNIT_SCALE, 
            height: spec.w / UNIT_SCALE, 
            depth: spec.d / UNIT_SCALE,
            offsetVal 
        };
    });

    const planHalfL = totalL / 2;
    const calculatedItems = [];

    // --- POSITIONNEMENT CUVE 1 (ANCRE) ---
    const firstItem = items[0];
    let x1 = 0;
    
    if (firstItem.position === "center") {
        x1 = 0;
    } else if (firstItem.position === "left") {
        // Centre Cuve = -L/2 + Offset + W/2
        x1 = -planHalfL + (firstItem.offsetVal || 1.0) + firstItem.width / 2;
    } else if (firstItem.position === "right") {
        // Centre Cuve = L/2 - Offset - W/2
        x1 = planHalfL - (firstItem.offsetVal || 1.0) - firstItem.width / 2;
    }
    
    calculatedItems.push({ ...firstItem, x: x1, valid: firstItem.type !== "Aucune cuve" });

    // --- POSITIONNEMENT CUVES SUIVANTES (RELATIF EN CHAÎNE) ---
    for (let i = 1; i < items.length; i++) {
        const prev = calculatedItems[i-1];
        const curr = items[i];
        
        let minGap = GAP;
        // Si cuve précédente a égouttoir à droite OU cuve actuelle a égouttoir à gauche -> Espace += 350mm
        if (prev.hasDrainer && prev.drainerPosition === 'right') minGap += DRAINER_LEN;
        if (curr.hasDrainer && curr.drainerPosition === 'left') minGap += DRAINER_LEN;

        // Position = CentrePrec + DemiLPrec + GAP_TOTAL + DemiLCurr
        const dist = (prev.width / 2) + minGap + (curr.offsetVal || 0) + (curr.width / 2);
        const x = prev.x + dist;
        
        calculatedItems.push({ ...curr, x, valid: curr.type !== "Aucune cuve" });
    }

    return calculatedItems;
  }, [config.sinks, config.length, totalL]);

  // --- ELEVATION Y ---
  const maxBasinDepth = calculatedSinks.reduce((max, s) => s.valid && s.depth > max ? s.depth : max, 0);
  const elevationY = maxBasinDepth > 0 ? (maxBasinDepth - 0.4) + 0.02 : 0;

  // --- GÉOMÉTRIE DÉCOUPE MUR (Teethed Hole) - VERSION REFERENCE ---
  const drawTeethedHole = (holePath, sink) => {
      const w = sink.width;
      const h = sink.height;
      const r = 0.15;
      
      const x = -w / 2;
      const y = -h / 2;
      
      const { count, totalH } = getDrainerSpec(sink.type);
      const startY = totalH / 2 - GROOVE_W / 2;
      
      const grooveYs = [];
      if (sink.hasDrainer) {
          for (let i = 0; i < count; i++) {
              grooveYs.push(startY - i * (GROOVE_W + GAP_DRAIN));
          }
      }

      const cutDepth = wallThickness; 

      holePath.moveTo(x, y + r);

      // Côté GAUCHE
      if (sink.hasDrainer && sink.drainerPosition === "left") {
          const yTop = y + h - r;
          const sortedGrooves = [...grooveYs].sort((a,b) => a - b); 
          let penY = y + r;
          
          sortedGrooves.forEach(gY => {
              const gBot = gY - GROOVE_W/2;
              const gTop = gY + GROOVE_W/2;
              if (gBot > penY && gTop < yTop) {
                  holePath.lineTo(x, gBot);
                  holePath.lineTo(x - cutDepth, gBot);
                  holePath.lineTo(x - cutDepth, gTop);
                  holePath.lineTo(x, gTop);
                  penY = gTop;
              }
          });
          holePath.lineTo(x, yTop);
      } else {
          holePath.lineTo(x, y + h - r);
      }

      holePath.absarc(x + r, y + h - r, r, Math.PI, Math.PI / 2, true);
      holePath.lineTo(x + w - r, y + h);
      holePath.absarc(x + w - r, y + h - r, r, Math.PI / 2, 0, true);

      // Côté DROIT
      if (sink.hasDrainer && sink.drainerPosition === "right") {
          const yBot = y + r;
          const sortedGrooves = [...grooveYs].sort((a,b) => b - a);
          let penY = y + h - r;
          const rightX = x + w;

          sortedGrooves.forEach(gY => {
              const gTop = gY + GROOVE_W/2;
              const gBot = gY - GROOVE_W/2;
              if (gTop < penY && gBot > yBot) {
                  holePath.lineTo(rightX, gTop);
                  holePath.lineTo(rightX + cutDepth, gTop);
                  holePath.lineTo(rightX + cutDepth, gBot);
                  holePath.lineTo(rightX, gBot);
                  penY = gBot;
              }
          });
          holePath.lineTo(rightX, yBot);
      } else {
          holePath.lineTo(x + w, y + r);
      }

      holePath.absarc(x + w - r, y + r, r, 0, -Math.PI / 2, true);
      holePath.lineTo(x + r, y);
      holePath.absarc(x + r, y + r, r, -Math.PI / 2, -Math.PI, true);
  };

  // --- GEOMETRIE PLAN - VERSION REFERENCE ---
  const planComponents = useMemo(() => {
    const drawBaseRect = (shp) => {
      shp.moveTo(-totalL / 2, -totalW / 2);
      shp.lineTo(-totalL / 2, totalW / 2);
      shp.lineTo(totalL / 2, totalW / 2);
      shp.lineTo(totalL / 2, -totalW / 2);
      shp.lineTo(-totalL / 2, -totalW / 2);
    };

    const drawOneHole = (shp, x, z, w, h, r) => {
       const hole = new THREE.Path();
       hole.moveTo(x - w / 2, z - h / 2 + r);
       hole.lineTo(x - w / 2, z + h / 2 - r);
       hole.absarc(x - w / 2 + r, z + h / 2 - r, r, Math.PI, Math.PI / 2, true);
       hole.lineTo(x + w / 2 - r, z + h / 2);
       hole.absarc(x + w / 2 - r, z + h / 2 - r, r, Math.PI / 2, 0, true);
       hole.lineTo(x + w / 2, z - h / 2 + r);
       hole.absarc(x + w / 2 - r, z - h / 2 + r, r, 0, -Math.PI / 2, true);
       hole.lineTo(x - w / 2 + r, z - h / 2);
       hole.absarc(x - w / 2 + r, z - h / 2 + r, r, -Math.PI / 2, -Math.PI, true);
       shp.holes.push(hole);
    };

    const extrudeSettings = { bevelEnabled: false, curveSegments: 32 };
    const hasAnyDrainer = calculatedSinks.some(s => s.hasDrainer && s.valid);

    const shapeBase = new THREE.Shape();
    drawBaseRect(shapeBase);
    calculatedSinks.forEach(s => {
        if(s.valid) drawOneHole(shapeBase, s.x, 0, s.width, s.height, 0.15);
    });
    const geomBase = new THREE.ExtrudeGeometry(shapeBase, { ...extrudeSettings, depth: baseThickness });
    geomBase.rotateX(-Math.PI / 2);

    const shapeTop = new THREE.Shape();
    drawBaseRect(shapeTop);
    calculatedSinks.forEach(s => {
        if(s.valid) {
            drawOneHole(shapeTop, s.x, 0, s.width, s.height, 0.15);
            if(s.hasDrainer) {
                const isLeft = s.drainerPosition === "left";
                const SAFETY_GAP = 0.001; 
                const innerEdge = isLeft ? s.x - s.width/2 : s.x + s.width/2;
                const drainStartEdge = isLeft ? innerEdge - SAFETY_GAP : innerEdge + SAFETY_GAP;
                const drainCenter = isLeft ? drainStartEdge - DRAINER_LEN/2 : drainStartEdge + DRAINER_LEN/2;
                
                const { count, totalH } = getDrainerSpec(s.type);
                const startZ = 0 - totalH / 2 + GROOVE_W / 2;
                
                for (let i = 0; i < count; i++) {
                    const currentZ = startZ + i * (GROOVE_W + GAP_DRAIN);
                    const shapeY = -currentZ; 
                    const halfW = GROOVE_W / 2;
                    const grooveHole = new THREE.Path();
                    
                    const xStart = drainCenter - DRAINER_LEN/2;
                    const xEnd = drainCenter + DRAINER_LEN/2;
                    
                    if (isLeft) {
                        // Pointe à Gauche (Loin), Base à Droite (Près)
                        grooveHole.moveTo(xStart, shapeY); // Pointe
                        grooveHole.lineTo(xEnd, shapeY + halfW); // Base Haut
                        grooveHole.lineTo(xEnd, shapeY - halfW); // Base Bas
                        grooveHole.lineTo(xStart, shapeY); // Retour Pointe
                    } else {
                        // Pointe à Droite (Loin), Base à Gauche (Près)
                        grooveHole.moveTo(xEnd, shapeY); // Pointe
                        grooveHole.lineTo(xStart, shapeY + halfW); // Base Haut
                        grooveHole.lineTo(xStart, shapeY - halfW); // Base Bas
                        grooveHole.lineTo(xEnd, shapeY); // Retour Pointe
                    }
                    shapeTop.holes.push(grooveHole);
                }
            }
        }
    });
    
    if(hasAnyDrainer) {
         const geomTop = new THREE.ExtrudeGeometry(shapeTop, { ...extrudeSettings, depth: grooveDepth });
         geomTop.rotateX(-Math.PI / 2);
         return { isSplit: true, bottom: geomBase, top: geomTop };
    } else {
         const geomFull = new THREE.ExtrudeGeometry(shapeTop, { ...extrudeSettings, depth: thickness });
         geomFull.rotateX(-Math.PI / 2);
         return { isSplit: false, full: geomFull };
    }
  }, [totalL, totalW, calculatedSinks, thickness]);

  // --- VISUELS EGOUTTOIR - VERSION REFERENCE ---
  const drainerVisuals = useMemo(() => {
     const visuals = [];
     const geometry = new THREE.CylinderGeometry(0, GROOVE_W/2, DRAINER_LEN, 32, 1, false, 0, Math.PI);
     
     // CORRECTION ROTATION : Alignement sur l'axe X
     geometry.rotateZ(-Math.PI/2); // Y -> X
     
     const depthScale = 0.08 / (GROOVE_W/2); 
     geometry.scale(1, depthScale, 1);
     const drainerColor = config.color === "white" ? "#d0d0d0" : "#000000";

     calculatedSinks.forEach((s, idx) => {
         if(s.valid && s.hasDrainer) {
             const isLeft = s.drainerPosition === "left";
             const SAFETY_GAP = 0.001; 
             const innerEdge = isLeft ? s.x - s.width/2 : s.x + s.width/2;
             const drainStartEdge = isLeft ? innerEdge - SAFETY_GAP : innerEdge + SAFETY_GAP;
             const drainCenter = isLeft ? drainStartEdge - DRAINER_LEN/2 : drainStartEdge + DRAINER_LEN/2;
             
             const { count, totalH } = getDrainerSpec(s.type);
             const startZ = 0 - totalH / 2 + GROOVE_W / 2;
             
             // CORRECTION SENS :
             // Geometrie par défaut (après rotZ -90) : Pointe vers X+ (Droite), Base vers X- (Gauche)
             // Droite : Base près cuve (X-), Pointe loin (X+). C'est le sens par défaut (rotY = 0).
             // Gauche : Base près cuve (X+), Pointe loin (X-). Il faut inverser (rotY = PI).
             const rotY = isLeft ? Math.PI : 0; 

             for (let i = 0; i < count; i++) {
                 const currentZ = startZ + i * (GROOVE_W + GAP_DRAIN);
                 visuals.push(
                     <mesh key={`${idx}-${i}`} geometry={geometry} position={[drainCenter, 0.401, currentZ]} rotation={[0, rotY, 0]}>
                         <meshStandardMaterial color={drainerColor} roughness={0.6} side={THREE.DoubleSide} />
                     </mesh>
                 );
             }
         }
     });
     return <group>{visuals}</group>;
  }, [calculatedSinks, config.color]);

  // --- HELPER SINGLE SINK (DOUBLE PAROI) - VERSION REFERENCE ---
  const SingleSinkGeometry = ({ s }) => {
      if(!s.valid) return null;
      
      const { outerWallGeom, innerSkinGeom } = useMemo(() => {
        const SHRINK_OFFSET = 0.1; 
        const THIN_SKIN = 0.002;

        // 1. MUR EXTERIEUR (Épais, hauteur réduite)
        const outerShape = new THREE.Shape();
        const wOut = s.width + wallThickness * 2;
        const hOut = s.height + wallThickness * 2;
        outerShape.moveTo(-wOut/2, -hOut/2); outerShape.lineTo(-wOut/2, hOut/2); outerShape.lineTo(wOut/2, hOut/2); outerShape.lineTo(wOut/2, -hOut/2); outerShape.lineTo(-wOut/2, -hOut/2);
        
        const holeOut = new THREE.Path();
        drawTeethedHole(holeOut, s);
        outerShape.holes.push(holeOut);

        const geomOut = new THREE.ExtrudeGeometry(outerShape, { depth: s.depth - SHRINK_OFFSET, bevelEnabled: false });
        geomOut.rotateX(-Math.PI/2);

        // 2. MUR INTERIEUR (Peau fine, hauteur totale)
        const innerShape = new THREE.Shape();
        const r = 0.15;
        const hw = s.width; const hh = s.height;
        innerShape.moveTo(-hw/2, -hh/2+r); innerShape.lineTo(-hw/2, hh/2-r); innerShape.absarc(-hw/2+r, hh/2-r, r, Math.PI, Math.PI/2, true);
        innerShape.lineTo(hw/2-r, hh/2); innerShape.absarc(hw/2-r, hh/2-r, r, Math.PI/2, 0, true);
        innerShape.lineTo(hw/2, -hh/2+r); innerShape.absarc(hw/2-r, -hh/2+r, r, 0, -Math.PI / 2, true);
        innerShape.lineTo(-hw/2+r, -hh/2); innerShape.absarc(-hw/2+r, -hh/2+r, r, -Math.PI/2, -Math.PI, true);
        
        const holeIn = new THREE.Path();
        const rIn = Math.max(0.01, r - THIN_SKIN);
        const hwIn = s.width - THIN_SKIN*2;
        const hhIn = s.height - THIN_SKIN*2;
        holeIn.moveTo(-hwIn/2, -hhIn/2+rIn); holeIn.lineTo(-hwIn/2, hhIn/2-rIn); holeIn.absarc(-hwIn/2+rIn, hhIn/2-rIn, rIn, Math.PI, Math.PI/2, true);
        holeIn.lineTo(hwIn/2-rIn, hhIn/2); holeIn.absarc(hwIn/2-rIn, hhIn/2-rIn, rIn, Math.PI/2, 0, true);
        holeIn.lineTo(hwIn/2, -hhIn/2+rIn); holeIn.absarc(hwIn/2-rIn, -hhIn/2+rIn, rIn, 0, -Math.PI / 2, true);
        holeIn.lineTo(-hwIn/2+rIn, -hhIn/2); holeIn.absarc(-hwIn/2+rIn, -hhIn/2+rIn, rIn, -Math.PI/2, -Math.PI, true);
        innerShape.holes.push(holeIn);

        const geomIn = new THREE.ExtrudeGeometry(innerShape, { depth: s.depth, bevelEnabled: false });
        geomIn.rotateX(-Math.PI/2);

        return { outerWallGeom: geomOut, innerSkinGeom: geomIn };
      }, [s.width, s.height, s.depth, s.type, s.hasDrainer, s.drainerPosition]);

      const floorY = 0.4 - s.depth;
      const materialProps = { 
          color: config.color === "white"?"#fff":"#111", 
          roughness:0.9, 
          metalness:0.1,
          side: THREE.DoubleSide
      };

      return (
          <group position={[s.x, 0, 0]}>
              <mesh position={[0, floorY, 0]} geometry={outerWallGeom}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>
              <mesh position={[0, 0.4 - s.depth, 0]} geometry={innerSkinGeom}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>
              <mesh position={[0, floorY, 0]}>
                  <boxGeometry args={[s.width, 0.02, s.height]} />
                  <meshStandardMaterial color={config.color === "white"?"#ccc":"#000"} roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, floorY + 0.02, 0]}><cylinderGeometry args={[0.025, 0.025, 0.01, 32]} /><meshBasicMaterial color="#000000" /></mesh>
              {s.hasTapHole && (
                  <mesh position={[s.tapHolePosition==="left"?-0.5:s.tapHolePosition==="right"?0.5:0, 0.4, -s.height/2-0.2]}>
                      <cylinderGeometry args={[0.0175, 0.0175, 0.5, 32]} />
                      <meshBasicMaterial color="black" />
                  </mesh>
              )}
          </group>
      );
  };

  // --- SPLASHBACK - VERSION REFERENCE ---
  const splashRadius = 0.06;
  const createSplashGeometry = (length, radius, miterStart, miterEnd, reverseCut = false) => {
    let currentLength = length;
    if (miterStart) currentLength -= radius;
    if (miterEnd) currentLength -= radius;
    let centerOffset = 0;
    if (miterStart && !miterEnd) centerOffset = radius / 2;
    if (!miterStart && miterEnd) centerOffset = -radius / 2;
    const safeLength = Math.max(0.001, currentLength);
    const geometry = new THREE.CylinderGeometry(radius, radius, safeLength, 32);
    geometry.rotateZ(Math.PI / 2);
    if (centerOffset !== 0) geometry.translate(centerOffset, 0, 0);
    const positionAttribute = geometry.attributes.position;
    const vertexCount = positionAttribute.count;
    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttribute.getX(i);
      const z = positionAttribute.getZ(i);
      const offset = reverseCut ? -z : z;
      if (x > 0 && miterEnd) positionAttribute.setX(i, x + offset);
      else if (x < 0 && miterStart) positionAttribute.setX(i, x - offset);
    }
    geometry.computeVertexNormals();
    return geometry;
  };

  const geomFront = useMemo(() => !config.splashback || !config.apronFront ? null : createSplashGeometry(totalL, splashRadius, !!config.apronLeft, !!config.apronRight, false), [config.splashback, config.apronFront, config.apronLeft, config.apronRight, totalL, splashRadius]);
  const geomBack = useMemo(() => !config.splashback || !config.apronBack ? null : createSplashGeometry(totalL, splashRadius, !!config.apronRight, !!config.apronLeft, false), [config.splashback, config.apronBack, config.apronLeft, config.apronRight, totalL, splashRadius]);
  const geomLeft = useMemo(() => !config.splashback || !config.apronLeft ? null : createSplashGeometry(totalW, splashRadius, !!config.apronFront, !!config.apronBack, true), [config.splashback, config.apronLeft, config.apronBack, config.apronFront, totalW, splashRadius]);
  const geomRight = useMemo(() => !config.splashback || !config.apronRight ? null : createSplashGeometry(totalW, splashRadius, !!config.apronBack, !!config.apronFront, true), [config.splashback, config.apronRight, config.apronFront, config.apronBack, totalW, splashRadius]);
  const materialProps = { color: config.color === "white" ? "#ffffff" : "#111111", roughness: 0.9, metalness: 0.1 };

  return (
    <group position={[0, elevationY, 0]}>
        {planComponents.isSplit ? (
            <>
                <mesh position={[0, 0, 0]} geometry={planComponents.bottom}><meshStandardMaterial {...materialProps} /></mesh>
                <mesh position={[0, 0.4 - grooveDepth, 0]} geometry={planComponents.top}><meshStandardMaterial {...materialProps} /></mesh>
            </>
        ) : (
             <mesh position={[0, 0, 0]} geometry={planComponents.full}><meshStandardMaterial {...materialProps} /></mesh>
        )}

        {calculatedSinks.map((s, i) => <SingleSinkGeometry key={i} s={s} />)}
        {drainerVisuals}

        {config.aprons && (
        <>
          {config.apronFront && <mesh position={[0, 0.4 - apronH / 2, totalW / 2 - wallThickness / 2]}><boxGeometry args={[totalL, apronH, wallThickness]} /><meshStandardMaterial {...materialProps} /></mesh>}
          {config.apronLeft && <mesh position={[-totalL / 2 + wallThickness / 2, 0.4 - apronH / 2, 0]}><boxGeometry args={[wallThickness, apronH, totalW]} /><meshStandardMaterial {...materialProps} /></mesh>}
          {config.apronRight && <mesh position={[totalL / 2 - wallThickness / 2, 0.4 - apronH / 2, 0]}><boxGeometry args={[wallThickness, apronH, totalW]} /><meshStandardMaterial {...materialProps} /></mesh>}
          {config.apronBack && <mesh position={[0, 0.4 - apronH / 2, -totalW / 2 + wallThickness / 2]}><boxGeometry args={[totalL, apronH, wallThickness]} /><meshStandardMaterial {...materialProps} /></mesh>}
        </>
      )}

      {config.rims && (
        <>
          {config.rimLeft && <mesh position={[-totalL / 2 + wallThickness / 2, 0.4 + config.rimHeigh / UNIT_SCALE / 2, 0]}><boxGeometry args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]} /><meshStandardMaterial {...materialProps} /></mesh>}
          {config.rimRight && <mesh position={[totalL / 2 - wallThickness / 2, 0.4 + config.rimHeigh / UNIT_SCALE / 2, 0]}><boxGeometry args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]} /><meshStandardMaterial {...materialProps} /></mesh>}
          {config.rimBack && <mesh position={[0, 0.4 + config.rimHeigh / UNIT_SCALE / 2, -totalW / 2 + wallThickness / 2]}><boxGeometry args={[totalL, config.rimHeigh / UNIT_SCALE, wallThickness]} /><meshStandardMaterial {...materialProps} /></mesh>}
        </>
      )}

      {config.splashback && (
        <>
          {geomFront && <mesh position={[0, 0.4, totalW / 2 - splashRadius]} geometry={geomFront}><meshStandardMaterial {...materialProps} /></mesh>}
          {geomBack && <mesh position={[0, 0.4, -totalW / 2 + splashRadius]} rotation={[0, Math.PI, 0]} geometry={geomBack}><meshStandardMaterial {...materialProps} /></mesh>}
          {geomLeft && <mesh position={[-totalL / 2 + splashRadius, 0.4, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geomLeft}><meshStandardMaterial {...materialProps} /></mesh>}
          {geomRight && <mesh position={[totalL / 2 - splashRadius, 0.4, 0]} rotation={[0, -Math.PI / 2, 0]} geometry={geomRight}><meshStandardMaterial {...materialProps} /></mesh>}
        </>
      )}
    </group>
  );
};

export default Vasque3D;