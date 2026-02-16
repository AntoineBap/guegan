import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/orderConfirmation.scss"; // On créera ce fichier

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (token && orderId) fetchOrder();
  }, [orderId, token]);

  if (!order)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Chargement de la commande...
      </div>
    );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="confirmation-page">
      <div className="success-banner">
        <h1>✅ Commande Enregistrée !</h1>
        <p>Merci pour votre confiance.</p>
      </div>

      <div className="order-grid">
        {/* INFO COMMANDE */}
        <div className="card info-card">
          <h2>Détails de la commande</h2>
          <p>
            <strong>N° Commande :</strong> {order._id}
          </p>
          <p>
            <strong>Date :</strong> {formatDate(order.createdAt)}
          </p>
          <p>
            <strong>Statut :</strong>{" "}
            <span className="status-badge pending">En attente de paiement</span>
          </p>
          <p style={{ color: "#e74c3c", marginTop: "10px" }}>
            <strong>📅 Date limite de paiement :</strong>{" "}
            {formatDate(order.paymentDeadline)}
          </p>
        </div>

        {/* INSTRUCTIONS PAIEMENT */}
        <div className="card bank-card">
          <h2>🏦 Instructions de Virement</h2>
          <p>
            Veuillez effectuer le virement avant la date limite vers le compte
            suivant :
          </p>
          <div className="iban-box">
            <p>
              <strong>Banque :</strong> GUEGAN PRO BANK
            </p>
            <p>
              <strong>IBAN :</strong> FR76 1234 5678 9012 3456 7890 123
            </p>
            <p>
              <strong>BIC :</strong> GUEGFR2P
            </p>
            <p>
              <strong>Libellé du virement :</strong> {order._id}
            </p>
          </div>
          <small>
            La fabrication de votre commande sur-mesure débutera dès réception
            du paiement.
          </small>
        </div>

        {/* ADRESSES */}
        <div className="card address-card">
          <div className="col">
            <h3>Facturation</h3>
            <p>
              {order.billingAddress.firstName} {order.billingAddress.lastName}
            </p>
            <p>{order.billingAddress.company}</p>
            <p>{order.billingAddress.address}</p>
            <p>
              {order.billingAddress.zip} {order.billingAddress.city}
            </p>
          </div>
          <div className="col">
            <h3>Livraison</h3>
            <p>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.company}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.zip} {order.shippingAddress.city}
            </p>
          </div>
        </div>

        {/* LISTE PRODUITS */}
        <div className="card items-card full-width">
          <h3>Articles commandés</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Détails</th>
                <th>Qté</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>Plan Vasque Sur-Mesure</td>
                  <td>
                    {item.length}x{item.width}mm, {item.sinks.length} cuve(s)
                  </td>
                  <td>{item.quantity}</td>
                  <td>{(item.unitPrice * item.quantity).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grand-total">
            Total à payer : <span>{order.totalAmount.toFixed(2)} € HT</span>
          </div>
        </div>
      </div>

      <button className="btn-home" onClick={() => navigate("/")}>
        Retour à l'accueil
      </button>
    </div>
  );
};

export default OrderConfirmation;
