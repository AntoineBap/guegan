// Constantes et constructions de géométrie du plan-vasque (unités 3D : 1 = 10 mm).
// Fonctions pures, partagées par Vasque3D et SinkModel.
import * as THREE from "three";

export const UNIT_SCALE = 100;
export const PLAN_THICKNESS = 0.4;
export const GROOVE_DEPTH = 0.3; // épaisseur de la couche supérieure rainurée
export const BASE_THICKNESS = 0.1;
export const WALL_THICKNESS = 0.12;
export const MELA_H = 0.28; // 28 mm de mélaminé hydrofuge sous la résine
export const SPLASH_RADIUS = 0.06;

// Égouttoir
export const DRAINER_LEN = 3.5;
export const GROOVE_W = 0.1;
const STD_GROOVE_COUNT = 7;
const TOTAL_DRAINER_WIDTH_STD = 3.5;
export const GAP_DRAIN = (TOTAL_DRAINER_WIDTH_STD - STD_GROOVE_COUNT * GROOVE_W) / 6;

export const getDrainerSpec = (sinkType) => {
  const isSanitary = sinkType && sinkType.toLowerCase().includes("sanitaire");
  const count = isSanitary ? 5 : 7;
  const totalH = count * GROOVE_W + (count - 1) * GAP_DRAIN;
  return { count, totalH };
};

export const cap = (side) => side.charAt(0).toUpperCase() + side.slice(1);

// Bande qui suit un morceau du contour (côté droit ou arc), vue de dessus :
// de `inset` à `inset + thickness` vers l'intérieur du plan, extrudée sur `height`
// à partir de `yBottom`. Sert aux retombées, dosserets et chants mélaminés.
export const bandGeometry = (piece, inset, thickness, yBottom, height) => {
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

// Contour intérieur d'une cuve rectangulaire, avec les encoches où arrivent les rainures
export const drawTeethedHole = (holePath, sink) => {
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
  const cutDepth = WALL_THICKNESS;

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


// Bourrelet anti-goutte rectiligne, avec coupe d'onglet aux angles vifs
export const createSplashGeometry = (
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
