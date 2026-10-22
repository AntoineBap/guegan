import React, { useMemo } from "react";
import * as THREE from "three";
import { computeSinkLayout } from "../utils/sinkLayout";
import { getCorners, outlinePieces, outlinePoints, CORNER_SIDES } from "../utils/planShape";

const cap = (side) => side.charAt(0).toUpperCase() + side.slice(1);

// Bande qui suit un morceau du contour (côté droit ou arc), vue de dessus :
// de `inset` à `inset + thickness` vers l'intérieur du plan, extrudée sur `height`
// à partir de `yBottom`. Sert aux retombées, dosserets et chants mélaminés.
const bandGeometry = (piece, inset, thickness, yBottom, height) => {
  const outer = [];
  const inner = [];
  if (piece.kind === "line") {
    const [nx, nz] = piece.normal;
    for (const [x, z] of piece.points) {
      outer.push([x - nx * inset, z - nz * inset]);
      inner.push([x - nx * (inset + thickness), z - nz * (inset + thickness)]);
    }
  } else {
    const [cx, cz] = piece.center;
    const rOut = piece.radius - inset;
    const rIn = Math.max(0.0001, piece.radius - inset - thickness);
    const n = piece.points.length - 1;
    for (let i = 0; i <= n; i++) {
      const t = piece.t0 + ((piece.t1 - piece.t0) * i) / n;
      outer.push([cx + rOut * Math.cos(t), cz + rOut * Math.sin(t)]);
      inner.push([cx + rIn * Math.cos(t), cz + rIn * Math.sin(t)]);
    }
  }
  const poly = [...outer, ...inner.reverse()];
  const shape = new THREE.Shape();
  // Forme dans le plan (x, -z) : après rotateX(-PI/2), y de la forme devient -z
  shape.moveTo(poly[0][0], -poly[0][1]);
  for (let i = 1; i < poly.length; i++) shape.lineTo(poly[i][0], -poly[i][1]);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, yBottom, 0);
  return geom;
};

