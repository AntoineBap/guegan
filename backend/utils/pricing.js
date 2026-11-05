// Recalcul serveur du prix d'un plan-vasque.
// Reprend à l'identique la logique de frontend/src/components/ConfigResume.jsx :
// le prix envoyé par le navigateur n'est jamais pris tel quel.

const MAX_QUANTITY = 100;
const MIN_CORNER_RADIUS = 50;
const MAX_SINKS = 6;

class PricingError extends Error {}

const num = (v) => (typeof v === "number" ? v : Number(v));

const linearPartPrice = (heightMm, lengthMm, formula) => {
  if (!heightMm || heightMm <= formula.b) return 0;
  const pricePerMeter = formula.a * Math.log(heightMm - formula.b) - formula.c;
  return Math.round(Math.max(0, pricePerMeter) * (lengthMm / 1000));
};

// Angles arrondis (quarts de cercle) : sans supplément, mais ils doivent tenir dans le plan.
// Mêmes règles que frontend/src/utils/planShape.js.
const sanitizeCorners = (corners, length, width) => {
  if (corners === undefined || corners === null) return undefined;
  if (typeof corners !== "object") throw new PricingError("Angles invalides.");
  const out = {};
  for (const k of ["fl", "fr", "br", "bl"]) {
    const r = corners[k] === undefined || corners[k] === null || corners[k] === "" ? 0 : num(corners[k]);
    if (!Number.isFinite(r) || r < 0) throw new PricingError("Rayon d'angle invalide.");
    if (r > 0 && r < MIN_CORNER_RADIUS) throw new PricingError(`Rayon d'angle minimum : ${MIN_CORNER_RADIUS} mm.`);
    out[k] = Math.round(r);
  }
  const tol = 1;
  if (out.fl + out.fr > length + tol || out.bl + out.br > length + tol ||
      out.fl + out.bl > width + tol || out.fr + out.br > width + tol) {
    throw new PricingError("Les arrondis ne tiennent pas dans le plan.");
  }
  return out;
};

// Un côté dont les deux arrondis se rejoignent (demi-cercle) n'a plus de partie droite :
// pas de dosseret ni de retombée facturés dessus. Même règle que planShape.sideExists.
const SIDE_CORNERS = { front: ["fl", "fr"], back: ["bl", "br"], left: ["bl", "fl"], right: ["br", "fr"] };
const sideExists = (side, corners, length, width) => {
  if (!corners) return true;
  const len = side === "front" || side === "back" ? length : width;
  const [a, b] = SIDE_CORNERS[side];
  return len - corners[a] - corners[b] > 1;
};

const computeUnitPrice = (item, settings) => {
  const length = num(item.length);
  const width = num(item.width);
  const { maxLength, maxDepth } = settings.constraints;

  if (!Number.isFinite(length) || length < 300 || length > maxLength)
    throw new PricingError("Largeur du plan invalide.");
  if (!Number.isFinite(width) || width < 300 || width > maxDepth)
    throw new PricingError("Profondeur du plan invalide.");

  const corners = sanitizeCorners(item.corners, length, width);
  const has = (side) => sideExists(side, corners, length, width);

  // Plan
  let total = Math.round(219.3 * (length / 1000) * (width / 1000) + 447.37);

  // Cuves
  const sinks = Array.isArray(item.sinks) ? item.sinks : [];
  if (sinks.length > MAX_SINKS) throw new PricingError("Trop de cuves.");
  for (const sink of sinks) {
    if (!sink || sink.type === "Aucune cuve") continue;
    const base = settings.sinkPrices[sink.type];
    if (typeof base !== "number") throw new PricingError("Modèle de cuve inconnu.");
    total += base;
    if (sink.hasTapHole && sink.tapHolePosition !== "none")
      total += settings.prices.tapHole;
    if (sink.hasDrainer) total += settings.prices.drainer;
  }

  // Dosserets
  if (item.rims) {
    const h = num(item.rimHeigh) || 100;
    if (h < 0 || h > 550) throw new PricingError("Hauteur de dosseret invalide.");
    const f = settings.linearFormula.rims;
    if (item.rimLeft && has("left")) total += linearPartPrice(h, width, f);
    if (item.rimBack && has("back")) total += linearPartPrice(h, length, f);
    if (item.rimRight && has("right")) total += linearPartPrice(h, width, f);
  }

  // Retombées (l'avant est compté sans les 40 premiers mm)
  if (item.aprons) {
    const h = num(item.apronHeight) || 40;
    if (h < 0 || h > 200) throw new PricingError("Hauteur de retombée invalide.");
    const f = settings.linearFormula.aprons;
    if (item.apronFront && has("front")) total += linearPartPrice(Math.max(0, h - 40), length, f);
    if (item.apronLeft && has("left")) total += linearPartPrice(h, width, f);
    if (item.apronBack && has("back")) total += linearPartPrice(h, length, f);
    if (item.apronRight && has("right")) total += linearPartPrice(h, width, f);
  }

  // Anti-goutte
  if (item.splashback)
    total += Math.round((length / 1000) * settings.prices.waterDrip);

  return total;
};

// Renvoie les items avec unitPrice / totalPrice recalculés, et le total HT.
const priceItems = (items, settings) => {
  if (!Array.isArray(items) || items.length === 0)
    throw new PricingError("Aucun article.");
  if (items.length > 50) throw new PricingError("Trop d'articles.");

  let totalAmount = 0;
  const priced = items.map((item) => {
    if (!item || typeof item !== "object") throw new PricingError("Article invalide.");
    const quantity = num(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY)
      throw new PricingError("Quantité invalide.");
    const unitPrice = computeUnitPrice(item, settings);
    const corners = sanitizeCorners(item.corners, num(item.length), num(item.width));
    totalAmount += unitPrice * quantity;
    return {
      ...item,
      ...(corners !== undefined && { corners }),
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
  });

  return { items: priced, totalAmount };
};

module.exports = { priceItems, computeUnitPrice, PricingError };
