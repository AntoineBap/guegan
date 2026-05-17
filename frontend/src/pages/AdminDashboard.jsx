import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../styles/adminDashboard.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBox = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconFile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconSettings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    shipped: 0,
    users: "--",
    quotes: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    else if (!isAdmin) navigate("/");
    else {
      // On lance en parallèle la récupération des stats et des devis pour les compter
      Promise.all([
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
        fetch(`${API_URL}/api/admin/quotes`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      ])
        .then(([statsData, quotesData]) => {
          let validQuotesCount = 0;
          
          if (Array.isArray(quotesData)) {
            // On compte uniquement les devis qui ont moins d'1 mois
            validQuotesCount = quotesData.filter(q => {
              const creationDate = new Date(q.createdAt);
              const oneMonthLater = new Date(creationDate);
              oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
              return new Date() <= oneMonthLater;
            }).length;
          }

          setStats({
            pending: statsData.pending_payment || statsData.pending || 0,
            paid: statsData.paid || 0,
            shipped: statsData.shipped || 0,
            users: statsData.users || "--",
            quotes: validQuotesCount, // Le vrai compte s'affiche ici
          });
        })
        .catch((err) => console.error(err));
    }
  }, [isAuthenticated, isAdmin, navigate, token]);

  if (!isAdmin) return null;

  const sections = [
    {
      title: "En attente de paiement",
      count: stats.pending,
      path: "/admin/orders/pending_payment",
      icon: <IconClock />,
      type: "type-warning",
    },
    {
      title: "Commandes Payées",
      count: stats.paid,
      path: "/admin/orders/paid",
      icon: <IconCheck />,
      type: "type-success",
    },
    {
      title: "Commandes Expédiées",
      count: stats.shipped,
      path: "/admin/orders/shipped",
      icon: <IconBox />,
      type: "type-info",
    },
    {
      title: "Devis Valables",
      count: stats.quotes,
      path: "/admin/quotes",
      icon: <IconFile />,
      type: "type-info",
    },
    {
      title: "Clients Inscrits",
      count: stats.users,
      path: "/admin/users",
      icon: <IconUsers />,
      type: "type-users",
    },
    {
      title: "Modifier les Variables",
      count: null,
      path: "/admin/settings",
      icon: <IconSettings />,
      type: "type-settings",
    },
  ];

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Header />
      <div className="admin-dashboard">
        <h2 style={{ marginBottom: "30px", color: "#333" }}>Vue d'ensemble</h2>
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
              <span className="card-arrow"><IconArrow /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;