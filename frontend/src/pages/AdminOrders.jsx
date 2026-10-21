import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import { formatPrice, formatDate, ORDER_STATUS, itemTitle } from "../utils/format";
import { downloadPdf } from "../utils/pdf";
import useToast from "../components/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PAGE = {
  pending_payment: {
    title: "À encaisser",
    sub: "Commandes en attente du virement. Validez le paiement dès réception pour lancer la fabrication.",
    action: "Paiement reçu",
    confirm: "Confirmer la réception du paiement ? Le client sera prévenu par email dans 1 h.",
    nextStatus: "paid",
  },
  paid: {
    title: "En fabrication",
    sub: "Commandes payées, à produire en atelier.",
    action: "Marquer expédiée",
    confirm: "Marquer cette commande comme expédiée ? Le client sera prévenu par email dans 1 h.",
    nextStatus: "shipped",
    rollback: "Remettre en attente de paiement",
  },
  shipped: {
    title: "Expédiées",
    sub: "Commandes remises au transporteur.",
    rollback: "Remettre en fabrication",
  },
};

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AdminOrders = () => {
  const { status } = useParams();
  const { token } = useContext(AuthContext);
  const { refreshStats } = useOutletContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, toastNode] = useToast();

  const page = PAGE[status] || PAGE.pending_payment;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${status}`, { headers });
      setOrders(res.ok ? await res.json() : []);
    } catch {
      setOrders([]);
      toast("Impossible de charger les commandes.", "error");
    }
  }, [status, headers, toast]);

  useEffect(() => {
    setOrders(null);
    setQuery("");
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [
        o.orderNumber,
        o.userId?.companyName,
        o.userId?.email,
        o.billingAddress?.company,
        o.billingAddress?.lastName,
        o.shippingAddress?.city,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [orders, query]);

  const run = async (orderId, fn, successMsg) => {
    setBusyId(orderId);
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      toast(successMsg);
      await fetchOrders();
      refreshStats();
    } catch {
      toast("L'opération a échoué.", "error");
    }
    setBusyId(null);
  };

  const advance = (e, order) => {
    e.stopPropagation();
    if (!window.confirm(page.confirm)) return;
    run(
      order._id,
      () =>
        fetch(`${API_URL}/api/admin/order/${order._id}`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status: page.nextStatus }),
        }),
      `Commande #${order.orderNumber} mise à jour.`,
    );
  };

  const rollback = (e, order) => {
    e.stopPropagation();
    if (!window.confirm(`${page.rollback} la commande #${order.orderNumber} ?\nL'email prévu au client sera annulé s'il n'est pas encore parti.`)) return;
    run(
      order._id,
      () => fetch(`${API_URL}/api/admin/order/${order._id}/rollback`, { method: "PUT", headers }),
      `Commande #${order.orderNumber} revenue à l'étape précédente.`,
    );
  };

  const remove = (e, order) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer définitivement la commande #${order.orderNumber} ?\nCette action est irréversible.`)) return;
    run(
      order._id,
      () => fetch(`${API_URL}/api/admin/order/${order._id}`, { method: "DELETE", headers }),
      `Commande #${order.orderNumber} supprimée.`,
    );
  };

  const deliveryNote = async (e, order) => {
    e.stopPropagation();
    setBusyId(order._id);
    try {
      await downloadPdf(async () => {
        const { default: DeliveryNote } = await import("../components/DeliveryNote");
        return <DeliveryNote order={order} />;
      }, `BL-${order.orderNumber}.pdf`);
    } catch {
      toast("Génération du bon de livraison impossible.", "error");
    }
    setBusyId(null);
  };

  return (
    <div className="admin-page">
      <Helmet>
        <title>{page.title} — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <p className="eyebrow">Commandes</p>
          <h1>{page.title}</h1>
          <p className="sub">{page.sub}</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <IconSearch />
            <span className="sr-only">Rechercher</span>
            <input
              type="text"
              placeholder="N° de commande, société, ville…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {orders && (
            <span className="result-count">
              {filtered.length} commande{filtered.length > 1 ? "s" : ""} ·{" "}
              {formatPrice(filtered.reduce((s, o) => s + (o.totalAmount || 0), 0))} HT
            </span>
          )}
        </div>

        {orders === null ? (
          <div className="loading-state" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <strong>{query ? "Aucun résultat" : "Aucune commande"}</strong>
            {query ? "Essayez un autre terme de recherche." : "Rien à traiter dans cette étape."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table as-cards">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Plans</th>
                  <th>{status === "pending_payment" ? "Échéance" : "Livraison"}</th>
                  <th className="num">Montant HT</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const late = status === "pending_payment" && o.paymentDeadline && new Date(o.paymentDeadline) < new Date();
                  const busy = busyId === o._id;
                  return (
                    <tr key={o._id} className="is-clickable" onClick={() => navigate(`/admin/order/${o._id}`)}>
                      <td>
                        <div className="stack">
                          <span className="ref">#{o.orderNumber}</span>
                          <small>{formatDate(o.createdAt)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="stack">
                          <span>{o.userId?.companyName || o.billingAddress?.company || "—"}</span>
                          <small>
                            {o.billingAddress?.firstName} {o.billingAddress?.lastName}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="stack">
                          {o.items.slice(0, 2).map((it, i) => (
                            <span key={i}>
                              {it.quantity} × {itemTitle(it, i)} <small>{it.length}×{it.width}</small>
                            </span>
                          ))}
                          {o.items.length > 2 && <small>+ {o.items.length - 2} autre(s)</small>}
                        </div>
                      </td>
                      <td className="nowrap">
                        {status === "pending_payment" ? (
                          late ? (
                            <span className="status-badge is-pending">Dépassée</span>
                          ) : (
                            formatDate(o.paymentDeadline)
                          )
                        ) : (
                          <span className="muted">
                            {o.shippingAddress?.zip} {o.shippingAddress?.city}
                          </span>
                        )}
                      </td>
                      <td className="num amount">
                        <strong>{formatPrice(o.totalAmount)}</strong>
                      </td>
                      <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {status === "shipped" && (
                            <button className="btn btn-outline btn-sm" disabled={busy} onClick={(e) => deliveryNote(e, o)}>
                              Bon de livraison
                            </button>
                          )}
                          {page.rollback && (
                            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => rollback(e, o)} title={page.rollback}>
                              Annuler l'étape
                            </button>
                          )}
                          {page.action && (
                            <button className="btn btn-primary btn-sm" disabled={busy} onClick={(e) => advance(e, o)}>
                              {page.action}
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => remove(e, o)} aria-label={`Supprimer la commande ${o.orderNumber}`} title="Supprimer">
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="sub" style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 12 }}>
        Statut : {ORDER_STATUS[status]?.label}. Les emails de changement de statut partent 1 h après l'action, ce qui laisse le temps d'annuler une erreur.
      </p>
      {toastNode}
    </div>
  );
};

export default AdminOrders;
