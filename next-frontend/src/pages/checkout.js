import React, { useState, useEffect } from 'react';
import { useCart } from '../components/Cart/CartProvider';
import styles from '../styles/checkout.module.css';
import Link from 'next/link';

const CheckoutPage = () => {
  const { cart, savedForLater } = useCart();
  const [mounted, setMounted] = useState(false);
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateTotal = () => cart.reduce((total, item) => total + Number(item.price || 0) + Number(item.shippingPrice || 0), 0).toFixed(2);

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    // Handle order submission here
    console.log("Order submitted", { billingAddress, shippingAddress, paymentMethod, cart });
  };

  if (!mounted) return null; // Prevent rendering on the server to avoid hydration issues

  return (
    <div className={styles.checkoutPage}>
      <h1 className={styles.header}>Checkout</h1>
      <div className={styles.checkoutItemsWrapper}>
        <div className={styles.checkoutItems}>
          {cart.map((item, index) => (
            <div key={item.ListingID} className={styles.checkoutItem}>
              <div className={styles.itemImage}>
                <img src={item.imageFront} alt={item.name} />
              </div>
              <div className={styles.itemDetails}>
                <p>{item.name} - {item.sport} - {item.cardSet} #{item.number}</p>
                <p>Grade: {item.grade}</p>
                <p>Price: ${item.price}</p>
                <p>Shipping: ${item.shippingPrice}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.checkoutForm}>
          <form onSubmit={handleSubmitOrder}>
            <h2>Billing Address</h2>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
            />
            <h2>Shipping Address</h2>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
            <h2>Payment Method</h2>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="creditCard">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="bitcoin">Bitcoin</option>
            </select>
            <div className={styles.summary}>
              <h2>Summary</h2>
              <p>Total: ${calculateTotal()}</p>
            </div>
            <button type="submit" className={styles.button}>Submit Order</button>
          </form>
          <Link href="/cart">
            <button className={styles.button}>Edit Cart</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
