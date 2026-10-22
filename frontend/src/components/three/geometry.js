// Constantes et constructions de géométrie du plan-vasque (unités 3D : 1 = 10 mm).
// Fonctions pures, partagées par Vasque3D et SinkModel.
import * as THREE from "three";

export const UNIT_SCALE = 100;
export const PLAN_THICKNESS = 0.4;
// Avec égouttoir, le plan est fait de deux couches : la couche supérieure rainurée a
// exactement la profondeur d'une rainure (8 mm). Plus épaisse, la découpe laissait une
// fente sous chaque rainure, visible depuis la cuve dès que la rainure y débouche.
export const GROOVE_DEPTH = 0.08;
export const BASE_THICKNESS = PLAN_THICKNESS - GROOVE_DEPTH;
// Le bol ovale commence un peu sous le dessus du plan, pour ne pas dépasser dans les rainures
export const OVAL_LIP_DROP = 0.09;
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

// --- RAINURES QUI DÉBOUCHENT DANS LA CUVE -----------------------------------
const SINK_HOLE_RADIUS = 0.28;
const isOvalSink = (s) => s.type.toLowerCase().includes("sanitaire");

// Bord de la découpe de la cuve côté égouttoir, à la hauteur (z monde) d'une rainure
const holeEdgeX = (s, z, side) => {
  if (isOvalSink(s)) {
    const a = s.width / 2;
    const b = s.height / 2;
    const t = Math.min(1, Math.abs(z - s.z) / b);
    return s.x + side * a * Math.sqrt(1 - t * t);
  }
  return s.x + side * (s.width / 2);
};

// Rainures d'une cuve : centre (z monde), départ sur le bord de la cuve (edgeX), pointe (apexX).
// La pointe est au même endroit qu'avant ; la rainure part maintenant du bord même de la cuve.
export const grooveLayout = (s) => {
  if (!s.valid || !s.hasDrainer) return [];
  const isLeft = s.drainerPosition === "left";
  const side = isLeft ? -1 : 1;
  const extraOffset = isOvalSink(s) ? WALL_THICKNESS : 0;
  const apexX = s.x + side * (s.width / 2 + extraOffset + DRAINER_LEN);
  const { count, totalH } = getDrainerSpec(s.type);
  const startZ = s.z - totalH / 2 + GROOVE_W / 2;
  const out = [];
  for (let i = 0; i < count; i++) {
    const z = startZ + i * (GROOVE_W + GAP_DRAIN);
    out.push({ z, edgeX: holeEdgeX(s, z, side), apexX, isLeft });
  }
  return out;
};

// Découpe de la cuve dans la couche rainurée, rainures comprises (un seul contour) :
// chaque rainure est un triangle qui part du bord de la cuve. Coordonnées de forme (x, -z).
export const holeWithGrooves = (s) => {
  const grooves = grooveLayout(s);
  const half = GROOVE_W / 2;
  const cy = -s.z;
  const w = s.width;
  const h = s.height;
  const pts = [];

  if (isOvalSink(s)) {
    // Ellipse échantillonnée, côté droit de haut en bas puis côté gauche de bas en haut
    const a = w / 2;
    const b = h / 2;
    const N = 160;
    const right = !grooves[0]?.isLeft;
    const notches = grooves
      .map((g) => ({ y: -g.z, top: -g.z + half, bot: -g.z - half, apex: g.apexX }))
      .sort((p, q) => q.y - p.y);
    const edgeAt = (y, sideSign) => s.x + sideSign * a * Math.sqrt(Math.max(0, 1 - ((y - cy) / b) ** 2));
    const halfPoints = (sideSign, withNotches) => {
      const list = [];
      let k = 0;
      for (let i = 0; i <= N; i++) {
        const th = Math.PI / 2 - (Math.PI * i) / N; // de haut (pi/2) en bas (-pi/2)
        const y = cy + b * Math.sin(th);
        const x = s.x + sideSign * a * Math.cos(th);
        if (withNotches) {
          while (k < notches.length && y < notches[k].top) {
            const n = notches[k];
            list.push([edgeAt(n.top, sideSign), n.top], [n.apex, n.y], [edgeAt(n.bot, sideSign), n.bot]);
            k++;
          }
          if (notches.some((n) => y <= n.top && y >= n.bot)) continue;
        }
        list.push([x, y]);
      }
      return list;
    };
    const r = halfPoints(1, right);
    const l = halfPoints(-1, !right).reverse();
    pts.push(...r, ...l);
  } else {
    // Rectangle à angles arrondis, avec les triangles des rainures sur le côté égouttoir
    const r = SINK_HOLE_RADIUS;
    const x0 = s.x - w / 2;
    const x1 = s.x + w / 2;
    const yTop = cy + h / 2 - r;
    const yBot = cy - h / 2 + r;
    const clampY = (y) => Math.min(yTop, Math.max(yBot, y));
    const arc = (cx, cyy, a0, a1) => {
      for (let i = 1; i <= 12; i++) {
        const t = a0 + ((a1 - a0) * i) / 12;
        pts.push([cx + r * Math.cos(t), cyy + r * Math.sin(t)]);
      }
    };
    const leftNotches = grooves.filter((g) => g.isLeft).map((g) => -g.z).sort((p, q) => p - q);
    const rightNotches = grooves.filter((g) => !g.isLeft).map((g) => -g.z).sort((p, q) => q - p);
    const apex = grooves[0]?.apexX;

    pts.push([x0, yBot]);
    for (const y of leftNotches) pts.push([x0, clampY(y - half)], [apex, y], [x0, clampY(y + half)]);
    pts.push([x0, yTop]);
    arc(x0 + r, yTop, Math.PI, Math.PI / 2);
    pts.push([x1 - r, cy + h / 2]);
    arc(x1 - r, yTop, Math.PI / 2, 0);
    for (const y of rightNotches) pts.push([x1, clampY(y + half)], [apex, y], [x1, clampY(y - half)]);
    pts.push([x1, yBot]);
    arc(x1 - r, yBot, 0, -Math.PI / 2);
    pts.push([x0 + r, cy - h / 2]);
    arc(x0 + r, yBot, -Math.PI / 2, -Math.PI);
  }

  const path = new THREE.Path();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  path.closePath();
  return path;
};

// Raccord vertical au bout de chaque rainure, dans le plan du bord de la cuve : bouche
// les deux petits coins sous le demi-cône (rectangle de la découpe moins la demi-ellipse),
// pour que, vu depuis la cuve, on ne voie que l'ouverture en demi-ellipse.
export const grooveMouthGeometry = (edgeX, z) => {
  const half = GROOVE_W / 2;
  const top = PLAN_THICKNESS + 0.001;
  const bottom = BASE_THICKNESS;
  const depth = top - bottom;
  const piece = (sign) => {
    const sh = new THREE.Shape();
    sh.moveTo(sign * half, top);
    for (let i = 1; i <= 16; i++) {
      const t = (Math.PI / 2) * (i / 16); // du bord (t=0) au fond (t=pi/2)
      sh.lineTo(sign * half * Math.cos(t), top - depth * Math.sin(t));
    }
    sh.lineTo(sign * half, bottom);
    sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    g.rotateY(Math.PI / 2);
    g.translate(edgeX, 0, z);
    return g;
  };
  return [piece(1), piece(-1)];
};
