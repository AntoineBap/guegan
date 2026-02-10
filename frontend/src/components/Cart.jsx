import React, { useState, useMemo, useEffect } from 'react';
import '../styles/cart.scss';

const Cart = ({ cartItems, updateItem, removeItem, closeCart, onLoadConfig }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  
  // État pour savoir quel item est "ouvert" (détails techniques)
  const [expandedId, setExpandedId] = useState(null);

  // --- SYNCHRONISATION SÉLECTION ---
  useEffect(() => {
    setSelectedIds(prevSelected => {
        // On garde ceux qui sont déjà sélectionnés et qui existent toujours dans le panier
        // (On continue d'utiliser les IDs pour la sélection visuelle, c'est plus stable)
        const currentValidIds = prevSelected.filter(id => cartItems.find(item => item.id === id));
        
        // Si le panier change (ajout), on veut peut-être sélectionner les nouveaux par défaut.
        // Ici, on remet tout par défaut pour simplifier l'UX.
        const allIds = cartItems.map(i => i.id);
        return allIds;
    });
  }, [cartItems.length]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleDetails = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // --- ACTIONS ---
  
  // CORRECTION ICI : On prend l'INDEX, pas l'ID
  const handleDelete = (index) => {
    if (window.confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
      removeItem(index); // On envoie l'index (0, 1, 2...) au Context
    }
  };

  // CORRECTION ICI : On prend l'INDEX et on envoie un OBJET quantity
  const handleQuantityChange = (index, newQty) => {
      const qty = parseInt(newQty) || 1;
      // On envoie : Index, et l'objet des changements
      updateItem(index, { quantity: qty });
  };

  // Calcul dynamique du total (basé sur les IDs sélectionnés)
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
            // AJOUT DE 'index' DANS LE MAP
            cartItems.map((item, index) => (
              <div key={index} className={`cart-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}>
                
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
                            // ON UTILISE L'INDEX ICI
                            onChange={(e) => handleQuantityChange(index, e.target.value)} 
                            />
                        </div>
                        <span className="item-total">{fmt(item.unitPrice * item.quantity)}</span>
                        {/* ON UTILISE L'INDEX ICI POUR LA SUPPRESSION */}
                        <button className="delete-btn" onClick={() => handleDelete(index)}>🗑️</button>
                    </div>
                </div>

                {/* ZONE DETAILS (Reste identique) */}
                {expandedId === item.id && (
                    <div className="cart-item-details fade-in">
                        <h4>Caractéristiques complètes :</h4>
                        <ul>
                            <li><strong>Dimensions :</strong> L {item.length} x P {item.width} mm</li>
                            <li><strong>Couleur :</strong> {item.color === 'white' ? "Blanc Pur" : "Autre"}</li>
                            
                            {item.sinks && item.sinks.map((s, idx) => (
                                <li key={s.id || idx} className="sub-group">
                                    <strong>Cuve #{idx+1} :</strong> {s.type ? s.type.replace("Cuve ", "") : "Standard"}
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