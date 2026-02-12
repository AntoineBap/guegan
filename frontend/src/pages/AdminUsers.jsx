import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';
import * as XLSX from 'xlsx'; // Librairie pour l'Excel
import '../styles/adminUsers.scss';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminUsers = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chargement des données à l'ouverture de la page
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/users-export`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

    const handleExportExcel = () => {
        // 1. Préparer les données pour Excel (Mappage des colonnes exactes demandées)
        const dataToExport = users.map(user => ({
            "Nom & Prénom": user.nom_complet,
            "Email": user.email,
            "Téléphone": user.telephone,
            "N° SIRET": user.siret,
            "Entreprise": user.entreprise,
            "Adresse Entreprise": user.adresse,
            "N° TVA": user.tva,
            "Contenu Panier": user.panier
        }));

        // 2. Création du classeur
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients GUEGAN");

        // 3. Style colonnes (largeur)
        const wscols = [
            {wch: 25}, // Nom
            {wch: 30}, // Email
            {wch: 15}, // Tel
            {wch: 20}, // Siret
            {wch: 25}, // Entreprise
            {wch: 40}, // Adresse
            {wch: 20}, // TVA
            {wch: 60}  // Panier (large car multi-lignes)
        ];
        worksheet['!cols'] = wscols;

        // 4. Téléchargement
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        XLSX.writeFile(workbook, `Export_Clients_${dateStr}.xlsx`);
    };

    return (
        <div className="admin-users-page">
            <Header />
            
            <div className="content-wrapper">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/admin')}>
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
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={index}>
                                        <td style={{fontWeight: 'bold'}}>{user.nom_complet}</td>
                                        <td>
                                            <a href={`mailto:${user.email}`} style={{color: '#3498db'}}>
                                                {user.email}
                                            </a>
                                        </td>
                                        <td>{user.telephone}</td>
                                        <td>{user.siret}</td>
                                        <td>{user.entreprise}</td>
                                        <td className="address-cell">{user.adresse}</td>
                                        <td>{user.tva}</td>
                                        <td className="cart-cell">{user.panier}</td>
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