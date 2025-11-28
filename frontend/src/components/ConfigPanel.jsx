import '../styles/configPanel.scss';

const ConfigPanel = ({ config, setConfig, setShowModal }) => {

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Conversion en nombre pour les inputs numériques
    const val = type === 'number' ? parseFloat(value) : value;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : val
    }));
  };

  const handleCheckout = async () => {
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerText;
    btn.innerText = "Chargement...";
    btn.disabled = true;

    try {
      // Simulation ou appel réel
      setTimeout(() => {
          alert("Redirection vers le paiement...");
          btn.innerText = originalText;
          btn.disabled = false;
      }, 1000);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div className="config-panel">
      <h1>
        Votre Vasque <span className="gold-text">Signature</span>
      </h1>

      <div className="form-group">
        <label>Couleur du Corian</label>
        <div className="corian-color">
          <button
            className={config.color === "white" ? "active" : ""}
            onClick={() => setConfig({ ...config, color: "white" })}
          >
            Blanc Pur
          </button>
          <button
            className={config.color === "black" ? "active" : ""}
            onClick={() => setConfig({ ...config, color: "black" })}
          >
            Noir Intense
          </button>
        </div>
      </div>

      {/* --- SECTION PLAN DE TRAVAIL --- */}
      <div className="form-group section-box">
        <label className="section-title">Dimensions du Plan (Extérieur)</label>
        <div className="inputs-row">
          <div>
            <span>Longueur</span>
            <input
              type="number"
              name="length"
              value={config.length}
              onChange={handleChange}
              min="60" max="300"
            />
          </div>
          <div>
            <span>Largeur (Prof.)</span>
            <input
              type="number"
              name="width"
              value={config.width}
              onChange={handleChange}
              min="30" max="100"
            />
          </div>
          
        </div>
      </div>

      {/* --- SECTION CUVE --- */}
      <div className="form-group section-box">
        <label className="section-title">Dimensions de la Cuve (Intérieur)</label>
        <div className="inputs-row">
          <div>
            <span>Longueur Cuve</span>
            <input
              type="number"
              name="basinLength"
              value={config.basinLength || 50}
              onChange={handleChange}
              min="30" max={config.length - 10} // Max contraint par le plan
            />
          </div>
          <div>
            <span>Largeur Cuve</span>
            <input
              type="number"
              name="basinWidth"
              value={config.basinWidth || 35}
              onChange={handleChange}
              min="20" max={config.width - 5} // Max contraint par le plan
            />
          </div>
          <div>
            <div>
            <span>Prof. Cuve</span>
            <input
              type="number"
              name="depth"
              value={config.depth}
              onChange={handleChange}
              min="10" max="50"
            />
          </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Position du bassin</label>
        <select name="position" value={config.position} onChange={handleChange}>
          <option value="center">Centré</option>
          <option value="left">Gauche</option>
          <option value="right">Droite</option>
        </select>
      </div>

      <div className="form-group">
        <label>Perçage Robinetterie</label>
        <div className="drilling-options">
          {["none", "center", "left", "right"].map((opt) => (
            <button
              key={opt}
              className={config.tapHole === opt ? "active-small" : ""}
              onClick={() => setConfig({ ...config, tapHole: opt })}
            >
              {opt === "none"
                ? "Aucun"
                : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="splashback"
            checked={config.splashback}
            onChange={handleChange}
          />
          Ajouter Goutte d'eau (Dosseret)
        </label>
        {config.splashback && (
          <input
            type="number"
            className="small-input"
            name="splashbackHeight"
            value={config.splashbackHeight}
            onChange={handleChange}
            placeholder="H (cm)"
          />
        )}
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="sideRims"
            checked={config.sideRims}
            onChange={handleChange}
          />
          Ajouter Rebords latéraux
        </label>
        {config.sideRims && (
          <input
            type="number"
            className="small-input"
            name="sideRimHeight"
            value={config.sideRimHeight}
            onChange={handleChange}
            placeholder="H (cm)"
          />
        )}
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={() => setShowModal(true)}>
          Voir Rendu 3D
        </button>
        <button className="btn-primary" onClick={handleCheckout}>
          Commander • 950.00 €
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;