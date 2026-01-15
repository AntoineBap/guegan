const Vasque3D = ({ config }) => {
  const UNIT_SCALE = 100;

  // --- 1. DÉTECTION ---
  const isNoSinkName = config.sink === "Aucune cuve";
  const isZeroLength = config.basinLength === 0;
  const hasSink = !isNoSinkName && !isZeroLength;

  // dimensions du plan de travail
  const totalW = config.width / UNIT_SCALE;
  const totalL = config.length / UNIT_SCALE;

  // --- GESTION DES ÉPAISSEURS ---
  const thickness = 0.4;      // 40mm
  const wallThickness = 0.12; // 12mm

  // Hauteur retombées
  const apronH = (config.aprons && config.apronHeight) ? config.apronHeight / UNIT_SCALE : 0.4;

  // --- 2. DIMENSIONS DE LA CUVE ---
  const inputBasinL = config.basinLength !== undefined ? config.basinLength : 500;
  const inputBasinW = config.basinWidth !== undefined ? config.basinWidth : 350;
  const inputBasinD = config.depth !== undefined ? config.depth : 120;
  const rawBasinL = inputBasinL / UNIT_SCALE;
  const rawBasinW = inputBasinW / UNIT_SCALE;
  const rawBasinD = inputBasinD / UNIT_SCALE;
  
  const basinL = Math.min(rawBasinL, totalL - 0.2);
  const basinW = Math.min(rawBasinW, totalW - 0.2);
  const basinH = rawBasinD / 2;

  const materialColor = config.color === "white" ? "#ffffff" : "#111111";
  const materialProps = { color: materialColor, roughness: 0.9, metalness: 0.1 };
  const basinFloorColor = config.color === "white" ? "#cccccc" : "#000000";
  const basinFloorMaterialProps = { color: basinFloorColor, roughness: 0.9, metalness: 0.1 };

  const edgeMargin = 1;
  let basinX = 0;
  
  // --- 3. CALCUL POSITION Z (PROFONDEUR) DE LA CUVE ---
  let basinZ = 0; // Par défaut centrée

  if (hasSink) {
    // A. Position X (Gauche / Droite / Centre)
    if (config.position === "left") {
        const offset = config.sinkOffset ? config.sinkOffset / UNIT_SCALE : edgeMargin;
        basinX = -totalL / 2 + offset + basinL / 2;
    } else if (config.position === "right") {
        const offset = config.sinkOffset ? config.sinkOffset / UNIT_SCALE : edgeMargin;
        basinX = totalL / 2 - offset - basinL / 2;
    }

    // B. Position Z (Profondeur)
    if (config.tapHole !== "none") {
        // SI ROBINETTERIE : On impose 100mm (1.0) à l'arrière
        // Position Z = (Bord Arrière) + (100mm) + (Moitié Cuve)
        basinZ = -totalW / 2 + 1.0 + basinW / 2;
    } 
    // SINON : basinZ reste à 0 (Cuve centrée)
  }

  const topSurfaceY = hasSink ? rawBasinD / 2 : thickness / 2;
  const floorY = topSurfaceY - basinH;

  // --- 4. POSITION TROU ROBINETTERIE ---
  const holeDiameter = 0.35; 
  const holeRadius = holeDiameter / 2;
  
  let holeX = basinX; 
  let holeZ = 0;

  if (hasSink) {
      if (config.tapHole === "left") holeX = basinX - basinL / 3;
      if (config.tapHole === "right") holeX = basinX + basinL / 3;
      
      if (config.tapHole !== "none") {
          // Le trou est centré dans la zone arrière de 100mm
          // Donc à 50mm (0.5) du bord arrière du plan
          holeZ = -totalW / 2 + 0.5;
          
          // Correction Dosseret : on avance de 6mm
          if (config.rimBack) holeZ += 0.06;
      }
  } else {
      if (config.position === "left") holeX = -totalL / 4;
      if (config.position === "right") holeX = totalL / 4;
      holeZ = -totalW / 4; 
      if (config.rimBack) holeZ += 0.06;
  }

  // --- 5. CALCUL DES PIÈCES DU PLAN (DÉCOUPE) ---
  const leftPlateWidth = basinX - basinL / 2 - -totalL / 2;
  const leftPlateX = -totalL / 2 + leftPlateWidth / 2;
  
  const rightPlateWidth = totalL / 2 - (basinX + basinL / 2);
  const rightPlateX = totalL / 2 - rightPlateWidth / 2;

  // Calcul dynamique des bandes Avant/Arrière selon la position Z de la cuve
  const basinBackEdge = basinZ - basinW / 2;
  const backStripDepth = basinBackEdge - (-totalW / 2); // Espace réel à l'arrière
  const backStripZ = -totalW / 2 + backStripDepth / 2;

  const basinFrontEdge = basinZ + basinW / 2;
  const frontStripDepth = totalW / 2 - basinFrontEdge; // Espace réel à l'avant
  const frontStripZ = totalW / 2 - frontStripDepth / 2;

  const splashRadius = 0.06; 

  return (
    <group>
      {/* PLAN */}
      {!hasSink ? (
        <mesh position={[0, topSurfaceY - thickness / 2, 0]}>
          <boxGeometry args={[totalL, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ) : (
        <group>
          {/* GAUCHE */}
          {leftPlateWidth > 0.001 && (
            <mesh position={[leftPlateX, topSurfaceY - thickness / 2, 0]}>
              <boxGeometry args={[leftPlateWidth, thickness, totalW]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {/* DROITE */}
          {rightPlateWidth > 0.001 && (
            <mesh position={[rightPlateX, topSurfaceY - thickness / 2, 0]}>
              <boxGeometry args={[rightPlateWidth, thickness, totalW]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {/* BANDE ARRIÈRE */}
          {backStripDepth > 0.001 && (
            <mesh position={[basinX, topSurfaceY - thickness / 2, backStripZ]}>
              <boxGeometry args={[basinL, thickness, backStripDepth]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {/* BANDE AVANT */}
          {frontStripDepth > 0.001 && (
            <mesh position={[basinX, topSurfaceY - thickness / 2, frontStripZ]}>
              <boxGeometry args={[basinL, thickness, frontStripDepth]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
        </group>
      )}

      {/* CUVE */}
      {hasSink && (
        <group>
            {/* FOND */}
            <mesh position={[basinX, floorY + wallThickness / 2, basinZ]} key={`floor-${config.color}`}>
                <boxGeometry args={[basinL, wallThickness, basinW]} /> 
                <meshStandardMaterial {...basinFloorMaterialProps} side={2} />
            </mesh>
            
            {/* CÔTÉS (Position Z ajustée avec basinZ) */}
            <mesh position={[basinX, topSurfaceY - basinH / 2, basinZ + basinW / 2 - wallThickness / 2]}>
                <boxGeometry args={[basinL, basinH, wallThickness]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[basinX, topSurfaceY - basinH / 2, basinZ - basinW / 2 + wallThickness / 2]}>
                <boxGeometry args={[basinL, basinH, wallThickness]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[basinX - basinL / 2 + wallThickness / 2, topSurfaceY - basinH / 2, basinZ]}>
                <boxGeometry args={[wallThickness, basinH, basinW - wallThickness * 2]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[basinX + basinL / 2 - wallThickness / 2, topSurfaceY - basinH / 2, basinZ]}>
                <boxGeometry args={[wallThickness, basinH, basinW - wallThickness * 2]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* BONDE D'ÉVACUATION (Centrée sur la cuve) */}
            <mesh position={[basinX, floorY + wallThickness + 0.005, basinZ]}>
                <cylinderGeometry args={[0.22, 0.22, 0.01, 32]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
        </group>
      )}

      {/* DOSSERETS */}
      {config.rims && (
        <>
          {config.rimLeft && (
            <mesh position={[-totalL / 2 + wallThickness / 2, topSurfaceY + (config.rimHeigh / UNIT_SCALE) / 2, 0]}>
                <boxGeometry args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.rimRight && (
            <mesh position={[totalL / 2 - wallThickness / 2, topSurfaceY + (config.rimHeigh / UNIT_SCALE) / 2, 0]}>
                <boxGeometry args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.rimBack && (
            <mesh position={[0, topSurfaceY + (config.rimHeigh / UNIT_SCALE) / 2, -totalW / 2 + wallThickness / 2]}>
                <boxGeometry args={[totalL, config.rimHeigh / UNIT_SCALE, wallThickness]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
        </>
      )}

      {/* RETOMBÉES */}
      {config.aprons && (
        <>
           {config.apronFront && (
             <mesh position={[0, topSurfaceY - apronH / 2, totalW / 2 - wallThickness / 2]}>
                 <boxGeometry args={[totalL, apronH, wallThickness]} />
                 <meshStandardMaterial {...materialProps} />
             </mesh>
           )}
           {config.apronLeft && (
             <mesh position={[-totalL / 2 + wallThickness / 2, topSurfaceY - apronH / 2, 0]}>
                 <boxGeometry args={[wallThickness, apronH, totalW]} />
                 <meshStandardMaterial {...materialProps} />
             </mesh>
           )}
           {config.apronRight && (
             <mesh position={[totalL / 2 - wallThickness / 2, topSurfaceY - apronH / 2, 0]}>
                 <boxGeometry args={[wallThickness, apronH, totalW]} />
                 <meshStandardMaterial {...materialProps} />
             </mesh>
           )}
           {config.apronBack && (
             <mesh position={[0, topSurfaceY - apronH / 2, -totalW / 2 + wallThickness / 2]}>
                 <boxGeometry args={[totalL, apronH, wallThickness]} />
                 <meshStandardMaterial {...materialProps} />
             </mesh>
           )}
        </>
      )}

      {/* GOUTTE D'EAU */}
      {config.splashback && (
        <mesh position={[0, topSurfaceY, totalW / 2 - splashRadius]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[splashRadius, splashRadius, totalL, 32]} />
            <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* TROU ROBINETTERIE */}
      {config.tapHole !== "none" && (
        <mesh position={[holeX, topSurfaceY - thickness / 2, holeZ]}>
            <cylinderGeometry args={[holeRadius, holeRadius, thickness + 0.02, 32]} />
            <meshBasicMaterial color="#000000" />
        </mesh>
      )}
    </group>
  );
};

export default Vasque3D;