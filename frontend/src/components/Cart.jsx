import React, { useState, useMemo, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import "../styles/cart.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Cart = ({ updateItem, removeItem, closeCart, onLoadConfig }) => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);
  const { cartItems, proceedToCheckout } = useCart();

  const [selectedIndices, setSelectedIndices] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  useEffect(() => {
    const allIndices = cartItems.map((_, index) => index);
    setSelectedIndices(allIndices);
  }, [cartItems.length]);

  const toggleSelection = (index) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleDetails = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleDelete = (index) => {
    if (
      window.confirm("Voulez-vous vraiment retirer cet article du panier ?")
    ) {
      removeItem(index);
      setSelectedIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleQuantityChange = (index, newQty) => {
    const qty = parseInt(newQty) || 1;
    updateItem(index, { quantity: qty });
  };

  const totalToPay = useMemo(() => {
    return cartItems
      .filter((_, index) => selectedIndices.includes(index))
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems, selectedIndices]);

  const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

  const renderPrice = (amount) => {
    if (isAuthenticated) {
      return fmt(amount);
    }
    return (
      <span className="blurred-price" title="Connectez-vous pour voir le prix">
        XXX,XX €
      </span>
    );
  };

  const handleCheckoutClick = () => {
    proceedToCheckout(selectedIndices);
    closeCart();
    navigate("/checkout");
  };

  const handleGenerateQuote = async () => {
    if (!isAuthenticated) return;
    setIsGeneratingQuote(true);
    const itemsToQuote = cartItems.filter((_, index) => selectedIndices.includes(index));
    
    try {
      const response = await fetch(`${API_URL}/api/auth/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToQuote, totalAmount: totalToPay }),
      });

      if (response.ok) {
        alert("Devis généré avec succès ! Vous pouvez le retrouver dans votre profil.");
        closeCart();
        navigate("/my-quotes");
      } else {
        alert("Erreur lors de la génération du devis.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur réseau.");
    }
    setIsGeneratingQuote(false);
  };

  return (
    <div className="cart-overlay">
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Mon Panier ({cartItems.length})</h2>
          <button className="close-btn" onClick={closeCart}>
            &times;
          </button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">Votre panier est vide.</div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={index}
                className={`cart-item ${selectedIndices.includes(index) ? "selected" : ""}`}
              >
                <div className="cart-item-main">
                  <div className="item-select">
                    <input
                      type="checkbox"
                      checked={selectedIndices.includes(index)}
                      onChange={() => toggleSelection(index)}
                    />
                  </div>

                  <div className="item-info">
                    <h3>Plan Vasque</h3>
                    <p className="details">
                      Dim: {item.length}x{item.width}mm •{" "}
                      {item.sinks 
                        ? item.sinks.filter(s => s.type !== "Aucune cuve").length 
                        : 0
                      } Cuve(s)
                    </p>

                    <div className="item-actions-row">
                      <button
                        className="btn-text"
                        onClick={() => toggleDetails(index)}
                      >
                        {expandedIndex === index
                          ? "Masquer détails ▲"
                          : "Voir détails ▼"}
                      </button>

                      {onLoadConfig && (
                        <>
                          <span className="separator">•</span>
                          <button
                            className="btn-text load-btn"
                            onClick={() => {
                              closeCart();
                              onLoadConfig(item);
                            }}
                          >
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
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                      />
                    </div>

                    <span className="item-total">
                      {renderPrice(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(index)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedIndex === index && (
                  <div className="cart-item-details fade-in">
                    <h4>Caractéristiques complètes :</h4>
                    <ul>
                      <li>
                        <strong>Dimensions :</strong> L {item.length} x P{" "}
                        {item.width} mm
                      </li>

                      {item.sinks &&
                        item.sinks
                          .filter((s) => s.type !== "Aucune cuve")
                          .map((s, idx) => {
                            const isAnchor = item.anchorId && s.id === item.anchorId;

                            let positionLabel = s.position;
                            if (s.position === "left") positionLabel = "Gauche";
                            else if (s.position === "right") positionLabel = "Droite";
                            else if (s.position === "center") positionLabel = "Centrée";

                            let drainerLabel = s.drainerPosition;
                            if (s.drainerPosition === "left") drainerLabel = "Gauche";
                            else if (s.drainerPosition === "right") drainerLabel = "Droite";

                            return (
                              <li key={idx} className="sub-group">
                                <strong>
                                  Cuve #{idx + 1}
                                  {isAnchor && (
                                    <span style={{ color: "#d4af37", marginLeft: "5px" }}>
                                      (Ancrée)
                                    </span>
                                  )} :
                                </strong>{" "}
                                {s.type ? s.type.replace("Cuve ", "") : "Standard"}
                                <br />
                                Position: {positionLabel}
                                {s.position !== "center" && ` (${s.offset}mm)`}
                                <br />
                                Robinet:{" "}
                                {s.hasTapHole ? `Oui (${s.tapHolePosition})` : "Non"}
                                <br />
                                Egouttoir:{" "}
                                {s.hasDrainer ? `Oui (${drainerLabel})` : "Non"}
                              </li>
                            );
                          })}

                      {item.rims && (
                        <li>
                          <strong>Dosserets (H{item.rimHeigh}mm) :</strong>{" "}
                          {[
                            item.rimLeft && "Gauche",
                            item.rimBack && "Fond",
                            item.rimRight && "Droite",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </li>
                      )}

                      {item.aprons && (
                        <li>
                          <strong>Retombées (H{item.apronHeight}mm) :</strong>{" "}
                          {[
                            item.apronFront && "Avant",
                            item.apronLeft && "Gauche",
                            item.apronBack && "Fond",
                            item.apronRight && "Droite",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </li>
                      )}

                      {item.splashback && (
                        <li>
                          <strong>Anti-Goutte d'eau :</strong> Oui{" "}
                        </li>
                      )}
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
            <span className="amount">{renderPrice(totalToPay)}</span>
          </div>

          {!isAuthenticated && (
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "0.9rem",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                ⚠️ Veuillez vous connecter pour voir les prix et commander
              </p>
              <button
                onClick={() => {
                  closeCart();
                  navigate("/login");
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "white",
                  border: "1px solid #111",
                  color: "#111",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                Se connecter
              </button>
            </div>
          )}

          <button
            onClick={handleGenerateQuote}
            disabled={totalToPay === 0 || isGeneratingQuote || !isAuthenticated}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "transparent",
              border: "2px solid #111",
              color: "#111",
              borderRadius: "6px",
              cursor: (totalToPay === 0 || !isAuthenticated) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              marginBottom: "10px",
              opacity: (totalToPay === 0 || !isAuthenticated) ? 0.5 : 1,
              transition: "all 0.2s"
            }}
          >
            {isGeneratingQuote ? "Génération en cours..." : "Générer un devis"}
          </button>

          <button
            className="checkout-btn"
            disabled={totalToPay === 0 || !isAuthenticated}
            style={
              !isAuthenticated || totalToPay === 0
                ? {
                    opacity: 0.5,
                    cursor: "not-allowed",
                    backgroundColor: "#ccc",
                  }
                : {}
            }
            onClick={handleCheckoutClick}
          >
            Valider la commande 
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;