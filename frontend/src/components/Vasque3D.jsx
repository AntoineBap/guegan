import React, { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { computeSinkLayout } from "../utils/sinkLayout";
import { getCorners, outlinePieces, outlinePoints, CORNER_SIDES } from "../utils/planShape";
import SinkModel from "./three/SinkModel";
import { sameModel } from "./three/modelKeys";
import {
  UNIT_SCALE,
  PLAN_THICKNESS,
  GROOVE_DEPTH,
  BASE_THICKNESS,
  WALL_THICKNESS,
  MELA_H,
  SPLASH_RADIUS,
  DRAINER_LEN,
  GROOVE_W,
  GAP_DRAIN,
  getDrainerSpec,
  cap,
  bandGeometry,
  createSplashGeometry,
} from "./three/geometry";

// Fusionne des géométries (indexées ou non) en une seule ; libère les morceaux
const mergeAll = (geoms) => {
  if (!geoms.length) return null;
  const parts = geoms.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    flat.clearGroups();
    return flat;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
};

// Libère la mémoire graphique d'un ensemble de géométries / matériaux quand il est remplacé
const useDispose = (resources) =>
  useEffect(
    () => () => Object.values(resources || {}).forEach((r) => r?.dispose?.()),
    [resources],
  );

// Matériaux partagés par tout le modèle (avant : un matériau neuf par maillage)
const createMaterials = (color) => {
  const white = color === "white";
  return {
    plan: new THREE.MeshStandardMaterial({ color: white ? "#ffffff" : "#111111", roughness: 0.9, metalness: 0.1 }),
    sink: new THREE.MeshStandardMaterial({ color: white ? "#ffffff" : "#111111", roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: white ? "#cccccc" : "#000000", roughness: 0.9, side: THREE.DoubleSide }),
    drainer: new THREE.MeshStandardMaterial({ color: white ? "#d0d0d0" : "#000000", roughness: 0.6, side: THREE.DoubleSide }),
    mela: new THREE.MeshStandardMaterial({ color: "#c8bb72", roughness: 0.85, metalness: 0.05 }),
    black: new THREE.MeshBasicMaterial({ color: "#000000", side: THREE.DoubleSide }),
  };
};

const Vasque3D = ({ config }) => {
  const totalW = config.width / UNIT_SCALE;
  const totalL = config.length / UNIT_SCALE;
  const apronH = (config.aprons && config.apronHeight ? config.apronHeight : 40) / UNIT_SCALE;

  const materials = useMemo(() => createMaterials(config.color), [config.color]);
  useDispose(materials);

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

  const maxBasinDepth = calculatedSinks.reduce((max, s) => (s.valid && s.depth > max ? s.depth : max), 0);
  // Le plan est surélevé pour que cuves et retombées restent au-dessus du sol
  const elevationY = maxBasinDepth + 0.01 > apronH ? maxBasinDepth + WALL_THICKNESS : apronH;

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
      depth: BASE_THICKNESS,
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
          const extraOffset = isOval ? WALL_THICKNESS : 0;
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
            // Côté cuve, la rainure se termine en demi-cercle (bout en cuillère)
            if (isLeft) {
              const xe = xEnd - halfW;
              grooveHole.moveTo(xStart, shapeY);
              grooveHole.lineTo(xe, shapeY + halfW);
              grooveHole.absarc(xe, shapeY, halfW, Math.PI / 2, -Math.PI / 2, true);
              grooveHole.lineTo(xStart, shapeY);
            } else {
              const xs = xStart + halfW;
              grooveHole.moveTo(xEnd, shapeY);
              grooveHole.lineTo(xs, shapeY + halfW);
              grooveHole.absarc(xs, shapeY, halfW, Math.PI / 2, (3 * Math.PI) / 2, false);
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
        depth: GROOVE_DEPTH,
      });
      geomTop.rotateX(-Math.PI / 2);
      return { isSplit: true, bottom: geomBase, top: geomTop };
    } else {
      const geomFull = new THREE.ExtrudeGeometry(shapeTop, {
        ...extrudeSettings,
        depth: PLAN_THICKNESS,
      });
      geomFull.rotateX(-Math.PI / 2);
      return { isSplit: false, full: geomFull };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalL, totalW, calculatedSinks, config.corners]);
  useDispose(planComponents);

  // --- RAINURES D'ÉGOUTTOIR ---
  // Demi-cône (profond côté cuve, nul à l'autre bout) fermé côté cuve par un quart
  // d'ellipsoïde de même section : fin en cuillère au ras de la cuve.
  // Toutes les rainures sont fusionnées en une seule géométrie.
  const drainerGeometry = useMemo(() => {
    const grooveR = GROOVE_W / 2;
    const depthScale = 0.08 / grooveR;
    const cone = new THREE.CylinderGeometry(0, grooveR, DRAINER_LEN - grooveR, 64, 1, true, 0, Math.PI);
    cone.rotateZ(-Math.PI / 2);
    cone.scale(1, depthScale, 1);
    const spoon = new THREE.SphereGeometry(grooveR, 48, 16, -Math.PI / 2, Math.PI, Math.PI / 2, Math.PI / 2);
    spoon.scale(1, depthScale, 1);

    const parts = [];
    calculatedSinks.forEach((s) => {
      if (!s.valid || !s.hasDrainer) return;
      const isOval = s.type.toLowerCase().includes("sanitaire");
      const extraOffset = isOval ? WALL_THICKNESS : 0;
      const isLeft = s.drainerPosition === "left";
      const SAFETY_GAP = 0.001;
      const innerEdge = isLeft ? s.x - s.width / 2 : s.x + s.width / 2;
      const drainStartEdge = isLeft ? innerEdge - extraOffset - SAFETY_GAP : innerEdge + extraOffset + SAFETY_GAP;
      const { count, totalH } = getDrainerSpec(s.type);
      const startZ = s.z - totalH / 2 + GROOVE_W / 2;
      // Repère local : origine au bord côté cuve, +x vers le bout de l'égouttoir
      const rotY = isLeft ? Math.PI : 0;
      for (let i = 0; i < count; i++) {
        const z = startZ + i * (GROOVE_W + GAP_DRAIN);
        const c = cone.clone();
        c.translate(grooveR + (DRAINER_LEN - grooveR) / 2, 0, 0);
        const sp = spoon.clone();
        sp.translate(grooveR, 0, 0);
        for (const g of [c, sp]) {
          g.rotateY(rotY);
          g.translate(drainStartEdge, 0.401, z);
          parts.push(g);
        }
      }
    });
    cone.dispose();
    spoon.dispose();
    return { grooves: mergeAll(parts) };
  }, [calculatedSinks]);
  useDispose(drainerGeometry);

  // --- BORDS (retombées, dosserets, chants, anti-goutte) ---
  // Tout est construit à partir du contour : un arc d'angle arrondi reçoit la retombée
  // ou le dosseret dès qu'un des deux côtés qu'il relie en a un.
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
      if (hasApron) out.aprons.push(bandGeometry(piece, 0, WALL_THICKNESS, 0.4 - apronH, apronH));
      if (pieceHas(piece, rimOn)) out.rims.push(bandGeometry(piece, 0, WALL_THICKNESS, 0.4, rimH));

      // Chant mélaminé visible là où il n'y a pas de retombée (jamais à l'avant)
      if (!hasApron && piece.side !== "front") {
        let mela = piece;
        if (piece.kind === "line") {
          // À un angle vif, la retombée du côté voisin couvre déjà l'épaisseur du mur
          const [a, b] = piece.points;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const ux = (b[0] - a[0]) / len;
          const uz = (b[1] - a[1]) / len;
          const cropStart = otherSide(prev) && apronOn(otherSide(prev)) ? WALL_THICKNESS : 0;
          const cropEnd = otherSide(next) && apronOn(otherSide(next)) ? WALL_THICKNESS : 0;
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
            SPLASH_RADIUS,
            splashSide(otherSide(prev)),
            splashSide(otherSide(next)),
          );
          const [nx, nz] = piece.normal;
          out.splashes.push({
            geom,
            position: [(a[0] + b[0]) / 2 - nx * SPLASH_RADIUS, 0.4, (a[1] + b[1]) / 2 - nz * SPLASH_RADIUS],
            rotation: [0, Math.atan2(-dz, dx), 0],
          });
        } else {
          // Quart de tore : même section que le bourrelet droit, raccord tangent
          const geom = new THREE.TorusGeometry(piece.radius - SPLASH_RADIUS, SPLASH_RADIUS, 32, 48, Math.PI / 2);
          geom.rotateX(Math.PI / 2);
          geom.rotateY(-Math.min(piece.t0, piece.t1));
          out.splashes.push({ geom, position: [piece.center[0], 0.4, piece.center[1]], rotation: [0, 0, 0] });
        }
      }
    });
    // Fusion : une seule géométrie par matériau au lieu d'une cinquantaine de maillages
    const placed = out.splashes.map(({ geom, position, rotation }) => {
      geom.rotateY(rotation[1]);
      geom.translate(position[0], position[1], position[2]);
      return geom;
    });
    const resin = mergeAll([...out.aprons, ...out.rims, ...placed]);
    const mela = mergeAll(out.melas);
    return { resin, mela };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.length, config.width, config.corners, config.aprons, config.apronFront, config.apronBack,
    config.apronLeft, config.apronRight, config.apronHeight, config.rims, config.rimHeigh,
    config.rimBack, config.rimLeft, config.rimRight, config.splashback,
  ]);
  useDispose(edgeGeometries);

  return (
    <group position={[0, elevationY, 0]}>
      {planComponents.isSplit ? (
        <>
          <mesh geometry={planComponents.bottom} material={materials.plan} />
          <mesh position={[0, 0.4 - GROOVE_DEPTH, 0]} geometry={planComponents.top} material={materials.plan} />
        </>
      ) : (
        <mesh geometry={planComponents.full} material={materials.plan} />
      )}

      {calculatedSinks
        .filter((s) => s.valid)
        .map((s, i) => (
          <SinkModel key={s.id ?? i} s={s} materials={materials} />
        ))}

      {drainerGeometry.grooves && <mesh geometry={drainerGeometry.grooves} material={materials.drainer} />}
      {edgeGeometries.resin && <mesh geometry={edgeGeometries.resin} material={materials.plan} />}
      {edgeGeometries.mela && <mesh geometry={edgeGeometries.mela} material={materials.mela} />}
    </group>
  );
};

export default memo(Vasque3D, sameModel);
