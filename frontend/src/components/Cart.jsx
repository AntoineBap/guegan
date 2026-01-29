import React, { useState, useMemo } from 'react';
import '../styles/cart.scss'; // Nous créerons ce fichier CSS juste après

const Cart = ({ cartItems, updateItem, removeItem, closeCart }) => {
  // État local pour savoir quels items sont cochés pour le paiement
  const [selectedIds, setSelectedIds] = useState(cartItems.map(item => item.id));

  // Gestion des checkbox
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Gestion de la suppression avec confirmation
  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette configuration du panier ?")) {
      removeItem(id);
      setSelectedIds(prev => prev.filter(pid => pid !== id));
    }
  };

  // Calcul du total des éléments SÉLECTIONNÉS uniquement
  const totalToPay = useMemo(() => {
    return cartItems
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cartItems, selectedIds]);

  // Formatage prix
  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

  return (
    <div className="cart-overlay">
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Votre Panier ({cartItems.length})</h2>
          <button className="close-btn" onClick={closeCart}>&times;</button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Votre panier est vide.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={`cart-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}>
                
                {/* Checkbox de sélection */}
                <div className="item-select">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)} 
                    onChange={() => toggleSelection(item.id)} 
                  />
                </div>

                {/* Détails de la config */}
                <div className="item-details">
                  <h3>Plan Vasque Sur Mesure</h3>
                  <p className="dims">{item.length} x {item.width} mm</p>
                  <p className="desc">
                    {item.sinks.length} cuve(s) • 
                    {item.color === 'white' ? 'Blanc Pur' : 'Autre'}
                  </p>
                  <p className="unit-price">PU: {fmt(item.unitPrice)} HT</p>
                </div>

                {/* Contrôles Quantité et Suppression */}
                <div className="item-actions">
                  <div className="qty-control">
                    <label>Qté:</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(item.id, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="item-total">
                    {fmt(item.unitPrice * item.quantity)}
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <span>Total Sélectionné (HT) :</span>
            <span className="total-amount">{fmt(totalToPay)}</span>
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