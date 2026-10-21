import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import ItemSpecs from "../components/ItemSpecs";
import useToast from "../components/useToast";
import { downloadPdf } from "../utils/pdf";
import { formatPrice, formatDate, formatDateLong, ORDER_STATUS, itemTitle } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const NEXT = {
  pending_payment: { status: "paid", label: "Paiement reçu", confirm: "Confirmer la réception du paiement ? Le client sera prévenu par email dans 1 h." },
  paid: { status: "shipped", label: "Marquer expédiée", confirm: "Marquer la commande comme expédiée ? Le client sera prévenu par email dans 1 h." },
};
const PREV_LABEL = { paid: "Remettre en attente de paiement", shipped: "Remettre en fabrication" };

const Address = ({ a }) =>
  a ? (
    <>
      {[a.firstName, a.lastName].filter(Boolean).join(" ")}
      {a.company && <><br />{a.company}</>}
      <br />
      {a.address}
      <br />
      {a.zip} {a.city}
      {a.country && a.country !== "France" && <><br />{a.country}</>}
    </>
  ) : (
    "—"
  );

const AdminOrderDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const { refreshStats } = useOutletContext();
  const navigate = useNavigate();
  const [order, setOrder] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/order-details/${id}`, { headers });
      setOrder(res.ok ? await res.json() : null);
    } catch {
      setOrder(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const act = async (request, msg) => {
    setBusy(true);
    try {
      const res = await request();
      if (!res.ok) throw new Error();
      toast(msg);
      await load();
      refreshStats();
    } catch {
      toast("L'opération a échoué.", "error");
    }
    setBusy(false);
  };

  const advance = () => {
    const next = NEXT[order.status];
    if (!next || !window.confirm(next.confirm)) return;
    act(
      () =>
        fetch(`${API_URL}/api/admin/order/${id}`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status: next.status }),
        }),
      "Statut mis à jour.",
    );
  };

  const rollback = () => {
    if (!window.confirm(`${PREV_LABEL[order.status]} ?\nL'email prévu au client sera annulé s'il n'est pas encore parti.`)) return;
    act(() => fetch(`${API_URL}/api/admin/order/${id}/rollback`, { method: "PUT", headers }), "Étape annulée.");
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement la commande #${order.orderNumber} ?`)) return;
    setBusy(true);
    const res = await fetch(`${API_URL}/api/admin/order/${id}`, { method: "DELETE", headers }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      refreshStats();
      navigate(`/admin/orders/${order.status}`);
    } else toast("Suppression impossible.", "error");
  };

  const deliveryNote = async () => {
    setBusy(true);
    try {
      await downloadPdf(async () => {
        const { default: DeliveryNote } = await import("../components/DeliveryNote");
        return <DeliveryNote order={order} />;
      }, `BL-${order.orderNumber}.pdf`);
    } catch {
      toast("Génération du bon de livraison impossible.", "error");
    }
    setBusy(false);
  };

  if (order === undefined) return <div className="loading-state" />;
  if (order === null)
    return (
      <div className="admin-page">
        <div className="empty-state">
          <strong>Commande introuvable</strong>
          <Link to="/admin">Retour au tableau de bord</Link>
        </div>
      </div>
    );

  const st = ORDER_STATUS[order.status] || { label: order.status, tone: "is-neutral" };
  const client = order.userId || {};
  const itemsTotal = order.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 1), 0);
  // Les anciennes commandes n'ont pas de champ shippingCost : la livraison était incluse dans le total
  const shipping =
    order.shippingCost === undefined
      ? Math.max(0, Math.round((order.totalAmount - itemsTotal) * 100) / 100)
      : Math.max(0, order.shippingCost);

  return (
    <div className="admin-page">
      <Helmet>
        <title>Commande #{order.orderNumber} — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <Link to={`/admin/orders/${order.status}`} className="back-link">
            ← {ORDER_STATUS[order.status]?.short || "Commandes"}
          </Link>
          <h1>Commande #{order.orderNumber}</h1>
          <p className="sub">
            Passée le {formatDateLong(order.createdAt)} ·{" "}
            <span className={`status-badge ${st.tone}`}>{st.label}</span>
          </p>
        </div>
        <div className="actions">
          {order.status === "shipped" && (
            <button className="btn btn-outline" disabled={busy} onClick={deliveryNote}>
              Bon de livraison (PDF)
            </button>
          )}
          {PREV_LABEL[order.status] && (
            <button className="btn btn-ghost" disabled={busy} onClick={rollback}>
              Annuler l'étape
            </button>
          )}
          {NEXT[order.status] && (
            <button className="btn btn-primary" disabled={busy} onClick={advance}>
              {NEXT[order.status].label}
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>Client</h2>
            </div>
            <div className="panel-body">
              <dl className="info-list">
                <div><dt>Société</dt><dd>{client.companyName || order.billingAddress?.company || "—"}</dd></div>
                <div><dt>Contact</dt><dd>{[client.firstName, client.lastName].filter(Boolean).join(" ") || "—"}</dd></div>
                <div><dt>Email</dt><dd>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : "—"}</dd></div>
                <div><dt>Téléphone</dt><dd>{client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : "—"}</dd></div>
                <div><dt>SIRET</dt><dd>{client.siret || "—"}</dd></div>
                <div><dt>N° TVA</dt><dd>{client.tvaNumber || "—"}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Adresses</h2>
            </div>
            <div className="panel-body">
              <dl className="info-list">
                <div><dt>Facturation</dt><dd><Address a={order.billingAddress} /></dd></div>
                <div><dt>Livraison</dt><dd><Address a={order.shippingAddress} /></dd></div>
                {order.status === "pending_payment" && (
                  <div><dt>Échéance</dt><dd>{formatDate(order.paymentDeadline)}</dd></div>
                )}
              </dl>
            </div>
          </section>

          <button className="btn btn-danger btn-sm" style={{ marginTop: 16 }} disabled={busy} onClick={remove}>
            Supprimer la commande
          </button>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Plans à produire</h2>
            <span className="hint">{order.items.reduce((n, i) => n + (i.quantity || 1), 0)} pièce(s)</span>
          </div>

          {order.items.map((item, index) => (
            <div key={index} className="line-item">
              <div className="line-head">
                <div>
                  <h3>{itemTitle(item, index)}</h3>
                </div>
                <div className="line-side">
                  <span className="qty">× {item.quantity}</span>
                  <span className="price">{formatPrice((item.unitPrice || 0) * (item.quantity || 1))}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate("/configurator", { state: { loadConfig: item } })}
                  >
                    Voir en 3D
                  </button>
                </div>
              </div>
              <ItemSpecs item={item} />
            </div>
          ))}

          <dl className="totals">
            <div><dt>Sous-total HT</dt><dd>{formatPrice(itemsTotal)}</dd></div>
            <div>
              <dt>Livraison HT</dt>
              <dd>{order.shippingCost === -1 ? "Sur devis" : shipping ? formatPrice(shipping) : "Offerte"}</dd>
            </div>
            <div><dt>TVA 20 %</dt><dd>{formatPrice(order.totalAmount * 0.2)}</dd></div>
            <div className="grand"><dt>Total TTC</dt><dd>{formatPrice(order.totalAmount * 1.2)}</dd></div>
          </dl>
        </section>
      </div>
      {toastNode}
    </div>
  );
};

export default AdminOrderDetails;
