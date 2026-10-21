import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import { formatPrice, formatDateLong, itemTitle, ORDER_STATUS } from "../utils/format";
import "../styles/orderConfirmation.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const IBAN = import.meta.env.VITE_BANK_IBAN || "IBAN non configuré";
const BIC = import.meta.env.VITE_BANK_BIC || "BIC non configuré";

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  return (
    <button type="button" className="copy-btn" onClick={copy}>
      {copied ? "Copié" : "Copier"}
    </button>
  );
};

const Address = ({ a }) => (
  <p>
    {[a.firstName, a.lastName].filter(Boolean).join(" ")}
    {a.company && <><br />{a.company}</>}
    <br />
    {a.address}
    <br />
    {a.zip} {a.city}
  </p>
);

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/order/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [orderId, token]);

  if (order === undefined) return <><Header /><div className="page-loader" /></>;
  if (order === null)
    return (
      <>
        <Header />
        <main className="confirmation-page">
          <h1>Commande introuvable</h1>
          <Link to="/my-orders" className="btn btn-primary">Voir mes commandes</Link>
        </main>
      </>
    );

  const reference = `Commande ${order.orderNumber}`;
  const ttc = order.totalAmount * 1.2;
  const isPending = order.status === "pending_payment";

  return (
    <>
      <Helmet>
        <title>Commande #{order.orderNumber} — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="confirmation-page">
        <header className="confirmation-head">
          <p className="eyebrow">Commande #{order.orderNumber}</p>
          <h1>{isPending ? "Merci, votre commande est enregistrée" : "Détail de votre commande"}</h1>
          <p className="lead">
            {isPending
              ? `Un récapitulatif a été envoyé par email. La fabrication démarre dès réception de votre virement, à effectuer avant le ${formatDateLong(order.paymentDeadline)}.`
              : `Commande passée le ${formatDateLong(order.createdAt)}.`}
          </p>
          {!isPending && (
            <p style={{ marginTop: 12 }}>
              <span className={`status-badge ${ORDER_STATUS[order.status]?.tone || "is-neutral"}`}>
                {ORDER_STATUS[order.status]?.label || order.status}
              </span>
            </p>
          )}
        </header>

        <div className="confirmation-grid">
          {isPending && (
            <section className="card bank-card">
              <h2>Virement bancaire</h2>
              <dl>
                <div>
                  <dt>Montant TTC</dt>
                  <dd className="amount">{formatPrice(ttc)}</dd>
                </div>
                <div>
                  <dt>IBAN</dt>
                  <dd>
                    <span className="mono">{IBAN}</span>
                    <CopyButton value={IBAN} />
                  </dd>
                </div>
                <div>
                  <dt>BIC</dt>
                  <dd>
                    <span className="mono">{BIC}</span>
                  </dd>
                </div>
                <div>
                  <dt>Libellé</dt>
                  <dd>
                    <strong>{reference}</strong>
                    <CopyButton value={reference} />
                  </dd>
                </div>
                <div>
                  <dt>Avant le</dt>
                  <dd>{formatDateLong(order.paymentDeadline)}</dd>
                </div>
              </dl>
              <p className="note">Indiquez bien le libellé pour que votre paiement soit rapproché sans délai.</p>
            </section>
          )}

          <section className="card">
            <h2>Articles</h2>
            <ul className="items">
              {order.items.map((item, i) => (
                <li key={i}>
                  <div>
                    <strong>{itemTitle(item, i)}</strong>
                    <span>
                      {item.length} × {item.width} mm ·{" "}
                      {(item.sinks || []).filter((s) => s.type !== "Aucune cuve").length || "sans"} cuve(s)
                    </span>
                  </div>
                  <span className="qty">× {item.quantity}</span>
                  <span className="price">{formatPrice(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="sum">
              {order.shippingCost > 0 && (
                <div><dt>Livraison HT</dt><dd>{formatPrice(order.shippingCost)}</dd></div>
              )}
              {order.shippingCost === -1 && (
                <div><dt>Livraison</dt><dd>sur devis, nous vous contactons</dd></div>
              )}
              <div><dt>Total HT</dt><dd>{formatPrice(order.totalAmount)}</dd></div>
              <div><dt>TVA 20 %</dt><dd>{formatPrice(order.totalAmount * 0.2)}</dd></div>
              <div className="grand"><dt>Total TTC</dt><dd>{formatPrice(ttc)}</dd></div>
            </dl>
          </section>

          <section className="card addresses">
            <div>
              <h2>Facturation</h2>
              <Address a={order.billingAddress} />
            </div>
            <div>
              <h2>Livraison</h2>
              <Address a={order.shippingAddress} />
            </div>
          </section>
        </div>

        <div className="confirmation-actions">
          <Link to="/my-orders" className="btn btn-primary">Suivre mes commandes</Link>
          <Link to="/configurator" className="btn btn-outline">Configurer un autre plan</Link>
        </div>
      </main>
    </>
  );
};

export default OrderConfirmation;
