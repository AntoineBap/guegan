const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export const formatPrice = (n) => currency.format(Number(n) || 0);

export const formatDate = (d, opts = {}) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...opts,
      })
    : "—";

export const formatDateLong = (d) =>
  formatDate(d, { day: "numeric", month: "long", year: "numeric" });

// Un devis est valable un mois après sa création
export const quoteExpiry = (createdAt) => {
  const d = new Date(createdAt);
  d.setMonth(d.getMonth() + 1);
  return d;
};

export const isQuoteValid = (createdAt) => new Date() <= quoteExpiry(createdAt);

export const ORDER_STATUS = {
  pending_payment: { label: "En attente de paiement", short: "À encaisser", tone: "is-pending" },
  paid: { label: "Payée, en fabrication", short: "En fabrication", tone: "is-paid" },
  shipped: { label: "Expédiée", short: "Expédiée", tone: "is-shipped" },
};

export const itemTitle = (item, index) =>
  item.roomName || item.name || `Plan ${index + 1}`;
