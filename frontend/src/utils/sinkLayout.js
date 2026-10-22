// Position des cuves sur le plan, en millimètres (repère de utils/planShape.js).
// Extrait de Vasque3D pour être partagé avec le configurateur (contrôle des arrondis).

export const SINK_DIMENSIONS = {
  "Aucune cuve": { l: 0, w: 0, d: 0 },
  "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300 },
  "Cuve Détente 400x400x200": { l: 400, w: 400, d: 200 },
  "Cuve Cuisine 500x400x180": { l: 500, w: 400, d: 180 },
  "Cuve Sanitaire 422x336x139": { l: 422, w: 336, d: 139 },
};

export const DRAINER_LENGTH = 350;
const DEFAULT_GAP = 40;
const MIN_BACK = 100;

// Renvoie pour chaque cuve : x, z (centre), width (le long du plan), height (profondeur
// dans le plan), depth (profondeur de cuve), offsetVal, tapHoleOffsetVal et valid.
export const computeSinkLayout = (config) => {
  const length = Number(config.length) || 0;
  const width = Number(config.width) || 0;
  const sinks = config.sinks || [
    {
      id: 999,
      type: config.sink || "Aucune cuve",
      position: config.position || "center",
      offset: config.sinkOffset || 100,
    },
  ];
  if (sinks.length === 0) return [];

  const items = sinks.map((s) => {
    const spec = SINK_DIMENSIONS[s.type] || SINK_DIMENSIONS["Aucune cuve"];
    return {
      ...s,
      width: spec.l,
      height: spec.w,
      depth: spec.d,
      offsetVal: s.offset !== undefined && s.offset !== null ? s.offset : DEFAULT_GAP,
      tapHoleOffsetVal: s.tapHoleOffset || 0,
    };
  });

  let anchorIndex = items.findIndex((s) => s.id === config.anchorId);
  if (anchorIndex === -1) anchorIndex = 0;
  const anchor = items[anchorIndex];
  const halfL = length / 2;

  let anchorX = 0;
  if (anchor.position === "left") anchorX = -halfL + anchor.offsetVal + anchor.width / 2;
  else if (anchor.position === "right") anchorX = halfL - anchor.offsetVal - anchor.width / 2;

  // Cuve poussée vers l'avant seulement si le plan est trop peu profond pour garder 100 mm à l'arrière
  const zFor = (s) => Math.max(0, MIN_BACK + s.height / 2 - width / 2);
  const out = new Array(items.length);
  out[anchorIndex] = { ...anchor, x: anchorX, z: zFor(anchor), valid: anchor.type !== "Aucune cuve" };

  for (let i = anchorIndex + 1; i < items.length; i++) {
    const prev = out[i - 1];
    const curr = items[i];
    const prevDrainer = prev.hasDrainer && prev.drainerPosition === "right" ? DRAINER_LENGTH : 0;
    const currDrainer = curr.hasDrainer && curr.drainerPosition === "left" ? DRAINER_LENGTH : 0;
    const x = prev.x + prev.width / 2 + prevDrainer + curr.offsetVal + currDrainer + curr.width / 2;
    out[i] = { ...curr, x, z: zFor(curr), valid: curr.type !== "Aucune cuve" };
  }

  for (let i = anchorIndex - 1; i >= 0; i--) {
    const next = out[i + 1];
    const curr = items[i];
    const nextDrainer = next.hasDrainer && next.drainerPosition === "left" ? DRAINER_LENGTH : 0;
    const currDrainer = curr.hasDrainer && curr.drainerPosition === "right" ? DRAINER_LENGTH : 0;
    const x = next.x - (next.width / 2 + nextDrainer + curr.offsetVal + currDrainer + curr.width / 2);
    out[i] = { ...curr, x, z: zFor(curr), valid: curr.type !== "Aucune cuve" };
  }

  return out;
};

// Rectangles occupés (cuve + égouttoir éventuel), pour les contrôles d'encombrement
export const sinkFootprints = (layout) =>
  layout
    .filter((s) => s.valid)
    .map((s) => {
      let x = s.x;
      let w = s.width;
      if (s.hasDrainer) {
        w += DRAINER_LENGTH;
        x += s.drainerPosition === "left" ? -DRAINER_LENGTH / 2 : DRAINER_LENGTH / 2;
      }
      return { x, z: s.z, w, h: s.height, id: s.id };
    });
