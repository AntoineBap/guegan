import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuoteNote from '../components/QuoteNote';
import '../styles/clientOrders.scss'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ClientQuotes = () => {
    const { user, token, isAuthenticated } = useContext(AuthContext);
    const { setCheckoutItems } = useCart();
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && token) {
            fetch(`${API_URL}/api/auth/my-quotes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setQuotes(data);
                } else {
                    setQuotes([]);
                }
            })
            .catch(err => {
                console.error("Erreur de fetch :", err);
                setQuotes([]);
            });
        }
    }, [isAuthenticated, token]);

    const isQuoteValid = (createdAt) => {
        const creationDate = new Date(createdAt);
        const oneMonthLater = new Date(creationDate);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        return new Date() <= oneMonthLater;
    };

    const handleDelete = async (quoteId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce devis ?")) return;
        try {
            const res = await fetch(`${API_URL}/api/auth/quotes/${quoteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setQuotes(prev => prev.filter(q => q._id !== quoteId));
                setSelectedQuote(null);
            }
        } catch (err) {
            console.error("Erreur suppression:", err);
        }
    };

    const handleOrder = (quote) => {
        setCheckoutItems(quote.items);
        navigate('/checkout');
    };

    const handleOpen3D = (item) => {
        navigate("/configurator", { state: { loadConfig: item } });
    };

    if (selectedQuote) {
        const isValid = isQuoteValid(selectedQuote.createdAt);
        const totalItemsCount = selectedQuote.items.reduce((total, item) => total + item.quantity, 0);
        
        return (
            <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                <Header />
                <div className="admin-order-details">
                    <div className="details-header">
                        <div>
                            <h1>Devis #{selectedQuote.quoteNumber}</h1>
                            <span className="date-creation">
                                Émis le {new Date(selectedQuote.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span 
                                className="status-badge"
                                style={{ backgroundColor: isValid ? '#27ae60' : '#e74c3c', color: 'white' }}
                            >
                                {isValid ? 'Valide' : 'Expiré'}
                            </span>
                            <button className="back-btn" onClick={() => setSelectedQuote(null)}>
                                ← Retour
                            </button>
                        </div>
                    </div>

                    <div className="details-grid">
                        <div className="info-column">
                            

                            <div className="info-card">
                                <h3>Actions sur le devis</h3>
                                <p><strong>Montant Total :</strong> {selectedQuote.totalAmount.toFixed(2)} € HT</p>
                                <p><strong>Validité :</strong> 1 mois</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                    <PDFDownloadLink
                                        document={<QuoteNote quote={selectedQuote} />}
                                        fileName={`Devis_${selectedQuote.quoteNumber}.pdf`}
                                        style={{
                                            textDecoration: 'none',
                                            padding: '10px',
                                            backgroundColor: '#111',
                                            color: '#fff',
                                            textAlign: 'center',
                                            borderRadius: '5px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {({ loading }) => (loading ? 'Préparation du PDF...' : '⬇️ Télécharger le Devis (PDF)')}
                                    </PDFDownloadLink>

                                    <button 
                                        onClick={() => handleOrder(selectedQuote)}
                                        disabled={!isValid}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: isValid ? '#27ae60' : '#ccc',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            cursor: isValid ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {isValid ? 'Passer Commande' : 'Devis Expiré'}
                                    </button>

                                    <button 
                                        onClick={() => handleDelete(selectedQuote._id)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: 'transparent',
                                            border: '1px solid #e74c3c',
                                            color: '#e74c3c',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑️ Supprimer ce devis
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="items-column">
                            <h3>🛠️ Plans à produire ({totalItemsCount})</h3>
                            <div className="items-list">
                                {selectedQuote.items.map((item, index) => (
                                    <div key={index} className="item-card-detail">
                                        <div className="item-header-row">
                                            <h4>
                                                Plan #{index + 1} - {item.length}x{item.width}mm
                                            </h4>
                                            <div className="item-actions">
                                                <span className="qty-badge">Qté: {item.quantity}</span>
                                                <button
                                                    className="btn-3d"
                                                    onClick={() => handleOpen3D(item)}
                                                >
                                                    👁️ Voir en 3D
                                                </button>
                                            </div>
                                        </div>

                                        <div className="item-specs">
                                            <ul>
                                                {item.sinks &&
                                                    item.sinks.length > 0 &&
                                                    item.sinks[0]?.type !== "Aucune cuve" &&
                                                    item.sinks.map((s, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="sub-spec"
                                                        style={{
                                                        borderLeft: "3px solid #ddd",
                                                        paddingLeft: "10px",
                                                        }}
                                                    >
                                                        <strong>Cuve {idx + 1} :</strong>{" "}
                                                        {s.type ? s.type.replace("Cuve ", "") : "Standard"}
                                                        <br />
                                                        Position :{" "}
                                                        {s.position === "left"
                                                        ? "Gauche"
                                                        : s.position === "right"
                                                            ? "Droite"
                                                            : "Centrée"}
                                                        {s.position !== "center" && ` (${s.offset}mm)`}
                                                        <br />
                                                        Robinet :{" "}
                                                        {s.hasTapHole ? (
                                                        <>
                                                            Oui (
                                                            {s.tapHolePosition === "left"
                                                            ? "Gauche"
                                                            : s.tapHolePosition === "right"
                                                                ? "Droite"
                                                                : "Centré"}
                                                            )
                                                            {s.tapHoleOffset && s.tapHoleOffset !== 0
                                                            ? ` [Décalage : ${s.tapHoleOffset}mm]`
                                                            : ""}
                                                        </>
                                                        ) : (
                                                        "Non"
                                                        )}
                                                        <br />
                                                        Egouttoir :{" "}
                                                        {s.hasDrainer
                                                        ? `Oui (${s.drainerPosition === "left" ? "Gauche" : "Droite"})`
                                                        : "Non"}
                                                    </li>
                                                    ))}

                                                {item.rims && (
                                                    <li className="sub-spec">
                                                    🧱 <strong>Dosserets (H{item.rimHeigh}mm) :</strong>{" "}
                                                    {[
                                                        item.rimLeft && "Gauche",
                                                        item.rimBack && "Fond",
                                                        item.rimRight && "Droite",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") || "Aucun"}
                                                    </li>
                                                )}

                                                {item.aprons && (
                                                    <li className="sub-spec">
                                                    <strong>Retombées (H{item.apronHeight}mm) :</strong>{" "}
                                                    {[
                                                        item.apronFront && "Avant",
                                                        item.apronLeft && "Gauche",
                                                        item.apronBack && "Fond",
                                                        item.apronRight && "Droite",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") || "Aucune"}
                                                    </li>
                                                )}

                                                {item.splashback && (
                                                    <li>
                                                    <strong>Anti-Goutte d'eau :</strong> Oui
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Header />
            <div className="client-orders-container">
                <button className="back-btn" onClick={() => navigate('/configurator')}>
                    ← Retour au configurateur
                </button>
                <h1>Mes Devis</h1>
                
                {quotes.length === 0 ? (
                    <p className="empty-state">Aucun devis pour le moment.</p>
                ) : (
                    <div className="orders-list">
                        {quotes.map(quote => {
                            const isValid = isQuoteValid(quote.createdAt);
                            const totalQuantity = quote.items.reduce((total, item) => total + item.quantity, 0);

                            return (
                                <div 
                                    key={quote._id} 
                                    className="order-card-client clickable"
                                    onClick={() => setSelectedQuote(quote)}
                                    style={{ cursor: 'pointer', borderLeft: isValid ? '5px solid #27ae60' : '5px solid #e74c3c' }}
                                >
                                    <div className="order-header">
                                        <span className="order-ref">#{quote.quoteNumber}</span>
                                        <span className="order-date">{new Date(quote.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="order-body">
                                        <p>{totalQuantity} article(s)</p>
                                        <p className="amount">{quote.totalAmount.toFixed(2)} €</p>
                                        <span style={{ fontSize: '0.8rem', color: '#666', marginTop:'5px', textDecoration:'underline' }}>Voir le devis &rarr;</span>
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

export default ClientQuotes;