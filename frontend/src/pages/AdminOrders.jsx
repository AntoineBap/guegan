import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import '../styles/adminOrders.scss';
// 👇 IMPORT POUR LE PDF
import { PDFDownloadLink } from '@react-pdf/renderer';
import DeliveryNote from '../components/DeliveryNote';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminOrders = () => {
    const { status } = useParams(); 
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
            alert("Erreur technique lors de la mise à jour");
        }
    };

    const handleDeleteOrder = async (e, orderId, orderNumber) => {
        e.stopPropagation(); 
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT la commande #${orderNumber} ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/order/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setOrders(orders.filter(o => o._id !== orderId));
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            alert("Erreur technique lors de la suppression");
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
                                onClick={() => navigate(`/admin/order/${order._id}`)}
                                style={{ cursor: 'pointer', borderLeft: `5px solid ${currentConfig.color}` }}
                            >
                                <div className="order-header">
                                    <div className="meta">
                                        <span className="order-id">#{order.orderNumber}</span>
                                        <span className="order-date">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="amount">
                                        {order.totalAmount?.toFixed(2)} € HT
                                    </div>
                                </div>

                                <div className="client-info">
                                    <p><strong>{order.userId?.companyName || "Entreprise inconnue"}</strong></p>
                                    <p>{order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
                                </div>

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

                                <div style={{marginTop: '15px', display: 'flex', gap: '15px', justifyContent: 'flex-end', alignItems: 'center'}}>
                                    
                                    {/* --- BOUTON BON DE LIVRAISON (UNIQUEMENT SI EXPÉDIÉ) --- */}
                                    {status === 'shipped' && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <PDFDownloadLink 
                                                document={<DeliveryNote order={order} />} 
                                                fileName={`BL-${order.orderNumber}.pdf`}
                                                style={{
                                                    textDecoration: 'none',
                                                    padding: '8px 12px',
                                                    backgroundColor: '#7f8c8d',
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem',
                                                    marginRight: '10px'
                                                }}
                                            >
                                                {({ blob, url, loading, error }) => 
                                                    loading ? 'Génération...' : '📄 Bon de Livraison'
                                                }
                                            </PDFDownloadLink>
                                        </div>
                                        
                                    )}

                                    <button 
                                        className="delete-btn"
                                        onClick={(e) => handleDeleteOrder(e, order._id, order.orderNumber)}
                                        style={{ 
                                            backgroundColor: 'transparent', 
                                            border: 'none', 
                                            color: '#e74c3c', 
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '5px'
                                        }}
                                        title="Supprimer définitivement"
                                    >
                                        🗑️
                                    </button>

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