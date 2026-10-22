// Géométrie du plan vu de dessus, en millimètres.
// Repère : x = largeur (gauche -, droite +), z = profondeur (arrière -, avant +),
// origine au centre du plan.
//
// Chaque angle peut être arrondi par un quart de cercle exact de rayon r.
// Deux angles voisins dont les rayons font chacun la moitié du côté forment un
// demi-cercle parfait (un seul cercle). Il n'y a jamais d'autre courbe que des arcs de cercle.

export const MIN_CORNER_RADIUS = 50;
// Matière minimale entre une cuve et un bord arrondi
export const SINK_CORNER_MARGIN = 50;

export const CORNERS = ["fl", "fr", "br", "bl"];

export const CORNER_LABEL = {
  fl: "Avant gauche",
  fr: "Avant droit",
  br: "Arrière droit",
  bl: "Arrière gauche",
};

// Les deux côtés qui se rejoignent à chaque angle
export const CORNER_SIDES = {
  fl: ["front", "left"],
  fr: ["front", "right"],
  br: ["back", "right"],
  bl: ["back", "left"],
};

// Les deux angles de chaque côté
export const SIDE_CORNERS = {
  front: ["fl", "fr"],
  back: ["bl", "br"],
  left: ["bl", "fl"],
  right: ["br", "fr"],
};

export const SIDE_LABEL = { front: "Avant", back: "Arrière", left: "Gauche", right: "Droite" };

export const getCorners = (config) => {
  const c = config?.corners || {};
  const out = {};
  for (const k of CORNERS) {
    const r = Number(c[k]) || 0;
    out[k] = r > 0 ? r : 0;
  }
  return out;
};

export const hasRoundedCorner = (config) => CORNERS.some((k) => getCorners(config)[k] > 0);

// Longueur du côté sur lequel deux angles se partagent la place
export const sideLength = (side, length, width) =>
  side === "front" || side === "back" ? length : width;

// Rayon maximal d'un angle compte tenu des deux angles voisins
export const maxRadius = (corner, corners, length, width) => {
  const [sideA, sideB] = CORNER_SIDES[corner];
  const other = (side) => SIDE_CORNERS[side].find((k) => k !== corner);
  const limitA = sideLength(sideA, length, width) - (corners[other(sideA)] || 0);
  const limitB = sideLength(sideB, length, width) - (corners[other(sideB)] || 0);
  return Math.max(0, Math.floor(Math.min(limitA, limitB)));
};

// Un côté forme un demi-cercle quand ses deux angles ont un rayon égal à la moitié du côté
export const isSemicircle = (side, corners, length, width) => {
  const half = sideLength(side, length, width) / 2;
  const [a, b] = SIDE_CORNERS[side];
  return Math.abs(corners[a] - half) < 0.5 && Math.abs(corners[b] - half) < 0.5;
};

// Rayons nécessaires pour arrondir un côté en demi-cercle, ou null si impossible
export const semicircleRadii = (side, corners, length, width) => {
  const half = sideLength(side, length, width) / 2;
  const next = { ...corners };
  for (const k of SIDE_CORNERS[side]) next[k] = half;
  // Les angles opposés doivent encore tenir sur les côtés adjacents
  for (const k of SIDE_CORNERS[side]) {
    if (next[k] > maxRadius(k, next, length, width) + 0.5) return null;
  }
  if (half < MIN_CORNER_RADIUS) return null;
  return next;
};

// Ramène des rayons dans les limites (après un changement de dimensions par exemple)
export const clampCorners = (corners, length, width) => {
  const out = { ...corners };
  // Plusieurs passes : réduire un angle peut libérer de la place pour un autre
  for (let pass = 0; pass < 3; pass++) {
    for (const k of CORNERS) {
      if (!out[k]) continue;
      const max = maxRadius(k, out, length, width);
      if (out[k] > max) out[k] = max;
      if (out[k] < MIN_CORNER_RADIUS) out[k] = 0;
    }
  }
  return out;
};

