import React, { useMemo } from 'react';
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

// Petit composant helper pour une ligne : Label ....... Prix
const SummaryLine = ({ label, price, isSubItem = false, value = null }) => (
    <div className={`summary-row ${isSubItem ? 'sub-item' : ''}`} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '6px',
        fontSize: isSubItem ? '0.9rem' : '1rem',
        color: isSubItem ? '#555' : '#000'
    }}>
        <span>
            {label} {value && <span style={{fontWeight:'500'}}>: {value}</span>}
        </span>
        {price !== undefined && price !== null && (
            <span style={{ fontWeight: 'bold', color: '#d4af37' }}>
                {price > 0 ? `+ ${price.toFixed(2).replace('.', ',')} €` : ''}
            </span>
        )}
    </div>
);

const ConfigResume = ({ config, handleAddToCart }) => {

  // --- FORMULES ---

  const planDetails = useMemo(() => {
    const widthM = config.width / 1000;
    const lengthM = config.length / 1000;
    const area = widthM * lengthM;
    const price = Math.round((219.30 * area) + 447.37);
    return { area, price };
  }, [config.width, config.length]);

  const sinksDetails = useMemo(() => {
    const sinks = config.sinks || [];
    if (sinks.length === 0) return [];

    return sinks.map((sink, index) => {
        if (sink.type === "Aucune cuve") return null;

        const spec = SINK_SPECS[sink.type] || { price: 0 };
        const basePrice = spec.price;
        const tapPrice = (sink.hasTapHole && sink.tapHolePosition !== "none") ? TAP_HOLE_PRICE : 0;
        const drainerPrice = sink.hasDrainer ? DRAINER_PRICE : 0;
        
        // Traduction Position Cuve
        let positionLabel = "Centré";
        if (sink.position === "left") positionLabel = "Gauche";
        if (sink.position === "right") positionLabel = "Droite";

        // Traduction Position Robinet
        let tapLabel = "Aucun";
        if (sink.hasTapHole) {
            if (sink.tapHolePosition === "center") tapLabel = "Centré";
            if (sink.tapHolePosition === "left") tapLabel = "Gauche";
            if (sink.tapHolePosition === "right") tapLabel = "Droite";
        }

        // Traduction Position Egouttoir
        let drainerLabel = "";
        if (sink.hasDrainer) {
            drainerLabel = sink.drainerPosition === "left" ? "Gauche" : "Droite";
        }

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
            totalForCalc: basePrice + tapPrice + drainerPrice
        };
    }).filter(Boolean);
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
    const sides = [];
    if (config.rimLeft) { totalPrice += getLinearPartPrice(height, config.width); sides.push("Gauche"); }
    if (config.rimBack) { totalPrice += getLinearPartPrice(height, config.length); sides.push("Arrière"); }
    if (config.rimRight) { totalPrice += getLinearPartPrice(height, config.width); sides.push("Droite"); }
    if (sides.length === 0) return null;
    return { sides: sides.join(", "), height, price: totalPrice };
  }, [config.rims, config.rimHeigh, config.rimLeft, config.rimRight, config.rimBack, config.width, config.length]);

  const apronsDetails = useMemo(() => {
    if (!config.aprons) return null;
    const rawHeight = config.apronHeight || 40;
    const frontEffectiveHeight = Math.max(0, rawHeight - 40);
    let totalPrice = 0;
    const sides = [];
    if (config.apronFront) { totalPrice += getLinearPartPrice(frontEffectiveHeight, config.length); sides.push("Avant"); }
    if (config.apronLeft) { totalPrice += getLinearPartPrice(rawHeight, config.width); sides.push("Gauche"); }
    if (config.apronBack) { totalPrice += getLinearPartPrice(rawHeight, config.length); sides.push("Arrière"); }
    if (config.apronRight) { totalPrice += getLinearPartPrice(rawHeight, config.width); sides.push("Droite"); }
    if (sides.length === 0) return null;
    return { sides: sides.join(", "), height: rawHeight, price: totalPrice };
  }, [config.aprons, config.apronHeight, config.apronFront, config.apronLeft, config.apronRight, config.apronBack, config.width, config.length]);

  const waterDripDetails = useMemo(() => {
      if (!config.splashback) return null;
      const price = Math.round((config.length / 1000) * WATER_DRIP_PRICE_PER_METER);
      return { price, length: config.length };
  }, [config.splashback, config.length]);

  // --- TOTAL ---
  const finalTotalPrice = useMemo(() => {
      let total = planDetails.price;
      sinksDetails.forEach(s => total += s.totalForCalc);
      if (rimsDetails) total += rimsDetails.price;
      if (apronsDetails) total += apronsDetails.price;
      if (waterDripDetails) total += waterDripDetails.price;
      return total;
  }, [planDetails, sinksDetails, rimsDetails, apronsDetails, waterDripDetails]);

  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

  return (
    <div className="summary-panel">
      <div className="summary-card">
        <h2>Résumé de votre configuration</h2>
        
        {/* --- SECTION PLAN --- */}
        <div className="summary-section">
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Plan de travail</h3>
            <SummaryLine label="Dimensions" value={`${config.length} x ${config.width} mm` } price={planDetails.price}/>
            <SummaryLine label="Surface" value={`${planDetails.area.toFixed(2)} m²`} />
            <SummaryLine label="Prix base"  />
        </div>

        {/* --- SECTION CUVES --- */}
        {sinksDetails.map((sink) => (
            <div key={sink.index} className="summary-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>
                    Cuve #{sink.index}
                </h3>

                {/* Modèle et Prix Cuve */}
                <SummaryLine label="Modèle" value={sink.modelName} price={sink.basePrice} />

                {/* Position */}
                <SummaryLine label="Position" value={sink.positionLabel} />

                {/* Décalage Bord (Uniquement si Ancré et sur un côté) */}
                {sink.isAnchor && sink.position !== "center" && (
                    <SummaryLine label="Décalage du bord" value={`${sink.offset} mm`} />
                )}

                {/* Ecart relatif (pour les cuves suivantes) */}
                {!sink.isAnchor && (
                    <SummaryLine label="Écart avec précédent" value={`${sink.offset} mm`} />
                )}

                {/* Perçage Robinet */}
                <SummaryLine label="Perçage Robinetterie" value={sink.tapLabel} price={sink.tapPrice > 0 ? sink.tapPrice : null} />

                {/* Décalage Robinet (Uniquement si coté selectionné) */}
                {sink.hasTapHole && (sink.tapHolePosition === "left" || sink.tapHolePosition === "right") && (
                    <SummaryLine label="Décalage du centre" value={`${sink.tapHoleOffset} mm`} />
                )}

                {/* Egouttoir */}
                {sink.hasDrainer && (
                     <SummaryLine label="Égouttoir" value={sink.drainerLabel} price={sink.drainerPrice} />
                )}
            </div>
        ))}

        {/* --- SECTION DOSSERETS --- */}
        {rimsDetails && (
             <div className="summary-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Dosserets</h3>
                <SummaryLine label="Hauteur" value={`${rimsDetails.height} mm`} />
                <SummaryLine label="Côtés" value={rimsDetails.sides} price={rimsDetails.price} />
            </div>
        )}

        {/* --- SECTION RETOMBEES --- */}
        {apronsDetails && (
             <div className="summary-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Retombées</h3>
                <SummaryLine label="Hauteur" value={`${apronsDetails.height} mm`} />
                <SummaryLine label="Côtés" value={apronsDetails.sides} price={apronsDetails.price}/>
                {config.apronFront && (
                     <p style={{fontSize: '0.75rem', color: '#888', fontStyle: 'italic', margin: '4px 0'}}>
                     </p>
                )}
            </div>
        )}

        {/* --- SECTION GOUTTE D'EAU --- */}
        {waterDripDetails && (
            <div className="summary-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Goutte d'eau</h3>
                <SummaryLine label="Anti-Goutte d'Eau" value={` ${waterDripDetails.length} mm`} price={waterDripDetails.price} />
            </div>
        )}

        {/* --- TOTAL --- */}
        <div className="price-section" style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Prix Total HT</span>
          <span className="price-value" style={{ fontSize: '1.4rem', color: '#d4af37' }}>{fmt(finalTotalPrice)}</span>
        </div>

        <button className="btn-primary" onClick={() => handleAddToCart({ ...config, totalPrice: finalTotalPrice })}>
          Ajouter au panier
        </button>
      </div>
    </div>
  );
};

export default ConfigResume;