import React, { useMemo, useState } from "react";
import { useCart } from "../contexts/CartContext"; // 1. IMPORT DU CONTEXTE
import "../styles/style.scss";

// --- CONSTANTES ---
const SINK_SPECS = {
  "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
  "Cuve Labo 400x400x300": { l: 400, w: 400, d: 300, price: 520 },
  "Cuve Détente 400x400x200": { l: 400, w: 400, d: 200, price: 490 },
  "Cuve Cuisine 500x400x180": { l: 500, w: 400, d: 180, price: 540 },
  "Cuve Sanitaire 422x336x139": { l: 422, w: 336, d: 139, price: 330 },
};

const TAP_HOLE_PRICE = 15;
const DRAINER_PRICE = 50;
const WATER_DRIP_PRICE_PER_METER = 50;

// Constantes de Poids (kg/m2)
const WEIGHT_PLAN_M2 = 39;
const WEIGHT_VERTICAL_M2 = 21; // Dosserets, Retombées, Cuves

// Petit composant helper pour une ligne : Label ....... Prix
const SummaryLine = ({ label, price, isSubItem = false, value = null }) => (
  <div
    className={`summary-row ${isSubItem ? "sub-item" : ""}`}
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "6px",
      fontSize: isSubItem ? "0.9rem" : "1rem",
      color: isSubItem ? "#555" : "#000",
    }}
  >
    <span>
      {label} {value && <span style={{ fontWeight: "500" }}>: {value}</span>}
    </span>
    {price !== undefined && price !== null && (
      <span style={{ fontWeight: "bold", color: "#d4af37" }}>
        {price > 0 ? `+ ${price.toFixed(2).replace(".", ",")} €` : ""}
      </span>
    )}
  </div>
);

