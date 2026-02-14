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
    "Cuve Détente 400x400x200": { l: 400, w: 400, d: 200 },
    "Cuve Cuisine 500x400x180": { l: 500, w: 400, d: 180 },
    "Cuve Sanitaire 422x336x139": { l: 422, w: 336, d: 139 },
  };

  const GAP_DEFAULT = 40 / UNIT_SCALE; 
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

  // --- CALCUL POSITIONS CUVES (MOTEUR BIDIRECTIONNEL) ---
  const calculatedSinks = useMemo(() => {
    const sinks = config.sinks || [
       { id: 999, type: config.sink || "Aucune cuve", position: config.position || "center", offset: config.sinkOffset || 100 }
    ];
    
    if (sinks.length === 0) return [];

    // 1. Préparation des dimensions
    const items = sinks.map(s => {
        const spec = SINK_SPECS_DIM[s.type] || SINK_SPECS_DIM["Aucune cuve"];
        const offsetVal = (s.offset !== undefined && s.offset !== null) ? s.offset / UNIT_SCALE : GAP_DEFAULT;
        
        // Tap Hole Offset scaling
        const tapHoleOffsetVal = (s.tapHoleOffset || 0) / UNIT_SCALE;

        return { 
            ...s, 
            width: spec.l / UNIT_SCALE, 
            height: spec.w / UNIT_SCALE, 
            depth: spec.d / UNIT_SCALE,
            offsetVal,
            tapHoleOffsetVal
        };
    });

    // 2. Identification de l'Ancre
    let anchorIndex = items.findIndex(s => s.id === config.anchorId);
    if (anchorIndex === -1) anchorIndex = 0;

    const anchorItem = items[anchorIndex];
    const planHalfL = totalL / 2;
    
    // 3. Position Ancre
    let anchorAbsX = 0;
    if (anchorItem.position === "center") {
        anchorAbsX = 0;
    } else if (anchorItem.position === "left") {
        anchorAbsX = -planHalfL + anchorItem.offsetVal + anchorItem.width / 2;
    } else if (anchorItem.position === "right") {
        anchorAbsX = planHalfL - anchorItem.offsetVal - anchorItem.width / 2;
    }

    const calculatedItems = new Array(items.length);

    // Fonction utilitaire pour calculer le Z (profondeur) selon la règle des 100mm min derrière
    const calculateZ = (sinkItem) => {
        const minBack = 100 / UNIT_SCALE; // 100mm minimum derrière
        const planHalfDepth = totalW / 2;
        const sinkHalfDepth = sinkItem.height / 2;
        return Math.max(0, (minBack + sinkHalfDepth) - planHalfDepth);
    };

    // 4. Placement Ancre
    calculatedItems[anchorIndex] = { 
        ...anchorItem, 
        x: anchorAbsX, 
        z: calculateZ(anchorItem),
        valid: anchorItem.type !== "Aucune cuve" 
    };

    // 5. Propagation DROITE
    for (let i = anchorIndex + 1; i < items.length; i++) {
        const prev = calculatedItems[i-1];
        const curr = items[i];
        
        let extraGap = 0;
        if (prev.hasDrainer && prev.drainerPosition === 'right') extraGap += DRAINER_LEN;
        if (curr.hasDrainer && curr.drainerPosition === 'left') extraGap += DRAINER_LEN;

        const dist = (prev.width / 2) + curr.offsetVal + extraGap + (curr.width / 2);
        const x = prev.x + dist;
        
        calculatedItems[i] = { 
            ...curr, 
            x, 
            z: calculateZ(curr),
            valid: curr.type !== "Aucune cuve" 
        };
    }

    // 6. Propagation GAUCHE
    for (let i = anchorIndex - 1; i >= 0; i--) {
        const next = calculatedItems[i+1]; 
        const curr = items[i];            
        
        const gapVal = curr.offsetVal;

        let extraGap = 0;
        if (curr.hasDrainer && curr.drainerPosition === 'right') extraGap += DRAINER_LEN;
        if (next.hasDrainer && next.drainerPosition === 'left') extraGap += DRAINER_LEN;

        const dist = (next.width / 2) + gapVal + extraGap + (curr.width / 2);
        const x = next.x - dist;

        calculatedItems[i] = { 
            ...curr, 
            x, 
            z: calculateZ(curr),
            valid: curr.type !== "Aucune cuve" 
        };
    }

    return calculatedItems;
  }, [config.sinks, config.length, totalL, totalW, config.anchorId]);

  // --- SUITE DU RENDU ---
  const maxBasinDepth = calculatedSinks.reduce((max, s) => s.valid && s.depth > max ? s.depth : max, 0);
  const elevationY = maxBasinDepth > 0 ? (maxBasinDepth - 0.4) + 0.02 : 0;

  const drawTeethedHole = (holePath, sink) => {
      const w = sink.width;
      const h = sink.height;
      const r = 0.28;
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

    const extrudeSettings = { bevelEnabled: false, curveSegments: 64 };
    const hasAnyDrainer = calculatedSinks.some(s => s.hasDrainer && s.valid);

    const shapeBase = new THREE.Shape();
    drawBaseRect(shapeBase);
    calculatedSinks.forEach(s => {
        if(s.valid) drawOneHole(shapeBase, s.x, -s.z, s.width, s.height, 0.15);
    });
    const geomBase = new THREE.ExtrudeGeometry(shapeBase, { ...extrudeSettings, depth: baseThickness });
    geomBase.rotateX(-Math.PI / 2);

    const shapeTop = new THREE.Shape();
    drawBaseRect(shapeTop);
    calculatedSinks.forEach(s => {
        if(s.valid) {
            drawOneHole(shapeTop, s.x, -s.z, s.width, s.height, 0.15);
            if(s.hasDrainer) {
                const isLeft = s.drainerPosition === "left";
                const SAFETY_GAP = 0.001; 
                const innerEdge = isLeft ? s.x - s.width/2 : s.x + s.width/2;
                const drainStartEdge = isLeft ? innerEdge - SAFETY_GAP : innerEdge + SAFETY_GAP;
                const drainCenter = isLeft ? drainStartEdge - DRAINER_LEN/2 : drainStartEdge + DRAINER_LEN/2;
                const { count, totalH } = getDrainerSpec(s.type);
                const startZ = s.z - totalH / 2 + GROOVE_W / 2;
                for (let i = 0; i < count; i++) {
                    const currentZ = startZ + i * (GROOVE_W + GAP_DRAIN);
                    const shapeY = -currentZ; 
                    const halfW = GROOVE_W / 2;
                    const grooveHole = new THREE.Path();
                    const xStart = drainCenter - DRAINER_LEN/2;
                    const xEnd = drainCenter + DRAINER_LEN/2;
                    if (isLeft) {
                        grooveHole.moveTo(xStart, shapeY);
                        grooveHole.lineTo(xEnd, shapeY + halfW);
                        grooveHole.lineTo(xEnd, shapeY - halfW);
                        grooveHole.lineTo(xStart, shapeY);
                    } else {
                        grooveHole.moveTo(xEnd, shapeY);
                        grooveHole.lineTo(xStart, shapeY + halfW);
                        grooveHole.lineTo(xStart, shapeY - halfW);
                        grooveHole.lineTo(xEnd, shapeY);
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

  const drainerVisuals = useMemo(() => {
     const visuals = [];
     const geometry = new THREE.CylinderGeometry(0, GROOVE_W/2, DRAINER_LEN, 64, 1, false, 0, Math.PI);
     geometry.rotateZ(-Math.PI/2);
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
             const startZ = s.z - totalH / 2 + GROOVE_W / 2;
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

  const SingleSinkGeometry = ({ s }) => {
      if(!s.valid) return null;
      
      const ROUND_RADIUS = 0.4; // Rayon de l'arrondi du fond
      const FLOOR_THICKNESS = 0.12; // Epaisseur du fond
      const SHORTEN_BOTTOM = ROUND_RADIUS + 0.01; // On remonte les murs de la valeur du rayon + un peu pour être au dessus du fond

      const { outerWallGeom, innerSkinGeom, tubesGeometry, cornerGeometry } = useMemo(() => {
        const SHRINK_OFFSET = 0.1; 
        const THIN_SKIN = 0.00000000001;

        // 1. Murs Verticaux (Raccourcis)
        const outerShape = new THREE.Shape();
        const wOut = s.width + wallThickness * 2;
        const hOut = s.height + wallThickness * 2;
        outerShape.moveTo(-wOut/2, -hOut/2); outerShape.lineTo(-wOut/2, hOut/2); outerShape.lineTo(wOut/2, hOut/2); outerShape.lineTo(wOut/2, -hOut/2); outerShape.lineTo(-wOut/2, -hOut/2);
        
        const holeOut = new THREE.Path();
        drawTeethedHole(holeOut, s);
        outerShape.holes.push(holeOut);

        const geomOut = new THREE.ExtrudeGeometry(outerShape, { depth: s.depth - SHRINK_OFFSET - SHORTEN_BOTTOM, bevelEnabled: false, curveSegments: 64 });
        geomOut.rotateX(-Math.PI/2);

        // 2. Peau Intérieure (Raccourcie)
        const innerShape = new THREE.Shape();
        const r = 0.28;
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

        const geomIn = new THREE.ExtrudeGeometry(innerShape, { depth: s.depth - SHORTEN_BOTTOM, bevelEnabled: false, curveSegments: 64 });
        geomIn.rotateX(-Math.PI/2);

        // 3. Géométrie des Quarts de Tubes
        const createTubeProfile = () => {
             const shape = new THREE.Shape();
             shape.absarc(0, 0, ROUND_RADIUS, 0, Math.PI/2);
             shape.lineTo(0, ROUND_RADIUS - wallThickness);
             shape.absarc(0, 0, ROUND_RADIUS - wallThickness, Math.PI/2, 0, true);
             shape.closePath();
             return shape;
        };
        const tubeShape = createTubeProfile();
        
        // Positions pour le calcul de longueurs : Distance entre les centres des coins
        const cX = (s.width/2 + wallThickness) - ROUND_RADIUS;
        const cZ = (s.height/2 + wallThickness) - ROUND_RADIUS;

        // Longueur exacte pour s'arrêter au centre des coins
        const sideDepth = cZ * 2;
        const fbDepth = cX * 2;

        // Extrusion Longueur (Gauche/Droite)
        const tubeGeomSide = new THREE.ExtrudeGeometry(tubeShape, { depth: sideDepth, bevelEnabled: false, curveSegments: 32 });
        // Centrage de l'axe Z pour que l'origine soit au milieu du tube
        tubeGeomSide.translate(0, 0, -sideDepth / 2);

        // Extrusion Largeur (Devant/Derrière)
        const tubeGeomFrontBack = new THREE.ExtrudeGeometry(tubeShape, { depth: fbDepth, bevelEnabled: false, curveSegments: 32 });
        // Centrage de l'axe Z (qui deviendra X après rotation)
        tubeGeomFrontBack.translate(0, 0, -fbDepth / 2);
        
        // 4. Géométrie des Coins (Lathe 1/8 Sphère creuse)
        const tubePoints = tubeShape.getPoints(10);
        const cornerGeom = new THREE.LatheGeometry(tubePoints, 32, 0, Math.PI/2);

        return { outerWallGeom: geomOut, innerSkinGeom: geomIn, tubesGeometry: { side: tubeGeomSide, frontBack: tubeGeomFrontBack }, cornerGeometry: cornerGeom };
      }, [s.width, s.height, s.depth, s.type, s.hasDrainer, s.drainerPosition, wallThickness]);

      const floorY = 0.4 - s.depth;
      const materialProps = { 
          color: config.color === "white"?"#fff":"#111", 
          roughness:0.9, 
          metalness:0.1,
          side: THREE.DoubleSide
      };

      const tapX = s.tapHolePosition === "Gauche" ? -s.tapHoleOffsetVal : s.tapHolePosition === "Droite" ? s.tapHoleOffsetVal : 0;

      // Positions des centres des tubes (décalés du bord extérieur par le rayon)
      const tubeCenterX = (s.width/2 + wallThickness) - ROUND_RADIUS;
      const tubeCenterZ = (s.height/2 + wallThickness) - ROUND_RADIUS;
      
      // REHAUSSEMENT : Au-dessus de l'épaisseur du sol (0.02 / 2 = 0.01)
      const tubeCenterY = floorY + 0.01; 

      // Rotation de base pour orienter le coin (Lathe)
      const baseCornerRot = [-Math.PI / 2, 0, Math.PI / 2];

      return (
          <group position={[s.x, 0, s.z]}>
              {/* Murs Verticaux */}
              <mesh position={[0, floorY + SHORTEN_BOTTOM, 0]} geometry={outerWallGeom}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>
              <mesh position={[0, 0.4 - s.depth + SHORTEN_BOTTOM, 0]} geometry={innerSkinGeom}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* Fond Plat (Réduit pour s'insérer entre les arrondis) */}
              <mesh position={[0, floorY + 0.07, 0]}>
                  <boxGeometry args={[s.width - 2*(ROUND_RADIUS-wallThickness), FLOOR_THICKNESS, s.height - 2*(ROUND_RADIUS-wallThickness)]} />
                  <meshStandardMaterial color={config.color === "white"?"#ccc":"#000"} roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
              
              {/* --- 4 QUARTS DE TUBES --- */}

              {/* 1. Tube Droite (+X) - Centré sur Z=0 */}
              <mesh 
                  geometry={tubesGeometry.side} 
                  position={[tubeCenterX, tubeCenterY + 0.4, 0]} 
                  rotation={[0, 0, -Math.PI/2]} 
              >
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* 2. Tube Gauche (-X) - Centré sur Z=0 */}
              <mesh 
                  geometry={tubesGeometry.side} 
                  position={[-tubeCenterX, tubeCenterY + 0.4, 0]} 
                  rotation={[0, Math.PI, -Math.PI/2]} 
              >
                  <meshStandardMaterial {...materialProps} />
              </mesh>

               {/* 3. Tube Arrière (-Z) - Centré sur X=0 */}
              <mesh 
                  geometry={tubesGeometry.frontBack} 
                  position={[0, tubeCenterY + 0.4, -tubeCenterZ]} 
                  rotation={[0, -Math.PI/2, Math.PI]} 
              >
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* 4. Tube Avant (+Z) - Centré sur X=0 */}
              <mesh 
                  geometry={tubesGeometry.frontBack} 
                  position={[0, tubeCenterY + 0.4, tubeCenterZ]} 
                  rotation={[0, Math.PI/2, Math.PI]} 
              >
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* --- 4 COINS --- */}
              {/* Avant-Droit (+X, +Z) */}
              <mesh geometry={cornerGeometry} position={[tubeCenterX, tubeCenterY + 0.4, tubeCenterZ]} rotation={[Math.PI/2, Math.PI/2, Math.PI/2]}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>
              
              {/* Arrière-Droit (+X, -Z) */}
              <mesh geometry={cornerGeometry} position={[tubeCenterX, tubeCenterY + 0.4 , -tubeCenterZ]} rotation={[-Math.PI/2, Math.PI, Math.PI/2]}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* Arrière-Gauche (-X, -Z) */}
              <mesh geometry={cornerGeometry} position={[-tubeCenterX, tubeCenterY+ 0.4, -tubeCenterZ]} rotation={[Math.PI/2, 0, Math.PI]}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* Avant-Gauche (-X, +Z) */}
              <mesh geometry={cornerGeometry} position={[-tubeCenterX, tubeCenterY + 0.4, tubeCenterZ]} rotation={[Math.PI/2, 0, Math.PI/2]}>
                  <meshStandardMaterial {...materialProps} />
              </mesh>

              {/* Bonde */}
              <mesh position={[0, floorY + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.175, 64]} />
                  <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
              </mesh>
              
              {/* Robinet */}
              {s.hasTapHole && (
                  <mesh position={[tapX, 0.401, -s.height/2 - 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                      <circleGeometry args={[0.175, 64]} />
                      <meshBasicMaterial color="black" side={THREE.DoubleSide} />
                  </mesh>
              )}
          </group>
      );
  };

  // --- SPLASHBACK GEOMETRY ---
  const splashRadius = 0.06;
  const createSplashGeometry = (length, radius, miterStart, miterEnd, reverseCut = false) => {
    let currentLength = length;
    if (miterStart) currentLength -= radius;
    if (miterEnd) currentLength -= radius;
    let centerOffset = 0;
    if (miterStart && !miterEnd) centerOffset = radius / 2;
    if (!miterStart && miterEnd) centerOffset = -radius / 2;
    const safeLength = Math.max(0.001, currentLength);
    const geometry = new THREE.CylinderGeometry(radius, radius, safeLength, 64); 
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