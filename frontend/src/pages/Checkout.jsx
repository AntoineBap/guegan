import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/checkout.scss'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Checkout = () => {
    const { cartItems, clearCart } = useCart();
    const { user, token, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const [useSameAddress, setUseSameAddress] = useState(true);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // NOUVEAU : État pour voir les détails d'un item dans le résumé
    const [expandedItemIndex, setExpandedItemIndex] = useState(null);

    // Initialisation Adresses
    const [billing, setBilling] = useState({
        firstName: '', lastName: '', company: '', address: '', city: '', zip: '', country: 'France'
    });
    const [shipping, setShipping] = useState({
        firstName: '', lastName: '', company: '', address: '', city: '', zip: '', country: 'France'
    });

    // Pré-remplissage si connecté
    useEffect(() => {
        if (user) {
            setBilling({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                company: user.companyName || '',
                address: user.companyAddress || '',
                city: '', zip: '', country: 'France'
            });
        }
    }, [user]);

    // Calcul Total
    const totalAmount = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

    const handleBillingChange = (e) => setBilling({...billing, [e.target.name]: e.target.value});
    const handleShippingChange = (e) => setShipping({...shipping, [e.target.name]: e.target.value});

    const toggleDetails = (index) => {
        setExpandedItemIndex(prev => (prev === index ? null : index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return alert("Veuillez vous connecter pour commander.");
        
        setIsSubmitting(true);
        const finalShipping = useSameAddress ? billing : shipping;

        try {
            const response = await fetch(`${API_URL}/api/auth/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: cartItems,
                    totalAmount,
                    billingAddress: billing,
                    shippingAddress: finalShipping
                })
            });

            const data = await response.json();

            if (response.ok) {
                clearCart(); 
                navigate(`/order-confirmation/${data.orderId}`);
            } else {
                // CORRECTION ERREUR : On affiche l'erreur réelle renvoyée par le backend
                alert("Erreur: " + (data.message || data.error || "Une erreur est survenue"));
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion serveur.");
        }
        setIsSubmitting(false);
    };

    if (cartItems.length === 0) return <div className="checkout-page"><p>Votre panier est vide.</p></div>;

    return (
        <div className="checkout-page">
            <h1>Finalisation de la commande</h1>
            
            <div className="checkout-container">
                {/* COLONNE GAUCHE : FORMULAIRES */}
                <div className="form-column">
                    <form onSubmit={handleSubmit}>
                        {/* ADRESSE FACTURATION */}
                        <section>
                            <h2>📍 Adresse de Facturation</h2>
                            <div className="form-grid">
                                <input type="text" name="firstName" placeholder="Prénom" value={billing.firstName} onChange={handleBillingChange} required />
                                <input type="text" name="lastName" placeholder="Nom" value={billing.lastName} onChange={handleBillingChange} required />
                                <input type="text" name="company" placeholder="Société" value={billing.company} onChange={handleBillingChange} />
                                <input type="text" name="address" placeholder="Adresse complète" className="full-width" value={billing.address} onChange={handleBillingChange} required />
                                <input type="text" name="zip" placeholder="Code Postal" value={billing.zip} onChange={handleBillingChange} required />
                                <input type="text" name="city" placeholder="Ville" value={billing.city} onChange={handleBillingChange} required />
                            </div>
                        </section>

                        {/* OPTION ADRESSE LIVRAISON */}
                        <div className="checkbox-section">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={useSameAddress} 
                                    onChange={(e) => setUseSameAddress(e.target.checked)} 
                                />
                                Utiliser la même adresse pour la livraison
                            </label>
                        </div>

                        {/* ADRESSE LIVRAISON (Si différente) */}
                        {!useSameAddress && (
                            <section className="fade-in">
                                <h2>🚚 Adresse de Livraison</h2>
                                <div className="form-grid">
                                    <input type="text" name="firstName" placeholder="Prénom" value={shipping.firstName} onChange={handleShippingChange} required />
                                    <input type="text" name="lastName" placeholder="Nom" value={shipping.lastName} onChange={handleShippingChange} required />
                                    <input type="text" name="company" placeholder="Société (Optionnel)" value={shipping.company} onChange={handleShippingChange} />
                                    <input type="text" name="address" placeholder="Adresse complète" className="full-width" value={shipping.address} onChange={handleShippingChange} required />
                                    <input type="text" name="zip" placeholder="Code Postal" value={shipping.zip} onChange={handleShippingChange} required />
                                    <input type="text" name="city" placeholder="Ville" value={shipping.city} onChange={handleShippingChange} required />
                                </div>
                            </section>
                        )}

                        {/* MENTIONS LEGALES */}
                        <div className="legal-box warning">
                            <h3>⚠️ Renonciation au droit de rétractation</h3>
                            <p>
                                Conformément à l'article <strong>L.221-28 3° du Code de la consommation</strong>, 
                                le droit de rétractation ne peut être exercé pour les contrats de fourniture de biens confectionnés 
                                selon les spécifications du consommateur ou nettement personnalisés.
                            </p>
                            <label className="accept-terms">
                                <input 
                                    type="checkbox" 
                                    required 
                                    checked={acceptedTerms} 
                                    onChange={(e) => setAcceptedTerms(e.target.checked)} 
                                />
                                J'ai lu et j'accepte que ma commande de produits sur-mesure ne soit ni échangeable ni remboursable une fois la fabrication lancée.
                            </label>
                        </div>

                        <button type="submit" className="validate-btn" disabled={isSubmitting || !acceptedTerms}>
                            {isSubmitting ? "Validation..." : `Confirmer et Payer (${totalAmount.toFixed(2)} €)`}
                        </button>
                    </form>
                </div>

                {/* COLONNE DROITE : RESUME DÉTAILLÉ */}
                <div className="summary-column">
                    <div className="summary-card">
                        <h3>Résumé ({cartItems.length} articles)</h3>
                        <div className="items-list">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="summary-item-wrapper">
                                    <div className="mini-item">
                                        <div>
                                            <span style={{fontWeight:'bold'}}>{item.quantity}x Plan {item.length}mm</span>
                                            <button 
                                                type="button"
                                                className="details-toggle-btn"
                                                onClick={() => toggleDetails(idx)}
                                            >
                                                {expandedItemIndex === idx ? "Masquer ▴" : "Détails ▾"}
                                            </button>
                                        </div>
                                        <span>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
                                    </div>

                                    {/* ZONE DE DÉTAILS DÉROULANTE */}
                                    {expandedItemIndex === idx && (
                                        <div className="mini-item-details">
                                            <ul>
                                                <li><strong>Couleur:</strong> {item.color === 'white' ? "Blanc Pur" : "Autre"}</li>
                                                <li><strong>Dim:</strong> {item.length}x{item.width}mm</li>
                                                {item.sinks && item.sinks.map((s, i) => (
                                                    <li key={i}>
                                                        - Cuve: {s.type.replace("Cuve ", "")} 
                                                        <br/>(Pos: {s.position === 'center' ? 'Centrée' : s.position})
                                                    </li>
                                                ))}
                                                {item.rims && <li>- Dosserets: H{item.rimHeigh}mm</li>}
                                                {item.aprons && <li>- Retombées: H{item.apronHeight}mm</li>}
                                                {item.splashback && <li>- Goutte d'eau: Oui</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="total-row">
                            <span>Total HT</span>
                            <span>{totalAmount.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;