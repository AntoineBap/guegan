import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item) => {
    // GENERATION D'UN ID UNIQUE ROBUSTE ICI
    const newItem = { 
      ...item, 
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}` 
    };
    
    setCartItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const updateCartItem = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      updateCartItem, 
      removeFromCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};