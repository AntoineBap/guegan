import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import '../styles/clientOrders.scss'; // Style ci-dessous

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ClientOrders = () => {
    const { token, isAuthenticated } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (isAuthenticated && token) {
            // Créer cette route dans user.js côté backend : router.get('/my-orders', auth, userCtrl.getMyOrders);
            fetch(`${API_URL}/api/auth/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error(err));
        }
    }, [isAuthenticated, token]);

    // Helper pour le statut
    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending_payment': return { label: 'En attente de paiement', color: 'orange' };
            case 'paid': return { label: 'Payée (En production)', color: 'green' };
            case 'shipped': return { label: 'Expédiée', color: 'blue' };
            default: return { label: status, color: 'gray' };
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Header />
            <div className="client-orders-container">
                <h1>Mes Commandes</h1>
                
                {orders.length === 0 ? (
                    <p>Aucune commande pour le moment.</p>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const statusInfo = getStatusLabel(order.status);
                            return (
                                <div key={order._id} className="order-card-client">
                                    <div className="order-header">
                                        <span className="order-ref">#{order._id.slice(-6).toUpperCase()}</span>
                                        <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        <span className="status-badge" style={{backgroundColor: statusInfo.color}}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="order-body">
                                        <p>{order.items.length} article(s)</p>
                                        <p className="amount">{order.totalAmount.toFixed(2)} €</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientOrders;