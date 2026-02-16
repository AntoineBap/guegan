import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const LogoBackground = ({ logoPath, repeatCount = 10 }) => {
  const { scene, size } = useThree();

  // Charge la texture
  const texture = useTexture(logoPath);

  useEffect(() => {
    if (texture) {
      // 1. IMPORTANT : Activer la répétition (le "tiling")
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // 2. Calcul du ratio de l'écran pour éviter l'étirement
      // Si l'écran est 2x plus large que haut, on doit répéter le logo 2x plus en largeur
      const screenRatio = size.width / size.height;

      // 3. Application de la répétition corrigée
      // X = repeatCount * ratio (pour couvrir la largeur sans étirer)
      // Y = repeatCount
      texture.repeat.set(repeatCount * screenRatio, repeatCount);

      // 4. Réglages de qualité pour éviter que ce soit flou ou scintillant
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16; // Rend le logo plus net sous certains angles
      texture.needsUpdate = true; // Force la mise à jour

      // 5. Appliquer au fond
      const oldBackground = scene.background;
      scene.background = texture;

      return () => {
        scene.background = oldBackground;
      };
    }
  }, [texture, scene, size.width, size.height, repeatCount]);

  return null;
};

export default LogoBackground;