// --- Contour ---------------------------------------------------------------
// Renvoie la suite des morceaux du contour, dans l'ordre :
// avant (gauche → droite), angle avant droit, droite (avant → arrière), angle arrière droit,
// arrière (droite → gauche), angle arrière gauche, gauche (arrière → avant), angle avant gauche.
// Les points sont en millimètres dans le repère (x, z).
export const outlinePieces = (length, width, corners, arcSegments = 48) => {
  const L2 = length / 2;
  const W2 = width / 2;
  const { fl, fr, br, bl } = corners;
  const pieces = [];

  const line = (side, a, b, normal) => {
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-6) pieces.push({ kind: "line", side, points: [a, b], normal });
  };
  const arc = (corner, cx, cz, r, t0, t1) => {
    if (r <= 0) {
      pieces.push({ kind: "corner", corner, point: [cx, cz] });
      return;
    }
    const points = [];
    for (let i = 0; i <= arcSegments; i++) {
      const t = t0 + ((t1 - t0) * i) / arcSegments;
      points.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
    }
    pieces.push({ kind: "arc", corner, center: [cx, cz], radius: r, t0, t1, points });
  };

  const D = Math.PI / 2;
  line("front", [-L2 + fl, W2], [L2 - fr, W2], [0, 1]);
  arc("fr", L2 - fr, W2 - fr, fr, D, 0);
  line("right", [L2, W2 - fr], [L2, -W2 + br], [1, 0]);
  arc("br", L2 - br, -W2 + br, br, 0, -D);
  line("back", [L2 - br, -W2], [-L2 + bl, -W2], [0, -1]);
  arc("bl", -L2 + bl, -W2 + bl, bl, -D, -2 * D);
  line("left", [-L2, -W2 + bl], [-L2, W2 - fl], [-1, 0]);
  arc("fl", -L2 + fl, W2 - fl, fl, 2 * D, D);

  return pieces;
};

// Points du contour fermé (sans doublons), pour construire la forme du plan
export const outlinePoints = (length, width, corners, arcSegments = 48) => {
  const pts = [];
  const push = (p) => {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 1e-6) pts.push(p);
  };
  for (const piece of outlinePieces(length, width, corners, arcSegments)) {
    if (piece.kind === "corner") push(piece.point);
    else piece.points.forEach(push);
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) pts.pop();
  return pts;
};

// --- Cuves et arrondis -----------------------------------------------------
// Une cuve (rectangle, égouttoir compris) ne doit pas déborder dans la zone retirée
// par un arrondi : son coin le plus proche de l'angle doit rester dans le cercle,
// avec SINK_CORNER_MARGIN de matière.
export const sinkCornerConflicts = (rects, length, width, corners, margin = SINK_CORNER_MARGIN) => {
  const L2 = length / 2;
  const W2 = width / 2;
  const conflicts = [];
  const dirs = { fl: [-1, 1], fr: [1, 1], br: [1, -1], bl: [-1, -1] };

  for (const k of CORNERS) {
    const r = corners[k];
    if (!r) continue;
    const [sx, sz] = dirs[k];
    const cx = sx * (L2 - r);
    const cz = sz * (W2 - r);
    rects.forEach((rect, index) => {
      // Coin du rectangle tourné vers l'angle du plan
      const px = sx > 0 ? rect.x + rect.w / 2 : rect.x - rect.w / 2;
      const pz = sz > 0 ? rect.z + rect.h / 2 : rect.z - rect.h / 2;
      const inCornerZone = (px - cx) * sx > 0 && (pz - cz) * sz > 0;
      if (inCornerZone && Math.hypot(px - cx, pz - cz) > r - margin) {
        conflicts.push({ corner: k, index });
      }
    });
  }
  return conflicts;
};

// Description lisible des angles, pour fiches techniques et PDF
// ex. ["Côté gauche en demi-cercle (R 300 mm)", "Avant droit arrondi R 100 mm"]
export const describeCorners = (config) => {
  const corners = getCorners(config);
  const L = Number(config.length) || 0;
  const W = Number(config.width) || 0;
  const done = new Set();
  const out = [];
  for (const side of ["left", "right", "front", "back"]) {
    if (corners[SIDE_CORNERS[side][0]] && isSemicircle(side, corners, L, W)) {
      SIDE_CORNERS[side].forEach((k) => done.add(k));
      out.push(`Côté ${SIDE_LABEL[side].toLowerCase()} en demi-cercle (R ${corners[SIDE_CORNERS[side][0]]} mm)`);
    }
  }
  for (const k of CORNERS) {
    if (corners[k] && !done.has(k)) out.push(`${CORNER_LABEL[k]} arrondi R ${corners[k]} mm`);
  }
  return out;
};
