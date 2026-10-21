import React, { useState, useMemo, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import ItemSpecs from "./ItemSpecs";
import { formatPrice, itemTitle } from "../utils/format";
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
    const qty = Math.min(100, Math.max(1, parseInt(newQty, 10) || 1));
    updateItem(index, { quantity: qty, totalPrice: (cartItems[index]?.unitPrice || 0) * qty });
  };

  // Fermeture avec Échap
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  const [quoteError, setQuoteError] = useState(null);

  const totalToPay = useMemo(() => {
    return cartItems
      .filter((_, index) => selectedIndices.includes(index))
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems, selectedIndices]);

  const renderPrice = (amount) => {
    if (isAuthenticated && Number.isFinite(amount)) return formatPrice(amount);
    return (
      <span className="blurred-price" title="Connectez-vous pour voir le prix">
        000,00 €
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
    setQuoteError(null);
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
        closeCart();
        navigate("/my-quotes", { state: { newQuote: true } });
      } else {
        const data = await response.json().catch(() => ({}));
        setQuoteError(data.message || "Le devis n'a pas pu être généré.");
      }
    } catch (error) {
      console.error(error);
      setQuoteError("Erreur réseau, réessayez.");
    }
    setIsGeneratingQuote(false);
  };

  const selectedCount = selectedIndices.length;
  const canProceed = isAuthenticated && selectedCount > 0 && totalToPay > 0;

  return (
    <div className="cart-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeCart()}>
      <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Panier">
        <div className="cart-header">
          <h2>
            Panier <span>{cartItems.length} article{cartItems.length > 1 ? "s" : ""}</span>
          </h2>
          <button className="close-btn" onClick={closeCart} aria-label="Fermer le panier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <strong>Votre panier est vide</strong>
              <p>Configurez un plan-vasque puis ajoutez-le au panier.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeCart();
                  navigate("/configurator");
                }}
              >
                Ouvrir le configurateur
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => {
              const selected = selectedIndices.includes(index);
              return (
                <div key={item.cartId || index} className={`cart-item ${selected ? "selected" : ""}`}>
                  <div className="cart-item-main">
                    <label className="item-select">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(index)}
                        aria-label={`Inclure ${itemTitle(item, index)}`}
                      />
                    </label>

                    <div className="item-info">
                      <h3>{itemTitle(item, index)}</h3>
                      <p className="details">
                        {item.length} × {item.width} mm ·{" "}
                        {(item.sinks || []).filter((s) => s.type !== "Aucune cuve").length || "sans"} cuve(s)
                      </p>
                      <div className="item-actions-row">
                        <button className="btn-text" onClick={() => toggleDetails(index)} aria-expanded={expandedIndex === index}>
                          {expandedIndex === index ? "Masquer" : "Détail"}
                        </button>
                        {onLoadConfig && (
                          <>
                            <button className="btn-text" onClick={() => onLoadConfig(item, index)}>
                              Voir en 3D
                            </button>
                            <button className="btn-text strong" onClick={() => onLoadConfig(item, index, true)}>
                              Modifier
                            </button>
                          </>
                        )}
                        <button className="btn-text danger" onClick={() => handleDelete(index)}>
                          Retirer
                        </button>
                      </div>
                    </div>

                    <div className="item-pricing">
                      <span className="item-total">{renderPrice(item.unitPrice * item.quantity)}</span>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuer la quantité"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          aria-label="Quantité"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          disabled={item.quantity >= 100}
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedIndex === index && (
                    <div className="cart-item-details fade-in">
                      <ItemSpecs item={item} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="total-row">
              <span>
                Total HT
                <small>
                  {selectedCount === cartItems.length ? "tous les articles" : `${selectedCount} article(s) sélectionné(s)`}
                </small>
              </span>
              <span className="amount">{renderPrice(totalToPay)}</span>
            </div>

            {!isAuthenticated ? (
              <div className="login-hint">
                <p>Connectez-vous pour voir les prix, générer un devis ou commander.</p>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    closeCart();
                    navigate("/login", { state: { from: "/configurator" } });
                  }}
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <>
                {quoteError && <p className="cart-error" role="alert">{quoteError}</p>}
                <button className="btn btn-primary btn-lg btn-block" disabled={!canProceed} onClick={handleCheckoutClick}>
                  Commander la sélection
                </button>
                <button className="btn btn-outline btn-block" disabled={!canProceed || isGeneratingQuote} onClick={handleGenerateQuote}>
                  {isGeneratingQuote ? "Génération du devis…" : "Générer un devis PDF"}
                </button>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};

export default Cart;
