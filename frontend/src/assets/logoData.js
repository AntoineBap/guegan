// Logo utilisé dans les PDF (devis, bon de livraison).
// Le fichier était vide dans le dépôt : on pointe vers le logo servi par le site,
// que @react-pdf/renderer sait charger par URL.
export const logoBase64 =
  typeof window !== "undefined" ? `${window.location.origin}/logo_guegan.png` : "/logo_guegan.png";
