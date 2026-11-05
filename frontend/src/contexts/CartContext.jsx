import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { SettingsContext } from "./SettingsContext";
import { computeUnitPrice, hasPrices } from "../utils/pricing";

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useCart = () => useContext(CartContext);

// Identifiant stable par article (les objets sont recréés lors d'un recalcul de prix)
const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const withIds = (items) =>
  Array.isArray(items) ? items.map((i) => (i.cartId ? i : { ...i, cartId: newId() })) : [];

export const CartProvider = ({ children }) => {
  // 1. Initialisation Panier Global
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("guest_cart");
      return localData ? withIds(JSON.parse(localData)) : [];
    } catch (error) {
      return [];
    }
  });

  // État pour stocker UNIQUEMENT les items à payer
  const [checkoutItems, setCheckoutItems] = useState([]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { token, isAuthenticated } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);

  // --- RECALCUL DES PRIX ---
  // Les articles ajoutés sans tarifs (visiteur) ou avant un changement de tarifs
  // sont remis à jour dès que les prix sont connus.
  useEffect(() => {
    if (!hasPrices(settings)) return;
    setCartItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const unitPrice = computeUnitPrice(item, settings);
        if (unitPrice === item.unitPrice) return item;
        changed = true;
        return { ...item, unitPrice, totalPrice: unitPrice * (item.quantity || 1) };
      });
      return changed ? next : prev;
    });
  }, [settings, cartItems.length]);

  // --- EFFET 1 : CHARGEMENT INITIAL (FETCH) ---
  useEffect(() => {
    const fetchCart = async () => {
      if (isAuthenticated && token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const savedCart = await response.json();
            if (Array.isArray(savedCart)) {
              // Fusion : panier enregistré + articles ajoutés avant la connexion
              // Identifiant stable pour les anciens articles sans cartId : si le chargement
              // se produit deux fois, la fusion ne crée pas de doublons.
              const saved = savedCart.map((i, idx) => (i.cartId ? i : { ...i, cartId: `saved-${idx}` }));
              const savedIds = new Set(saved.map((i) => i.cartId));
              setCartItems((prev) => [...saved, ...prev.filter((i) => !savedIds.has(i.cartId))]);
            }
          }
        } catch (error) {
          console.error("Erreur chargement panier:", error);
        }
      }
      setIsDataLoaded(true);
    };

    if (isAuthenticated) {
      // Pas de sauvegarde tant que le panier serveur n'est pas chargé (sinon il serait écrasé)
      setIsDataLoaded(false);
      fetchCart();
    } else {
      setIsDataLoaded(true);
    }
  }, [isAuthenticated, token]);

  // --- EFFET 2 : SAUVEGARDE AUTOMATIQUE ---
  // Regroupée (300 ms) : changer une quantité au clavier n'envoie plus une requête par frappe
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!isDataLoaded) return;
    clearTimeout(saveTimer.current);
    if (isAuthenticated && token) {
      saveTimer.current = setTimeout(() => {
        fetch(`${API_URL}/api/auth/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cart: cartItems }),
        }).catch((error) => console.error("Erreur réseau sauvegarde panier:", error));
      }, 300);
      try {
        localStorage.removeItem("guest_cart");
      } catch {
        /* stockage indisponible */
      }
    } else {
      try {
        localStorage.setItem("guest_cart", JSON.stringify(cartItems));
      } catch {
        /* stockage indisponible */
      }
    }
    return () => clearTimeout(saveTimer.current);
  }, [cartItems, isAuthenticated, token, isDataLoaded]);

  // --- ACTIONS ---
  const addToCart = (rawItem, insertAtIndex = null) => {
    const item = { ...rawItem, cartId: newId() };
    setCartItems((prev) => {
      if (insertAtIndex !== null && insertAtIndex >= 0 && insertAtIndex <= prev.length) {
        const newCart = [...prev];
        newCart.splice(insertAtIndex, 0, item);
        return newCart;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (indexToRemove) => {
    setCartItems((prev) => {
      const newCart = [...prev];
      if (typeof indexToRemove === "number" && indexToRemove >= 0) {
        newCart.splice(indexToRemove, 1);
      }
      return newCart;
    });
  };

  const updateCartItem = (indexToUpdate, newItemOrChanges) => {
    setCartItems((prev) => {
      const newCart = [...prev];
      const oldItem = newCart[indexToUpdate];
      if (!oldItem) return prev;
      if (typeof newItemOrChanges === "object") {
        newCart[indexToUpdate] = { ...oldItem, ...newItemOrChanges };
      } else {
        newCart[indexToUpdate] = newItemOrChanges;
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCheckoutItems([]); 
    localStorage.removeItem("guest_cart");
  };

  // Supprime uniquement les articles qui viennent d'être payés/validés
  const clearPurchasedItems = () => {
    const bought = new Set(checkoutItems.map((i) => i.cartId));
    setCartItems((prev) => prev.filter((item) => !bought.has(item.cartId)));
    setCheckoutItems([]);
  };

  // Conservé pour compatibilité : la fusion se fait désormais au chargement du panier serveur
  const mergeCartAfterLogin = () => {};

  const proceedToCheckout = (selectedIndices) => {
    // On filtre le panier global pour ne garder que les indices sélectionnés
    const itemsToBuy = cartItems.filter((_, index) =>
      selectedIndices.includes(index),
    );
    setCheckoutItems(itemsToBuy);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        checkoutItems, 
        setCheckoutItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        clearPurchasedItems, 
        isCartOpen,
        setIsCartOpen,
        mergeCartAfterLogin,
        proceedToCheckout, 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};