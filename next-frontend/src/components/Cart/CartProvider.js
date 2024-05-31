// CartProvider.js
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
    setCart((prevCart) => {
      const updatedCart = [...prevCart, item];
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const saveForLater = (id) => {
    const itemToSave = cart.find(item => item.id === id);
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
    setSavedForLater((prevSaved) => {
      const updatedSaved = [...prevSaved, itemToSave];
      localStorage.setItem('savedForLater', JSON.stringify(updatedSaved));
      return updatedSaved;
    });
  };

  const addToCartFromSaved = (id) => {
    const itemToAdd = savedForLater.find(item => item.id === id);
    setSavedForLater((prevSaved) => {
      const updatedSaved = prevSaved.filter(item => item.id !== id);
      localStorage.setItem('savedForLater', JSON.stringify(updatedSaved));
      return updatedSaved;
    });
    setCart((prevCart) => {
      const updatedCart = [...prevCart, itemToAdd];
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromSaved = (id) => {
    setSavedForLater((prevSaved) => {
      const updatedSaved = prevSaved.filter(item => item.id !== id);
      localStorage.setItem('savedForLater', JSON.stringify(updatedSaved));
      return updatedSaved;
    });
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
