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
            const response = await fetch(`${API_URL}/api/admin/orders/${status}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Gestion robuste des données (tableau ou objet)
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
        e.stopPropagation(); // Empêche de cliquer sur la carte quand on clique sur le bouton action
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
                fetchOrders();
            }
        } catch (error) {
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
                        <p>Aucune commande trouvée.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div 
                                key={order._id} 
                                className="order-card"
                                // 👇 CLIC SUR LA CARTE -> VERS DÉTAILS
                                onClick={() => navigate(`/admin/order/${order._id}`)}
                                style={{ cursor: 'pointer', borderLeft: `5px solid ${currentConfig.color}` }}
                            >
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
                                    <p><strong>{order.userId?.companyName || "Client"}</strong></p>
                                    <p>{order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
                                </div>

                                {/* DÉTAIL PRODUITS RAPIDE */}
                                <div className="products-summary">
                                    <ul>
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <li key={idx}>
                                                {item.quantity}x Plan {item.length}x{item.width}mm
                                            </li>
                                        ))}
                                        {order.items.length > 2 && <li>... (+{order.items.length - 2} autres)</li>}
                                    </ul>
                                </div>

                                <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                                    {/* BOUTON VOIR DÉTAILS EXPLICITE */}
                                    <button className="details-btn-small">
                                        🔍 Voir Détails & Plans
                                    </button>

                                    {/* BOUTON D'ACTION (Changer statut) */}
                                    {currentConfig.action && (
                                        <button 
                                            className="action-btn"
                                            style={{ backgroundColor: currentConfig.color }}
                                            onClick={(e) => handleStatusUpdate(e, order._id)}
                                        >
                                            {currentConfig.action} →
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