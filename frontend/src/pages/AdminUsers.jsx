import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/Header";
import * as XLSX from "xlsx";
import "../styles/adminUsers.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || 0;
        let bValue = b[sortConfig.key] || 0;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const handleExportExcel = () => {
    const dataToExport = sortedUsers.map((user) => ({
      "Nom & Prénom": user.nom_complet,
      Email: user.email,
      Téléphone: user.telephone,
      "N° SIRET": user.siret,
      Entreprise: user.entreprise,
      "Adresse Entreprise": user.adresse,
      "N° TVA": user.tva,
      "Contenu Panier": user.panier,
      "Total Panier HT": (user.total_panier || 0).toFixed(2) + " €", // Déplacé en dernier
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients GUEGAN");

    const wscols = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 60 }, // Panier
      { wch: 15 }, // Total (en dernier)
    ];
    worksheet["!cols"] = wscols;

    const dateStr = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    XLSX.writeFile(workbook, `Export_Clients_${dateStr}.xlsx`);
  };

  return (
    <div className="admin-users-page">
      <Header />

      <div className="content-wrapper">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/admin")}>
            ← Retour Dashboard
          </button>
          <h1>Gestion Clients ({users.length})</h1>
          <button className="export-btn" onClick={handleExportExcel}>
            📥 Télécharger Excel
          </button>
        </div>

        {loading ? (
          <div className="loading">Chargement des données clients...</div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nom / Prénom</th>
                  <th>Email</th>
                  <th>Tél</th>
                  <th>SIRET</th>
                  <th>Entreprise</th>
                  <th>Adresse</th>
                  <th>TVA</th>
                  <th>Panier</th>

                  {/* Colonne Triable (Déplacée en dernier) */}
                  <th
                    onClick={() => handleSort("total_panier")}
                    style={{
                      cursor: "pointer",
                      userSelect: "none",
                      backgroundColor:
                        sortConfig.key === "total_panier"
                          ? "#eef2f7"
                          : "transparent",
                      whiteSpace: "nowrap",
                    }}
                    title="Cliquez pour trier par montant"
                  >
                    Total Panier HT
                    <span style={{ marginLeft: "8px", fontSize: "0.8em" }}>
                      {sortConfig.key === "total_panier" ? (
                        sortConfig.direction === "asc" ? (
                          "▲"
                        ) : (
                          "▼"
                        )
                      ) : (
                        <span style={{ color: "#ccc" }}>▼</span>
                      )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: "bold" }}>{user.nom_complet}</td>
                    <td>
                      <a
                        href={`mailto:${user.email}`}
                        style={{ color: "#3498db" }}
                      >
                        {user.email}
                      </a>
                    </td>
                    <td>{user.telephone}</td>
                    <td>{user.siret}</td>
                    <td>{user.entreprise}</td>
                    <td className="address-cell">{user.adresse}</td>
                    <td>{user.tva}</td>
                    <td className="cart-cell">{user.panier}</td>

                    {/* Cellule Prix (Déplacée en dernier) */}
                    <td
                      style={{
                        fontWeight: "bold",
                        color: "#27ae60",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(user.total_panier || 0).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state">Aucun client trouvé.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
