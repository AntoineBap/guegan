import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import '../styles/adminOrderDetails.scss'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminOrderDetails = () => {
    const { id } = useParams();
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- CHARGEMENT ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/api/admin/order-details/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data);
                } else {
                    console.error("Erreur 404 ou autre");
                }
            } catch (error) {
                console.error("Erreur fetch order:", error);
            }
            setLoading(false);
        };
        fetchOrderDetails();
    }, [id, token]);

    // --- FONCTION "VOIR EN 3D" ---
    const handleOpen3D = (item) => {
        // Redirection vers l'accueil (Configurateur) avec les données de l'item
        navigate('/', { state: { loadConfig: item } });
    };

    if (loading) return <div className="loading">Chargement...</div>;
    if (!order) return <div className="error">Commande introuvable.</div>;

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Header />
            <div className="admin-order-details">
                
                {/* EN-TÊTE PAGE */}
                <div className="details-header">
                    <button onClick={() => navigate(-1)} className="back-btn">← Retour</button>
                    <div>
                        <h1>Commande #{order._id.slice(-6).toUpperCase()}</h1>
                        <span className="date-creation">Du {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                </div>

                <div className="details-grid">
                    
                    {/* COLONNE GAUCHE : INFOS CLIENT */}
                    <div className="info-column">
                        <div className="info-card">
                            <h3>👤 Client & Facturation</h3>
                            <p><strong>Société :</strong> {order.billingAddress.company || "Particulier"}</p>
                            <p><strong>Nom :</strong> {order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                            <p><strong>Email :</strong> {order.userId?.email || order.billingAddress.email}</p>
                            <p><strong>Tel :</strong> {order.userId?.phone || "N/A"}</p>
                        </div>
                        <div className="info-card">
                            <h3>🚚 Livraison</h3>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.zipCode} {order.shippingAddress.city}</p>
                            <p>{order.shippingAddress.country}</p>
                        </div>
                    </div>

                    {/* COLONNE DROITE : LISTE DES ITEMS (Style Cart.jsx) */}
                    <div className="items-column">
                        <h3>🛠️ Plans à produire ({order.items.length})</h3>
                        
                        <div className="items-list">
                            {order.items.map((item, index) => (
                                <div key={index} className="item-card-detail">
                                    
                                    {/* En-tête de l'article */}
                                    <div className="item-header-row">
                                        <h4>Plan #{index + 1} - {item.length}x{item.width}mm</h4>
                                        <div className="item-actions">
                                            <span className="qty-badge">Qté: {item.quantity}</span>
                                            
                                            {/* LE BOUTON 3D */}
                                            <button 
                                                className="btn-3d"
                                                onClick={() => handleOpen3D(item)}
                                            >
                                                👁️ Voir en 3D
                                            </button>
                                        </div>
                                    </div>

                                    {/* Détails techniques (Copie de la logique Cart.jsx) */}
                                    <div className="item-specs">
                                        <ul>
                                            <li><strong>Couleur :</strong> {item.color === 'white' ? "Blanc Pur" : "Autre"}</li>
                                            
                                            {/* CUVES */}
                                            {item.sinks && item.sinks.map((s, idx) => (
                                                <li key={idx} className="sub-spec">
                                                    📦 <strong>Cuve {idx+1} :</strong> {s.type ? s.type.replace("Cuve ", "") : "Standard"} 
                                                    <br/>Position: {s.position === 'center' ? 'Centrée' : s.position} 
                                                    {s.position !== 'center' && ` (${s.offset}mm)`}
                                                    <br/>Robinet: {s.hasTapHole ? `Oui (${s.tapHolePosition})` : 'Non'}
                                                </li>
                                            ))}

                                            {/* DOSSERETS */}
                                            {item.rims && (
                                                <li className="sub-spec">
                                                    🧱 <strong>Dosserets (H{item.rimHeigh}mm) :</strong> {[item.rimLeft && "Gauche", item.rimBack && "Fond", item.rimRight && "Droite"].filter(Boolean).join(", ")}
                                                </li>
                                            )}

                                            {/* RETOMBÉES */}
                                            {item.aprons && (
                                                <li className="sub-spec">
                                                    📐 <strong>Retombées (H{item.apronHeight}mm) :</strong> {[item.apronFront && "Avant", item.apronLeft && "Gauche", item.apronBack && "Fond", item.apronRight && "Droite"].filter(Boolean).join(", ")}
                                                </li>
                                            )}

                                            {item.splashback && <li>💧 <strong>Goutte d'eau :</strong> Oui</li>}
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