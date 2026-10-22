import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import { UNIT_SCALE } from "./three/geometry";
import "../styles/canvasView.scss";

// Éclairage d'ambiance calculé localement (avant : image HDR « city » téléchargée sur un
// CDN à chaque visite ; si le CDN ne répondait pas, la 3D ne s'affichait jamais).
// Dôme en dégradé : ciel clair au-dessus, sol plus sombre, comme une lumière extérieure
// douce. C'est ce contraste qui détache les faces verticales (chants, dosserets, cuves).
const buildEnvironmentScene = () => {
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 48, 24);
  const top = new THREE.Color(1.45, 1.45, 1.48); // > 1 : ciel lumineux (HDR)
  const horizon = new THREE.Color("#6e7178");
  const ground = new THREE.Color("#2b2a28");
  const colors = [];
  const pos = geo.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10; // -1 (bas) .. 1 (haut)
    if (y >= 0) c.copy(horizon).lerp(top, Math.pow(y, 0.6));
    else c.copy(horizon).lerp(ground, Math.pow(-y, 0.5));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
  scene.add(new THREE.Mesh(geo, mat));
  // Panneau lumineux au-dessus, légèrement vers l'avant (reflet doux sur le plan)
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.2), side: THREE.DoubleSide }),
  );
  panel.position.set(0, 8, 3);
  panel.lookAt(0, 0, 0);
  scene.add(panel);
  return scene;
};

const LocalEnvironment = ({ intensity = 1 }) => {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = buildEnvironmentScene();
    const env = pmrem.fromScene(envScene, 0.04).texture;
    // Objets three.js impératifs fournis par R3F : les modifier est l'usage prévu
    /* eslint-disable react-hooks/immutability */
    scene.environment = env;
    scene.environmentIntensity = intensity;
    /* eslint-enable react-hooks/immutability */
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      envScene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      pmrem.dispose();
    };
  }, [gl, scene, intensity, invalidate]);
  return null;
};

// Cadre automatiquement le plan entier quand ses dimensions changent,
// en gardant l'angle de vue choisi par l'utilisateur.
const CameraFit = ({ length, width }) => {
  const { camera, controls, size, invalidate } = useThree();
  const lastFit = useRef(null);

  useEffect(() => {
    if (!controls || !length || !width) return;
    const key = `${length}x${width}x${size.width}x${size.height}`;
    if (lastFit.current === key) return;
    lastFit.current = key;

    const L = length / UNIT_SCALE;
    const W = width / UNIT_SCALE;
    const aspect = size.width / Math.max(1, size.height);
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    // Distance pour que la largeur (et la profondeur) tiennent dans le cadre, avec une marge
    const dist = Math.max(L / 2 / Math.tan(hHalf), (W * 1.6) / 2 / Math.tan(vHalf)) * 1.12;

    const dir = camera.position.clone().sub(controls.target).normalize();
    // Objets three.js impératifs fournis par R3F : les modifier est l'usage prévu
    /* eslint-disable react-hooks/immutability */
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.minDistance = dist * 0.25;
    controls.maxDistance = dist * 2.5;
    /* eslint-enable react-hooks/immutability */
    controls.update();
    invalidate();
  }, [camera, controls, length, width, size.width, size.height, invalidate]);

  return null;
};

// Rotation avec inertie, mais arrêtée net 0,7 s après le relâchement : en rendu à la
// demande, l'inertie seule ne retombe jamais à zéro et la scène se redessinait en continu.
const SettlingControls = () => {
  const timer = useRef(null);
  const onStart = (e) => {
    clearTimeout(timer.current);
    e.target.enableDamping = true;
  };
  const onEnd = (e) => {
    const controls = e.target;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      controls.enableDamping = false; // remet à zéro la vitesse résiduelle
      controls.update();
    }, 700);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.12}
      enablePan={false}
      enableZoom
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
};

const CanvasView = ({ children, planLength, planWidth }) => (
  <div className="canvas-view">
    <div className="canvas-badge">Visuel non contractuel</div>
    <Canvas
      // Rendu à la demande : plus de 60 images/s quand rien ne bouge
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 6, 10], fov: 45 }}
    >
      <Suspense fallback={null}>
        <LocalEnvironment intensity={0.85} />
        <Stage environment={null} intensity={0.8} adjustCamera={false}>
          {children}
        </Stage>
        <SettlingControls />
        <CameraFit length={planLength} width={planWidth} />
      </Suspense>
    </Canvas>
  </div>
);

export default CanvasView;
