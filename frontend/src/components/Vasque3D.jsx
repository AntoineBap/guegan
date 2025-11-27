import { Geometry, Base, Subtraction } from '@react-three/csg';

const Vasque3D = ({ config }) => {

  const totalW = config.width / 10;
  const totalL = config.length / 10;
  const height = config.depth / 10;
  const thickness = 0.15;
  const materialColor = config.color === 'white' ? '#ffffff' : '#111111';
  const materialProps = {
    color: materialColor,
    roughness: config.color === 'white' ? 0.2 : 0.3,
    metalness: 0.1,
  };

  const basinMargin = 0.8;
  // Note: Ici je fixe la taille du bassin à un standard (ex: 50cm) ou proportionnel
  // Pour l'exemple, disons que le bassin fait toujours 50cm de large ou max la moitié du plan
  // Ajustez cette valeur si vous voulez un bassin plus grand/petit
  const basinL = Math.min(5, totalL - 2); // Le bassin fait 50cm (5 unités) ou s'adapte si le plan est petit
  const basinW = totalW - (basinMargin * 2);
  const basinH = height - 0.2;

  // --- CALCUL DE LA POSITION DU BASSIN (X) ---
  const edgeMargin = 1; // 10 cm du bord demandé
  let basinX = 0; // Centre par défaut

  if (config.position === 'left') {
    // Bord Gauche du plan (-totalL/2) + Marge (1) + Demi-longueur du bassin (pour avoir le centre)
    basinX = (-totalL / 2) + edgeMargin + (basinL / 2);
  } else if (config.position === 'right') {
    // Bord Droit du plan (totalL/2) - Marge (1) - Demi-longueur du bassin
    basinX = (totalL / 2) - edgeMargin - (basinL / 2);
  }
  // Si 'center', basinX reste à 0

  const floorY = (height / 2) - basinH;

  // --- POSITION ROBINETTERIE ---
  let holeXGlobal = basinX;
  if (config.tapHole === 'left') holeXGlobal = basinX - (basinL/4);
  if (config.tapHole === 'right') holeXGlobal = basinX + (basinL/4);

  // --- CALCUL DYNAMIQUE DES PLAQUES SUPERIEURES (PLAN DE TRAVAIL) ---
  // On doit combler l'espace entre le bord du plan et le bord du bassin
  
  // 1. Plaque Gauche : Du bord gauche total jusqu'au début du bassin
  const leftPlateWidth = (basinX - basinL/2) - (-totalL/2);
  const leftPlateX = (-totalL/2) + (leftPlateWidth / 2);

  // 2. Plaque Droite : De la fin du bassin jusqu'au bord droit total
  const rightPlateWidth = (totalL/2) - (basinX + basinL/2);
  const rightPlateX = (totalL/2) - (rightPlateWidth / 2);

  return (
    <group>
      {/* --- 1. PLAN DE TRAVAIL (Ajustement dynamique) --- */}
      
      {/* Plaque Gauche (Variable) */}
      {leftPlateWidth > 0 && (
        <mesh position={[leftPlateX, height/2 - thickness/2, 0]}>
          <boxGeometry args={[leftPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* Plaque Droite (Variable) */}
      {rightPlateWidth > 0 && (
        <mesh position={[rightPlateX, height/2 - thickness/2, 0]}>
          <boxGeometry args={[rightPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* Bandes Avant et Arrière (Qui suivent le bassin) */}
      <mesh position={[basinX, height/2 - thickness/2, totalW/2 - basinMargin/2]}>
         <boxGeometry args={[basinL, thickness, basinMargin]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX, height/2 - thickness/2, -totalW/2 + basinMargin/2]}>
         <boxGeometry args={[basinL, thickness, basinMargin]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>


      {/* --- 2. FOND DE LA CUVE (Suit basinX) --- */}
      <mesh position={[basinX, floorY + thickness/2, 0]} key={config.color}>
        <meshStandardMaterial {...materialProps} side={2} />
        <Geometry>
            <Base>
                <boxGeometry args={[basinL, thickness, basinW]} />
            </Base>
            {config.tapHole !== 'none' && (
                <Subtraction position={[holeXGlobal - basinX, 0, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, thickness + 1, 48]} />
                </Subtraction>
            )}
        </Geometry>
      </mesh>

      {/* --- 3. PAROIS DE LA CUVE (Suivent basinX) --- */}
      <mesh position={[basinX, height/2 - basinH/2, basinW/2 - thickness/2]}>
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX, height/2 - basinH/2, -basinW/2 + thickness/2]}>
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX - basinL/2 + thickness/2, height/2 - basinH/2, 0]}>
        <boxGeometry args={[thickness, basinH, basinW - thickness*2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX + basinL/2 - thickness/2, height/2 - basinH/2, 0]}>
        <boxGeometry args={[thickness, basinH, basinW - thickness*2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* --- 4. EXTRAS (Dosseret & Rebords restent fixes par rapport au plan total) --- */}
      {config.splashback && (
        <mesh position={[0, height/2 + (config.splashbackHeight/10)/2, -totalW/2 + thickness/2]}>
          <boxGeometry args={[totalL, config.splashbackHeight/10, thickness]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}
      {config.sideRims && (
        <>
          <mesh position={[-totalL/2 + thickness/2, height/2 + (config.sideRimHeight/10)/2, 0]}>
            <boxGeometry args={[thickness, config.sideRimHeight/10, totalW]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[totalL/2 - thickness/2, height/2 + (config.sideRimHeight/10)/2, 0]}>
            <boxGeometry args={[thickness, config.sideRimHeight/10, totalW]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      )}

      {/* --- 5. ANNEAU DORÉ --- */}
      {config.tapHole !== 'none' && (
        <group position={[holeXGlobal, floorY + thickness + 0.005, 0]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.25, 0.03, 16, 32]} /> 
             <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Vasque3D;