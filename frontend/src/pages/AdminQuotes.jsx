import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../styles/adminDashboard.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminQuotes = () => {
  const { token, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    if (!isAdmin) return navigate("/");
    
    fetch(`${API_URL}/api/admin/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setQuotes(data);
        }
      })
      .catch((err) => console.error(err));
  }, [isAdmin, navigate, token]);

  // Filtrer uniquement les devis valables (moins de 1 mois)
  const validQuotes = quotes.filter(q => {
    const creationDate = new Date(q.createdAt);
    const oneMonthLater = new Date(creationDate);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    return new Date() <= oneMonthLater;
  });

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Header />
      <div className="admin-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Gestion des Devis ({validQuotes.length} en cours)</h2>
          <button onClick={() => navigate("/admin")} style={{ padding: '8px 15px', background: '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            ← Retour Dashboard
          </button>
        </div>

        {validQuotes.length === 0 ? (
          <p style={{ textAlign: "center", fontStyle: "italic", color: "#666", marginTop: "40px" }}>
            Aucun devis en cours de validité.
          </p>
        ) : (
          <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderCollapse: 'collapse', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <thead style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '15px' }}>Numéro</th>
                <th style={{ padding: '15px' }}>Date de création</th>
                <th style={{ padding: '15px' }}>Fin de validité</th>
                <th style={{ padding: '15px' }}>Client</th>
                <th style={{ padding: '15px' }}>Montant HT</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {validQuotes.map(q => {
                const creationDate = new Date(q.createdAt);
                const expirationDate = new Date(creationDate);
                expirationDate.setMonth(expirationDate.getMonth() + 1);

                return (
                  <tr key={q._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>#{q.quoteNumber}</td>
                    <td style={{ padding: '15px' }}>{creationDate.toLocaleDateString()}</td>
                    <td style={{ padding: '15px', color: '#e74c3c', fontWeight: 'bold' }}>
                      {expirationDate.toLocaleDateString()}
                    </td>
                    <td style={{ padding: '15px' }}>{q.userId?.email || 'Inconnu'}</td>
                    <td style={{ padding: '15px' }}>{q.totalAmount.toFixed(2)} €</td>
                    <td style={{ padding: '15px' }}>
                      <button 
                        onClick={() => navigate(`/admin/quotes/${q._id}`)}
                        style={{ padding: '6px 12px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminQuotes;