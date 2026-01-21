import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

const Vasque3D = ({ config }) => {
  const UNIT_SCALE = 100;

  // --- 1. DÉTECTION ET CONFIG ---
  const currentSinkName = config.sink || "Aucune cuve";
  const isNoSinkName = currentSinkName === "Aucune cuve";
  const isZeroLength = isNoSinkName || config.basinLength === 0;
  const hasSink = !isNoSinkName && !isZeroLength;
  const totalW = config.width / UNIT_SCALE;
  const totalL = config.length / UNIT_SCALE;

  const thickness = 0.4; // Épaisseur totale
  const grooveDepth = 0.3; // Profondeur des rainures
  const baseThickness = 0.1; // Épaisseur du fond restant (0.4 - 0.3)

  const wallThickness = 0.12;
  const apronH =
    config.aprons && config.apronHeight ? config.apronHeight / UNIT_SCALE : 0.4;

  // --- 2. DIMENSIONS ---
  const inputBasinL = isNoSinkName
    ? 0
    : config.basinLength !== undefined
    ? config.basinLength
    : 500;
  const inputBasinW = isNoSinkName
    ? 0
    : config.basinWidth !== undefined
    ? config.basinWidth
    : 350;
  const inputBasinD = isNoSinkName
    ? 0
    : config.depth !== undefined
    ? config.depth
    : 120;

  const innerBasinL = inputBasinL / UNIT_SCALE;
  const innerBasinW = inputBasinW / UNIT_SCALE;
  const innerBasinD = inputBasinD / UNIT_SCALE;

  // Dimensions extérieures du mur
  const outerBasinL = innerBasinL + wallThickness * 2;
  const outerBasinW = innerBasinW + wallThickness * 2;

  const basinL = Math.min(outerBasinL, totalL - 0.02);
  const basinW = Math.min(outerBasinW, totalW - 0.02);

  const wallHeight = innerBasinD;

  // --- CONSTANTES EGOUTTOIR ---
  const DRAINER_LEN = 3.5;
  const GROOVE_W = 0.1;
  const GROOVE_COUNT = 7;
  const TOTAL_DRAINER_WIDTH = 3.5;
  const GAP = (TOTAL_DRAINER_WIDTH - GROOVE_COUNT * GROOVE_W) / 6;
  const DEPTH_END = 0.08;

  // --- COULEURS ---
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
  const drainerColor = config.color === "white" ? "#d0d0d0" : "#000000";

  const edgeMargin = 1;
  let basinX = 0;
  let basinZ = 0;

  if (hasSink) {
    if (config.position === "left") {
      const offset = config.sinkOffset
        ? config.sinkOffset / UNIT_SCALE
        : edgeMargin;
      basinX = -totalL / 2 + offset - 0.12 + basinL / 2;
    } else if (config.position === "right") {
      const offset = config.sinkOffset - 12
        ? config.sinkOffset / UNIT_SCALE
        : edgeMargin;
      basinX = totalL / 2 - offset + 0.12 - basinL / 2;
    }

    if (config.tapHole !== "none") {
      basinZ = -totalW / 2 + 1.0 + basinW / 2;
    }
  }

  // --- 3. HAUTEURS ---
  const sinkTotalHeight = innerBasinD + wallThickness;
  const topSurfaceY = hasSink ? sinkTotalHeight : thickness;
  const floorY = topSurfaceY - wallHeight;

  // --- 4. ROBINETTERIE ---
  const holeDiameter = 0.35;
  const holeRadius = holeDiameter / 2;
  let holeX = basinX;
  let holeZ = 0;

  if (hasSink) {
    const tapOffset =
      (config.tapHoleOffset !== undefined ? config.tapHoleOffset : 50) /
      UNIT_SCALE;
    if (config.tapHole === "left") holeX = basinX - tapOffset;
    if (config.tapHole === "right") holeX = basinX + tapOffset;

    if (config.tapHole !== "none") {
      holeZ = -totalW / 2 + 0.5;
      if (config.rimBack) holeZ += 0.06;
    }
  } else {
    if (config.position === "left") holeX = -totalL / 4;
    if (config.position === "right") holeX = totalL / 4;
    holeZ = -totalW / 4;
    if (config.rimBack) holeZ += 0.06;
  }

  // --- 5. EGOUTTOIR (GÉOMÉTRIE) ---
  const drainerGroup = useMemo(() => {
    if (!config.hasDrainer || !hasSink) return null;

    const geometry = new THREE.CylinderGeometry(
      0,
      GROOVE_W / 2,
      DRAINER_LEN,
      32,
      1,
      false,
      0,
      Math.PI
    );
    geometry.rotateX(-Math.PI / 2);
    geometry.rotateZ(-Math.PI / 2);
    const depthScale = DEPTH_END / (GROOVE_W / 2);
    geometry.scale(1, depthScale, 1);

    const grooves = [];
    const startZ = basinZ - TOTAL_DRAINER_WIDTH / 2 + GROOVE_W / 2;

    for (let i = 0; i < GROOVE_COUNT; i++) {
      const currentZ = startZ + i * (GROOVE_W + GAP);
      let groupX = 0;
      let rotationY = 0;

      if (config.drainerPosition === "left") {
        rotationY = Math.PI / 2;
        groupX = basinX - innerBasinL / 2 - DRAINER_LEN / 2;
      } else {
        rotationY = -Math.PI / 2;
        groupX = basinX + innerBasinL / 2 + DRAINER_LEN / 2;
      }

      grooves.push(
        <mesh
          key={`groove-${i}`}
          geometry={geometry}
          position={[groupX, topSurfaceY + 0.001, currentZ]}
          rotation={[0, rotationY, 0]}
        >
          <meshStandardMaterial
            color={drainerColor}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }
    return <group>{grooves}</group>;
  }, [
    config.hasDrainer,
    config.drainerPosition,
    hasSink,
    basinX,
    basinZ,
    innerBasinL,
    topSurfaceY,
    drainerColor,
  ]);

  // --- SPLASHBACK LOGIC ---
  const splashRadius = 0.06;
  const createSplashGeometry = (
    length,
    radius,
    miterStart,
    miterEnd,
    reverseCut = false
  ) => {
    let currentLength = length;
    if (miterStart) currentLength -= radius;
    if (miterEnd) currentLength -= radius;
    let centerOffset = 0;
    if (miterStart && !miterEnd) centerOffset = radius / 2;
    if (!miterStart && miterEnd) centerOffset = -radius / 2;
    const safeLength = Math.max(0.001, currentLength);
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      safeLength,
      32
    );
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

  const geomFront = useMemo(
    () =>
      !config.splashback || !config.apronFront
        ? null
        : createSplashGeometry(
            totalL,
            splashRadius,
            !!config.apronLeft,
            !!config.apronRight,
            false
          ),
    [
      config.splashback,
      config.apronFront,
      config.apronLeft,
      config.apronRight,
      totalL,
      splashRadius,
    ]
  );
  const geomBack = useMemo(
    () =>
      !config.splashback || !config.apronBack
        ? null
        : createSplashGeometry(
            totalL,
            splashRadius,
            !!config.apronRight,
            !!config.apronLeft,
            false
          ),
    [
      config.splashback,
      config.apronBack,
      config.apronLeft,
      config.apronRight,
      totalL,
      splashRadius,
    ]
  );
  const geomLeft = useMemo(
    () =>
      !config.splashback || !config.apronLeft
        ? null
        : createSplashGeometry(
            totalW,
            splashRadius,
            !!config.apronFront,
            !!config.apronBack,
            true
          ),
    [
      config.splashback,
      config.apronLeft,
      config.apronBack,
      config.apronFront,
      totalW,
      splashRadius,
    ]
  );
  const geomRight = useMemo(
    () =>
      !config.splashback || !config.apronRight
        ? null
        : createSplashGeometry(
            totalW,
            splashRadius,
            !!config.apronBack,
            !!config.apronFront,
            true
          ),
    [
      config.splashback,
      config.apronRight,
      config.apronFront,
      config.apronBack,
      totalW,
      splashRadius,
    ]
  );

  // --- GÉOMÉTRIE ARRONDIE (SHAPES) ---
  const outerRadius = 0.12;
  const innerRadius = 0.15;
  const filletRadius = 0.25;

  const drawTeethedHole = (
    ctx,
    width,
    height,
    radius,
    isDrainer,
    drainerPos
  ) => {
    const x = -width / 2;
    const y = -height / 2;
    const cutDepth = wallThickness;
    const grooveStopY = y + height;
    const grooveYs = [];
    if (isDrainer) {
      const startY = TOTAL_DRAINER_WIDTH / 2 - GROOVE_W / 2;
      for (let i = 0; i < GROOVE_COUNT; i++) {
        grooveYs.push(startY - i * (GROOVE_W + GAP));
      }
    }

    ctx.moveTo(x, y + radius);

    if (isDrainer && drainerPos === "left") {
      const yEnd = y + height - radius;
      for (let i = GROOVE_COUNT - 1; i >= 0; i--) {
        const gCenter = grooveYs[i];
        if (gCenter < grooveStopY) continue;
        const gBot = gCenter - GROOVE_W / 2;
        const gTop = gCenter + GROOVE_W / 2;
        ctx.lineTo(x, gBot);
        ctx.lineTo(x - cutDepth, gBot);
        ctx.lineTo(x - cutDepth, gTop);
        ctx.lineTo(x, gTop);
      }
      ctx.lineTo(x, yEnd);
    } else {
      ctx.lineTo(x, y + height - radius);
    }

    ctx.absarc(
      x + radius,
      y + height - radius,
      radius,
      Math.PI,
      Math.PI / 2,
      true
    );
    ctx.lineTo(x + width - radius, y + height);
    ctx.absarc(
      x + width - radius,
      y + height - radius,
      radius,
      Math.PI / 2,
      0,
      true
    );

    if (isDrainer && drainerPos === "right") {
      const rightX = x + width;
      const yEnd = y + radius;
      for (let i = 0; i < GROOVE_COUNT; i++) {
        const gCenter = grooveYs[i];
        if (gCenter < grooveStopY) break;
        const gTop = gCenter + GROOVE_W / 2;
        const gBot = gCenter - GROOVE_W / 2;
        ctx.lineTo(rightX, gTop);
        ctx.lineTo(rightX + cutDepth, gTop);
        ctx.lineTo(rightX + cutDepth, gBot);
        ctx.lineTo(rightX, gBot);
      }
      ctx.lineTo(rightX, yEnd);
    } else {
      ctx.lineTo(x + width, y + radius);
    }

    ctx.absarc(x + width - radius, y + radius, radius, 0, -Math.PI / 2, true);
    ctx.lineTo(x + radius, y);
    ctx.absarc(x + radius, y + radius, radius, -Math.PI / 2, -Math.PI, true);
  };

  const createPlanDrainerHoles = (shape) => {
    if (config.hasDrainer && hasSink) {
      const SAFETY_GAP = 0.01;
      const startZ = basinZ - TOTAL_DRAINER_WIDTH / 2 + GROOVE_W / 2;
      for (let i = 0; i < GROOVE_COUNT; i++) {
        const currentZ = startZ + i * (GROOVE_W + GAP);
        const shapeY = -currentZ;
        const halfW = GROOVE_W / 2;
        const grooveHole = new THREE.Path();

        if (config.drainerPosition === "left") {
          const xLarge = basinX - innerBasinL / 2;
          const xStart = xLarge - SAFETY_GAP;
          const xPoint = xLarge - DRAINER_LEN;
          grooveHole.moveTo(xStart, shapeY - halfW);
          grooveHole.lineTo(xStart, shapeY + halfW);
          grooveHole.lineTo(xPoint, shapeY);
          grooveHole.lineTo(xStart, shapeY - halfW);
        } else {
          const xLarge = basinX + innerBasinL / 2;
          const xStart = xLarge + SAFETY_GAP;
          const xPoint = xLarge + DRAINER_LEN;
          grooveHole.moveTo(xStart, shapeY - halfW);
          grooveHole.lineTo(xStart, shapeY + halfW);
          grooveHole.lineTo(xPoint, shapeY);
          grooveHole.lineTo(xStart, shapeY - halfW);
        }
        shape.holes.push(grooveHole);
      }
    }
  };

  // 1. GÉOMÉTRIE DU PLAN (MODIFIÉE POUR DOUBLE COUCHE)
  const planComponents = useMemo(() => {
    // Fonction utilitaire pour dessiner le rectangle de base
    const drawBaseRect = (shp) => {
      shp.moveTo(-totalL / 2, -totalW / 2);
      shp.lineTo(-totalL / 2, totalW / 2);
      shp.lineTo(totalL / 2, totalW / 2);
      shp.lineTo(totalL / 2, -totalW / 2);
      shp.lineTo(-totalL / 2, -totalW / 2);
    };

    // Fonction utilitaire pour le trou de la vasque (commun aux deux couches)
    const drawSinkHole = (shp) => {
      if (hasSink) {
        const hole = new THREE.Path();
        const hX = basinX;
        const hY = -basinZ;
        const r = innerRadius;
        const w = innerBasinL;
        const h = innerBasinW;

        hole.moveTo(hX - w / 2, hY - h / 2 + r);
        hole.lineTo(hX - w / 2, hY + h / 2 - r);
        hole.absarc(
          hX - w / 2 + r,
          hY + h / 2 - r,
          r,
          Math.PI,
          Math.PI / 2,
          true
        );
        hole.lineTo(hX + w / 2 - r, hY + h / 2);
        hole.absarc(hX + w / 2 - r, hY + h / 2 - r, r, Math.PI / 2, 0, true);
        hole.lineTo(hX + w / 2, hY - h / 2 + r);
        hole.absarc(hX + w / 2 - r, hY - h / 2 + r, r, 0, -Math.PI / 2, true);
        hole.lineTo(hX - w / 2 + r, hY - h / 2);
        hole.absarc(
          hX - w / 2 + r,
          hY - h / 2 + r,
          r,
          -Math.PI / 2,
          -Math.PI,
          true
        );
        shp.holes.push(hole);
      }
    };

    const extrudeSettings = {
      bevelEnabled: false,
      curveSegments: 32,
    };

    // Si on a un égouttoir, on divise le plan en deux couches
    if (config.hasDrainer && hasSink) {
      // -- 1. Couche Inférieure (BASE) - Pleine, épaisseur 0.1 --
      const shapeBase = new THREE.Shape();
      drawBaseRect(shapeBase);
      drawSinkHole(shapeBase); // Le trou de la vasque traverse aussi le fond

      const geomBase = new THREE.ExtrudeGeometry(shapeBase, {
        ...extrudeSettings,
        depth: baseThickness,
      });
      geomBase.rotateX(-Math.PI / 2);

      // -- 2. Couche Supérieure (TOP) - Avec rainures, épaisseur 0.3 --
      const shapeTop = new THREE.Shape();
      drawBaseRect(shapeTop);
      drawSinkHole(shapeTop);
      createPlanDrainerHoles(shapeTop); // C'est ici qu'on troue les rainures

      const geomTop = new THREE.ExtrudeGeometry(shapeTop, {
        ...extrudeSettings,
        depth: grooveDepth,
      });
      geomTop.rotateX(-Math.PI / 2);

      return { isSplit: true, bottom: geomBase, top: geomTop };
    } else {
      // -- Pas d'égouttoir : Une seule couche de 0.4 --
      const shape = new THREE.Shape();
      drawBaseRect(shape);
      drawSinkHole(shape);
      createPlanDrainerHoles(shape); // Ne fera rien si !hasDrainer

      const geom = new THREE.ExtrudeGeometry(shape, {
        ...extrudeSettings,
        depth: thickness,
      });
      geom.rotateX(-Math.PI / 2);

      return { isSplit: false, full: geom };
    }
  }, [
    totalL,
    totalW,
    hasSink,
    innerBasinL,
    innerBasinW,
    basinX,
    basinZ,
    thickness,
    innerRadius,
    config.hasDrainer,
    config.drainerPosition,
    baseThickness,
    grooveDepth,
  ]);

  // 2. GÉOMÉTRIE DES MURS
  const basinWallGeometry = useMemo(() => {
    if (!hasSink) return null;
    const shape = new THREE.Shape();
    const hole = new THREE.Path();
    drawTeethedHole(
      hole,
      innerBasinL,
      innerBasinW,
      innerRadius,
      config.hasDrainer,
      config.drainerPosition
    );
    shape.holes.push(hole);

    const extrudeSettings = {
      depth: wallHeight,
      bevelEnabled: false,
      curveSegments: 32,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [
    hasSink,
    basinL,
    basinW,
    innerBasinL,
    innerBasinW,
    innerRadius,
    wallHeight,
    config.hasDrainer,
    config.drainerPosition,
  ]);

  // 3. FOND DE CUVE
  const basinFloorGroup = useMemo(() => {
    if (!hasSink) return null;

    const r = 0.12;
    const reduction = 0.24;
    const elevation = 0.12; // Correction : 12mm = 0.012 en échelle de base si 1u=1m, ajusté selon UNIT_SCALE

    const L = basinL - reduction - 2 * r;
    const W = basinW - reduction - 2 * r;

    const centerGeo = new THREE.BoxGeometry(L, r, W);
    centerGeo.translate(0, 0.06, 0);

    const profileShape = new THREE.Shape();
    profileShape.moveTo(0, 0);
    profileShape.lineTo(-r, 0);
    profileShape.absarc(0, 0, r, Math.PI, (3 * Math.PI) / 2, false);

    const extrudeSettings = { bevelEnabled: false, curveSegments: 16 };

    const edgeGeoL = new THREE.ExtrudeGeometry(profileShape, {
      ...extrudeSettings,
      depth: L,
    });
    const edgeGeoW = new THREE.ExtrudeGeometry(profileShape, {
      ...extrudeSettings,
      depth: W,
    });

    const cornerGeo = new THREE.SphereGeometry(
      r,
      32,
      16,
      Math.PI,
      Math.PI / 2,
      Math.PI / 2,
      Math.PI / 2
    );

    return (
      <group>
        <mesh geometry={centerGeo}>
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          geometry={edgeGeoW}
          position={[-L / 2, elevation, -W / 2]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          geometry={edgeGeoW}
          position={[L / 2, elevation, W / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          geometry={edgeGeoL}
          position={[-L / 2, elevation, W / 2]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          geometry={edgeGeoL}
          position={[L / 2, elevation, -W / 2]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>

        <mesh position={[-L / 2, elevation, W / 2]} rotation={[0, Math.PI, 0]}>
          <primitive object={cornerGeo} attach="geometry" />
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          position={[L / 2, elevation, -W / 2]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <primitive object={cornerGeo} attach="geometry" />
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          position={[L / 2, elevation, W / 2]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <primitive object={cornerGeo} attach="geometry" />
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
        <mesh
          position={[-L / 2, elevation, -W / 2]}
          rotation={[0, (-3 * Math.PI) / 2, 0]}
        >
          <primitive object={cornerGeo} attach="geometry" />
          <meshStandardMaterial {...basinFloorMaterialProps} />
        </mesh>
      </group>
    );
  }, [hasSink, basinL, basinW, basinFloorMaterialProps]);

  // 4. CONGÉS INTÉRIEURS
  const basinFilletGroup = useMemo(() => {
    if (!hasSink) return null;
    const r = filletRadius;
    const cornerR = innerRadius;
    const shape = new THREE.Shape();
    shape.moveTo(0, r);
    shape.lineTo(0, 0);
    shape.lineTo(r, 0);
    shape.absarc(r, r, r, 1.5 * Math.PI, Math.PI, true);
    const straightL = Math.max(0.001, innerBasinL - 2 * cornerR);
    const straightW = Math.max(0.001, innerBasinW - 2 * cornerR);
    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false,
      curveSegments: 16,
    };
    const geomStraightL = new THREE.ExtrudeGeometry(shape, {
      ...extrudeSettings,
      depth: straightL,
    });
    const geomStraightW = new THREE.ExtrudeGeometry(shape, {
      ...extrudeSettings,
      depth: straightW,
    });
    const latheCurve = new THREE.Path();
    latheCurve.moveTo(cornerR, r);
    latheCurve.lineTo(cornerR, 0);
    latheCurve.lineTo(cornerR - r, 0);
    latheCurve.absarc(cornerR - r, r, r, 1.5 * Math.PI, 0, false);
    const latheCornerGeo = new THREE.LatheGeometry(
      latheCurve.getPoints(10),
      16,
      0,
      Math.PI / 2
    );
    return (
      <group>
        <mesh
          geometry={geomStraightL}
          position={[straightL / 2, 0, -innerBasinW / 2]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={geomStraightL}
          position={[-straightL / 2, 0, innerBasinW / 2]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={geomStraightW}
          position={[-innerBasinL / 2, 0, -straightW / 2]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={geomStraightW}
          position={[innerBasinL / 2, 0, straightW / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={latheCornerGeo}
          position={[-innerBasinL / 2 + cornerR, 0, -innerBasinW / 2 + cornerR]}
          rotation={[0, Math.PI, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={latheCornerGeo}
          position={[innerBasinL / 2 - cornerR, 0, -innerBasinW / 2 + cornerR]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={latheCornerGeo}
          position={[innerBasinL / 2 - cornerR, 0, innerBasinW / 2 - cornerR]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh
          geometry={latheCornerGeo}
          position={[-innerBasinL / 2 + cornerR, 0, innerBasinW / 2 - cornerR]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
      </group>
    );
  }, [hasSink, innerBasinL, innerBasinW, innerRadius, filletRadius]);

  return (
    <group>
      {/* PLAN AVEC GESTION DOUBLE COUCHE */}
      {planComponents.isSplit ? (
        <>
          {/* Couche Inférieure (Fond plein) : Posée à Y = topSurfaceY - 0.4 */}
          <mesh
            position={[0, topSurfaceY - thickness, 0]}
            geometry={planComponents.bottom}
          >
            <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Couche Supérieure (Trouée) : Posée au dessus, à Y = topSurfaceY - 0.3 */}
          <mesh
            position={[0, topSurfaceY - grooveDepth, 0]}
            geometry={planComponents.top}
          >
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      ) : (
        <mesh
          position={[0, topSurfaceY - thickness, 0]}
          geometry={planComponents.full}
        >
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* CUVE */}
      {hasSink && (
        <group>
          {/* MURS */}
          <mesh
            position={[basinX, topSurfaceY - wallHeight, basinZ]}
            geometry={basinWallGeometry}
          >
            <meshStandardMaterial {...materialProps} side={THREE.DoubleSide} />
          </mesh>

          {/* FOND */}
          <group position={[basinX, floorY - 0.12, basinZ]}>
            {basinFloorGroup}
          </group>

          {/* FILLETS INTÉRIEURS */}
          <group position={[basinX, floorY, basinZ]}>{basinFilletGroup}</group>

          {/* Trou de bonde */}
          <mesh position={[basinX, floorY + 0.005, basinZ]}>
            <cylinderGeometry args={[0.22, 0.22, 0.01, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      )}

      {/* EGOUTTOIR (Les cylindres dans les trous) */}
      {config.hasDrainer && drainerGroup}

      {/* DOSSERETS / RETOMBÉES */}
      {config.rims && (
        <>
          {config.rimLeft && (
            <mesh
              position={[
                -totalL / 2 + wallThickness / 2,
                topSurfaceY + config.rimHeigh / UNIT_SCALE / 2,
                0,
              ]}
            >
              <boxGeometry
                args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]}
              />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.rimRight && (
            <mesh
              position={[
                totalL / 2 - wallThickness / 2,
                topSurfaceY + config.rimHeigh / UNIT_SCALE / 2,
                0,
              ]}
            >
              <boxGeometry
                args={[wallThickness, config.rimHeigh / UNIT_SCALE, totalW]}
              />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.rimBack && (
            <mesh
              position={[
                0,
                topSurfaceY + config.rimHeigh / UNIT_SCALE / 2,
                -totalW / 2 + wallThickness / 2,
              ]}
            >
              <boxGeometry
                args={[totalL, config.rimHeigh / UNIT_SCALE, wallThickness]}
              />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
        </>
      )}

      {config.aprons && (
        <>
          {config.apronFront && (
            <mesh
              position={[
                0,
                topSurfaceY - apronH / 2,
                totalW / 2 - wallThickness / 2,
              ]}
            >
              <boxGeometry args={[totalL, apronH, wallThickness]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.apronLeft && (
            <mesh
              position={[
                -totalL / 2 + wallThickness / 2,
                topSurfaceY - apronH / 2,
                0,
              ]}
            >
              <boxGeometry args={[wallThickness, apronH, totalW]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.apronRight && (
            <mesh
              position={[
                totalL / 2 - wallThickness / 2,
                topSurfaceY - apronH / 2,
                0,
              ]}
            >
              <boxGeometry args={[wallThickness, apronH, totalW]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {config.apronBack && (
            <mesh
              position={[
                0,
                topSurfaceY - apronH / 2,
                -totalW / 2 + wallThickness / 2,
              ]}
            >
              <boxGeometry args={[totalL, apronH, wallThickness]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
        </>
      )}

      {config.splashback && (
        <>
          {geomFront && (
            <mesh
              position={[0, topSurfaceY, totalW / 2 - splashRadius]}
              geometry={geomFront}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {geomBack && (
            <mesh
              position={[0, topSurfaceY, -totalW / 2 + splashRadius]}
              rotation={[0, Math.PI, 0]}
              geometry={geomBack}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {geomLeft && (
            <mesh
              position={[-totalL / 2 + splashRadius, topSurfaceY, 0]}
              rotation={[0, Math.PI / 2, 0]}
              geometry={geomLeft}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {geomRight && (
            <mesh
              position={[totalL / 2 - splashRadius, topSurfaceY, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              geometry={geomRight}
            >
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
        </>
      )}

      {config.tapHole !== "none" && (
        <mesh position={[holeX, topSurfaceY - thickness / 2, holeZ]}>
          <cylinderGeometry
            args={[holeRadius, holeRadius, thickness + 0.02, 32]}
          />
          <meshBasicMaterial color="#000000" />
        </mesh>
      )}
    </group>
  );
};

export default Vasque3D;