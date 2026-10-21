// Frais de livraison recalculés côté serveur (même grille que Checkout.jsx).
// Origine : 1 rue de l'Industrie, 93000 Bobigny
const ORIGIN = { lat: 48.9118, lon: 2.4397 };
const ALLOWED = new Set([0, 200, 400, -1]); // -1 = au-delà de 600 km, sur devis

const distanceKm = (lat1, lon1, lat2, lon2) => {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const priceForDistance = (km) => {
  if (km <= 250) return 0;
  if (km <= 400) return 200;
  if (km <= 600) return 400;
  return -1;
};

// Renvoie le tarif de livraison. Si le géocodage échoue (API indisponible),
// on retombe sur la valeur du navigateur, uniquement si elle fait partie de la grille.
exports.computeShippingCost = async (address, clientValue) => {
  const fallback = ALLOWED.has(Number(clientValue)) ? Number(clientValue) : 0;
  if (!address?.zip || !address?.city) return fallback;

  const q = `${address.address || ""} ${address.zip} ${address.city}`.slice(0, 200);
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`,
      { signal: AbortSignal.timeout(4000) },
    );
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (!coords) return fallback;
    const [lon, lat] = coords;
    return priceForDistance(distanceKm(ORIGIN.lat, ORIGIN.lon, lat, lon));
  } catch {
    return fallback;
  }
};
