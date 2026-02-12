import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // 👈 Ajout de Link
import { useCart } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/checkout.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Checkout = () => {
  const { checkoutItems, clearCart } = useCart();
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [useSameAddress, setUseSameAddress] = useState(true);
  // États pour les cases à cocher
  const [acceptedTerms, setAcceptedTerms] = useState(false); // Renonciation rétractation
  const [acceptedCGV, setAcceptedCGV] = useState(false); // CGV

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItemIndex, setExpandedItemIndex] = useState(null);

  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    city: "",
    zip: "",
    country: "France",
  });
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    city: "",
    zip: "",
    country: "France",
  });

  useEffect(() => {
    if (user) {
      setBilling((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        company: user.companyName || "",
        address: user.companyAddress || "",
        city: user.city || "",
        zip: user.zip || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!checkoutItems || checkoutItems.length === 0) {
      navigate("/");
    }
  }, [checkoutItems, navigate]);

  const totalAmount = checkoutItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );

  const handleBillingChange = (e) =>
    setBilling({ ...billing, [e.target.name]: e.target.value });
  const handleShippingChange = (e) =>
    setShipping({ ...shipping, [e.target.name]: e.target.value });

  const toggleDetails = (index) => {
    setExpandedItemIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérification finale (sécurité)
    if (!acceptedTerms || !acceptedCGV) {
      return alert("Veuillez accepter les conditions pour continuer.");
    }

    if (!isAuthenticated)
      return alert("Veuillez vous connecter pour commander.");

    setIsSubmitting(true);
    const finalShipping = useSameAddress ? billing : shipping;

    try {
      const response = await fetch(`${API_URL}/api/auth/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: checkoutItems,
          totalAmount,
          billingAddress: billing,
          shippingAddress: finalShipping,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        clearCart();
        navigate(`/order-confirmation/${data.orderId}`);
      } else {
        console.error("Erreur Backend :", data);
        const errorMsg = data.message || data.error || JSON.stringify(data);
        alert("Erreur lors de la commande : " + errorMsg);
      }
    } catch (error) {
      console.error("Erreur Réseau :", error);
      alert("Impossible de contacter le serveur.");
    }
    setIsSubmitting(false);
  };

  if (checkoutItems.length === 0) return null;

  return (
    <div className="checkout-page">
      <h1>Finalisation de la commande</h1>

      <div className="checkout-container">
        <div className="form-column">
          <form id="checkout-form" onSubmit={handleSubmit}>
            <section>
              <h2>📍 Adresse de Facturation</h2>
              <div className="form-grid">
                <div className="field-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Jean"
                    value={billing.firstName}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Dupont"
                    value={billing.lastName}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Nom de l'entreprise</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Menuiserie Guegan"
                    value={billing.company}
                    onChange={handleBillingChange}
                  />
                </div>
                <div className="field-group full-width">
                  <label>Adresse</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="1 Avenue des Champs-Élysées"
                    value={billing.address}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Code Postal</label>
                  <input
                    type="text"
                    name="zip"
                    placeholder="75008"
                    value={billing.zip}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Paris"
                    value={billing.city}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
              </div>
            </section>

            <div className="checkbox-section">
              <label>
                <input
                  type="checkbox"
                  checked={useSameAddress}
                  onChange={(e) => setUseSameAddress(e.target.checked)}
                />
                Utiliser la même adresse pour la livraison
              </label>
            </div>

            {!useSameAddress && (
              <section className="fade-in">
                <h2>🚚 Adresse de Livraison</h2>
                <div className="form-grid">
                  {/* Champs adresse livraison identiques... */}
                  <div className="field-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Jean"
                      value={shipping.firstName}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Dupont"
                      value={shipping.lastName}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Nom de l'entreprise</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="Menuiserie Guegan"
                      value={shipping.company}
                      onChange={handleShippingChange}
                    />
                  </div>
                  <div className="field-group full-width">
                    <label>Adresse</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="1 Avenue des Champs-Élysées"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Code Postal</label>
                    <input
                      type="text"
                      name="zip"
                      placeholder="75008"
                      value={shipping.zip}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Paris"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                </div>
              </section>
            )}

            {/* --- ZONE LÉGALE --- */}
            <div className="legal-box warning">
              <h3>⚠️ Renonciation au droit de rétractation</h3>
              <p>
                Conformément à l'article{" "}
                <strong>L.221-28 3° du Code de la consommation</strong>, le
                droit de rétractation ne peut être exercé pour les contrats de
                fourniture de biens confectionnés selon les spécifications du
                consommateur ou nettement personnalisés.
              </p>
              <label className="accept-terms">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                J'ai lu et j'accepte que ma commande de produits sur-mesure ne
                soit ni échangeable ni remboursable une fois la fabrication
                lancée.
              </label>

              {/* --- NOUVELLE CHECKBOX CGV --- */}
              <div
                style={{
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <label className="accept-terms">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedCGV}
                    onChange={(e) => setAcceptedCGV(e.target.checked)}
                  />
                  <span>
                    J'ai lu et j'accepte les{" "}
                    <Link
                      to="/cgv"
                      target="_blank"
                      style={{ color: "#856404", textDecoration: "underline" }}
                    >
                      Conditions Générales de Vente
                    </Link>{" "}
                    (CGV).
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="summary-column">
          <div className="summary-card">
            <h3>Résumé ({checkoutItems.length} articles)</h3>
            <div className="items-list">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="summary-item-wrapper">
                  <div className="mini-item">
                    <div>
                      <span style={{ fontWeight: "bold" }}>
                        {item.quantity}x Plan {item.length}x{item.width}mm
                      </span>
                      <button
                        type="button"
                        className="details-toggle-btn"
                        onClick={() => toggleDetails(idx)}
                      >
                        {expandedItemIndex === idx ? "Masquer ▴" : "Détails ▾"}
                      </button>
                    </div>
                    <span>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
                  </div>

                  {expandedItemIndex === idx && (
                    <div className="mini-item-details">
                      <ul>
                        {/* Dimensions toujours affichées */}
                        <li>
                          <strong>Dimensions :</strong> {item.length}x
                          {item.width}mm
                        </li>

                        {/* CUVES : Ne s'affiche QUE s'il y a au moins une cuve */}
                        {item.sinks &&
                          item.sinks.length > 0 &&
                          item.sinks[0]?.type !== "Aucune cuve" &&
                          item.sinks.map((s, sinkIdx) => (
                            <li
                              key={sinkIdx}
                              style={{
                                marginTop: "8px",
                                paddingLeft: "10px",
                                borderLeft: "2px solid #ddd",
                              }}
                            >
                              <strong>Cuve #{sinkIdx + 1} :</strong>{" "}
                              {s.type
                                ? s.type.replace("Cuve ", "")
                                : "Standard"}
                              <br />
                              {/* On définit une petite fonction ou un objet de traduction pour la clarté */}
                              Position :{" "}
                              {s.position === "center"
                                ? "Centrée"
                                : s.position === "left"
                                  ? "Gauche"
                                  : s.position === "right"
                                    ? "Droite"
                                    : s.position}
                              {s.position !== "center" && ` (${s.offset}mm)`}
                              <br />
                              Robinet :{" "}
                              {s.hasTapHole ? (
                                <>
                                  Oui ({s.tapHolePosition})
                                  {s.tapHoleOffset && s.tapHoleOffset !== 0
                                    ? ` [Décalage : ${s.tapHoleOffset}mm]`
                                    : ""}
                                </>
                              ) : (
                                "Non"
                              )}
                              <br />
                              Egouttoir :{" "}
                              {s.hasDrainer ? (
                                <>
                                  Oui (
                                  {s.drainerPosition === "left"
                                    ? "Gauche"
                                    : s.drainerPosition === "right"
                                      ? "Droite"
                                      : s.drainerPosition}
                                  )
                                </>
                              ) : (
                                "Non"
                              )}
                            </li>
                          ))}

                        {/* DOSSERETS */}
                        {item.rims && (
                          <li style={{ marginTop: "5px" }}>
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

                        {/* RETOMBÉES */}
                        {item.aprons && (
                          <li style={{ marginTop: "5px" }}>
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

                        {/* GOUTTE D'EAU */}
                        {item.splashback && (
                          <li style={{ marginTop: "5px" }}>
                            <strong>Anti-Goutte d'eau :</strong> Oui
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="total-row">
              <span>Total HT</span>
              <span>{totalAmount.toFixed(2)} €</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="validate-btn"
              // Le bouton est désactivé si l'une des deux cases n'est pas cochée
              disabled={isSubmitting || !acceptedTerms || !acceptedCGV}
              style={{ marginTop: "20px" }}
            >
              {isSubmitting ? "Validation..." : "Confirmer et Payer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
