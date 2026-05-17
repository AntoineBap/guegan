import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Header from "../components/Header";
import QuoteNote from "../components/QuoteNote";
import "../styles/adminOrderDetails.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const IconUser = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconTruck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconWrench = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const IconWall = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="4" rx="1" />
    <rect x="2" y="10" width="9" height="4" rx="1" />
    <rect x="13" y="10" width="9" height="4" rx="1" />
    <rect x="2" y="17" width="20" height="4" rx="1" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconDownload = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconFile = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const AdminQuoteDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/quotes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuote(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [id, token]);

  const handleOpen3D = (item) => {
    navigate("/configurator", { state: { loadConfig: item } });
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!quote) return <div className="error">Devis introuvable.</div>;

  const totalItemsCount = quote.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const creationDate = new Date(quote.createdAt);
  const expirationDate = new Date(creationDate);
  expirationDate.setMonth(expirationDate.getMonth() + 1);

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Header />
      <div className="admin-order-details">
        <div className="details-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Retour
          </button>
          <div>
            <h1>Devis #{quote.quoteNumber}</h1>
            <span className="date-creation">
              Créé le {creationDate.toLocaleDateString()} —{" "}
              <strong style={{ color: "#e74c3c" }}>
                Valable jusqu'au {expirationDate.toLocaleDateString()}
              </strong>
            </span>
          </div>
          <PDFDownloadLink
            document={<QuoteNote quote={quote} />}
            fileName={`Devis_${quote.quoteNumber}.pdf`}
            style={{
              textDecoration: "none",
              padding: "10px 20px",
              backgroundColor: "#d4af37",
              color: "#fff",
              borderRadius: "5px",
              fontWeight: "bold",
            }}
          >
            {({ loading }) =>
              loading ? (
                "Génération..."
              ) : (
                <>
                  <IconDownload /> Télécharger PDF
                </>
              )
            }
          </PDFDownloadLink>
        </div>

        <div className="details-grid">
          <div className="info-column">
            <div className="info-card">
              <h3>
                <IconUser /> Client & Informations
              </h3>
              <p>
                <strong>Société :</strong>{" "}
                {quote.userId?.companyName || "Particulier"}
              </p>
              <p>
                <strong>Numéro SIRET :</strong> {quote.userId?.siret || "N/A"}
              </p>
              <p>
                <strong>Numéro de TVA :</strong>{" "}
                {quote.userId?.tvaNumber || "N/A"}
              </p>
              <p>
                <strong>Nom :</strong> {quote.userId?.firstName}{" "}
                {quote.userId?.lastName}
              </p>
              <p>
                <strong>Email :</strong> {quote.userId?.email}
              </p>
              <p>
                <strong>Tel :</strong> {quote.userId?.phone || "N/A"}
              </p>
              <p>
                <strong>Adresse :</strong>{" "}
                {quote.userId?.companyAddress || "N/A"}
              </p>
            </div>
          </div>

          <div className="items-column">
            <h3>
              <IconWrench /> Plans à produire ({totalItemsCount})
            </h3>
            <div className="items-list">
              {quote.items.map((item, index) => (
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
                        Voir en 3D
                      </button>
                    </div>
                  </div>

                  <div className="item-specs">
                    <ul>
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
                                {s.tapHolePosition === "Gauche"
                                  ? "Gauche"
                                  : s.tapHolePosition === "Droite"
                                    ? "Droite"
                                    : "Centré"}
                                )
                                {s.tapHoleOffset && s.tapHoleOffset !== 0
                                  ? ` [Décalage du centre : ${s.tapHoleOffset}mm]`
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

                      {item.rims && (
                        <li className="sub-spec">
                          <IconWall />{" "}
                          <strong>Dosserets (H{item.rimHeigh}mm) :</strong>{" "}
                          {[
                            item.rimLeft && "Gauche",
                            item.rimBack && "Fond",
                            item.rimRight && "Droite",
                          ]
                            .filter(Boolean)
                            .join(", ") || "Aucun"}
                        </li>
                      )}

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

export default AdminQuoteDetails;
