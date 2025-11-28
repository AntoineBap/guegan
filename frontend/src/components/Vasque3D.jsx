const Vasque3D = ({ config }) => {
  // dimensions du plan de travail
  const totalW = config.width / 10;
  const totalL = config.length / 10;
  const thickness = 0.15;

  //  dimensions de la cuve
  const rawBasinL = (config.basinLength || 50) / 10;
  const rawBasinW = (config.basinWidth || 35) / 10;
  const rawBasinD = (config.depth || 12) / 10;

  // securite pour que la cuve ne soit pas plus grande que le plan de travail
  const basinL = Math.min(rawBasinL, totalL - 0.2);
  const basinW = Math.min(rawBasinW, totalW - 0.2);
  const basinH = rawBasinD / 2 ; // la profondeur de la cuve

  const materialColor = config.color === "white" ? "#ffffff" : "#111111";
  const materialProps = {
    color: materialColor,
    roughness: 0.9,
    metalness: 0.1,
  };

  const basinFloorColor = config.color === "white" ? "#cccccc" : "#000000";
  const basinFloorMaterialProps = {
    color: basinFloorColor,
    roughness: 0.9,
    metalness: 0.1,
  };

  // calculs de position
  const edgeMargin = 1;
  let basinX = 0;

  if (config.position === "left") {
    basinX = -totalL / 2 + edgeMargin + basinL / 2;
  } else if (config.position === "right") {
    basinX = totalL / 2 - edgeMargin - basinL / 2;
  }
  // Center : 0

  // Hauteur du fond de la cuve par rapport au centre du plan
  // Le plan est centré en Y = planHeight/2. Le dessus est à planHeight.
  // On positionne par rapport au "haut" du plan pour que ça soit intuitif
  const topSurfaceY = rawBasinD / 2;
  const floorY = topSurfaceY - basinH;

  // Position Robinet
  let holeXGlobal = basinX;
  if (config.tapHole === "left") holeXGlobal = basinX - basinL / 4;
  if (config.tapHole === "right") holeXGlobal = basinX + basinL / 4;

  // --- CALCUL DYNAMIQUE DES PIÈCES DU PLAN ---

  // 1. Plaques Latérales (Gauche / Droite du bassin)
  const leftPlateWidth = basinX - basinL / 2 - -totalL / 2;
  const leftPlateX = -totalL / 2 + leftPlateWidth / 2;

  const rightPlateWidth = totalL / 2 - (basinX + basinL / 2);
  const rightPlateX = totalL / 2 - rightPlateWidth / 2;

  // 2. Bandes Avant / Arrière (Calculées selon la largeur de la cuve choisie)
  // Espace restant total sur la largeur divisé par 2
  const zMargin = (totalW - basinW) / 2;

  // Position Z des bandes
  const frontStripZ = basinW / 2 + zMargin / 2;
  const backStripZ = -basinW / 2 - zMargin / 2;

  return (
    <group>
      {/* --- PLAN DE TRAVAIL (ASSEMBLAGE) --- */}

      {/* A. Plaque Gauche */}
      {leftPlateWidth > 0.01 && (
        <mesh position={[leftPlateX, topSurfaceY - thickness / 2, 0]}>
          <boxGeometry args={[leftPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* B. Plaque Droite */}
      {rightPlateWidth > 0.01 && (
        <mesh position={[rightPlateX, topSurfaceY - thickness / 2, 0]}>
          <boxGeometry args={[rightPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* C. Bandes Avant et Arrière (s'adaptent à la largeur de la cuve) */}
      {zMargin > 0.01 && (
        <>
          {/* Bande Arrière (Vers -Z) */}
          <mesh position={[basinX, topSurfaceY - thickness / 2, backStripZ]}>
            <boxGeometry args={[basinL, thickness, zMargin]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Bande Avant (Vers +Z) */}
          <mesh position={[basinX, topSurfaceY - thickness / 2, frontStripZ]}>
            <boxGeometry args={[basinL, thickness, zMargin]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      )}

      {/* --- FOND DE LA CUVE (SIMPLE - SANS BOOLEX) --- */}
      {/* Nous remplaçons le CSG par une simple boîte contrastée pour éviter les erreurs de dépendance */}
      <mesh
        position={[basinX, floorY + thickness / 2, 0]}
        key={`floor-${config.color}`}
      >
        <boxGeometry args={[basinL, thickness, basinW]} />
        <meshStandardMaterial {...basinFloorMaterialProps} side={2} />
      </mesh>

      {/* --- PAROIS DE LA CUVE --- */}
      {/* Paroi Droite (+Z) */}
      <mesh
        position={[
          basinX,
          topSurfaceY - basinH / 2,
          basinW / 2 - thickness / 2,
        ]}
      >
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Paroi Gauche (-Z) */}
      <mesh
        position={[
          basinX,
          topSurfaceY - basinH / 2,
          -basinW / 2 + thickness / 2,
        ]}
      >
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Paroi Latérale Gauche (-X) */}
      <mesh
        position={[
          basinX - basinL / 2 + thickness / 2,
          topSurfaceY - basinH / 2,
          0,
        ]}
      >
        <boxGeometry args={[thickness, basinH, basinW - thickness * 2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Paroi Latérale Droite (+X) */}
      <mesh
        position={[
          basinX + basinL / 2 - thickness / 2,
          topSurfaceY - basinH / 2,
          0,
        ]}
      >
        <boxGeometry args={[thickness, basinH, basinW - thickness * 2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* --- EXTRAS (Dosseret & Rebords) --- */}
      {config.sideRims && (
        <>
          <mesh
            position={[
              -totalL / 2 + thickness / 2,
              topSurfaceY + config.sideRimHeight / 20,
              0,
            ]}
          >
            <boxGeometry
              args={[thickness, config.sideRimHeight / 10, totalW]}
            />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh
            position={[
              totalL / 2 - thickness / 2,
              topSurfaceY + config.sideRimHeight / 10 / 2,
              0,
            ]}
          >
            <boxGeometry
              args={[thickness, config.sideRimHeight / 10, totalW]}
            />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh
            position={[
              0,
              topSurfaceY + config.sideRimHeight / 10 / 2,
              -totalW / 2 + thickness / 2,
            ]}
          >
            <boxGeometry
              args={[totalL, config.sideRimHeight / 10, thickness]}
            />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      )}

      {/* --- ANNEAU DORÉ --- */}
      {config.tapHole !== "none" && (
        <group position={[holeXGlobal, floorY + thickness + 0.005, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.03, 16, 32]} />
            <meshStandardMaterial
              color="#D4AF37"
              metalness={1}
              roughness={0.1}
            />
          </mesh>
          {/* Simulation visuelle du trou (Cylindre noir plat) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
             <circleGeometry args={[0.22, 32]} />
             <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Vasque3D;