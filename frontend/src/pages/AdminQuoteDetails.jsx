import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import ItemSpecs from "../components/ItemSpecs";
import useToast from "../components/useToast";
import { downloadPdf } from "../utils/pdf";
import { formatPrice, formatDateLong, quoteExpiry, isQuoteValid, itemTitle } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminQuoteDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quote, setQuote] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();

  useEffect(() => {
    fetch(`${API_URL}/api/admin/quotes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [id, token]);

  const download = async () => {
    setBusy(true);
    try {
      await downloadPdf(async () => {
        const { default: QuoteNote } = await import("../components/QuoteNote");
        return <QuoteNote quote={quote} />;
      }, `Devis_${quote.quoteNumber}.pdf`);
    } catch {
      toast("Génération du PDF impossible.", "error");
    }
    setBusy(false);
  };

  if (quote === undefined) return <div className="loading-state" />;
  if (quote === null)
    return (
      <div className="admin-page">
        <div className="empty-state">
          <strong>Devis introuvable</strong>
          <Link to="/admin/quotes">Retour aux devis</Link>
        </div>
      </div>
    );

  const client = quote.userId || {};
  const valid = isQuoteValid(quote.createdAt);

  return (
    <div className="admin-page">
      <Helmet>
        <title>Devis #{quote.quoteNumber} — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <Link to="/admin/quotes" className="back-link">← Devis</Link>
          <h1>Devis #{quote.quoteNumber}</h1>
          <p className="sub">
            Créé le {formatDateLong(quote.createdAt)} ·{" "}
            <span className={`status-badge ${valid ? "is-paid" : "is-neutral"}`}>
              {valid ? "Valable" : "Expiré"} jusqu'au {formatDateLong(quoteExpiry(quote.createdAt))}
            </span>
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-gold" disabled={busy} onClick={download}>
            {busy ? "Génération…" : "Télécharger le PDF"}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Client</h2>
          </div>
          <div className="panel-body">
            <dl className="info-list">
              <div><dt>Société</dt><dd>{client.companyName || "—"}</dd></div>
              <div><dt>Contact</dt><dd>{[client.firstName, client.lastName].filter(Boolean).join(" ") || "—"}</dd></div>
              <div><dt>Email</dt><dd>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : "Compte supprimé"}</dd></div>
              <div><dt>Téléphone</dt><dd>{client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : "—"}</dd></div>
              <div><dt>Adresse</dt><dd>{client.companyAddress || "—"}</dd></div>
              <div><dt>SIRET</dt><dd>{client.siret || "—"}</dd></div>
              <div><dt>N° TVA</dt><dd>{client.tvaNumber || "—"}</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Plans chiffrés</h2>
            <span className="hint">{quote.items.reduce((n, i) => n + (i.quantity || 1), 0)} pièce(s)</span>
          </div>

          {quote.items.map((item, index) => (
            <div key={index} className="line-item">
              <div className="line-head">
                <h3>{itemTitle(item, index)}</h3>
                <div className="line-side">
                  <span className="qty">× {item.quantity}</span>
                  <span className="price">{formatPrice((item.unitPrice || 0) * (item.quantity || 1))}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("/configurator", { state: { loadConfig: item } })}>
                    Voir en 3D
                  </button>
                </div>
              </div>
              <ItemSpecs item={item} />
            </div>
          ))}

          <dl className="totals">
            <div><dt>Total HT</dt><dd>{formatPrice(quote.totalAmount)}</dd></div>
            <div><dt>TVA 20 %</dt><dd>{formatPrice(quote.totalAmount * 0.2)}</dd></div>
            <div className="grand"><dt>Total TTC</dt><dd>{formatPrice(quote.totalAmount * 1.2)}</dd></div>
          </dl>
        </section>
      </div>
      {toastNode}
    </div>
  );
};

export default AdminQuoteDetails;
