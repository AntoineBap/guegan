import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import { formatPrice, formatDate, quoteExpiry, isQuoteValid } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminQuotes = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState(null);
  const [query, setQuery] = useState("");
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/quotes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch(() => setQuotes([]));
  }, [token]);

  const list = useMemo(() => {
    if (!quotes) return [];
    const q = query.trim().toLowerCase();
    return quotes
      .filter((x) => showExpired || isQuoteValid(x.createdAt))
      .filter(
        (x) =>
          !q ||
          [x.quoteNumber, x.userId?.companyName, x.userId?.email, x.userId?.lastName]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
      );
  }, [quotes, query, showExpired]);

  const expiredCount = quotes ? quotes.filter((x) => !isQuoteValid(x.createdAt)).length : 0;

  return (
    <div className="admin-page">
      <Helmet>
        <title>Devis — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>Devis</h1>
          <p className="sub">Devis générés par les clients depuis leur panier. Un devis reste valable un mois.</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="sr-only">Rechercher</span>
            <input type="text" placeholder="N° de devis, société, email…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {expiredCount > 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--muted)" }}>
              <input type="checkbox" checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} />
              Afficher les expirés ({expiredCount})
            </label>
          )}
          {quotes && <span className="result-count">{list.length} devis</span>}
        </div>

        {quotes === null ? (
          <div className="loading-state" />
        ) : list.length === 0 ? (
          <div className="empty-state">
            <strong>Aucun devis en cours</strong>
            Les devis créés par les clients apparaîtront ici.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table as-cards">
              <thead>
                <tr>
                  <th>Devis</th>
                  <th>Client</th>
                  <th>Plans</th>
                  <th>Validité</th>
                  <th className="num">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {list.map((q) => {
                  const valid = isQuoteValid(q.createdAt);
                  const daysLeft = Math.ceil((quoteExpiry(q.createdAt) - new Date()) / 86400000);
                  return (
                    <tr key={q._id} className="is-clickable" onClick={() => navigate(`/admin/quotes/${q._id}`)}>
                      <td>
                        <div className="stack">
                          <span className="ref">#{q.quoteNumber}</span>
                          <small>{formatDate(q.createdAt)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="stack">
                          <span>{q.userId?.companyName || "—"}</span>
                          <small>{q.userId?.email || "Compte supprimé"}</small>
                        </div>
                      </td>
                      <td className="muted">{q.items.reduce((n, i) => n + (i.quantity || 1), 0)}</td>
                      <td className="nowrap">
                        {valid ? (
                          <span className={`status-badge ${daysLeft <= 7 ? "is-pending" : "is-paid"}`}>
                            {daysLeft <= 0 ? "Expire aujourd'hui" : `${daysLeft} j restants`}
                          </span>
                        ) : (
                          <span className="status-badge is-neutral">Expiré le {formatDate(quoteExpiry(q.createdAt))}</span>
                        )}
                      </td>
                      <td className="num amount">
                        <strong>{formatPrice(q.totalAmount)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminQuotes;
