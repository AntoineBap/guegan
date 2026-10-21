import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import { SettingsContext } from "../contexts/SettingsContext";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import ItemSpecs from "../components/ItemSpecs";
import { formatPrice, itemTitle } from "../utils/format";
import "../styles/checkout.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Coordonnées de l'origine : 1 Rue de l'Industrie, 93000 Bobigny
const ORIGIN_LAT = 48.9118;
const ORIGIN_LON = 2.4397;

const Checkout = () => {
  const { checkoutItems, clearPurchasedItems } = useCart();
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItemIndex, setExpandedItemIndex] = useState(null);

  const [submitError, setSubmitError] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);

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

  const leadTime = settings?.constraints?.leadTime || 15;

  useEffect(() => {
    if (user) {
      // L'adresse issue du SIRET est du type « 1 rue de l'Industrie, 93000 Bobigny » : on la découpe
      const raw = user.companyAddress || "";
      const m = raw.match(/^(.*?)[,\s]+(\d{5})\s+(.+)$/);
      setBilling((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        company: user.companyName || "",
        address: m ? m[1].trim() : raw,
        zip: m ? m[2] : user.zip || "",
        city: m ? m[3].trim() : user.city || "",
      }));
    }
  }, [user]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const targetAddress = useSameAddress ? billing : shipping;

    if (targetAddress.zip && targetAddress.city) {
      const timer = setTimeout(() => {
        const query = `${targetAddress.address} ${targetAddress.zip} ${targetAddress.city}`;

        fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.features && data.features.length > 0) {
              const [lon, lat] = data.features[0].geometry.coordinates;
              const distance = calculateDistance(
                ORIGIN_LAT,
                ORIGIN_LON,
                lat,
                lon,
              );

              let price = 0;
              if (distance <= 250) price = 0;
              else if (distance <= 400) price = 200;
              else if (distance <= 600) price = 400;
              else price = -1;

              setShippingCost(price);
            }
          })
          .catch((err) => console.error("Erreur calcul distance", err));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    billing.address,
    billing.zip,
    billing.city,
    shipping.address,
    shipping.zip,
    shipping.city,
    useSameAddress,
  ]);

  const itemsTotal = checkoutItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );

  const safeShippingCost = shippingCost === -1 ? 0 : shippingCost;
  const finalTotal = itemsTotal + safeShippingCost;

  const handleBillingChange = (e) =>
    setBilling({ ...billing, [e.target.name]: e.target.value });
  const handleShippingChange = (e) =>
    setShipping({ ...shipping, [e.target.name]: e.target.value });

  const toggleDetails = (index) => {
    setExpandedItemIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!acceptedTerms || !acceptedCGV) {
      return setSubmitError("Merci d'accepter les conditions avant de valider.");
    }

    setIsSubmitting(true);
    const finalShipping = useSameAddress ? billing : shipping;

    try {
      const response = await fetch(`${API_URL}/api/auth/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Le serveur recalcule les prix et la livraison : ces montants ne sont qu'indicatifs
        body: JSON.stringify({
          // Commande issue d'un devis : le serveur reprend les prix du devis s'il est encore valable
          quoteId: checkoutItems[0]?.fromQuoteId,
          items: checkoutItems,
          totalAmount: finalTotal,
          shippingCost,
          billingAddress: billing,
          shippingAddress: finalShipping,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        clearPurchasedItems();
        navigate(`/order-confirmation/${data.orderId}`, { replace: true });
        return;
      }
      setSubmitError(data.message || "La commande n'a pas pu être enregistrée.");
    } catch {
      setSubmitError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
    setIsSubmitting(false);
  };

  const renderAddressFields = ({ values, onChange, prefix }) => (
    <div className="form-grid">
      <label className="field-group">
        <span>Prénom</span>
        <input type="text" name="firstName" autoComplete={`${prefix} given-name`} value={values.firstName} onChange={onChange} required />
      </label>
      <label className="field-group">
        <span>Nom</span>
        <input type="text" name="lastName" autoComplete={`${prefix} family-name`} value={values.lastName} onChange={onChange} required />
      </label>
      <label className="field-group full-width">
        <span>Entreprise</span>
        <input type="text" name="company" autoComplete={`${prefix} organization`} value={values.company} onChange={onChange} />
      </label>
      <label className="field-group full-width">
        <span>Adresse</span>
        <input type="text" name="address" autoComplete={`${prefix} street-address`} value={values.address} onChange={onChange} required />
      </label>
      <label className="field-group">
        <span>Code postal</span>
        <input type="text" name="zip" inputMode="numeric" autoComplete={`${prefix} postal-code`} value={values.zip} onChange={onChange} required />
      </label>
      <label className="field-group">
        <span>Ville</span>
        <input type="text" name="city" autoComplete={`${prefix} address-level2`} value={values.city} onChange={onChange} required />
      </label>
    </div>
  );

  if (checkoutItems.length === 0) {
    return (
      <>
        <Header />
        <main className="checkout-page checkout-empty">
          <h1>Aucun article à commander</h1>
          <p>Sélectionnez les plans à commander depuis votre panier.</p>
          <Link to="/configurator" className="btn btn-primary">Retour au configurateur</Link>
        </main>
      </>
    );
  }

  const shippingLabel =
    shippingCost === -1 ? "Sur devis" : shippingCost === 0 ? "Offerte" : formatPrice(shippingCost);

  return (
    <>
      <Helmet>
        <title>Finaliser la commande — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="checkout-page">
        <div className="checkout-head">
          <Link to="/configurator" className="back-link">← Continuer la configuration</Link>
          <h1>Finaliser la commande</h1>
          <ol className="steps" aria-label="Étapes">
            <li className="done">Panier</li>
            <li className="current">Adresses & conditions</li>
            <li>Virement</li>
          </ol>
        </div>

        <div className="checkout-container">
          <div className="form-column">
            {!isAuthenticated ? (
              <section className="panel-box login-needed">
                <h2>Connectez-vous pour commander</h2>
                <p>Les commandes sont réservées aux comptes professionnels. Votre sélection est conservée.</p>
                <Link to="/login" state={{ from: "/checkout" }} className="btn btn-primary">
                  Se connecter ou créer un compte
                </Link>
              </section>
            ) : (
              <form id="checkout-form" onSubmit={handleSubmit}>
                <section className="panel-box">
                  <h2>Adresse de facturation</h2>
                  {renderAddressFields({ values: billing, onChange: handleBillingChange, prefix: "billing" })}

                  <label className="inline-check">
                    <input type="checkbox" checked={useSameAddress} onChange={(e) => setUseSameAddress(e.target.checked)} />
                    Livrer à la même adresse
                  </label>
                </section>

                {!useSameAddress && (
                  <section className="panel-box fade-in">
                    <h2>Adresse de livraison</h2>
                    {renderAddressFields({ values: shipping, onChange: handleShippingChange, prefix: "shipping" })}
                  </section>
                )}

                <section className="panel-box legal-box">
                  <h2>Conditions</h2>
                  <p>
                    Conformément à l'article <strong>L.221-28 3° du Code de la consommation</strong>, le droit de
                    rétractation ne s'applique pas aux biens confectionnés selon les spécifications du client.
                  </p>
                  <label className="inline-check">
                    <input type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                    <span>
                      J'accepte que ma commande sur mesure ne soit ni échangeable ni remboursable une fois la
                      fabrication lancée.
                    </span>
                  </label>
                  <label className="inline-check">
                    <input type="checkbox" required checked={acceptedCGV} onChange={(e) => setAcceptedCGV(e.target.checked)} />
                    <span>
                      J'ai lu et j'accepte les <Link to="/cgv" target="_blank">conditions générales de vente</Link>.
                    </span>
                  </label>
                </section>
              </form>
            )}
          </div>

          <aside className="summary-column">
            <div className="summary-card">
              <h2>
                Récapitulatif <span>{checkoutItems.reduce((n, i) => n + (i.quantity || 1), 0)} pièce(s)</span>
              </h2>

              <ul className="items-list">
                {checkoutItems.map((item, idx) => (
                  <li key={idx}>
                    <div className="mini-item">
                      <div>
                        <strong>
                          {item.quantity} × {itemTitle(item, idx)}
                        </strong>
                        <span>
                          {item.length} × {item.width} mm
                        </span>
                      </div>
                      <span className="price">{isAuthenticated ? formatPrice(item.unitPrice * item.quantity) : "–"}</span>
                    </div>
                    <button type="button" className="details-toggle-btn" onClick={() => toggleDetails(idx)} aria-expanded={expandedItemIndex === idx}>
                      {expandedItemIndex === idx ? "Masquer le détail" : "Voir le détail"}
                    </button>
                    {expandedItemIndex === idx && <ItemSpecs item={item} />}
                  </li>
                ))}
              </ul>

              <dl className="totals">
                <div>
                  <dt title="Délai entre la réception du paiement et l'expédition">Délai avant expédition</dt>
                  <dd>{leadTime} jours</dd>
                </div>
                <div>
                  <dt>Sous-total HT</dt>
                  <dd>{isAuthenticated ? formatPrice(itemsTotal) : "–"}</dd>
                </div>
                <div>
                  <dt>Livraison HT</dt>
                  <dd>{shippingLabel}</dd>
                </div>
                <div className="grand">
                  <dt>Total HT</dt>
                  <dd>{isAuthenticated ? formatPrice(finalTotal) : "–"}</dd>
                </div>
                {isAuthenticated && (
                  <div className="ttc">
                    <dt>soit TTC</dt>
                    <dd>{formatPrice(finalTotal * 1.2)}</dd>
                  </div>
                )}
              </dl>
              {shippingCost === -1 && (
                <p className="shipping-note">Livraison au-delà de 600 km : nous vous contactons pour la chiffrer.</p>
              )}

              {submitError && <p className="submit-error" role="alert">{submitError}</p>}

              {isAuthenticated && (
                <button
                  type="submit"
                  form="checkout-form"
                  className="btn btn-primary btn-lg btn-block"
                  disabled={isSubmitting || !acceptedTerms || !acceptedCGV}
                >
                  {isSubmitting ? "Validation…" : "Valider la commande"}
                </button>
              )}
              <p className="pay-note">Paiement par virement bancaire. Les coordonnées s'affichent à l'étape suivante.</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
};

export default Checkout;
