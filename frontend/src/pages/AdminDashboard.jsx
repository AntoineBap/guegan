import React, { useContext, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import { formatPrice, formatDate } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const daysLeft = (deadline) => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
};

const AdminDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const { stats } = useOutletContext();
  const [pending, setPending] = useState(null);
  const [inProduction, setInProduction] = useState(null);

  useEffect(() => {
    const get = (status) =>
      fetch(`${API_URL}/api/admin/orders/${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

    get("pending_payment").then(setPending);
    get("paid").then(setInProduction);
  }, [token]);

  const kpis = [
    {
      to: "/admin/orders/pending_payment",
      label: "À encaisser",
      value: stats?.pending,
      meta: stats ? `${formatPrice(stats.amounts?.pending)} HT attendus` : "",
      highlight: true,
    },
    {
      to: "/admin/orders/paid",
      label: "En fabrication",
      value: stats?.paid,
      meta: stats ? `${formatPrice(stats.amounts?.paid)} HT` : "",
    },
    {
      to: "/admin/orders/shipped",
      label: "Expédiées",
      value: stats?.shipped,
      meta: stats ? `${formatPrice(stats.amounts?.shipped)} HT au total` : "",
    },
    { to: "/admin/quotes", label: "Devis en cours", value: stats?.quotes, meta: "valables 1 mois" },
    { to: "/admin/users", label: "Comptes clients", value: stats?.users, meta: "inscrits" },
  ];

  return (
    <div className="admin-page">
      <Helmet>
        <title>Tableau de bord — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Bonjour{user?.firstName ? ` ${user.firstName}` : ""}</h1>
          <p className="sub">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <Link key={k.to} to={k.to} className={`kpi ${k.highlight ? "is-highlight" : ""}`}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.value ?? "–"}</span>
            <span className="kpi-meta">{k.meta}</span>
          </Link>
        ))}
      </div>

      <div className="dash-columns">
        <section className="panel">
          <div className="panel-head">
            <h2>Paiements attendus</h2>
            <Link to="/admin/orders/pending_payment" className="btn btn-ghost btn-sm">
              Tout voir
            </Link>
          </div>
          {pending === null ? (
            <div className="loading-state" />
          ) : pending.length === 0 ? (
            <div className="empty-state">
              <strong>Aucun virement en attente</strong>
              Les nouvelles commandes apparaîtront ici.
            </div>
          ) : (
            <ul className="todo-list">
              {pending.slice(0, 6).map((o) => {
                const left = daysLeft(o.paymentDeadline);
                return (
                  <li key={o._id}>
                    <Link to={`/admin/order/${o._id}`}>
                      <div className="todo-main">
                        <strong>
                          #{o.orderNumber} · {o.userId?.companyName || o.billingAddress?.company || "Client"}
                        </strong>
                        <span>
                          Passée le {formatDate(o.createdAt)}
                          {left !== null &&
                            (left >= 0 ? ` · échéance dans ${left} j` : ` · échéance dépassée de ${-left} j`)}
                        </span>
                      </div>
                      {left !== null && left < 0 && <span className="status-badge is-pending">En retard</span>}
                      <span className="todo-amount">{formatPrice(o.totalAmount)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>En atelier</h2>
              <span className="hint">{inProduction ? `${inProduction.length} commande(s)` : ""}</span>
            </div>
            {inProduction === null ? (
              <div className="loading-state" />
            ) : inProduction.length === 0 ? (
              <div className="empty-state">Rien en fabrication pour le moment.</div>
            ) : (
              <ul className="todo-list">
                {inProduction.slice(0, 4).map((o) => (
                  <li key={o._id}>
                    <Link to={`/admin/order/${o._id}`}>
                      <div className="todo-main">
                        <strong>#{o.orderNumber}</strong>
                        <span>
                          {o.items.reduce((n, i) => n + (i.quantity || 1), 0)} plan(s) ·{" "}
                          {o.userId?.companyName || "Client"}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Raccourcis</h2>
            </div>
            <div className="quick-links">
              <Link to="/admin/settings">
                Modifier les tarifs <span>→</span>
              </Link>
              <Link to="/admin/users">
                Exporter les clients (Excel) <span>→</span>
              </Link>
              <Link to="/configurator">
                Ouvrir le configurateur <span>→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
