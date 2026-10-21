import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import { formatPrice, formatDate, ORDER_STATUS, itemTitle } from "../utils/format";
import "../styles/clientPages.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Étapes affichées sous chaque commande
const STEPS = ["pending_payment", "paid", "shipped"];
const STEP_LABEL = { pending_payment: "Commande", paid: "Fabrication", shipped: "Expédition" };

const ClientOrders = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/auth/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [token]);

  return (
    <>
      <Helmet>
        <title>Mes commandes — Guegan Shop</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="client-page">
        <div className="client-head">
          <div>
            <p className="eyebrow">Mon espace</p>
            <h1>Mes commandes</h1>
          </div>
          <Link to="/configurator" className="btn btn-outline">Nouveau plan</Link>
        </div>

        {orders === null ? (
          <div className="page-loader" />
        ) : orders.length === 0 ? (
          <div className="client-empty">
            <strong>Aucune commande pour le moment</strong>
            <p>Vos commandes et leur suivi apparaîtront ici.</p>
            <Link to="/configurator" className="btn btn-primary">Configurer un plan</Link>
          </div>
        ) : (
          <ul className="record-list">
            {orders.map((order) => {
              const st = ORDER_STATUS[order.status] || { label: order.status, tone: "is-neutral" };
              const stepIndex = STEPS.indexOf(order.status);
              const pieces = order.items.reduce((n, i) => n + (i.quantity || 1), 0);
              return (
                <li key={order._id}>
                  <button className="record" onClick={() => navigate(`/order-confirmation/${order._id}`)}>
                    <div className="record-main">
                      <div className="record-title">
                        <strong>Commande #{order.orderNumber}</strong>
                        <span className={`status-badge ${st.tone}`}>{st.label}</span>
                      </div>
                      <span className="record-meta">
                        {formatDate(order.createdAt)} · {pieces} pièce(s) ·{" "}
                        {order.items.slice(0, 2).map((it, i) => itemTitle(it, i)).join(", ")}
                        {order.items.length > 2 ? "…" : ""}
                      </span>
                      <ol className="progress" aria-label="Avancement">
                        {STEPS.map((s, i) => (
                          <li key={s} className={i <= stepIndex ? "done" : ""}>
                            {STEP_LABEL[s]}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="record-side">
                      <span className="amount">{formatPrice(order.totalAmount)}</span>
                      <span className="hint">HT</span>
                      {order.status === "pending_payment" && <span className="action">Payer par virement →</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
};

export default ClientOrders;
