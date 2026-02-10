import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // 1. Initialisation
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('guest_cart');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            return [];
        }
    });

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // On récupère les infos d'auth
    const { token, isAuthenticated } = useContext(AuthContext);

    // --- DEBUG : Ce log va s'afficher à chaque changement ---
    useEffect(() => {
        console.log("🔍 ÉTAT DU CONTEXTE :", { 
            connecté: isAuthenticated, 
            tokenPrésent: !!token, 
            nbArticles: cartItems.length,
            donnéesChargées: isDataLoaded 
        });
    }, [isAuthenticated, token, cartItems.length, isDataLoaded]);


    // --- EFFET 1 : CHARGEMENT INITIAL (FETCH) ---
    useEffect(() => {
        const fetchCart = async () => {
            if (isAuthenticated && token) {
                try {
                    console.log("🔄 Tentative de récupération du panier BDD...");
                    const response = await fetch(`${API_URL}/api/auth/cart`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        const savedCart = await response.json();
                        console.log("✅ Panier BDD reçu :", savedCart);
                        if (Array.isArray(savedCart)) {
                            setCartItems(savedCart);
                        }
                    } else {
                        console.log("⚠️ Réponse serveur non-OK pour le panier:", response.status);
                    }
                } catch (error) {
                    console.error("❌ Erreur chargement panier:", error);
                }
            }
            setIsDataLoaded(true);
        };

        if (isAuthenticated) {
            fetchCart();
        } else {
            setIsDataLoaded(true);
        }
    }, [isAuthenticated, token]);


    // --- EFFET 2 : SAUVEGARDE AUTOMATIQUE ---
    useEffect(() => {
        if (!isDataLoaded) return;

        // A. CAS CONNECTÉ
        if (isAuthenticated && token) {
            // On sauvegarde si on a des items OU si le tableau est vide (pour vider la BDD aussi)
            console.log("💾 Déclenchement sauvegarde BDD...");
            saveCartToBackend(cartItems);
            localStorage.removeItem('guest_cart');
        } 
        // B. CAS INVITÉ
        else {
            localStorage.setItem('guest_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, isAuthenticated, token, isDataLoaded]);


    // --- EFFET 3 : DÉCONNEXION ---
    const [wasAuthenticated, setWasAuthenticated] = useState(isAuthenticated);
    useEffect(() => {
        if (wasAuthenticated && !isAuthenticated) {
            console.log("👋 Déconnexion détectée -> Reset local");
            setCartItems([]); 
            localStorage.removeItem('guest_cart');
            setIsDataLoaded(true);
        }
        setWasAuthenticated(isAuthenticated);
    }, [isAuthenticated]);


    // --- FONCTION SAUVEGARDE API ---
    const saveCartToBackend = async (items) => {
        if (!token) {
            console.error("⛔ Pas de token, annulation sauvegarde.");
            return;
        }

        console.log(`📤 Envoi POST vers ${API_URL}/api/auth/cart avec ${items.length} items`);
        
        try {
            const response = await fetch(`${API_URL}/api/auth/cart`, {
                method: 'POST', // On utilise bien POST ici
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cart: items })
            });
            
            if (response.ok) {
                console.log("✅ Sauvegarde BDD réussie (200 OK)");
            } else {
                const text = await response.text();
                console.error(`❌ Erreur sauvegarde: ${response.status} - ${text}`);
            }
        } catch (error) {
            console.error("❌ Erreur réseau sauvegarde:", error);
        }
    };

    // --- ACTIONS ---
    const addToCart = (item) => {
        setCartItems(prev => [...prev, item]);
        setIsCartOpen(true);
    };

    const removeFromCart = (indexToRemove) => {
        setCartItems(prev => {
            const newCart = [...prev];
            if (typeof indexToRemove === 'number' && indexToRemove >= 0) {
                newCart.splice(indexToRemove, 1);
            }
            return newCart;
        });
    };

    const updateCartItem = (indexToUpdate, newItemOrChanges) => {
        setCartItems(prev => {
            const newCart = [...prev];
            const oldItem = newCart[indexToUpdate];
            if (!oldItem) return prev; 
            if (typeof newItemOrChanges === 'object') {
                newCart[indexToUpdate] = { ...oldItem, ...newItemOrChanges };
            } else {
                newCart[indexToUpdate] = newItemOrChanges;
            }
            return newCart;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('guest_cart');
    };

    const mergeCartAfterLogin = (dbCart = []) => {
        console.log("📥 Fusion Panier Login :", dbCart);
        setCartItems(prevGuestCart => {
            let finalCart = [];
            if (!dbCart || dbCart.length === 0) finalCart = [...prevGuestCart];
            else if (prevGuestCart.length === 0) finalCart = [...dbCart];
            else finalCart = [...dbCart, ...prevGuestCart];
            return finalCart;
        });
        setIsDataLoaded(true);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateCartItem,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            mergeCartAfterLogin
        }}>
            {children}
        </CartContext.Provider>
    );
};