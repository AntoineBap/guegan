const Settings = require("../models/Settings");

const GLOBAL_KEY = "global_settings";

// Mêmes valeurs par défaut que frontend/src/contexts/SettingsContext.jsx
const DEFAULT_SETTINGS = {
  sinkPrices: {
    "Cuve Labo 400x400x300": 520,
    "Cuve Détente 400x400x200": 490,
    "Cuve Cuisine 500x400x180": 540,
    "Cuve Sanitaire 422x336x139": 330,
  },
  prices: { tapHole: 15, drainer: 50, waterDrip: 50 },
  linearFormula: {
    rims: { a: 53.6, b: 17.6, c: 86.4 },
    aprons: { a: 53.6, b: 17.6, c: 86.4 },
  },
  constraints: { maxLength: 3600, maxDepth: 700 },
};

const mergeWithDefaults = (value = {}) => ({
  ...DEFAULT_SETTINGS,
  ...value,
  sinkPrices: { ...DEFAULT_SETTINGS.sinkPrices, ...(value.sinkPrices || {}) },
  prices: { ...DEFAULT_SETTINGS.prices, ...(value.prices || {}) },
  linearFormula: {
    ...DEFAULT_SETTINGS.linearFormula,
    ...(value.linearFormula || {}),
  },
  constraints: { ...DEFAULT_SETTINGS.constraints, ...(value.constraints || {}) },
});

// Cache mémoire : les settings sont lus à chaque chargement du configurateur
// et à chaque commande, mais ne changent que via l'admin.
let cache = null;

exports.GLOBAL_KEY = GLOBAL_KEY;

exports.getSettingsDoc = async (key) => {
  if (key === GLOBAL_KEY && cache) return cache;
  const doc = await Settings.findOne({ key }).lean();
  if (key === GLOBAL_KEY) cache = doc;
  return doc;
};

exports.getGlobalSettings = async () => {
  const doc = await exports.getSettingsDoc(GLOBAL_KEY);
  return mergeWithDefaults(doc?.value);
};

exports.invalidateCache = () => {
  cache = null;
};
