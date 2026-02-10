import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/adminDashboard.scss'; // Import du style

const AdminDashboard = () => {
    const { isAuthenticated, isAdmin, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Sécurité : Redirection si pas admin
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (!isAdmin) {
            navigate('/');
        }
    }, [isAuthenticated, isAdmin, navigate]);

    if (!isAdmin) return null;

    // --- CONFIGURATION DES SECTIONS ---
    const sections = [
        {
            title: "En attente de paiement",
            count: 0, // À dynamiser plus tard
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
            count: null, // Pas de compteur pour les réglages
            path: "/admin/settings",
            icon: "⚙️",
            type: "type-settings"
        }
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>GUEGAN <span className="gold">Admin</span></h1>
                <button className="logout-btn" onClick={logout}>
                    Déconnexion
                </button>
            </div>

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
    );
};

export default AdminDashboard;