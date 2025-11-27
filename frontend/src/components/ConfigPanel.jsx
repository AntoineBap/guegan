import '../styles/configPanel.scss';

const ConfigPanel = ({ config, setConfig, setShowModal }) => {

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckout = async () => {
    // petit feedback visuel pour dire que ca charge
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerText;
    btn.innerText = "Chargement...";
    btn.disabled = true;

    try {
      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }), // non envoie toute la config quand on cree la session de paiement
      });

      const data = await response.json();

      if (data.url) {
        // redirection vers la page de paiement Stripe 
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la création de la commande");
        btn.innerText = originalText;
        btn.disabled = false;
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Impossible de contacter le serveur.");
      btn.innerText = originalText;
      btn.disabled = false;
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

      <div className="form-group">
        <label>Dimensions (cm)</label>
        <div className="inputs-row">
          <div>
            <span>Longueur</span>
            <input
              type="number"
              name="length"
              value={config.length}
              onChange={handleChange}
            />
          </div>
          <div>
            <span>Largeur</span>
            <input
              type="number"
              name="width"
              value={config.width}
              onChange={handleChange}
            />
          </div>
          <div>
            <span>Profondeur</span>
            <input
              type="number"
              name="depth"
              value={config.depth}
              onChange={handleChange}
            />
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

      <div className="form-group">
        <label>Commentaires / Demande spéciale</label>
        <textarea
          name="comments"
          rows="3"
          onChange={handleChange}
          placeholder="Une précision pour l'atelier ?"
        ></textarea>
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
