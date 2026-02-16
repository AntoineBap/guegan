import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../styles/adminOrderDetails.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/order-details/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          console.error("Erreur chargement commande");
        }
      } catch (error) {
        console.error("Erreur fetch order:", error);
      }
      setLoading(false);
    };
    fetchOrderDetails();
  }, [id, token]);

  const handleOpen3D = (item) => {
    navigate("/configurator", { state: { loadConfig: item } });
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!order) return <div className="error">Commande introuvable.</div>;

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Header />
      <div className="admin-order-details">
        <div className="details-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Retour
          </button>
          <div>
            <h1>Commande #{order.orderNumber}</h1>
            <span className="date-creation">
              Du {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className={`status-badge ${order.status}`}>{order.status}</span>
        </div>

        <div className="details-grid">
          {/* INFOS CLIENT */}
          <div className="info-column">
            <div className="info-card">
              <h3>👤 Client & Facturation</h3>
              <p>
                <strong>Société :</strong>{" "}
                {order.billingAddress.company || "Particulier"}
              </p>
              <p>
                <strong>Numéro SIRET :</strong> {order.userId?.siret || "N/A"}
              </p>
              <p>
                <strong>Numéro de TVA :</strong> {order.userId?.tvaNumber || "N/A"}
              </p>
              <p>
                <strong>Nom :</strong> {order.billingAddress.firstName}{" "}
                {order.billingAddress.lastName}
              </p>
              <p>
                <strong>Email :</strong>{" "}
                {order.userId?.email || order.billingAddress.email}
              </p>
              <p>
                <strong>Tel :</strong> {order.userId?.phone || "N/A"}
              </p>
              <p>
                <strong>Adresse :</strong> {order.billingAddress.address || "N/A"}
              </p>
              <p>
                <strong>Ville :</strong> {order.billingAddress.city || "N/A"}
              </p>
              <p>
                <strong>Code Postal :</strong> {order.billingAddress.zip || "N/A"}
              </p>
              <p>
                <strong>Pays :</strong> {order.billingAddress.country || "N/A"}
              </p>
            </div>
            <div className="info-card">
              <h3>🚚 Livraison</h3>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.zip} {order.shippingAddress.city}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* LISTE DES PLANS */}
          <div className="items-column">
            <h3>🛠️ Plans à produire ({order.items.length})</h3>

            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-card-detail">
                  <div className="item-header-row">
                    <h4>
                      Plan #{index + 1} - {item.length}x{item.width}mm
                    </h4>
                    <div className="item-actions">
                      <span className="qty-badge">Qté: {item.quantity}</span>
                      <button
                        className="btn-3d"
                        onClick={() => handleOpen3D(item)}
                      >
                        👁️ Voir en 3D
                      </button>
                    </div>
                  </div>

                  <div className="item-specs">
                    <ul>
                      {/* CUVES : Masqué si "Aucune cuve" */}
                      {item.sinks &&
                        item.sinks.length > 0 &&
                        item.sinks[0]?.type !== "Aucune cuve" &&
                        item.sinks.map((s, idx) => (
                          <li
                            key={idx}
                            className="sub-spec"
                            style={{
                              borderLeft: "3px solid #ddd",
                              paddingLeft: "10px",
                            }}
                          >
                            <strong>Cuve {idx + 1} :</strong>{" "}
                            {s.type ? s.type.replace("Cuve ", "") : "Standard"}
                            <br />
                            Position :{" "}
                            {s.position === "left"
                              ? "Gauche"
                              : s.position === "right"
                                ? "Droite"
                                : "Centrée"}
                            {s.position !== "center" && ` (${s.offset}mm)`}
                            <br />
                            Robinet :{" "}
                            {s.hasTapHole ? (
                              <>
                                Oui (
                                {s.tapHolePosition === "left"
                                  ? "Gauche"
                                  : s.tapHolePosition === "right"
                                    ? "Droite"
                                    : "Centré"}
                                )
                                {s.tapHoleOffset && s.tapHoleOffset !== 0
                                  ? ` [Décalage : ${s.tapHoleOffset}mm]`
                                  : ""}
                              </>
                            ) : (
                              "Non"
                            )}
                            <br />
                            Egouttoir :{" "}
                            {s.hasDrainer
                              ? `Oui (${s.drainerPosition === "left" ? "Gauche" : "Droite"})`
                              : "Non"}
                          </li>
                        ))}

                      {/* DOSSERETS */}
                      {item.rims && (
                        <li className="sub-spec">
                          🧱 <strong>Dosserets (H{item.rimHeigh}mm) :</strong>{" "}
                          {[
                            item.rimLeft && "Gauche",
                            item.rimBack && "Fond",
                            item.rimRight && "Droite",
                          ]
                            .filter(Boolean)
                            .join(", ") || "Aucun"}
                        </li>
                      )}

                      {/* RETOMBÉES */}
                      {item.aprons && (
                        <li className="sub-spec">
                          <strong>Retombées (H{item.apronHeight}mm) :</strong>{" "}
                          {[
                            item.apronFront && "Avant",
                            item.apronLeft && "Gauche",
                            item.apronBack && "Fond",
                            item.apronRight && "Droite",
                          ]
                            .filter(Boolean)
                            .join(", ") || "Aucune"}
                        </li>
                      )}

                      {/* GOUTTE D'EAU */}
                      {item.splashback && (
                        <li>
                          <strong>Anti-Goutte d'eau :</strong> Oui
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
