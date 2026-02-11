import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import '../styles/adminOrders.scss';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminOrders = () => {
    const { status } = useParams(); // 'pending_payment', 'paid', 'shipped'
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Titres dynamiques selon le statut
    const titles = {
        'pending_payment': { label: 'En attente de paiement', action: 'Confirmer le paiement', nextStatus: 'paid', color: '#f39c12' },
        'paid': { label: 'Commandes Payées (À Produire)', action: 'Marquer comme Expédié', nextStatus: 'shipped', color: '#27ae60' },
        'shipped': { label: 'Commandes Expédiées / Terminées', action: null, nextStatus: null, color: '#2980b9' }
    };

    const currentConfig = titles[status] || titles['pending_payment'];

    useEffect(() => {
        if (token) fetchOrders();
    }, [status, token]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            console.log(`📡 Fetching orders for status: ${status}`);
            const response = await fetch(`${API_URL}/api/admin/orders/${status}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("📦 Données reçues :", data);

                // SÉCURITÉ : Vérifie si c'est un tableau direct ou un objet { orders: [...] }
                if (Array.isArray(data)) {
                    setOrders(data);
                } else if (data.orders && Array.isArray(data.orders)) {
                    setOrders(data.orders);
                } else {
                    console.error("Format de données inattendu", data);
                    setOrders([]);
                }
            } else {
                console.error("Erreur serveur :", response.status);
            }
        } catch (error) {
            console.error("Erreur fetch :", error);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (orderId) => {
        if (!window.confirm("Voulez-vous vraiment changer le statut de cette commande ?")) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/order/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: currentConfig.nextStatus })
            });

            if (response.ok) {
                fetchOrders(); // Rafraichir la liste
            } else {
                alert("Erreur lors de la mise à jour");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur technique");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Header />
            <div className="admin-orders-page">
                
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/admin')}>← Retour Dashboard</button>
                    <h2 style={{ color: currentConfig.color }}>{currentConfig.label} ({orders.length})</h2>
                </div>

                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucune commande trouvée pour le statut : <strong>{status}</strong></p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order._id} className="order-card">
                                {/* EN-TÊTE CARTE */}
                                <div className="order-header">
                                    <div className="meta">
                                        <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                                        <span className="order-date">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="amount">
                                        {order.totalAmount?.toFixed(2)} € HT
                                    </div>
                                </div>

                                {/* INFO CLIENT */}
                                <div className="client-info">
                                    <p><strong>Entreprise :</strong> {order.userId?.companyName || order.billingAddress?.company || "N/A"}</p>
                                    <p><strong>Contact :</strong> {order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
                                    <p><strong>Email :</strong> {order.userId?.email || order.billingAddress?.email || "N/A"}</p>
                                </div>

                                {/* DÉTAIL PRODUITS */}
                                <div className="products-summary">
                                    <h4>Contenu ({order.items.length}) :</h4>
                                    <ul>
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>
                                                {item.quantity}x Plan {item.length}x{item.width}mm 
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* BOUTON D'ACTION */}
                                {currentConfig.action && (
                                    <button 
                                        className="action-btn"
                                        style={{ backgroundColor: currentConfig.color }}
                                        onClick={() => handleStatusUpdate(order._id)}
                                    >
                                        {currentConfig.action} →
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;