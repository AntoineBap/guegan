import React, { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import Header from "../components/Header";
import ItemSpecs from "../components/ItemSpecs";
import { downloadPdf } from "../utils/pdf";
import { formatPrice, formatDate, formatDateLong, quoteExpiry, isQuoteValid, itemTitle } from "../utils/format";
import "../styles/clientPages.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ClientQuotes = () => {
  const { token } = useContext(AuthContext);
  const { setCheckoutItems } = useCart();
  const [quotes, setQuotes] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated = location.state?.newQuote;

  useEffect(() => {
    fetch(`${API_URL}/api/auth/my-quotes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuotes(list);
        // Le devis qui vient d'être généré est déplié
        if (justCreated && list[0]) setOpenId(list[0]._id);
      })
      .catch(() => setQuotes([]));
  }, [token, justCreated]);

  const handleDelete = async (quote) => {
    if (!window.confirm(`Supprimer le devis #${quote.quoteNumber} ?`)) return;
    setBusyId(quote._id);
    const res = await fetch(`${API_URL}/api/auth/quotes/${quote._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    setBusyId(null);
    if (res?.ok) setQuotes((prev) => prev.filter((q) => q._id !== quote._id));
    else setError("Suppression impossible, réessayez.");
  };

  const handleDownload = async (quote) => {
    setBusyId(quote._id);
    setError(null);
    try {
      await downloadPdf(async () => {
        const { default: QuoteNote } = await import("../components/QuoteNote");
        return <QuoteNote quote={quote} />;
      }, `Devis_${quote.quoteNumber}.pdf`);
    } catch {
      setError("Le PDF n'a pas pu être généré.");
    }
    setBusyId(null);
  };

  const handleOrder = (quote) => {
    setCheckoutItems(quote.items.map((i) => ({ ...i, fromQuoteId: quote._id })));
    navigate("/checkout");
  };

  return (
    <>
      <Helmet>
        <title>Mes devis — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="client-page">
        <div className="client-head">
          <div>
            <p className="eyebrow">Mon espace</p>
            <h1>Mes devis</h1>
            <p className="sub">Chaque devis est valable un mois. Les prix y sont garantis pendant cette période.</p>
          </div>
        </div>

        {justCreated && <p className="notice">Votre devis a été généré. Vous pouvez le télécharger en PDF ou le commander directement.</p>}
        {error && <p className="notice is-error" role="alert">{error}</p>}

        {quotes === null ? (
          <div className="page-loader" />
        ) : quotes.length === 0 ? (
          <div className="client-empty">
            <strong>Aucun devis</strong>
            <p>Depuis votre panier, « Générer un devis PDF » crée un devis valable un mois.</p>
            <Link to="/configurator" className="btn btn-primary">Configurer un plan</Link>
          </div>
        ) : (
          <ul className="record-list">
            {quotes.map((quote) => {
              const valid = isQuoteValid(quote.createdAt);
              const open = openId === quote._id;
              const busy = busyId === quote._id;
              return (
                <li key={quote._id} className={open ? "is-open" : ""}>
                  <button className="record" onClick={() => setOpenId(open ? null : quote._id)} aria-expanded={open}>
                    <div className="record-main">
                      <div className="record-title">
                        <strong>Devis #{quote.quoteNumber}</strong>
                        <span className={`status-badge ${valid ? "is-paid" : "is-neutral"}`}>
                          {valid ? `Valable jusqu'au ${formatDate(quoteExpiry(quote.createdAt))}` : "Expiré"}
                        </span>
                      </div>
                      <span className="record-meta">
                        Créé le {formatDateLong(quote.createdAt)} · {quote.items.reduce((n, i) => n + (i.quantity || 1), 0)} pièce(s)
                      </span>
                    </div>
                    <div className="record-side">
                      <span className="amount">{formatPrice(quote.totalAmount)}</span>
                      <span className="hint">HT</span>
                    </div>
                  </button>

                  {open && (
                    <div className="record-detail">
                      {quote.items.map((item, i) => (
                        <div key={i} className="detail-item">
                          <div className="detail-item-head">
                            <strong>
                              {item.quantity} × {itemTitle(item, i)}
                            </strong>
                            <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                          </div>
                          <ItemSpecs item={item} />
                          <button className="btn-link" onClick={() => navigate("/configurator", { state: { loadConfig: item } })}>
                            Voir en 3D
                          </button>
                        </div>
                      ))}
                      <div className="detail-actions">
                        {valid && (
                          <button className="btn btn-primary" onClick={() => handleOrder(quote)}>
                            Commander ce devis
                          </button>
                        )}
                        <button className="btn btn-outline" disabled={busy} onClick={() => handleDownload(quote)}>
                          {busy ? "Génération…" : "Télécharger le PDF"}
                        </button>
                        <button className="btn btn-ghost" disabled={busy} onClick={() => handleDelete(quote)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
};

export default ClientQuotes;
