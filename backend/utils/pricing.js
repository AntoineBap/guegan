// Recalcul serveur du prix d'un plan-vasque.
// Reprend à l'identique la logique de frontend/src/components/ConfigResume.jsx :
// le prix envoyé par le navigateur n'est jamais pris tel quel.

const MAX_QUANTITY = 100;
const MAX_SINKS = 6;

class PricingError extends Error {}

const num = (v) => (typeof v === "number" ? v : Number(v));

const linearPartPrice = (heightMm, lengthMm, formula) => {
  if (!heightMm || heightMm <= formula.b) return 0;
  const pricePerMeter = formula.a * Math.log(heightMm - formula.b) - formula.c;
  return Math.round(Math.max(0, pricePerMeter) * (lengthMm / 1000));
};

const computeUnitPrice = (item, settings) => {
  const length = num(item.length);
  const width = num(item.width);
  const { maxLength, maxDepth } = settings.constraints;

  if (!Number.isFinite(length) || length < 300 || length > maxLength)
    throw new PricingError("Largeur du plan invalide.");
  if (!Number.isFinite(width) || width < 300 || width > maxDepth)
    throw new PricingError("Profondeur du plan invalide.");

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
    if (item.rimLeft) total += linearPartPrice(h, width, f);
    if (item.rimBack) total += linearPartPrice(h, length, f);
    if (item.rimRight) total += linearPartPrice(h, width, f);
  }

  // Retombées (l'avant est compté sans les 40 premiers mm)
  if (item.aprons) {
    const h = num(item.apronHeight) || 40;
    if (h < 0 || h > 200) throw new PricingError("Hauteur de retombée invalide.");
    const f = settings.linearFormula.aprons;
    if (item.apronFront) total += linearPartPrice(Math.max(0, h - 40), length, f);
    if (item.apronLeft) total += linearPartPrice(h, width, f);
    if (item.apronBack) total += linearPartPrice(h, length, f);
    if (item.apronRight) total += linearPartPrice(h, width, f);
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
    totalAmount += unitPrice * quantity;
    return { ...item, quantity, unitPrice, totalPrice: unitPrice * quantity };
  });

  return { items: priced, totalAmount };
};

module.exports = { priceItems, computeUnitPrice, PricingError };
