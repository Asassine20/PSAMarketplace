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
      <h1 className={styles.largeText}>Your Shopping Cart</h1>
      <div className={styles.cartItems}>
        {cart.map((item, index) => (
          <div 
            key={item.id} 
            className={styles.cartItem} 
            style={{ borderBottom: index === cart.length - 1 ? 'none' : '1px solid #ccc' }}
          >
            <div className={styles.cartItemDetailsLeft}>
              <p className={styles.largeTextStrong}>{item.storeName}</p>
              <p className={styles.largeText}>{item.feedback}%</p>
              <div className={styles.cartItemImages}>
                <img src={item.imageFront} alt={item.name} className={styles.cartItemImage} />
                <img src={item.imageBack} alt={item.name} className={styles.cartItemImage} />
              </div>
            </div>
            <div className={styles.cartItemDetails}>
              <p className={styles.largeTextStrong}>{item.name} - {item.sport} - #{item.number} - {item.variant} - {item.color}</p>
              <p className={styles.largeText}><strong>Grade:</strong> {item.grade}</p>
              <p className={styles.largeText}><strong>Cert Number:</strong> {item.certNumber}</p>
            </div>
            <div className={styles.cartItemPrices}>
              <p className={styles.largeTextStrong}><strong>${(Number(item.price || 0)).toFixed(2)}</strong></p>
              <p className={styles.largeText}>+ ${(Number(item.shippingPrice || 0)).toFixed(2)}</p>
            </div>
            <button className={styles.removeButton} onClick={() => removeFromCart(item.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className={styles.cartSummary}>
        <h2 className={styles.largeText}>Summary</h2>
        <p className={styles.largeText}>Number of Packages: {cart.length}</p>
        <p className={styles.largeText}>Number of Items: {cart.reduce((count, item) => count + (item.quantity || 1), 0)}</p>
        <p className={styles.largeText}>Item Total Price: ${calculateTotal()}</p>
        <p className={styles.largeText}>Shipping Price: ${(cart.reduce((total, item) => total + Number(item.shippingPrice || 0), 0)).toFixed(2)}</p>
        <p className={styles.largeText}>Subtotal: ${(cart.reduce((total, item) => total + Number(item.price || 0) + Number(item.shippingPrice || 0), 0)).toFixed(2)}</p>
        <button className={styles.largeText} onClick={clearCart}>Clear Cart</button>
        <button className={styles.largeText} onClick={() => alert('Checkout not implemented yet')}>Checkout</button>
      </div>
    </div>
  );
};

export default CartPage;
