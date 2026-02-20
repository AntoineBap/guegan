import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";

const CartContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // 1. Initialisation Panier Global
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("guest_cart");
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

  // État pour stocker UNIQUEMENT les items à payer
  const [checkoutItems, setCheckoutItems] = useState([]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { token, isAuthenticated } = useContext(AuthContext);

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
              setCartItems(savedCart);
            }
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
    if (isAuthenticated && token) {
      saveCartToBackend(cartItems);
      localStorage.removeItem("guest_cart");
    } else {
      localStorage.setItem("guest_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, token, isDataLoaded]);

  // --- FONCTION SAUVEGARDE API ---
  const saveCartToBackend = async (items) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/auth/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart: items }),
      });
    } catch (error) {
      console.error("❌ Erreur réseau sauvegarde:", error);
    }
  };

  // --- ACTIONS ---
  const addToCart = (item) => {
    setCartItems((prev) => [...prev, item]);
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

  // NOUVEAU : Supprime uniquement les articles qui viennent d'être payés/validés
  const clearPurchasedItems = () => {
    setCartItems((prev) => prev.filter(item => !checkoutItems.includes(item)));
    setCheckoutItems([]);
  };

  const mergeCartAfterLogin = (dbCart = []) => {
    setCartItems((prevGuestCart) => {
      let finalCart = [];
      if (!dbCart || dbCart.length === 0) finalCart = [...prevGuestCart];
      else if (prevGuestCart.length === 0) finalCart = [...dbCart];
      else finalCart = [...dbCart, ...prevGuestCart];
      return finalCart;
    });
    setIsDataLoaded(true);
  };

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
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        clearPurchasedItems, // On expose la nouvelle fonction
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