// Modèle 3D d'une cuve (rectangulaire avec angles en quart de tube, ou bol ovale).
// Composant autonome : sa géométrie n'est recalculée que si la cuve elle-même change.
import React, { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { WALL_THICKNESS, OVAL_LIP_DROP, drawTeethedHole } from "./geometry";

const SinkModel = ({ s, materials }) => {

  const isOval = s.type.toLowerCase().includes("sanitaire");
  const ROUND_RADIUS = 0.4;
  const FLOOR_THICKNESS = 0.12;
  const SHORTEN_BOTTOM = ROUND_RADIUS - WALL_THICKNESS;

  const {
    outerWallGeom,
    innerSkinGeom,
    tubesGeometry,
    cornerGeometry,
    ovalBowlGeom,
  } = useMemo(() => {
    const SHRINK_OFFSET = 0.0;
    const THIN_SKIN = 0.00000000001;
    const WALL_TOP_DROP = 0.1;

    let geomOut, geomIn, tubeGeomSide, tubeGeomFrontBack, cornerGeom, ovalGeom;

    if (isOval) {
      // --- OVAL (SANITAIRE) EGG-SHAPED BOWL ---
      const points = [];
      const segments = 64; // Très lissé pour le bol
      const wR = s.width / 2;
      const wR_out = wR + WALL_THICKNESS;
      const dIn = s.depth;
      const dOut = s.depth + WALL_THICKNESS;

      // Courbe intérieure (du bord supérieur vers le centre en bas)
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * (Math.PI / 2);
        const x = Math.cos(theta) * wR;
        const y = -OVAL_LIP_DROP - Math.sin(theta) * (dIn - OVAL_LIP_DROP);
        points.push(new THREE.Vector2(x, y));
      }

      // Courbe extérieure (du centre en bas remontant vers le bord supérieur)
      for (let i = segments; i >= 0; i--) {
        const theta = (i / segments) * (Math.PI / 2);
        const x = Math.cos(theta) * wR_out;
        const y = -OVAL_LIP_DROP - Math.sin(theta) * (dOut - OVAL_LIP_DROP);

        if (i === 0) {
          // On descend la lèvre externe de 0.01 pour éviter le z-fighting avec le plan
          points.push(new THREE.Vector2(x, -OVAL_LIP_DROP - 0.01));
        } else {
          points.push(new THREE.Vector2(x, y));
        }
      }

      // Ferme le tracé pour avoir un maillage parfait
      points.push(points[0].clone());

      ovalGeom = new THREE.LatheGeometry(points, 64);
    } else {
      // --- RECTANGULAR GEOMETRY ---
      const outerShape = new THREE.Shape();
      const wOut = s.width + WALL_THICKNESS * 2;
      const hOut = s.height + WALL_THICKNESS * 2;
      const rOut = 0.4;

      outerShape.moveTo(-wOut / 2 + rOut, -hOut / 2);
      outerShape.lineTo(wOut / 2 - rOut, -hOut / 2);
      outerShape.absarc(
        wOut / 2 - rOut,
        -hOut / 2 + rOut,
        rOut,
        -Math.PI / 2,
        0,
        false,
      );
      outerShape.lineTo(wOut / 2, hOut / 2 - rOut);
      outerShape.absarc(
        wOut / 2 - rOut,
        hOut / 2 - rOut,
        rOut,
        0,
        Math.PI / 2,
        false,
      );
      outerShape.lineTo(-wOut / 2 + rOut, hOut / 2);
      outerShape.absarc(
        -wOut / 2 + rOut,
        hOut / 2 - rOut,
        rOut,
        Math.PI / 2,
        Math.PI,
        false,
      );
      outerShape.lineTo(-wOut / 2, -hOut / 2 + rOut);
      outerShape.absarc(
        -wOut / 2 + rOut,
        -hOut / 2 + rOut,
        rOut,
        Math.PI,
        -Math.PI / 2,
        false,
      );

      const holeOut = new THREE.Path();
      drawTeethedHole(holeOut, s);
      outerShape.holes.push(holeOut);

      geomOut = new THREE.ExtrudeGeometry(outerShape, {
        depth: s.depth - SHRINK_OFFSET - SHORTEN_BOTTOM - WALL_TOP_DROP,
        bevelEnabled: false,
        curveSegments: 64,
      });
      geomOut.rotateX(-Math.PI / 2);

      const innerShape = new THREE.Shape();
      const r = 0.28;
      const hw = s.width;
      const hh = s.height;
      innerShape.moveTo(-hw / 2, -hh / 2 + r);
      innerShape.lineTo(-hw / 2, hh / 2 - r);
      innerShape.absarc(
        -hw / 2 + r,
        hh / 2 - r,
        r,
        Math.PI,
        Math.PI / 2,
        true,
      );
      innerShape.lineTo(hw / 2 - r, hh / 2);
      innerShape.absarc(hw / 2 - r, hh / 2 - r, r, Math.PI / 2, 0, true);
      innerShape.lineTo(hw / 2, -hh / 2 + r);
      innerShape.absarc(hw / 2 - r, -hh / 2 + r, r, 0, -Math.PI / 2, true);
      innerShape.lineTo(-hw / 2 + r, -hh / 2);
      innerShape.absarc(
        -hw / 2 + r,
        -hh / 2 + r,
        r,
        -Math.PI / 2,
        -Math.PI,
        true,
      );

      const holeIn = new THREE.Path();
      const rIn = Math.max(0.01, r - THIN_SKIN);
      const hwIn = s.width - THIN_SKIN * 2;
      const hhIn = s.height - THIN_SKIN * 2;
      holeIn.moveTo(-hwIn / 2, -hhIn / 2 + rIn);
      holeIn.lineTo(-hwIn / 2, hhIn / 2 - rIn);
      holeIn.absarc(
        -hwIn / 2 + rIn,
        hhIn / 2 - rIn,
        rIn,
        Math.PI,
        Math.PI / 2,
        true,
      );
      holeIn.lineTo(hwIn / 2 - rIn, hhIn / 2);
      holeIn.absarc(
        hwIn / 2 - rIn,
        hhIn / 2 - rIn,
        rIn,
        Math.PI / 2,
        0,
        true,
      );
      holeIn.lineTo(hwIn / 2, -hhIn / 2 + rIn);
      holeIn.absarc(
        hwIn / 2 - rIn,
        -hhIn / 2 + rIn,
        rIn,
        0,
        -Math.PI / 2,
        true,
      );
      holeIn.lineTo(-hwIn / 2 + rIn, -hhIn / 2);
      holeIn.absarc(
        -hwIn / 2 + rIn,
        -hhIn / 2 + rIn,
        rIn,
        -Math.PI / 2,
        -Math.PI,
        true,
      );
      innerShape.holes.push(holeIn);

      geomIn = new THREE.ExtrudeGeometry(innerShape, {
        // S'arrête sous le dessus du plan, comme les murs : au ras du plan, elle bouchait
        // le bout des rainures (le « plat » visible au bout de l'égouttoir)
        depth: s.depth - SHRINK_OFFSET - SHORTEN_BOTTOM - WALL_TOP_DROP,
        bevelEnabled: false,
        curveSegments: 64,
      });
      geomIn.rotateX(-Math.PI / 2);

      const createTubeProfile = () => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, ROUND_RADIUS, 0, Math.PI / 2);
        shape.lineTo(0, ROUND_RADIUS - WALL_THICKNESS);
        shape.absarc(
          0,
          0,
          ROUND_RADIUS - WALL_THICKNESS,
          Math.PI / 2,
          0,
          true,
        );
        shape.closePath();
        return shape;
      };
      const tubeShape = createTubeProfile();

      const cX = s.width / 2 + WALL_THICKNESS - ROUND_RADIUS;
      const cZ = s.height / 2 + WALL_THICKNESS - ROUND_RADIUS;

      const sideDepth = cZ * 2;
      const fbDepth = cX * 2;

      tubeGeomSide = new THREE.ExtrudeGeometry(tubeShape, {
        depth: sideDepth,
        bevelEnabled: false,
        curveSegments: 32,
      });
      tubeGeomSide.translate(0, 0, -sideDepth / 2);

      tubeGeomFrontBack = new THREE.ExtrudeGeometry(tubeShape, {
        depth: fbDepth,
        bevelEnabled: false,
        curveSegments: 32,
      });
      tubeGeomFrontBack.translate(0, 0, -fbDepth / 2);

      const tubePoints = tubeShape.getPoints(10);
      cornerGeom = new THREE.LatheGeometry(
        tubePoints,
        32,
        0,
        Math.PI / 2,
      );
    }

    return {
      outerWallGeom: geomOut,
      innerSkinGeom: geomIn,
      tubesGeometry: { side: tubeGeomSide, frontBack: tubeGeomFrontBack },
      cornerGeometry: cornerGeom,
      ovalBowlGeom: ovalGeom,
    };
    // Constantes de module et champs de `s` listés un par un : pas d'autre dépendance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    s.width,
    s.height,
    s.depth,
    s.type,
    s.hasDrainer,
    s.drainerPosition,
    isOval,
  ]);

  // Libère la mémoire graphique quand la cuve change ou disparaît
  useEffect(
    () => () => {
      [outerWallGeom, innerSkinGeom, tubesGeometry.side, tubesGeometry.frontBack, cornerGeometry, ovalBowlGeom].forEach(
        (g) => g?.dispose(),
      );
    },
    [outerWallGeom, innerSkinGeom, tubesGeometry, cornerGeometry, ovalBowlGeom],
  );

  const floorInternalY = 0.4 - s.depth;


  const tapX =
    s.tapHolePosition === "Gauche"
      ? -s.tapHoleOffsetVal
      : s.tapHolePosition === "Droite"
        ? s.tapHoleOffsetVal
        : 0;

  const tubeCenterX = s.width / 2 + WALL_THICKNESS - ROUND_RADIUS;
  const tubeCenterZ = s.height / 2 + WALL_THICKNESS - ROUND_RADIUS;
  const tubeCenterY = floorInternalY + (ROUND_RADIUS - WALL_THICKNESS);

  return (
    <group position={[s.x, 0, s.z]}>

      {isOval ? (
        <mesh
          geometry={ovalBowlGeom}
          position={[0, 0.4, 0]}
          scale={[1, 1, s.height / s.width]} /* Échelle sur Z pour créer l'ellipse exacte */
        >
          <primitive object={materials.sink} attach="material" />
        </mesh>
      ) : (
        <>
          {/* Murs Verticaux (Vasques Rectangulaires) */}
          <mesh position={[0, tubeCenterY, 0]} geometry={outerWallGeom}>
            <primitive object={materials.sink} attach="material" />
          </mesh>
          <mesh position={[0, tubeCenterY, 0]} geometry={innerSkinGeom}>
            <primitive object={materials.sink} attach="material" />
          </mesh>

          {/* Fond Plat */}
          <mesh position={[0, floorInternalY - FLOOR_THICKNESS / 2, 0]}>
            <boxGeometry
              args={[
                s.width - 2 * (ROUND_RADIUS - WALL_THICKNESS),
                FLOOR_THICKNESS,
                s.height - 2 * (ROUND_RADIUS - WALL_THICKNESS),
              ]}
            />
            <primitive object={materials.floor} attach="material" />
          </mesh>

          {/* 4 QUARTS DE TUBES */}
          <mesh
            geometry={tubesGeometry.side}
            position={[tubeCenterX, tubeCenterY, 0]}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={tubesGeometry.side}
            position={[-tubeCenterX, tubeCenterY, 0]}
            rotation={[0, Math.PI, -Math.PI / 2]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={tubesGeometry.frontBack}
            position={[0, tubeCenterY, -tubeCenterZ]}
            rotation={[0, -Math.PI / 2, Math.PI]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={tubesGeometry.frontBack}
            position={[0, tubeCenterY, tubeCenterZ]}
            rotation={[0, Math.PI / 2, Math.PI]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          {/* 4 COINS */}
          <mesh
            geometry={cornerGeometry}
            position={[tubeCenterX, tubeCenterY, tubeCenterZ]}
            rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 2]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={cornerGeometry}
            position={[tubeCenterX, tubeCenterY, -tubeCenterZ]}
            rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={cornerGeometry}
            position={[-tubeCenterX, tubeCenterY, -tubeCenterZ]}
            rotation={[Math.PI / 2, 0, Math.PI]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>

          <mesh
            geometry={cornerGeometry}
            position={[-tubeCenterX, tubeCenterY, tubeCenterZ]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          >
            <primitive object={materials.sink} attach="material" />
          </mesh>
        </>
      )}

      {/* Bonde (Elle s'aligne automatiquement au centre pour les deux formes) */}
      <mesh
        position={[0, floorInternalY + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.175, 64]} />
        <primitive object={materials.black} attach="material" />
      </mesh>

      {/* Robinet */}
      {s.hasTapHole && (
        <mesh
          position={[tapX, 0.401, -s.height / 2 - 0.4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.175, 64]} />
          <primitive object={materials.black} attach="material" />
        </mesh>
      )}
    </group>
  );
};

// Ne re-rend la cuve que si une caractéristique qui la concerne change
const SINK_KEYS = ["x", "z", "width", "height", "depth", "type", "hasDrainer", "drainerPosition", "hasTapHole", "tapHolePosition", "tapHoleOffsetVal"];
const sameSink = (a, b) => a.materials === b.materials && SINK_KEYS.every((k) => a.s[k] === b.s[k]);

export default memo(SinkModel, sameSink);
