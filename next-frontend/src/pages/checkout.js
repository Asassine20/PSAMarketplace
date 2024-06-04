// src/pages/checkout.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../components/Cart/CartProvider';
import styles from '../styles/checkout.module.css';
import Link from 'next/link';
import AddressModal from '../components/Address/AddressModal';

const CheckoutPage = () => {
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState(''); // 'billing' or 'shipping'

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupItemsByStore = (items) => items.reduce((acc, item) => {
    const key = item.storeName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupedCartItems = groupItemsByStore(cart);

  const calculateTotal = () => cart.reduce((total, item) => total + Number(item.price || 0) + Number(item.shippingPrice || 0), 0).toFixed(2);

  const calculatePackageTotal = (items) => items.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);

  const calculateShippingTotal = (items) => items.reduce((total, item) => total + Number(item.shippingPrice || 0), 0).toFixed(2);

  const calculateTaxes = (items) => (calculatePackageTotal(items) * 0.1).toFixed(2); // Assuming a 10% tax rate

  const handleOpenModal = (type) => {
    setAddressType(type);
    setShowAddressModal(true);
  };

  const handleCloseModal = () => {
    setShowAddressModal(false);
  };

  const handleAddressSubmit = (address, type) => {
    if (type === 'billing') {
      setBillingAddress(address);
    } else {
      setShippingAddress(address);
    }
    setShowAddressModal(false);
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    // Handle order submission here
    console.log("Order submitted", { billingAddress, shippingAddress, paymentMethod, cart });
  };

  if (!mounted) return null; // Prevent rendering on the server to avoid hydration issues

  return (
    <div className={styles.checkoutPage}>
      <h1 className={styles.header}>Checkout</h1>
      <div className={styles.checkoutFormWrapper}>
        <div className={styles.checkoutForm}>
          <form onSubmit={handleSubmitOrder}>
            <div className={styles.addressSection}>
              <div>
                <h2>Shipping Address</h2>
                <button type="button" onClick={() => handleOpenModal('shipping')} className={styles.addressButton}>Enter Shipping Address</button>
                {shippingAddress && <p>{shippingAddress.FirstName} {shippingAddress.LastName}, {shippingAddress.Street}, {shippingAddress.City}, {shippingAddress.State}, {shippingAddress.ZipCode}, {shippingAddress.Country}</p>}
              </div>
              <div>
                <h2>Billing Address</h2>
                <button type="button" onClick={() => handleOpenModal('billing')} className={styles.addressButton}>Enter Billing Address</button>
                {billingAddress && <p>{billingAddress.FirstName} {billingAddress.LastName}, {billingAddress.Street}, {billingAddress.City}, {billingAddress.State}, {billingAddress.ZipCode}, {billingAddress.Country}</p>}
              </div>
            </div>
            <div className={styles.paymentMethod}>
              <h2>Payment Method</h2>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="creditCard">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bitcoin">Bitcoin</option>
              </select>
            </div>
            <button type="submit" className={styles.button}>Submit Order</button>
          </form>
          <Link href="/cart">
            <button className={styles.button}>Edit Cart</button>
          </Link>
        </div>
        <div className={styles.summary}>
          <h2>Summary</h2>
          <p>Total: ${calculateTotal()}</p>
        </div>
      </div>
      <div className={styles.checkoutItemsWrapper}>
        <div className={styles.checkoutItems}>
          {Object.keys(groupedCartItems).map((storeName) => (
            <div key={storeName} className={styles.package}>
              <div className={styles.packageDetails}>
                <h2 className={styles.packageHeader}>
                  {storeName} ({groupedCartItems[storeName][0].feedback}%)
                </h2>
                {groupedCartItems[storeName].map((item, index) => (
                  <div key={`${item.ListingID}-${index}`} className={styles.checkoutItem}>
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
              <div className={styles.packageTotal}>
                <p>Items Subtotal: ${calculatePackageTotal(groupedCartItems[storeName])}</p>
                <p>Shipping Total: ${calculateShippingTotal(groupedCartItems[storeName])}</p>
                <p>Taxes: ${calculateTaxes(groupedCartItems[storeName])}</p>
                <p>Total: ${(parseFloat(calculatePackageTotal(groupedCartItems[storeName])) + parseFloat(calculateShippingTotal(groupedCartItems[storeName])) + parseFloat(calculateTaxes(groupedCartItems[storeName]))).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAddressModal && (
        <AddressModal
          addressType={addressType}
          onClose={handleCloseModal}
          onSubmit={handleAddressSubmit}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
