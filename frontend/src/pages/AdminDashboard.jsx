import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import '../styles/adminDashboard.scss';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminDashboard = () => {
    const { isAuthenticated, isAdmin, token } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        pending: 0,
        paid: 0,
        shipped: 0,
        users: '--'
    });

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
        else if (!isAdmin) navigate('/');
        else {
            fetch(`${API_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                setStats({
                    pending: data.pending_payment || data.pending || 0,
                    paid: data.paid || 0,
                    shipped: data.shipped || 0,
                    users: data.users || '--'
                });
            })
            .catch(err => console.error(err));
        }
    }, [isAuthenticated, isAdmin, navigate, token]);

    if (!isAdmin) return null;

    const sections = [
        {
            title: "En attente de paiement",
            count: stats.pending,
            path: "/admin/orders/pending_payment",
            icon: "⏳",
            type: "type-warning"
        },
        {
            title: "Commandes Payées",
            count: stats.paid,
            path: "/admin/orders/paid",
            icon: "✅",
            type: "type-success"
        },
        {
            title: "Commandes Expédiées",
            count: stats.shipped,
            path: "/admin/orders/shipped",
            icon: "📦",
            type: "type-info"
        },
        {
            title: "Clients Inscrits",
            count: stats.users,
            path: "/admin/users",
            icon: "👥",
            type: "type-users"
        },
        {
            title: "Modifier les Variables",
            count: null, 
            path: "/admin/settings",
            icon: "⚙️",
            type: "type-settings"
        }
    ];

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Header />
            <div className="admin-dashboard">
                <h2 style={{ marginBottom: '30px', color: '#333' }}>Vue d'ensemble</h2>
                <div className="dashboard-grid">
                    {sections.map((section, index) => (
                        <div 
                            key={index} 
                            className={`dashboard-card ${section.type}`}
                            onClick={() => navigate(section.path)}
                        >
                            <div>
                                <div className="card-icon">{section.icon}</div>
                                <h3 className="card-title">{section.title}</h3>
                                {section.count !== null && (
                                    <div className="card-count">{section.count}</div>
                                )}
                            </div>
                            <span className="card-arrow">➔</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;