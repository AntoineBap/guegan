import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../styles/adminOrders.scss";
// 👇 IMPORT POUR LE PDF
import { PDFDownloadLink } from "@react-pdf/renderer";
import DeliveryNote from "../components/DeliveryNote";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IconWrench = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const IconWall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="9" height="4" rx="1"/><rect x="13" y="10" width="9" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const AdminOrders = () => {
  const { status } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const titles = {
    pending_payment: {
      label: "En attente de paiement",
      action: "Confirmer le paiement",
      nextStatus: "paid",
      color: "#f39c12",
    },
    paid: {
      label: "Commandes Payées (À Produire)",
      action: "Marquer comme Expédié",
      nextStatus: "shipped",
      color: "#27ae60",
    },
    shipped: {
      label: "Commandes Expédiées / Terminées",
      action: null,
      nextStatus: null,
      color: "#2980b9",
    },
  };

  const currentConfig = titles[status] || titles["pending_payment"];

  useEffect(() => {
    if (token) fetchOrders();
  }, [status, token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error("Erreur fetch :", error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (e, orderId) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Voulez-vous vraiment changer le statut de cette commande ?",
      )
    )
      return;

    try {
      const response = await fetch(`${API_URL}/api/admin/order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: currentConfig.nextStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      alert("Erreur technique lors de la mise à jour");
    }
  };

  const handleDeleteOrder = async (e, orderId, orderNumber) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT la commande #${orderNumber} ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/order/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setOrders(orders.filter((o) => o._id !== orderId));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur technique lors de la suppression");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Header />
      <div className="admin-orders-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/admin")}>
            ← Retour Dashboard
          </button>
          <h2 style={{ color: currentConfig.color }}>
            {currentConfig.label} ({orders.length})
          </h2>
        </div>

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>Aucune commande trouvée.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order._id}
                className="order-card"
                onClick={() => navigate(`/admin/order/${order._id}`)}
                style={{
                  cursor: "pointer",
                  borderLeft: `5px solid ${currentConfig.color}`,
                }}
              >
                <div className="order-header">
                  <div className="meta">
                    <span className="order-id">#{order.orderNumber}</span>
                    <span className="order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="amount">
                    {order.totalAmount?.toFixed(2)} € HT
                  </div>
                </div>

                <div className="client-info">
                  <p>
                    <strong>
                      {order.userId?.companyName || "Entreprise inconnue"}
                    </strong>
                  </p>
                  <p>
                    {order.billingAddress?.firstName}{" "}
                    {order.billingAddress?.lastName}
                  </p>
                </div>

                <div className="products-summary">
                  <ul>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}x {item.roomName ? item.roomName : `Plan ${item.length}x${item.width}mm`}
                      </li>
                    ))}
                    {order.items.length > 2 && (
                      <li>... (+{order.items.length - 2} autres)</li>
                    )}
                  </ul>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    display: "flex",
                    gap: "15px",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {/* --- BOUTON BON DE LIVRAISON (UNIQUEMENT SI EXPÉDIÉ) --- */}
                  {status === "shipped" && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <PDFDownloadLink
                        document={<DeliveryNote order={order} />}
                        fileName={`BL-${order.orderNumber}.pdf`}
                        style={{
                          textDecoration: "none",
                          padding: "8px 12px",
                          backgroundColor: "#7f8c8d",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.9rem",
                          marginRight: "10px",
                        }}
                      >
                        {({ blob, url, loading, error }) =>
                          loading ? "Génération..." : <><IconFile /> Bon de Livraison</>
                        }
                      </PDFDownloadLink>
                    </div>
                  )}

                  <button
                    className="delete-btn"
                    onClick={(e) =>
                      handleDeleteOrder(e, order._id, order.orderNumber)
                    }
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#e74c3c",
                      cursor: "pointer",
                      padding: "5px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Supprimer définitivement"
                  >
                    <IconTrash />
                  </button>

                  {currentConfig.action && (
                    <button
                      className="action-btn"
                      style={{ backgroundColor: currentConfig.color }}
                      onClick={(e) => handleStatusUpdate(e, order._id)}
                    >
                      {currentConfig.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;