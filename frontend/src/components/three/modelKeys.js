// Champs de la configuration qui changent le modèle 3D. Le reste (nom de la pièce,
// quantité…) ne doit pas recalculer la scène : chaque frappe déclenchait ~16 images.
const MODEL_KEYS = [
  "length", "width", "color", "sinks", "anchorId", "corners", "splashback",
  "aprons", "apronHeight", "apronFront", "apronBack", "apronLeft", "apronRight",
  "rims", "rimHeigh", "rimBack", "rimLeft", "rimRight",
  "sink", "position", "sinkOffset", // anciens formats de configuration
];
export const sameModel = (a, b) => MODEL_KEYS.every((k) => a.config[k] === b.config[k]);