// ATTENTION : On reçoit 'onReset' ici, et non plus 'handleAddToCart'
const ConfigResume = ({ config, onReset }) => {
  const [quantity, setQuantity] = useState(1);

  // 1. On récupère la fonction du panier depuis le Contexte
  const { addToCart } = useCart();

  // --- FORMULES PRIX & SURFACES ---

  const planDetails = useMemo(() => {
    const widthM = config.width / 1000;
    const lengthM = config.length / 1000;
    const area = widthM * lengthM;
    const price = Math.round(219.3 * area + 447.37);
    return { area, price };
  }, [config.width, config.length]);

  const sinksDetails = useMemo(() => {
    const sinks = config.sinks || [];
    if (sinks.length === 0) return [];

    return sinks
      .map((sink, index) => {
        if (sink.type === "Aucune cuve") return null;

        const spec = SINK_SPECS[sink.type] || { price: 0, l: 0, w: 0, d: 0 };
        const basePrice = spec.price;
        const tapPrice =
          sink.hasTapHole && sink.tapHolePosition !== "none"
            ? TAP_HOLE_PRICE
            : 0;
        const drainerPrice = sink.hasDrainer ? DRAINER_PRICE : 0;

        let positionLabel = "Centré";
        if (sink.position === "left") positionLabel = "Gauche";
        if (sink.position === "right") positionLabel = "Droite";

        let tapLabel = "Aucun";
        if (sink.hasTapHole) {
          if (sink.tapHolePosition === "center") tapLabel = "Centré";
          if (sink.tapHolePosition === "left") tapLabel = "Gauche";
          if (sink.tapHolePosition === "right") tapLabel = "Droite";
        }

        let drainerLabel = "";
        if (sink.hasDrainer) {
          drainerLabel = sink.drainerPosition === "left" ? "Gauche" : "Droite";
        }

        // --- CALCUL SURFACE CUVE POUR POIDS ---
        // Formule : length * depth * 2 + width * depth * 2 + length * width
        // Attention : spec.l, spec.w, spec.d sont en mm, il faut convertir en m
        const L_m = spec.l / 1000;
        const W_m = spec.w / 1000;
        const D_m = spec.d / 1000;

        const surfaceM2 = L_m * D_m * 2 + W_m * D_m * 2 + L_m * W_m;

        return {
          ...sink,
          index: index + 1,
          modelName: sink.type.replace("Cuve ", ""),
          positionLabel,
          tapLabel,
          drainerLabel,
          isAnchor: sink.id === config.anchorId,
          basePrice,
          tapPrice,
          drainerPrice,
          totalForCalc: basePrice + tapPrice + drainerPrice,
          surfaceM2, // Stocké pour le calcul global
        };
      })
      .filter(Boolean);
  }, [config.sinks, config.anchorId]);

  const getLinearPartPrice = (heightMm, lengthMm) => {
    if (!heightMm || heightMm <= 17.6) return 0;
    const pricePerMeter = 53.6 * Math.log(heightMm - 17.6) - 86.4;
    return Math.round(Math.max(0, pricePerMeter) * (lengthMm / 1000));
  };

  const rimsDetails = useMemo(() => {
    if (!config.rims) return null;
    const height = config.rimHeigh || 100;
    let totalPrice = 0;
    let totalLengthMm = 0;
    const sides = [];

    if (config.rimLeft) {
      totalPrice += getLinearPartPrice(height, config.width);
      totalLengthMm += config.width;
      sides.push("Gauche");
    }
    if (config.rimBack) {
      totalPrice += getLinearPartPrice(height, config.length);
      totalLengthMm += config.length;
      sides.push("Arrière");
    }
    if (config.rimRight) {
      totalPrice += getLinearPartPrice(height, config.width);
      totalLengthMm += config.width;
      sides.push("Droite");
    }

    if (sides.length === 0) return null;
    return {
      sides: sides.join(", "),
      height,
      price: totalPrice,
      totalLengthMm,
    };
  }, [
    config.rims,
    config.rimHeigh,
    config.rimLeft,
    config.rimRight,
    config.rimBack,
    config.width,
    config.length,
  ]);

  const apronsDetails = useMemo(() => {
    if (!config.aprons) return null;
    const rawHeight = config.apronHeight || 40;
    const frontEffectiveHeight = Math.max(0, rawHeight - 40);
    let totalPrice = 0;
    let totalLengthMm = 0;
    const sides = [];

    if (config.apronFront) {
      totalPrice += getLinearPartPrice(frontEffectiveHeight, config.length);
      totalLengthMm += config.length;
      sides.push("Avant");
    }
    if (config.apronLeft) {
      totalPrice += getLinearPartPrice(rawHeight, config.width);
      totalLengthMm += config.width;
      sides.push("Gauche");
    }
    if (config.apronBack) {
      totalPrice += getLinearPartPrice(rawHeight, config.length);
      totalLengthMm += config.length;
      sides.push("Arrière");
    }
    if (config.apronRight) {
      totalPrice += getLinearPartPrice(rawHeight, config.width);
      totalLengthMm += config.width;
      sides.push("Droite");
    }

    if (sides.length === 0) return null;
    return {
      sides: sides.join(", "),
      height: rawHeight,
      price: totalPrice,
      totalLengthMm,
    };
  }, [
    config.aprons,
    config.apronHeight,
    config.apronFront,
    config.apronLeft,
    config.apronRight,
    config.apronBack,
    config.width,
    config.length,
  ]);

  const waterDripDetails = useMemo(() => {
    if (!config.splashback) return null;
    const price = Math.round(
      (config.length / 1000) * WATER_DRIP_PRICE_PER_METER,
    );
    return { price, length: config.length };
  }, [config.splashback, config.length]);

  // --- CALCUL POIDS ---
  const totalWeight = useMemo(() => {
    let weight = 0;

    // 1. Plan (39 kg/m2)
    weight += planDetails.area * WEIGHT_PLAN_M2;

    // 2. Dosserets (21 kg/m2)
    if (rimsDetails) {
      const areaRims =
        (rimsDetails.totalLengthMm / 1000) * (rimsDetails.height / 1000);
      weight += areaRims * WEIGHT_VERTICAL_M2;
    }

    // 3. Retombées (21 kg/m2)
    if (apronsDetails) {
      const areaAprons =
        (apronsDetails.totalLengthMm / 1000) * (apronsDetails.height / 1000);
      weight += areaAprons * WEIGHT_VERTICAL_M2;
    }

    // 4. Cuves (21 kg/m2 surface développée)
    sinksDetails.forEach((sink) => {
      weight += sink.surfaceM2 * WEIGHT_VERTICAL_M2;
    });

    return Math.round(weight * 100) / 100; // Arrondi 2 décimales
  }, [planDetails, rimsDetails, apronsDetails, sinksDetails]);

  // --- TOTAL PRIX ---
  const unitTotalPrice = useMemo(() => {
    let total = planDetails.price;
    sinksDetails.forEach((s) => (total += s.totalForCalc));
    if (rimsDetails) total += rimsDetails.price;
    if (apronsDetails) total += apronsDetails.price;
    if (waterDripDetails) total += waterDripDetails.price;
    return total;
  }, [planDetails, sinksDetails, rimsDetails, apronsDetails, waterDripDetails]);

  // Grand Total avec Quantité
  const grandTotal = unitTotalPrice * quantity;

  const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

  // 2. FONCTION QUI SE DECLENCHE AU CLIC
  const performAddToCart = () => {
    const finalItem = {
      ...config,
      unitPrice: unitTotalPrice,
      quantity,
      totalPrice: grandTotal,
      totalWeight, // On stocke aussi le poids unitaire
    };

    addToCart(finalItem);

    if (onReset) {
      if (
        window.confirm(
          "Produit ajouté ! Voulez-vous commencer une nouvelle configuration ?",
        )
      ) {
        onReset();
        setQuantity(1);
      }
    }
  };

  // Seuil pour alerte poids (ex: 80kg pour 2 personnes)
  const isHeavy = totalWeight > 80;

  return (
    <div className="summary-panel">
      <div className="summary-card">
        <h2>Résumé de votre configuration</h2>

        {/* --- SECTION PLAN --- */}
        <div className="summary-section">
          <h3
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "5px",
              marginBottom: "10px",
            }}
          >
            Plan de travail
          </h3>
          <SummaryLine
            label="Dimensions"
            value={`${config.length} x ${config.width} mm`}
            price={planDetails.price}
          />
          <SummaryLine
            label="Surface"
            value={`${planDetails.area.toFixed(2)} m²`}
          />
        </div>

        {/* --- SECTION CUVES --- */}
        {sinksDetails.map((sink) => (
          <div key={sink.index} className="summary-section">
            <h3
              style={{
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              Cuve #{sink.index}
            </h3>

            <SummaryLine
              label="Modèle"
              value={sink.modelName}
              price={sink.basePrice}
            />
            <SummaryLine label="Position" value={sink.positionLabel} />

            {sink.isAnchor && sink.position !== "center" && (
              <SummaryLine
                label="Décalage du bord"
                value={`${sink.offset} mm`}
              />
            )}

            {!sink.isAnchor && (
              <SummaryLine
                label="Écart avec précédent"
                value={`${sink.offset} mm`}
              />
            )}

            <SummaryLine
              label="Perçage Robinetterie"
              value={sink.tapLabel}
              price={sink.tapPrice > 0 ? sink.tapPrice : null}
            />

            {sink.hasTapHole &&
              (sink.tapHolePosition === "left" ||
                sink.tapHolePosition === "right") && (
                <SummaryLine
                  label="Décalage du centre"
                  value={`${sink.tapHoleOffset} mm`}
                />
              )}

            {sink.hasDrainer && (
              <SummaryLine
                label="Égouttoir"
                value={sink.drainerLabel}
                price={sink.drainerPrice}
              />
            )}
          </div>
        ))}

        {/* --- SECTION DOSSERETS --- */}
        {rimsDetails && (
          <div className="summary-section">
            <h3
              style={{
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              Dosserets
            </h3>
            <SummaryLine
              label="Hauteur"
              value={`${rimsDetails.height} mm`}
              price={rimsDetails.price}
            />
            <SummaryLine label="Côtés" value={rimsDetails.sides} />
          </div>
        )}

        {/* --- SECTION RETOMBEES --- */}
        {apronsDetails && (
          <div className="summary-section">
            <h3
              style={{
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              Retombées
            </h3>
            <SummaryLine
              label="Hauteur"
              value={`${apronsDetails.height} mm`}
              price={apronsDetails.price}
            />
            <SummaryLine label="Côtés" value={apronsDetails.sides} />
            {config.apronFront && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#888",
                  fontStyle: "italic",
                  margin: "4px 0",
                }}
              >
                (Face avant : hauteur calculée -40mm)
              </p>
            )}
          </div>
        )}

        {/* --- SECTION GOUTTE D'EAU --- */}
        {waterDripDetails && (
          <div className="summary-section">
            <h3
              style={{
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              Goutte d'eau
            </h3>
            <SummaryLine
              label="Usinage"
              value={`Sous plan (L: ${waterDripDetails.length} mm)`}
              price={waterDripDetails.price}
            />
          </div>
        )}

        {/* --- TOTAL ET QUANTITE --- */}
        <div
          style={{
            marginTop: "20px",
            borderTop: "2px solid #ccc",
            paddingTop: "15px",
          }}
        >
          {/* Prix Unitaire */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#666",
              fontSize: "0.9rem",
              marginBottom: "10px",
            }}
          >
            <span>Prix Unitaire HT</span>
            <span>{fmt(unitTotalPrice)}</span>
          </div>

          {/* Sélecteur de Quantité */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <label style={{ fontWeight: "bold" }}>Quantité</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setQuantity(val > 0 ? val : 1);
              }}
              style={{
                width: "80px",
                padding: "8px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Total Final */}
          <div
            className="price-section"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #eee",
              paddingTop: "15px",
            }}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
              Total HT
            </span>
            <span
              className="price-value"
              style={{ fontSize: "1.6rem", color: "#d4af37" }}
            >
              {fmt(grandTotal)}
            </span>
          </div>
        </div>

        {/* --- ALERT POIDS --- */}
        <div
          style={{
            backgroundColor: isHeavy ? "#fff3cd" : "#e8f5e9",
            color: isHeavy ? "#856404" : "#155724",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
            fontSize: "0.9rem",
            textAlign: "center",
            border: isHeavy ? "1px solid #ffeeba" : "1px solid #c3e6cb",
          }}
        >
          {isHeavy && <span style={{ marginRight: "5px" }}>⚠️</span>}
          Poids estimé : <strong>{totalWeight} kg</strong>
          {isHeavy && (
            <div style={{ fontSize: "0.8em", marginTop: "3px" }}>
              Attention, charge lourde (prévoir manutention).
            </div>
          )}
        </div>

        {/* BOUTON AJOUT PANIER */}
        <button className="btn-primary" onClick={performAddToCart}>
          Ajouter au panier ({quantity})
        </button>
      </div>
    </div>
  );
};

export default ConfigResume;
