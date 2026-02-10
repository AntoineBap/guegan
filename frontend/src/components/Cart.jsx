import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/cart.scss';

const Cart = ({ cartItems, updateItem, removeItem, closeCart, onLoadConfig }) => {
  const navigate = useNavigate();
  // On utilise les INDEX (0, 1, 2...) au lieu des IDs
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // --- SYNCHRONISATION SÉLECTION ---
  useEffect(() => {
    // Par défaut, on sélectionne tous les index disponibles
    const allIndices = cartItems.map((_, index) => index);
    setSelectedIndices(allIndices);
  }, [cartItems.length]);

  const toggleSelection = (index) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleDetails = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const handleDelete = (index) => {
    if (window.confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
      removeItem(index);
      // On retire aussi l'index de la sélection pour éviter des bugs visuels
      setSelectedIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleQuantityChange = (index, newQty) => {
      const qty = parseInt(newQty) || 1;
      updateItem(index, { quantity: qty });
  };

  // Calcul dynamique du total (basé sur les INDEX sélectionnés)
  const totalToPay = useMemo(() => {
    return cartItems
      .filter((_, index) => selectedIndices.includes(index))
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cartItems, selectedIndices]);

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
            cartItems.map((item, index) => (
              <div key={index} className={`cart-item ${selectedIndices.includes(index) ? 'selected' : ''}`}>
                
                {/* LIGNE PRINCIPALE */}
                <div className="cart-item-main">
                    <div className="item-select">
                    <input 
                        type="checkbox" 
                        checked={selectedIndices.includes(index)} 
                        onChange={() => toggleSelection(index)} 
                    />
                    </div>
                    
                    <div className="item-info">
                    <h3>Plan Vasque {item.color === 'white' ? 'Blanc Pur' : ''}</h3>
                    <p className="details">Dim: {item.length}x{item.width}mm • {item.sinks ? item.sinks.length : 0} Cuve(s)</p>
                    
                    <div className="item-actions-row">
                        <button className="btn-text" onClick={() => toggleDetails(index)}>
                            {expandedIndex === index ? "Masquer détails ▲" : "Voir détails ▼"}
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
                            onChange={(e) => handleQuantityChange(index, e.target.value)} 
                            />
                        </div>
                        <span className="item-total">{fmt(item.unitPrice * item.quantity)}</span>
                        <button className="delete-btn" onClick={() => handleDelete(index)}>🗑️</button>
                    </div>
                </div>

                {/* ZONE DETAILS */}
                {expandedIndex === index && (
                    <div className="cart-item-details fade-in">
                        <h4>Caractéristiques complètes :</h4>
                        <ul>
                            <li><strong>Dimensions :</strong> L {item.length} x P {item.width} mm</li>
                            <li><strong>Couleur :</strong> {item.color === 'white' ? "Blanc Pur" : "Autre"}</li>
                            
                            {item.sinks && item.sinks.map((s, idx) => (
                                <li key={idx} className="sub-group">
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
            onClick={() => {
                closeCart(); 
                navigate('/checkout'); 
            }}
          >
            Passer au paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;