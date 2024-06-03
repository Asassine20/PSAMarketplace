import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { accessToken } = useAuth();
  const [cart, setCart] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return null;
  });

  const fetchCart = useCallback(async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/cart', {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const uniqueCartItems = data.cart.filter((item, index, self) =>
          index === self.findIndex((t) => t.ListingID === item.ListingID)
        );
        const uniqueSavedForLaterItems = data.savedForLater.filter((item, index, self) =>
          index === self.findIndex((t) => t.ListingID === item.ListingID)
        );
        setCart(uniqueCartItems || []);
        setSavedForLater(uniqueSavedForLaterItems || []);
      } else {
        console.error("Failed to fetch cart data");
      }
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateCart = async (cart, savedForLater) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cart, savedForLater }),
      });

      if (!response.ok) {
        console.error("Failed to update cart data");
        return false;
      } else {
        // Fetch the updated cart data after updating the cart
        fetchCart();
        return true;
      }
    } catch (error) {
      console.error("Error updating cart data:", error);
      return false;
    }
  };

  const addToCart = async (item) => {
    if (!item.ListingID) {
      console.error("Invalid item: ListingID is required", item);
      return false;
    }
    if (!cart.find(cartItem => cartItem.ListingID === item.ListingID)) {
      const updatedCart = [...cart, item];
      setCart(updatedCart);
      const success = await updateCart(updatedCart, savedForLater);
      if (!success) {
        setCart(cart);  // Revert cart state on failure
        return false;
      }
      return true;
    } else {
      console.warn("Item already in cart:", item);
      return false;
    }
  };

  const removeFromCart = async (id) => {
    const updatedCart = cart.filter(item => item.ListingID !== id);
    setCart(updatedCart);
    await updateCart(updatedCart, savedForLater);
  };

  const clearCart = async () => {
    setCart([]);
    await updateCart([], savedForLater);
  };

  const saveForLater = async (id) => {
    const itemToSave = cart.find(item => item.ListingID === id);
    if (!itemToSave) {
      console.error("Invalid item: Item not found in cart");
      return false;
    }
    const updatedCart = cart.filter(item => item.ListingID !== id);
    const updatedSavedForLater = [...savedForLater, itemToSave];
    setCart(updatedCart);
    setSavedForLater(updatedSavedForLater);
    const success = await updateCart(updatedCart, updatedSavedForLater);
    if (!success) {
      setCart(cart);  // Revert cart state on failure
      setSavedForLater(savedForLater);  // Revert saved for later state on failure
      return false;
    }
    return true;
  };

  const addToCartFromSaved = async (id) => {
    const itemToAdd = savedForLater.find(item => item.ListingID === id);
    if (!itemToAdd) {
      console.error("Invalid item: Item not found in saved for later");
      return false;
    }
    const updatedSavedForLater = savedForLater.filter(item => item.ListingID !== id);
    const updatedCart = [...cart, itemToAdd];
    setCart(updatedCart);
    setSavedForLater(updatedSavedForLater);
    const success = await updateCart(updatedCart, updatedSavedForLater);
    if (!success) {
      setCart(cart);  // Revert cart state on failure
      setSavedForLater(savedForLater);  // Revert saved for later state on failure
      return false;
    }
    return true;
  };

  const removeFromSaved = async (id) => {
    const updatedSavedForLater = savedForLater.filter(item => item.ListingID !== id);
    setSavedForLater(updatedSavedForLater);
    await updateCart(cart, updatedSavedForLater);
  };

  const isInCart = (id) => cart.some(item => item.ListingID === id);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, saveForLater, savedForLater, addToCartFromSaved, removeFromSaved, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
