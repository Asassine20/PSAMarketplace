import React, { useState, useEffect } from 'react';
import { useCart } from '../components/Cart/CartProvider';
import useAuth from '../hooks/useAuth';
import styles from '../styles/checkout.module.css';
import Link from 'next/link';
import AddressModal from '../components/Address/AddressModal';
import CardPaymentForm from '../components/CardPaymentForm/CardPaymentForm';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const { userId, email } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState(''); // 'billing' or 'shipping'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(true);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
    saveCard: false,
    cardHolderName: '',
  });
  const [isSameAsBilling, setIsSameAsBilling] = useState(false);
  const router = useRouter();

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

  const calculateTotal = () => cart.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);

  const calculatePackageTotal = (items) => items.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);

  const calculateShippingTotal = () => {
    const shippingPrices = Object.values(groupedCartItems).map(items => Number(items[0]?.shippingPrice || 0));
    return shippingPrices.reduce((total, price) => total + price, 0).toFixed(2);
  };

  const calculateTaxes = (items) => (calculatePackageTotal(items) * 0.1).toFixed(2); // Assuming a 10% tax rate

  const handleOpenModal = (type) => {
    setAddressType(type);
    setShowAddressModal(true);
  };

  const handleCloseModal = (sameAsBilling) => {
    setShowAddressModal(false);
    setIsSameAsBilling(sameAsBilling);
  };

  const formatDateForMySQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    if (!billingAddress || !shippingAddress || !userId || cart.length === 0) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      // Fetch inventory details
      const inventoryResponse = await fetch('/api/cart/inventory-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: cart.map(item => item.ListingID) })
      });

      if (!inventoryResponse.ok) {
        throw new Error('Failed to fetch inventory details');
      }

      const inventoryDetails = await inventoryResponse.json();

      const orders = Object.keys(groupedCartItems).map(storeName => {
        const orderNumber = uuidv4();
        const items = groupedCartItems[storeName];

        return {
          OrderNumber: orderNumber,
          AddressID: shippingAddress.AddressID,
          SalePrice: calculatePackageTotal(items),
          OrderDate: formatDateForMySQL(new Date()),
          BuyerID: userId,
          SellerID: inventoryDetails.find(detail => detail.StoreName === storeName).SellerID,
          ShippingPrice: items[0].shippingPrice,
          email: email,
          items: items.map(item => ({
            OrderNumber: orderNumber,
            ListingID: item.ListingID,
            Quantity: 1, // Assuming quantity is 1 for each item
            Price: item.price,
            CardID: inventoryDetails.find(detail => detail.ListingID === item.ListingID).CardID,
            GradeID: inventoryDetails.find(detail => detail.ListingID === item.ListingID).GradeID
          }))
        };
      });

      // Insert orders
      const orderResponse = await fetch('/api/cart/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create orders');
      }

      // Insert order items and update inventory
      for (const order of orders) {
        const orderItemsResponse = await fetch('/api/cart/order-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: order.items })
        });

        if (!orderItemsResponse.ok) {
          throw new Error('Failed to create order items');
        }

        const inventoryUpdateResponse = await fetch('/api/cart/update-sold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingIds: order.items.map(item => item.ListingID) })
        });

        if (!inventoryUpdateResponse.ok) {
          throw new Error('Failed to update inventory');
        }
      }

      // Clear the cart
      clearCart();

      // Extract order numbers and store names
      const orderNumbers = orders.map(order => order.OrderNumber);
      const storeNames = orders.map(order => order.items[0].storeName);

      // Redirect to the order-confirmed page
      router.push(`/order-confirmed?orderNumbers=${orderNumbers.join(',')}&storeNames=${storeNames.join(',')}`);

    } catch (error) {
      console.error('Error submitting order:', error);
      alert("Failed to submit order. Please try again.");
    }
  };

  if (!mounted) return null; // Prevent rendering on the server to avoid hydration issues

  const formatCardDetails = (item) => {
    const details = [
      item.name,
      item.sport,
      item.cardYear,
      item.cardSet,
      `#${item.number}`,
      item.variant,
      item.color,
      item.numbered ? `Numbered: ${item.numbered}` : '',
      item.team,
      item.auto === 1 ? 'Auto' : '',
      item.colorPattern
    ];

    return details.filter(detail => detail).join(' - ');
  };

  return (
    <div className={styles.checkoutPage}>
      <h1 className={styles.header}>Checkout</h1>
      <div className={styles.checkoutFormWrapper}>
        <div className={styles.checkoutForm}>
          <form onSubmit={handleSubmitOrder}>
            <div className={styles.addressSection}>
              <div>
                <h3>Shipping Address</h3>
                <button type="button" onClick={() => handleOpenModal('shipping')} className={styles.addressButton} style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '4px' }}>Enter Shipping Address</button>
                {shippingAddress && (
                  <p>
                    {shippingAddress.FirstName} {shippingAddress.LastName}<br />
                    {shippingAddress.Street}{shippingAddress.Street2 && <>, {shippingAddress.Street2}</>}<br />
                    {shippingAddress.City}, {shippingAddress.State} {shippingAddress.ZipCode}<br />
                    {shippingAddress.Country}
                  </p>
                )}
              </div>
              <div>
                <h3>Billing Address</h3>
                <button type="button" onClick={() => handleOpenModal('billing')} className={styles.addressButton} style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '4px' }}>Enter Billing Address</button>
                {isSameAsBilling && (
                  <p>Billing address is the same as shipping address</p>
                )}
                {billingAddress && (
                  <p>
                    {billingAddress.FirstName} {billingAddress.LastName}<br />
                    {billingAddress.Street}{billingAddress.Street2 && <>, {billingAddress.Street2}</>}<br />
                    {billingAddress.City}, {billingAddress.State}, {billingAddress.ZipCode}<br />
                    {billingAddress.Country}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.paymentAndSummary}>
              <div className={styles.paymentMethod}>
                <h3>Payment Method</h3>
                <CardPaymentForm
                  cardDetails={cardDetails}
                  setCardDetails={setCardDetails}
                  setSavedCards={setSavedCards}
                  savedCards={savedCards}
                  selectedCard={selectedCard}
                  setSelectedCard={setSelectedCard}
                  showCardForm={showCardForm}
                  setShowCardForm={setShowCardForm}
                />
              </div>

              <div className={styles.summary}>
                <h3>Summary</h3>
                <p><span className={styles.summaryLabel}>Subtotal:</span> <span className={styles.summaryInfo}>${(cart.reduce((total, item) => total + Number(item.price || 0), 0)).toFixed(2)}</span></p>
                <p><span className={styles.summaryLabel}>Shipping:</span> <span className={styles.summaryInfo}>${calculateShippingTotal()}</span></p>
                <p><span className={styles.summaryLabel}>Taxes:</span> <span className={styles.summaryInfo}>${(cart.reduce((total, item) => total + Number(item.price || 0) * 0.1, 0)).toFixed(2)}</span></p>
                <p><span className={styles.summaryLabel}><strong>Total:</strong></span> <span className={styles.summaryInfo}><strong>${calculateTotal()}</strong></span></p>
              </div>
            </div>
            <div className={styles.formActions}>
              <Link href="/cart">
                <button type="button" className={styles.editCartButton}>Edit Cart</button>
              </Link>
              <button type="submit" className={styles.submitOrderButton}>{paymentMethod === 'paypal' ? 'Pay with PayPal' : 'Submit Order'}</button>
            </div>
          </form>
        </div>
      </div>
      <h1 className={styles.header}>Packages</h1>
      <div className={styles.checkoutItemsWrapper}>
        {cart.length === 0 ? (
          <div className={styles.emptyCartMessage}>
            <p>Your cart is empty. Shop now!</p>
            <Link href="/search?cardName=&page=1&inStock=true">
              <button className={styles.continueShoppingButton}>Continue Shopping</button>
            </Link>
          </div>
        ) : (
          <div className={styles.checkoutItems}>
            {Object.keys(groupedCartItems).map((storeName, storeIndex) => (
              <div key={storeName} className={`${styles.package} ${storeIndex === Object.keys(groupedCartItems).length - 1 ? styles.lastPackage : ''}`}>
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
                        <p><strong>{formatCardDetails(item)}</strong></p>
                        <p>Grade: {item.grade}</p>
                        <p>Price: ${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.packageTotal}>
                  <h2>{storeName}<br />Order Summary</h2>
                  <p><span className={styles.packageLabel}>Items Subtotal:</span> <span className={styles.packageInfo}>${calculatePackageTotal(groupedCartItems[storeName])}</span></p>
                  <p><span className={styles.packageLabel}>Shipping Total:</span> <span className={styles.packageInfo}>${(Number(groupedCartItems[storeName][0]?.shippingPrice || 0)).toFixed(2)}</span></p>
                  <p><span className={styles.packageLabel}>Taxes:</span> <span className={styles.packageInfo}>${calculateTaxes(groupedCartItems[storeName])}</span></p>
                  <p><span className={styles.packageLabel}><strong>Total:</strong></span> <span className={styles.packageInfo}><strong>${(parseFloat(calculatePackageTotal(groupedCartItems[storeName])) + parseFloat((Number(groupedCartItems[storeName][0]?.shippingPrice || 0))) + parseFloat(calculateTaxes(groupedCartItems[storeName]))).toFixed(2)}</strong></span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAddressModal && (
        <AddressModal
          addressType={addressType}
          onClose={handleCloseModal}
          setBillingAddress={setBillingAddress}
          setShippingAddress={setShippingAddress}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
