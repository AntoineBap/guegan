import React, { useMemo, useState, useContext } from "react";
import { useCart } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/configResume.scss";

// Constantes de Poids (kg/m2) - Restent en dur car physique des matériaux
const WEIGHT_PLAN_M2 = 39;
const WEIGHT_VERTICAL_M2 = 21;

// --- SOUS-COMPOSANT : LIGNE DE RÉSUMÉ ---
const SummaryLine = ({
  label,
  price,
  isSubItem = false,
  value = null,
  isAuthenticated,
}) => {
  const renderPrice = () => {
    if (price === undefined || price === null) return null;
    if (price === 0) return "";

    if (isAuthenticated) {
      return (
        <span className="price-tag">
          {`+ ${price.toFixed(2).replace(".", ",")} €`}
        </span>
      );
    } else {
      return <span className="price-tag blurred">+ *** €</span>;
    }
  };

  return (
    <div className={`summary-row ${isSubItem ? "sub-item" : ""}`}>
      <span>
        {label} {value && <span className="label-value">: {value}</span>}
      </span>
      {renderPrice()}
    </div>
  );
};

// On récupère settings et sinkSpecs via les props
const ConfigResume = ({ config, onReset, sinkSpecs, settings }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isAuthenticated } = useContext(AuthContext);

  // Valeurs par défaut si settings tarde à charger (sécurité)
  const TAP_HOLE_PRICE = settings?.prices?.tapHole || 15;
  const DRAINER_PRICE = settings?.prices?.drainer || 50;
  const WATER_DRIP_PRICE = settings?.prices?.waterDrip || 50;

  // --- 1. CALCULS PRIX & SURFACES ---

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
    if (!sinkSpecs) return [];

    const anchorIndex = sinks.findIndex(s => s.id === config.anchorId);

    return sinks
      .map((sink, index) => {
        if (sink.type === "Aucune cuve") return null;

        const isAnchor = sink.id === config.anchorId;
        const spec = sinkSpecs[sink.type] || { price: 0, l: 0, w: 0, d: 0 };
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

        const L_m = spec.l / 1000;
        const W_m = spec.w / 1000;
        const D_m = spec.d / 1000;
        const surfaceM2 = L_m * D_m * 2 + W_m * D_m * 2 + L_m * W_m;

        const title = `Cuve #${index + 1}${isAnchor ? " (ANCRÉE)" : ""}`;

        let gapLabel = "Écart";
        if (!isAnchor) {
            if (index < anchorIndex) {
                gapLabel = "Écart à Droite avec la Cuve suivante";
            } else {
                gapLabel = "Écart à Gauche avec la Cuve précédente";
            }
        }

        return {
          ...sink,
          index: index + 1,
          modelName: sink.type.replace("Cuve ", ""),
          positionLabel,
          tapLabel,
          drainerLabel,
          isAnchor,
          basePrice,
          tapPrice,
          drainerPrice,
          totalForCalc: basePrice + tapPrice + drainerPrice,
          surfaceM2,
          title,     
          gapLabel   
        };
      })
      .filter(Boolean);
  }, [config.sinks, config.anchorId, sinkSpecs, TAP_HOLE_PRICE, DRAINER_PRICE]);

  // Fonction générique pour calculer le prix linéaire avec formule configurable
  // type = 'rims' ou 'aprons'
  const getLinearPartPrice = (heightMm, lengthMm, type) => {
    // Récupération des paramètres de la formule dans les settings
    const formula = settings?.linearFormula?.[type] || { a: 53.6, b: 17.6, c: 86.4 };
    
    if (!heightMm || heightMm <= formula.b) return 0;
    
    // Formule: A * ln(h - B) - C
    const pricePerMeter = formula.a * Math.log(heightMm - formula.b) - formula.c;
    
    return Math.round(Math.max(0, pricePerMeter) * (lengthMm / 1000));
  };

  const rimsDetails = useMemo(() => {
    if (!config.rims) return null;
    const height = config.rimHeigh || 100;
    let totalPrice = 0;
    let totalLengthMm = 0;
    const sides = [];

    // On utilise le type 'rims' pour la formule
    if (config.rimLeft) {
      totalPrice += getLinearPartPrice(height, config.width, 'rims');
      totalLengthMm += config.width;
      sides.push("Gauche");
    }
    if (config.rimBack) {
      totalPrice += getLinearPartPrice(height, config.length, 'rims');
      totalLengthMm += config.length;
      sides.push("Arrière");
    }
    if (config.rimRight) {
      totalPrice += getLinearPartPrice(height, config.width, 'rims');
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
    settings // Dépendance ajoutée pour recalculer si formule change
  ]);

  const apronsDetails = useMemo(() => {
    if (!config.aprons) return null;
    const rawHeight = config.apronHeight || 40;
    const frontEffectiveHeight = Math.max(0, rawHeight - 40);
    let totalPrice = 0;
    let totalLengthMm = 0;
    const sides = [];

    // On utilise le type 'aprons' pour la formule
    if (config.apronFront) {
      totalPrice += getLinearPartPrice(frontEffectiveHeight, config.length, 'aprons');
      totalLengthMm += config.length;
      sides.push("Avant");
    }
    if (config.apronLeft) {
      totalPrice += getLinearPartPrice(rawHeight, config.width, 'aprons');
      totalLengthMm += config.width;
      sides.push("Gauche");
    }
    if (config.apronBack) {
      totalPrice += getLinearPartPrice(rawHeight, config.length, 'aprons');
      totalLengthMm += config.length;
      sides.push("Arrière");
    }
    if (config.apronRight) {
      totalPrice += getLinearPartPrice(rawHeight, config.width, 'aprons');
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
    settings
  ]);

  const waterDripDetails = useMemo(() => {
    if (!config.splashback) return null;
    const price = Math.round(
      (config.length / 1000) * WATER_DRIP_PRICE,
    );
    return { price, length: config.length };
  }, [config.splashback, config.length, WATER_DRIP_PRICE]);

  // --- 2. CALCUL POIDS ---
  const totalWeight = useMemo(() => {
    let weight = 0;
    weight += planDetails.area * WEIGHT_PLAN_M2;

    if (rimsDetails) {
      const areaRims =
        (rimsDetails.totalLengthMm / 1000) * (rimsDetails.height / 1000);
      weight += areaRims * WEIGHT_VERTICAL_M2;
    }

    if (apronsDetails) {
      const areaAprons =
        (apronsDetails.totalLengthMm / 1000) * (apronsDetails.height / 1000);
      weight += areaAprons * WEIGHT_VERTICAL_M2;
    }

    sinksDetails.forEach((sink) => {
      weight += sink.surfaceM2 * WEIGHT_VERTICAL_M2;
    });

    return Math.round(weight * 100) / 100;
  }, [planDetails, rimsDetails, apronsDetails, sinksDetails]);

  // --- 3. TOTAL PRIX ---
  const unitTotalPrice = useMemo(() => {
    let total = planDetails.price;
    sinksDetails.forEach((s) => (total += s.totalForCalc));
    if (rimsDetails) total += rimsDetails.price;
    if (apronsDetails) total += apronsDetails.price;
    if (waterDripDetails) total += waterDripDetails.price;
    return total;
  }, [planDetails, sinksDetails, rimsDetails, apronsDetails, waterDripDetails]);

  const grandTotal = unitTotalPrice * quantity;
  const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";
  const isHeavy = totalWeight > 80;

  // --- 4. AJOUT AU PANIER ---
  const performAddToCart = () => {
    const finalItem = {
      ...config,
      unitPrice: unitTotalPrice,
      quantity,
      totalPrice: grandTotal,
      totalWeight,
    };

    addToCart(finalItem);

    if (onReset) {
      onReset();
      setQuantity(1);
    }
  };

  return (
    <div className="summary-panel">
      <div className="summary-card">
        <h2>Résumé de votre configuration</h2>

        {/* --- PLAN --- */}
        <div className="summary-section">
          <h3>Plan de travail</h3>
          <SummaryLine
            label="Dimensions"
            value={`${config.length} x ${config.width} mm`}
            price={planDetails.price}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* --- CUVES --- */}
        {sinksDetails.map((sink) => (
          <div key={sink.index} className="summary-section">
            <h3>{sink.title}</h3>
            
            <SummaryLine
              label="Modèle"
              value={sink.modelName}
              price={sink.basePrice}
              isAuthenticated={isAuthenticated}
            />
            
            {sink.isAnchor && (
                <SummaryLine
                label="Position"
                value={sink.positionLabel}
                isAuthenticated={isAuthenticated}
                />
            )}

            {sink.isAnchor && sink.position !== "center" && (
              <SummaryLine
                label="Décalage du bord"
                value={`${sink.offset} mm`}
                isAuthenticated={isAuthenticated}
              />
            )}
            
            {!sink.isAnchor && (
              <SummaryLine
                label={sink.gapLabel}
                value={`${sink.offset} mm`}
                isAuthenticated={isAuthenticated}
              />
            )}

            {sink.hasTapHole && (
                <SummaryLine
                label="Perçage Robinetterie"
                value={sink.tapLabel}
                price={sink.tapPrice > 0 ? sink.tapPrice : null}
                isAuthenticated={isAuthenticated}
                />
            )}

            {sink.hasTapHole &&
              (sink.tapHolePosition === "left" ||
                sink.tapHolePosition === "right") && (
                <SummaryLine
                  label="Décalage du centre"
                  value={`${sink.tapHoleOffset} mm`}
                  isAuthenticated={isAuthenticated}
                />
              )}
            {sink.hasDrainer && (
              <SummaryLine
                label="Égouttoir"
                value={sink.drainerLabel}
                price={sink.drainerPrice}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        ))}

        {/* --- DOSSERETS --- */}
        {rimsDetails && (
          <div className="summary-section">
            <h3>Dosserets</h3>
            <SummaryLine
              label="Hauteur"
              value={`${rimsDetails.height} mm`}
              price={rimsDetails.price}
              isAuthenticated={isAuthenticated}
            />
            <SummaryLine
              label="Côtés"
              value={rimsDetails.sides}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {/* --- RETOMBEES --- */}
        {apronsDetails && (
          <div className="summary-section">
            <h3>Retombées</h3>
            <SummaryLine
              label="Hauteur"
              value={`${apronsDetails.height} mm`}
              price={apronsDetails.price}
              isAuthenticated={isAuthenticated}
            />
            <SummaryLine
              label="Côtés"
              value={apronsDetails.sides}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {/* --- GOUTTE D'EAU --- */}
        {waterDripDetails && (
          <div className="summary-section">
            <h3>Anti-Goutte d'eau</h3>
            <SummaryLine
              label="Longueur"
              value={`${waterDripDetails.length} mm`}
              price={waterDripDetails.price}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}

        {/* --- FOOTER --- */}
        <div className="summary-footer">
          <div className="unit-price-row">
            <span>Prix Unitaire HT</span>
            {isAuthenticated ? (
              <span>{fmt(unitTotalPrice)}</span>
            ) : (
              <span className="blurred">*** €</span>
            )}
          </div>

          <div className="quantity-row">
            <label>Quantité</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setQuantity(val > 0 ? val : 1);
              }}
            />
          </div>

          <div className="total-row">
            <span className="total-label">Total HT</span>
            {isAuthenticated ? (
              <span className="total-value">{fmt(grandTotal)}</span>
            ) : (
              <span className="total-value blurred">**** €</span>
            )}
          </div>

          {!isAuthenticated && (
            <div className="lock-msg">
              🔒 Connectez-vous pour voir les tarifs
            </div>
          )}
        </div>

        {/* --- POIDS --- */}
        <div className={`weight-alert ${isHeavy ? "heavy" : "light"}`}>
          {isHeavy && <span style={{ marginRight: "5px" }}>⚠️</span>}
          Poids estimé : <strong>{totalWeight} kg</strong>
          {isHeavy && (
            <span className="sub-text">
              Attention, charge lourde (prévoir manutention).
            </span>
          )}
        </div>

        <button className="btn-add-cart" onClick={performAddToCart}>
          Ajouter au panier ({quantity})
        </button>
      </div>
    </div>
  );
};

export default ConfigResume;