import React, { useCallback, useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/admin.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ICONS = {
  dashboard: <Icon d={<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>} />,
  pending: <Icon d={<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>} />,
  paid: <Icon d={<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>} />,
  shipped: <Icon d={<><rect x="1" y="6" width="14" height="11" /><polygon points="15 10 19 10 23 13 23 17 15 17 15 10" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="18.5" cy="18.5" r="2" /></>} />,
  quotes: <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>} />,
  users: <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  settings: <Icon d={<><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>} />,
};

const AdminLayout = () => {
  const { token } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [stats, setStats] = useState(null);

  // Les compteurs sont rafraîchis à chaque navigation (ex. après validation d'un paiement)
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {
      /* compteurs non bloquants */
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats, pathname]);

  const links = [
    { to: "/admin", end: true, label: "Tableau de bord", icon: ICONS.dashboard },
    { section: "Commandes" },
    { to: "/admin/orders/pending_payment", label: "À encaisser", icon: ICONS.pending, count: stats?.pending, tone: "pending" },
    { to: "/admin/orders/paid", label: "En fabrication", icon: ICONS.paid, count: stats?.paid },
    { to: "/admin/orders/shipped", label: "Expédiées", icon: ICONS.shipped, count: stats?.shipped },
    { section: "Clients" },
    { to: "/admin/quotes", label: "Devis", icon: ICONS.quotes, count: stats?.quotes },
    { to: "/admin/users", label: "Comptes clients", icon: ICONS.users, count: stats?.users },
    { section: "Boutique" },
    { to: "/admin/settings", label: "Tarifs & paramètres", icon: ICONS.settings },
  ];

  return (
    <div className="admin-shell">
      <Header />
      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav aria-label="Administration">
            {links.map((l) =>
              l.section ? (
                <div key={l.section} className="side-section">{l.section}</div>
              ) : (
                <NavLink key={l.to} to={l.to} end={l.end} className="side-link">
                  {l.icon}
                  <span>{l.label}</span>
                  {typeof l.count === "number" && (
                    <span className={`side-count ${l.tone === "pending" && l.count > 0 ? "is-alert" : ""}`}>
                      {l.count}
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </aside>
        <main className="admin-main">
          <Outlet context={{ stats, refreshStats: loadStats }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
