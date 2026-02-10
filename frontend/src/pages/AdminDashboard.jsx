import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
// 👇 Import du composant Header
import Header from '../components/Header';
import '../styles/adminDashboard.scss';

const AdminDashboard = () => {
    const { isAuthenticated, isAdmin } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (!isAdmin) {
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, navigate]);

    if (!isAdmin) return null;

    const sections = [
        {
            title: "En attente de paiement",
            count: 0,
            path: "/admin/orders-pending",
            icon: "⏳",
            type: "type-warning"
        },
        {
            title: "Commandes Payées",
            count: 0,
            path: "/admin/orders-paid",
            icon: "✅",
            type: "type-success"
        },
        {
            title: "Commandes Expédiées",
            count: 0,
            path: "/admin/orders-shipped",
            icon: "📦",
            type: "type-info"
        },
        {
            title: "Clients Inscrits",
            count: "--",
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
            {/* 👇 LE HEADER EST ICI */}
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