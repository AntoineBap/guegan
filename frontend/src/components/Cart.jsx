import React, { useState, useMemo, useEffect } from 'react'; // Ajout de useEffect
import '../styles/cart.scss';

const Cart = ({ cartItems, updateItem, removeItem, closeCart, onLoadConfig }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  
  // État pour savoir quel item est "ouvert"
  const [expandedId, setExpandedId] = useState(null);

  // SYNCHRONISATION : Quand le panier change (ajout/suppression), on met à jour la sélection
  // Si un nouvel ID apparaît, on le sélectionne par défaut.
  useEffect(() => {
    setSelectedIds(prevSelected => {
        // On garde ceux qui sont déjà sélectionnés et qui existent toujours
        const currentValidIds = prevSelected.filter(id => cartItems.find(item => item.id === id));
        
        // On trouve les nouveaux items (ceux qui ne sont pas encore dans prevSelected)
        // Note: ceci sélectionne tout par défaut à l'ouverture, ou ajoute les nouveaux
        const allIds = cartItems.map(i => i.id);
        
        // Si c'est le premier chargement ou si un item a été ajouté, on veut probablement tout sélectionner
        // ou juste ajouter le nouveau. Pour simplifier : on sélectionne tout ce qui est dans le panier.
        // Si vous préférez garder l'état "décoché" des anciens, la logique serait plus complexe.
        // Ici, on réinitialise la sélection pour correspondre au contenu du panier.
        return allIds;
    });
  }, [cartItems.length]); // Dépend de la taille du panier

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleDetails = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDelete = (id) => {
    if (window.confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
      removeItem(id);
      // Pas besoin de mettre à jour selectedIds ici manuellement, le useEffect le fera
    }
  };

  // Calcul dynamique
  const totalToPay = useMemo(() => {
    return cartItems
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cartItems, selectedIds]);

  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

  return (
    <div className="cart-overlay">
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Mon Panier ({cartItems.length})</h2>
          <button className="close-btn" onClick={closeCart}>&times;</button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">Votre panier est vide.</div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={`cart-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}>
                
                {/* LIGNE PRINCIPALE */}
                <div className="cart-item-main">
                    <div className="item-select">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => toggleSelection(item.id)} 
                    />
                    </div>
                    
                    <div className="item-info">
                    <h3>Plan Vasque {item.color === 'white' ? 'Blanc Pur' : ''}</h3>
                    <p className="details">Dim: {item.length}x{item.width}mm • {item.sinks ? item.sinks.length : 0} Cuve(s)</p>
                    
                    <div className="item-actions-row">
                        <button className="btn-text" onClick={() => toggleDetails(item.id)}>
                            {expandedId === item.id ? "Masquer détails ▲" : "Voir détails ▼"}
                        </button>
                        
                        {/* Afficher le bouton charger SEULEMENT si la fonction existe */}
                        {onLoadConfig && (
                            <>
                                <span className="separator">•</span>
                                <button className="btn-text load-btn" onClick={() => onLoadConfig(item)}>
                                    👁️ Voir en 3D
                                </button>
                            </>
                        )}
                    </div>
                    </div>

                    <div className="item-pricing">
                        <div className="qty-wrapper">
                            <input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(item.id, parseInt(e.target.value) || 1)} 
                            />
                        </div>
                        <span className="item-total">{fmt(item.unitPrice * item.quantity)}</span>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </div>
                </div>

                {/* ZONE DETAILS */}
                {expandedId === item.id && (
                    <div className="cart-item-details fade-in">
                        <h4>Caractéristiques complètes :</h4>
                        <ul>
                            <li><strong>Dimensions :</strong> L {item.length} x P {item.width} mm</li>
                            <li><strong>Couleur :</strong> {item.color === 'white' ? "Blanc Pur" : "Autre"}</li>
                            
                            {item.sinks && item.sinks.map((s, idx) => (
                                <li key={s.id || idx} className="sub-group">
                                    <strong>Cuve #{idx+1} :</strong> {s.type.replace("Cuve ", "")}
                                    <br/>Position: {s.position === 'center' ? 'Centrée' : s.position} 
                                    {s.position !== 'center' && ` (${s.offset}mm)`}
                                    <br/>Robinet: {s.hasTapHole ? `Oui (${s.tapHolePosition})` : 'Non'}
                                    <br/>Egouttoir: {s.hasDrainer ? `Oui (${s.drainerPosition})` : 'Non'}
                                </li>
                            ))}

                            {item.rims && (
                                <li>
                                    <strong>Dosserets (H{item.rimHeigh}mm) :</strong> {[item.rimLeft && "Gauche", item.rimBack && "Fond", item.rimRight && "Droite"].filter(Boolean).join(", ")}
                                </li>
                            )}

                            {item.aprons && (
                                <li>
                                    <strong>Retombées (H{item.apronHeight}mm) :</strong> {[item.apronFront && "Avant", item.apronLeft && "Gauche", item.apronBack && "Fond", item.apronRight && "Droite"].filter(Boolean).join(", ")}
                                </li>
                            )}

                            {item.splashback && <li><strong>Goutte d'eau :</strong> Oui (sous plan)</li>}
                        </ul>
                    </div>
                )}

              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <span>Total Sélectionné (HT)</span>
            <span className="amount">{fmt(totalToPay)}</span>
          </div>
          <button 
            className="checkout-btn" 
            disabled={totalToPay === 0}
            onClick={() => alert("Redirection vers le paiement...")}
          >
            Passer au paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;