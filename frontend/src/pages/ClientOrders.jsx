import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation
import Header from '../components/Header';
import '../styles/clientOrders.scss';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ClientOrders = () => {
    const { token, isAuthenticated } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null); // Pour la vue détaillée
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const bic = import.meta.env.VITE_BANK_BIC || 'BIC non configuré';
    const iban = import.meta.env.VITE_BANK_IBAN || 'IBAN non configuré';

    // 1. Détection du retour de commande pour afficher la modale
    useEffect(() => {
        if (location.state && location.state.orderSuccess) {
            setShowSuccessModal(true);
            // On nettoie l'état pour que la modale ne réapparaisse pas au refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (isAuthenticated && token) {
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


    // --- RENDU DE LA VUE DÉTAILLÉE ---
    if (selectedOrder) {
        const statusInfo = getStatusLabel(selectedOrder.status);
        
        return (
            <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                <Header />
                <div className="admin-order-details"> {/* Réutilisation de la classe CSS fournie */}
                    <div className="details-header">
                        <div>
                            <h1>Commande #{selectedOrder.orderNumber}</h1>
                            <span className="date-creation">
                                Du {new Date(selectedOrder.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span className={`status-badge ${selectedOrder.status}`}>
                                {statusInfo.label}
                            </span>
                            <button className="back-btn" onClick={() => setSelectedOrder(null)}>
                                ← Retour
                            </button>
                        </div>
                    </div>

                    <div className="details-grid">
                        {/* COLONNE GAUCHE : INFOS PAIEMENT (Au lieu de client) */}
                        <div className="info-column">
                            <div className="info-card">
                                <h3>Informations de Paiement</h3>
                                <p><strong>Montant Total :</strong> {selectedOrder.totalAmount.toFixed(2)} € HT</p>
                                <p><strong>Méthode :</strong> Virement Bancaire</p>
                                <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '5px', fontSize:'0.9rem' }}>
                                    <strong>Coordonnées bancaires :</strong><br/>
                                    IBAN : {iban}<br/>
                                    BIC : {bic}<br/>
                                    <br/>
                                    <em>Merci d'indiquer la référence <strong>#{selectedOrder.orderNumber}</strong> dans le libellé du virement.</em>
                                </div>
                            </div>

                            <div className="info-card">
                                <h3>Adresse de Livraison</h3>
                                <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                <p>{selectedOrder.shippingAddress.company}</p>
                                <p>{selectedOrder.shippingAddress.address}</p>
                                <p>{selectedOrder.shippingAddress.zip} {selectedOrder.shippingAddress.city}</p>
                            </div>
                        </div>

                        {/* COLONNE DROITE : ARTICLES */}
                        <div className="items-column">
                            <h3>Articles ({selectedOrder.items.length})</h3>
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="item-card-detail">
                                    <div className="item-header-row">
                                        <h4>Plan Vasque {item.length}x{item.width}mm</h4>
                                        <div className="item-actions">
                                            <span className="qty-badge">x{item.quantity}</span>
                                            <span style={{fontWeight:'bold'}}>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
                                        </div>
                                    </div>

                                    <div className="item-specs">
                                        <ul>
                                            {/* Détail Cuves */}
                                            {item.sinks && item.sinks.length > 0 && item.sinks[0].type !== "Aucune cuve" && (
                                                <li>
                                                    <strong>Cuves :</strong>
                                                    {item.sinks.map((s, i) => (
                                                        <div key={i} className="sub-spec">
                                                            #{i+1} : {s.type.replace("Cuve ", "")} - {s.position === 'center' ? 'Centrée' : s.position} 
                                                            {s.offset && ` (${s.offset}mm)`}
                                                            {s.hasTapHole && ` - Robinet ${s.tapHolePosition}`}
                                                        </div>
                                                    ))}
                                                </li>
                                            )}
                                            
                                            {/* Détail Dosserets */}
                                            {item.rims && (
                                                <li>
                                                    <strong>Dosserets (H{item.rimHeigh}mm) :</strong> {[item.rimLeft && 'Gauche', item.rimBack && 'Fond', item.rimRight && 'Droite'].filter(Boolean).join(', ')}
                                                </li>
                                            )}

                                            {/* Détail Retombées */}
                                            {item.aprons && (
                                                <li>
                                                    <strong>Retombées (H{item.apronHeight}mm) :</strong> {[item.apronFront && 'Avant', item.apronLeft && 'Gauche', item.apronBack && 'Fond', item.apronRight && 'Droite'].filter(Boolean).join(', ')}
                                                </li>
                                            )}
                                            
                                            {/* Splashback */}
                                            {item.splashback && <li><strong>Anti-goutte :</strong> Oui</li>}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDU LISTE (PAR DÉFAUT) ---
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
                                <div 
                                    key={order._id} 
                                    className="order-card-client clickable"
                                    onClick={() => setSelectedOrder(order)} // Clic pour voir le détail
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="order-header">
                                        <span className="order-ref">#{order.orderNumber}</span>
                                        <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        <span className="status-badge" style={{backgroundColor: statusInfo.color}}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="order-body">
                                        <p>{order.items.length} article(s)</p>
                                        <p className="amount">{order.totalAmount.toFixed(2)} €</p>
                                        <span style={{ fontSize: '0.8rem', color: '#666', marginTop:'5px', textDecoration:'underline' }}>Voir le détail & paiement &rarr;</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODALE DE SUCCÈS --- */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content" style={{ height: 'auto', maxWidth: '500px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowSuccessModal(false)}>×</button>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <h2 style={{ color: '#27ae60' }}>Commande Validée !</h2>
                        <p style={{ fontSize: '1.1rem', margin: '20px 0', lineHeight: '1.5' }}>
                            Votre commande a bien été prise en compte.<br/>
                            Veuillez consulter votre boîte mail pour obtenir les informations de paiement et la confirmation.
                        </p>
                        <button 
                            className="btn-secondary" 
                            style={{ background:'#111', color:'#fff', marginTop:'10px' }}
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientOrders;