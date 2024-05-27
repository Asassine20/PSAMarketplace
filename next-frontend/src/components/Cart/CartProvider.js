import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [savedForLater, setSavedForLater] = useState(() => {
    if (typeof window !== "undefined") {
      const savedItems = localStorage.getItem('savedForLater');
      return savedItems ? JSON.parse(savedItems) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('cart', JSON.stringify(cart));
      localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
    }
  }, [cart, savedForLater]);

  const addToCart = (item) => {
    setCart((prevCart) => [...prevCart, item]);
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const saveForLater = (id) => {
    const itemToSave = cart.find(item => item.id === id);
    setCart((prevCart) => prevCart.filter(item => item.id !== id));
    setSavedForLater((prevSaved) => [...prevSaved, itemToSave]);
  };

  const addToCartFromSaved = (id) => {
    const itemToAdd = savedForLater.find(item => item.id === id);
    setSavedForLater((prevSaved) => prevSaved.filter(item => item.id !== id));
    setCart((prevCart) => [...prevCart, itemToAdd]);
  };

  const removeFromSaved = (id) => {
    setSavedForLater((prevSaved) => prevSaved.filter(item => item.id !== id));
  };

  const isInCart = (id) => {
    return cart.some(item => item.id === id);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, saveForLater, savedForLater, addToCartFromSaved, removeFromSaved, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
