import React from 'react';
import { useCart } from '../components/Cart/CartProvider';
import styles from '../styles/Cart.module.css';

const CartPage = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);
  };

  return (
    <div className={styles.cartPage}>
      <h1>Your Shopping Cart</h1>
      <div className={styles.cartItems}>
        {cart.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <img src={item.image} alt={item.name} className={styles.cartItemImage} />
            <div className={styles.cartItemDetails}>
              <p><strong>Name:</strong> {item.name}</p>
              <p><strong>Store:</strong> {item.storeName}</p>
              <p><strong>Feedback:</strong> {item.feedback}%</p>
              <p><strong>Grade:</strong> {item.grade}</p>
              <p><strong>Cert Number:</strong> {item.certNumber}</p>
              <p><strong>Price:</strong> ${Number(item.price || 0).toFixed(2)}</p>
              <p><strong>Shipping:</strong> ${Number(item.shippingPrice || 0).toFixed(2)}</p>
            </div>
            <button onClick={() => removeFromCart(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className={styles.cartSummary}>
        <h2>Summary</h2>
        <p>Number of Packages: {cart.length}</p>
        <p>Number of Items: {cart.reduce((count, item) => count + (item.quantity || 1), 0)}</p>
        <p>Item Total Price: ${calculateTotal()}</p>
        <p>Shipping Price: ${(cart.reduce((total, item) => total + Number(item.shippingPrice || 0), 0)).toFixed(2)}</p>
        <p>Subtotal: ${(cart.reduce((total, item) => total + Number(item.price || 0) + Number(item.shippingPrice || 0), 0)).toFixed(2)}</p>
        <button onClick={clearCart}>Clear Cart</button>
        <button onClick={() => alert('Checkout not implemented yet')}>Checkout</button>
      </div>
    </div>
  );
};

export default CartPage;
