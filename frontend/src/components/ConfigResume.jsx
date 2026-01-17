import React from 'react';
import "../styles/style.scss"; // Assurez-vous que le chemin est correct

const ConfigResume = ({ config, totalPrice, handleAddToCart, currentSink }) => {
  return (
    <div className="summary-panel">
      <div className="summary-card">
        <h2>Résumé de votre configuration</h2>
        
        <div className="summary-section">
          <h3>Dimensions</h3>
          <p>{config.length / 10} cm × {config.width / 10} cm</p>
        </div>

        <div className="summary-section">
          <h3>Cuve</h3>
          <p>
            {currentSink === "Aucune cuve" ? "Aucune" : currentSink.replace("Cuve ", "")}
          </p>
          <p className="summary-detail">Pos: {config.position}</p>
        </div>

        {config.hasTapHole && (
          <div className="summary-section">
            <h3>Perçage robinet</h3>
            <p>Oui (Ø35mm)</p>
             <p className="summary-detail">Pos: {config.tapHole} {config.tapHole !== 'center' && `(${config.tapHoleOffset}mm)`}</p>
          </div>
        )}

        {/* Ajout des résumés pour Dosserets et Retombées si présents */}
        {config.rims && (
             <div className="summary-section">
                <h3>Dosserets (H: {config.rimHeigh}mm)</h3>
                <p>
                    {[config.rimLeft && "Gauche", config.rimBack && "Fond", config.rimRight && "Droite"].filter(Boolean).join(", ")}
                </p>
            </div>
        )}

        {config.aprons && (
             <div className="summary-section">
                <h3>Retombées (H: {config.apronHeight}mm)</h3>
                <p>
                    {[config.apronFront && "Avant", config.apronLeft && "Gauche", config.apronBack && "Fond", config.apronRight && "Droite"].filter(Boolean).join(", ")}
                </p>
            </div>
        )}

        <div className="price-section">
          <span>Prix Total TTC</span>
          <span className="price-value">{totalPrice} €</span>
        </div>

        <button className="btn-primary" onClick={handleAddToCart}>
          Ajouter au panier
        </button>
      </div>
    </div>
  );
};

export default ConfigResume;