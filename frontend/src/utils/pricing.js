// Même calcul que backend/utils/pricing.js et ConfigResume.jsx.
// Sert à recalculer les articles du panier quand les tarifs changent ou
// deviennent disponibles (ex. : panier rempli avant connexion).

const linearPartPrice = (heightMm, lengthMm, f) => {
  if (!f || !heightMm || heightMm <= f.b) return 0;
  return Math.round(Math.max(0, f.a * Math.log(heightMm - f.b) - f.c) * (lengthMm / 1000));
};

export const hasPrices = (settings) =>
  Object.values(settings?.sinkPrices || {}).some((p) => typeof p === "number") &&
  !!settings?.linearFormula?.rims;

export const computeUnitPrice = (item, settings) => {
  const length = Number(item.length) || 0;
  const width = Number(item.width) || 0;
  const prices = settings.prices || {};

  let total = Math.round(219.3 * (length / 1000) * (width / 1000) + 447.37);

  for (const sink of item.sinks || []) {
    if (!sink || sink.type === "Aucune cuve") continue;
    total += settings.sinkPrices?.[sink.type] || 0;
    if (sink.hasTapHole && sink.tapHolePosition !== "none") total += prices.tapHole || 0;
    if (sink.hasDrainer) total += prices.drainer || 0;
  }

  if (item.rims) {
    const h = Number(item.rimHeigh) || 100;
    const f = settings.linearFormula.rims;
    if (item.rimLeft) total += linearPartPrice(h, width, f);
    if (item.rimBack) total += linearPartPrice(h, length, f);
    if (item.rimRight) total += linearPartPrice(h, width, f);
  }

  if (item.aprons) {
    const h = Number(item.apronHeight) || 40;
    const f = settings.linearFormula.aprons;
    if (item.apronFront) total += linearPartPrice(Math.max(0, h - 40), length, f);
    if (item.apronLeft) total += linearPartPrice(h, width, f);
    if (item.apronBack) total += linearPartPrice(h, length, f);
    if (item.apronRight) total += linearPartPrice(h, width, f);
  }

  if (item.splashback) total += Math.round((length / 1000) * (prices.waterDrip || 0));

  return total;
};