const Vasque3D = ({ config }) => {
  const UNIT_SCALE = 100;

  // --- CONFIG GENERALE ---
  const totalW = config.width / UNIT_SCALE;
  const totalL = config.length / UNIT_SCALE;
  const thickness = 0.4;
  const grooveDepth = 0.3;
  const baseThickness = 0.1;
  const wallThickness = 0.12;
  const apronH =
    (config.aprons && config.apronHeight ? config.apronHeight : 40) /
    UNIT_SCALE;

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
  // Position des cuves (calcul partagé avec le configurateur), convertie en unités 3D
  const calculatedSinks = useMemo(
    () =>
      computeSinkLayout(config).map((s) => ({
        ...s,
        width: s.width / UNIT_SCALE,
        height: s.height / UNIT_SCALE,
        depth: s.depth / UNIT_SCALE,
        offsetVal: s.offsetVal / UNIT_SCALE,
        tapHoleOffsetVal: s.tapHoleOffsetVal / UNIT_SCALE,
        x: s.x / UNIT_SCALE,
        z: s.z / UNIT_SCALE,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.sinks, config.length, config.width, config.anchorId],
  );

  const maxBasinDepth = calculatedSinks.reduce(
    (max, s) => (s.valid && s.depth > max ? s.depth : max),
    0,
  );

  const hasAnySink = (config.sinks || []).some(s => s.type && s.type !== "Aucune cuve");
  const hasAprons = config.aprons && (config.apronFront || config.apronLeft || config.apronRight || config.apronBack);

  const elevationY =
    maxBasinDepth + 0.01 > apronH
      ? maxBasinDepth + wallThickness
      : apronH ;

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
      const sortedGrooves = [...grooveYs].sort((a, b) => a - b);
      let penY = y + r;
      sortedGrooves.forEach((gY) => {
        const gBot = gY - GROOVE_W / 2;
        const gTop = gY + GROOVE_W / 2;
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
      const sortedGrooves = [...grooveYs].sort((a, b) => b - a);
      let penY = y + h - r;
      const rightX = x + w;
      sortedGrooves.forEach((gY) => {
        const gTop = gY + GROOVE_W / 2;
        const gBot = gY - GROOVE_W / 2;
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
    // Contour du plan : rectangle, avec des quarts de cercle aux angles arrondis
    const outline = outlinePoints(config.length, config.width, getCorners(config), 64).map(
      ([x, z]) => [x / UNIT_SCALE, z / UNIT_SCALE],
    );
    const drawBaseRect = (shp) => {
      shp.moveTo(outline[0][0], -outline[0][1]);
      for (let i = 1; i < outline.length; i++) shp.lineTo(outline[i][0], -outline[i][1]);
      shp.closePath();
    };
    const drawOneHole = (shp, x, z, w, h, r, isOval) => {
      const hole = new THREE.Path();
      if (isOval) {
        hole.absellipse(x, z, w / 2, h / 2, 0, Math.PI * 2, true);
      } else {
        hole.moveTo(x - w / 2, z - h / 2 + r);
        hole.lineTo(x - w / 2, z + h / 2 - r);
        hole.absarc(x - w / 2 + r, z + h / 2 - r, r, Math.PI, Math.PI / 2, true);
        hole.lineTo(x + w / 2 - r, z + h / 2);
        hole.absarc(x + w / 2 - r, z + h / 2 - r, r, Math.PI / 2, 0, true);
        hole.lineTo(x + w / 2, z - h / 2 + r);
        hole.absarc(x + w / 2 - r, z - h / 2 + r, r, 0, -Math.PI / 2, true);
        hole.lineTo(x - w / 2 + r, z - h / 2);
        hole.absarc(
          x - w / 2 + r,
          z - h / 2 + r,
          r,
          -Math.PI / 2,
          -Math.PI,
          true,
        );
      }
      shp.holes.push(hole);
    };

    const extrudeSettings = { bevelEnabled: false, curveSegments: 64 };
    const hasAnyDrainer = calculatedSinks.some((s) => s.hasDrainer && s.valid);

    const shapeBase = new THREE.Shape();
    drawBaseRect(shapeBase);
    calculatedSinks.forEach((s) => {
      if (s.valid) {
        const isOval = s.type.toLowerCase().includes("sanitaire");
        drawOneHole(shapeBase, s.x, -s.z, s.width, s.height, 0.28, isOval);
      }
    });
    const geomBase = new THREE.ExtrudeGeometry(shapeBase, {
      ...extrudeSettings,
      depth: baseThickness,
    });
    geomBase.rotateX(-Math.PI / 2);

    const shapeTop = new THREE.Shape();
    drawBaseRect(shapeTop);
    calculatedSinks.forEach((s) => {
      if (s.valid) {
        const isOval = s.type.toLowerCase().includes("sanitaire");
        drawOneHole(shapeTop, s.x, -s.z, s.width, s.height, 0.28, isOval);
        if (s.hasDrainer) {
          const isLeft = s.drainerPosition === "left";
          const extraOffset = isOval ? wallThickness : 0;
          const SAFETY_GAP = 0.001;
          const innerEdge = isLeft ? s.x - s.width / 2 : s.x + s.width / 2;
          const drainStartEdge = isLeft
            ? innerEdge - extraOffset - SAFETY_GAP
            : innerEdge + extraOffset + SAFETY_GAP;
          const drainCenter = isLeft
            ? drainStartEdge - DRAINER_LEN / 2
            : drainStartEdge + DRAINER_LEN / 2;
          const { count, totalH } = getDrainerSpec(s.type);
          const startZ = s.z - totalH / 2 + GROOVE_W / 2;
          for (let i = 0; i < count; i++) {
            const currentZ = startZ + i * (GROOVE_W + GAP_DRAIN);
            const shapeY = -currentZ;
            const halfW = GROOVE_W / 2;
            const grooveHole = new THREE.Path();
            const xStart = drainCenter - DRAINER_LEN / 2;
            const xEnd = drainCenter + DRAINER_LEN / 2;
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

    if (hasAnyDrainer) {
      const geomTop = new THREE.ExtrudeGeometry(shapeTop, {
        ...extrudeSettings,
        depth: grooveDepth,
      });
      geomTop.rotateX(-Math.PI / 2);
      return { isSplit: true, bottom: geomBase, top: geomTop };
    } else {
      const geomFull = new THREE.ExtrudeGeometry(shapeTop, {
        ...extrudeSettings,
        depth: thickness,
      });
      geomFull.rotateX(-Math.PI / 2);
      return { isSplit: false, full: geomFull };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalL, totalW, calculatedSinks, thickness, config.corners]);

  const drainerVisuals = useMemo(() => {
    const visuals = [];
    const geometry = new THREE.CylinderGeometry(
      0,
      GROOVE_W / 2,
      DRAINER_LEN,
      64,
      1,
      true,
      0,
      Math.PI,
    );
    geometry.rotateZ(-Math.PI / 2);
    const depthScale = 0.08 / (GROOVE_W / 2);
    geometry.scale(1, depthScale, 1);
    const drainerColor = config.color === "white" ? "#d0d0d0" : "#000000";

    calculatedSinks.forEach((s, idx) => {
      if (s.valid && s.hasDrainer) {
        const isOval = s.type.toLowerCase().includes("sanitaire");
        const extraOffset = isOval ? wallThickness : 0;
        const isLeft = s.drainerPosition === "left";
        const SAFETY_GAP = 0.001;
        const innerEdge = isLeft ? s.x - s.width / 2 : s.x + s.width / 2;
        const drainStartEdge = isLeft
          ? innerEdge - extraOffset - SAFETY_GAP
          : innerEdge + extraOffset + SAFETY_GAP;
        const drainCenter = isLeft
          ? drainStartEdge - DRAINER_LEN / 2
          : drainStartEdge + DRAINER_LEN / 2;
        const { count, totalH } = getDrainerSpec(s.type);
        const startZ = s.z - totalH / 2 + GROOVE_W / 2;
        const rotY = isLeft ? Math.PI : 0;
        for (let i = 0; i < count; i++) {
          const currentZ = startZ + i * (GROOVE_W + GAP_DRAIN);
          visuals.push(
            <mesh
              key={`${idx}-${i}`}
              geometry={geometry}
              position={[drainCenter, 0.401, currentZ]}
              rotation={[0, rotY, 0]}
            >
              <meshStandardMaterial
                color={drainerColor}
                roughness={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>,
          );
        }
      }
    });
    return <group>{visuals}</group>;
  }, [calculatedSinks, config.color]);

  const SingleSinkGeometry = ({ s }) => {
    if (!s.valid) return null;

    const isOval = s.type.toLowerCase().includes("sanitaire");
    const ROUND_RADIUS = 0.4;
    const FLOOR_THICKNESS = 0.12;
    const SHORTEN_BOTTOM = ROUND_RADIUS - wallThickness;

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
        const wR_out = wR + wallThickness;
        const dIn = s.depth;
        const dOut = s.depth + wallThickness;

        // Courbe intérieure (du bord supérieur vers le centre en bas)
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * (Math.PI / 2);
          const x = Math.cos(theta) * wR;
          const y = -Math.sin(theta) * dIn;
          points.push(new THREE.Vector2(x, y));
        }

        // Courbe extérieure (du centre en bas remontant vers le bord supérieur)
        for (let i = segments; i >= 0; i--) {
          const theta = (i / segments) * (Math.PI / 2);
          const x = Math.cos(theta) * wR_out;
          const y = -Math.sin(theta) * dOut;

          if (i === 0) {
            // On descend la lèvre externe de 0.01 pour éviter le z-fighting avec le plan
            points.push(new THREE.Vector2(x, -0.01));
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
        const wOut = s.width + wallThickness * 2;
        const hOut = s.height + wallThickness * 2;
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
          depth: s.depth - SHRINK_OFFSET - SHORTEN_BOTTOM,
          bevelEnabled: false,
          curveSegments: 64,
        });
        geomIn.rotateX(-Math.PI / 2);

        const createTubeProfile = () => {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, ROUND_RADIUS, 0, Math.PI / 2);
          shape.lineTo(0, ROUND_RADIUS - wallThickness);
          shape.absarc(
            0,
            0,
            ROUND_RADIUS - wallThickness,
            Math.PI / 2,
            0,
            true,
          );
          shape.closePath();
          return shape;
        };
        const tubeShape = createTubeProfile();

        const cX = s.width / 2 + wallThickness - ROUND_RADIUS;
        const cZ = s.height / 2 + wallThickness - ROUND_RADIUS;

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
    }, [
      s.width,
      s.height,
      s.depth,
      s.type,
      s.hasDrainer,
      s.drainerPosition,
      wallThickness,
      isOval,
    ]);

    const floorInternalY = 0.4 - s.depth;

    const materialProps = {
      color: config.color === "white" ? "#fff" : "#111",
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    };

    const tapX =
      s.tapHolePosition === "Gauche"
        ? -s.tapHoleOffsetVal
        : s.tapHolePosition === "Droite"
          ? s.tapHoleOffsetVal
          : 0;

    const tubeCenterX = s.width / 2 + wallThickness - ROUND_RADIUS;
    const tubeCenterZ = s.height / 2 + wallThickness - ROUND_RADIUS;
    const tubeCenterY = floorInternalY + (ROUND_RADIUS - wallThickness);

    return (
      <group position={[s.x, 0, s.z]}>
        
        {isOval ? (
          <mesh
            geometry={ovalBowlGeom}
            position={[0, 0.4, 0]}
            scale={[1, 1, s.height / s.width]} /* Échelle sur Z pour créer l'ellipse exacte */
          >
            <meshStandardMaterial {...materialProps} />
          </mesh>
        ) : (
          <>
            {/* Murs Verticaux (Vasques Rectangulaires) */}
            <mesh position={[0, tubeCenterY, 0]} geometry={outerWallGeom}>
              <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, tubeCenterY, 0]} geometry={innerSkinGeom}>
              <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* Fond Plat */}
            <mesh position={[0, floorInternalY - FLOOR_THICKNESS / 2, 0]}>
              <boxGeometry
                args={[
                  s.width - 2 * (ROUND_RADIUS - wallThickness),
                  FLOOR_THICKNESS,
                  s.height - 2 * (ROUND_RADIUS - wallThickness),
                ]}
              />
              <meshStandardMaterial
                color={config.color === "white" ? "#ccc" : "#000"}
                roughness={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 4 QUARTS DE TUBES */}
            <mesh
              geometry={tubesGeometry.side}
              position={[tubeCenterX, tubeCenterY, 0]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={tubesGeometry.side}
              position={[-tubeCenterX, tubeCenterY, 0]}
              rotation={[0, Math.PI, -Math.PI / 2]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={tubesGeometry.frontBack}
              position={[0, tubeCenterY, -tubeCenterZ]}
              rotation={[0, -Math.PI / 2, Math.PI]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={tubesGeometry.frontBack}
              position={[0, tubeCenterY, tubeCenterZ]}
              rotation={[0, Math.PI / 2, Math.PI]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 4 COINS */}
            <mesh
              geometry={cornerGeometry}
              position={[tubeCenterX, tubeCenterY, tubeCenterZ]}
              rotation={[Math.PI / 2, Math.PI / 2, Math.PI / 2]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={cornerGeometry}
              position={[tubeCenterX, tubeCenterY, -tubeCenterZ]}
              rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={cornerGeometry}
              position={[-tubeCenterX, tubeCenterY, -tubeCenterZ]}
              rotation={[Math.PI / 2, 0, Math.PI]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh
              geometry={cornerGeometry}
              position={[-tubeCenterX, tubeCenterY, tubeCenterZ]}
              rotation={[Math.PI / 2, 0, Math.PI / 2]}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>
          </>
        )}

        {/* Bonde (Elle s'aligne automatiquement au centre pour les deux formes) */}
        <mesh
          position={[0, floorInternalY + 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.175, 64]} />
          <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
        </mesh>

        {/* Robinet */}
        {s.hasTapHole && (
          <mesh
            position={[tapX, 0.401, -s.height / 2 - 0.4]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.175, 64]} />
            <meshBasicMaterial color="black" side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    );
  };

  // --- SPLASHBACK GEOMETRY ---
  const splashRadius = 0.06;
  const createSplashGeometry = (
    length,
    radius,
    miterStart,
    miterEnd,
    reverseCut = false,
  ) => {
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

  // --- BORDS (retombées, dosserets, chants, anti-goutte) ---
  // Tout est construit à partir du contour : un arc d'angle arrondi reçoit la retombée
  // ou le dosseret dès qu'un des deux côtés qu'il relie en a un.
  const MELA_H = 0.28; // 28 mm de mélaminé hydrofuge sous la résine
  const edgeGeometries = useMemo(() => {
    const corners = getCorners(config);
    const pieces = outlinePieces(config.length, config.width, corners, 48).map((p) => ({
      ...p,
      points: p.points?.map(([x, z]) => [x / UNIT_SCALE, z / UNIT_SCALE]),
      point: p.point && [p.point[0] / UNIT_SCALE, p.point[1] / UNIT_SCALE],
      center: p.center && [p.center[0] / UNIT_SCALE, p.center[1] / UNIT_SCALE],
      radius: p.radius && p.radius / UNIT_SCALE,
    }));

    const sideHas = (prefix, side) => !!config[`${prefix}${cap(side)}`];
    const apronOn = (side) => !!config.aprons && sideHas("apron", side);
    const rimOn = (side) => !!config.rims && side !== "front" && sideHas("rim", side);
    const pieceHas = (piece, test) =>
      piece.kind === "line" ? test(piece.side) : CORNER_SIDES[piece.corner].some(test);

    const rimH = (config.rimHeigh || 100) / UNIT_SCALE;
    const EPS = 0.002;
    const out = { aprons: [], rims: [], melas: [], splashes: [] };

    pieces.forEach((piece, i) => {
      if (piece.kind === "corner") return;
      const prev = pieces[(i + pieces.length - 1) % pieces.length];
      const next = pieces[(i + 1) % pieces.length];
      // À un angle vif : le côté qui se trouve de l'autre côté de cet angle
      const otherSide = (cornerPiece) =>
        cornerPiece.kind === "corner"
          ? CORNER_SIDES[cornerPiece.corner].find((sd) => sd !== piece.side)
          : null;

      const hasApron = pieceHas(piece, apronOn);
      if (hasApron) out.aprons.push(bandGeometry(piece, 0, wallThickness, 0.4 - apronH, apronH));
      if (pieceHas(piece, rimOn)) out.rims.push(bandGeometry(piece, 0, wallThickness, 0.4, rimH));

      // Chant mélaminé visible là où il n'y a pas de retombée (jamais à l'avant)
      if (!hasApron && piece.side !== "front") {
        let mela = piece;
        if (piece.kind === "line") {
          // À un angle vif, la retombée du côté voisin couvre déjà l'épaisseur du mur
          const [a, b] = piece.points;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const ux = (b[0] - a[0]) / len;
          const uz = (b[1] - a[1]) / len;
          const cropStart = otherSide(prev) && apronOn(otherSide(prev)) ? wallThickness : 0;
          const cropEnd = otherSide(next) && apronOn(otherSide(next)) ? wallThickness : 0;
          mela = {
            ...piece,
            points: [
              [a[0] + ux * cropStart, a[1] + uz * cropStart],
              [b[0] - ux * cropEnd, b[1] - uz * cropEnd],
            ],
          };
        }
        out.melas.push(bandGeometry(mela, -EPS, 0.003, 0, MELA_H));
      }

      // Anti-goutte : bourrelet sur l'arête supérieure, là où il y a une retombée
      if (config.splashback && hasApron) {
        if (piece.kind === "line") {
          const [a, b] = piece.points;
          const dx = b[0] - a[0];
          const dz = b[1] - a[1];
          const splashSide = (sd) => !!sd && apronOn(sd);
          const geom = createSplashGeometry(
            Math.hypot(dx, dz),
            splashRadius,
            splashSide(otherSide(prev)),
            splashSide(otherSide(next)),
          );
          const [nx, nz] = piece.normal;
          out.splashes.push({
            geom,
            position: [(a[0] + b[0]) / 2 - nx * splashRadius, 0.4, (a[1] + b[1]) / 2 - nz * splashRadius],
            rotation: [0, Math.atan2(-dz, dx), 0],
          });
        } else {
          // Quart de tore : même section que le bourrelet droit, raccord tangent
          const geom = new THREE.TorusGeometry(piece.radius - splashRadius, splashRadius, 32, 48, Math.PI / 2);
          geom.rotateX(Math.PI / 2);
          geom.rotateY(-Math.min(piece.t0, piece.t1));
          out.splashes.push({ geom, position: [piece.center[0], 0.4, piece.center[1]], rotation: [0, 0, 0] });
        }
      }
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.length, config.width, config.corners, config.aprons, config.apronFront, config.apronBack,
    config.apronLeft, config.apronRight, config.apronHeight, config.rims, config.rimHeigh,
    config.rimBack, config.rimLeft, config.rimRight, config.splashback,
  ]);

  const materialProps = {
    color: config.color === "white" ? "#ffffff" : "#111111",
    roughness: 0.9,
    metalness: 0.1,
  };

  return (
    <group position={[0, elevationY, 0]}>
      {planComponents.isSplit ? (
        <>
          <mesh position={[0, 0, 0]} geometry={planComponents.bottom}>
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh
            position={[0, 0.4 - grooveDepth, 0]}
            geometry={planComponents.top}
          >
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0, 0]} geometry={planComponents.full}>
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {calculatedSinks.map((s, i) => (
        <SingleSinkGeometry key={i} s={s} />
      ))}
      {drainerVisuals}

      {edgeGeometries.aprons.map((g, i) => (
        <mesh key={`apron-${i}`} geometry={g}>
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {edgeGeometries.rims.map((g, i) => (
        <mesh key={`rim-${i}`} geometry={g}>
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
      {edgeGeometries.melas.map((g, i) => (
        <mesh key={`mela-${i}`} geometry={g}>
          <meshStandardMaterial color="#c8bb72" roughness={0.85} metalness={0.05} />
        </mesh>
      ))}
      {edgeGeometries.splashes.map((sp, i) => (
        <mesh key={`splash-${i}`} geometry={sp.geom} position={sp.position} rotation={sp.rotation}>
          <meshStandardMaterial {...materialProps} />
        </mesh>
      ))}
    </group>
  );
};

export default Vasque3D;