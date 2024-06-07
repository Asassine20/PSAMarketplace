import React, { useState, useEffect } from 'react';
import { useCart } from '../components/Cart/CartProvider';
import useAuth from '../hooks/useAuth';
import styles from '../styles/checkout.module.css';
import Link from 'next/link';
import AddressModal from '../components/Address/AddressModal';

const CheckoutPage = () => {
    const { cart } = useCart();
    const { userId } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [billingAddress, setBillingAddress] = useState(null);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('creditCard');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressType, setAddressType] = useState(''); // 'billing' or 'shipping'
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expMonth: '',
        expYear: '',
        securityCode: '',
        saveCard: false,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!userId) return;
            try {
                const response = await fetch(`/api/address?userId=${userId}`);
                const data = await response.json();
                const billing = data.find(address => address.IsBilling);
                const shipping = data.find(address => !address.IsBilling);
                if (billing) setBillingAddress(billing);
                if (shipping) setShippingAddress(shipping);
            } catch (error) {
                console.error('Failed to fetch addresses:', error);
            }
        };
        fetchAddresses();
    }, [userId]);

    const groupItemsByStore = (items) => items.reduce((acc, item) => {
        const key = item.storeName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const groupedCartItems = groupItemsByStore(cart);

    const calculateTotal = () => {
        const itemsTotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);
        const shippingTotal = Object.values(groupedCartItems).reduce((total, items) => total + (Number(items[0]?.shippingPrice) || 0), 0);
        const taxes = itemsTotal * 0.1; // Assuming a 10% tax rate
        return (itemsTotal + shippingTotal + taxes).toFixed(2);
    };

    const calculatePackageTotal = (items) => items.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);

    const calculateShippingTotal = (items) => {
        return Number(items[0]?.shippingPrice || 0);
    };

    const calculateTaxes = (items) => (calculatePackageTotal(items) * 0.1).toFixed(2); // Assuming a 10% tax rate

    const handleOpenModal = (type) => {
        setAddressType(type);
        setShowAddressModal(true);
    };

    const handleCloseModal = () => {
        setShowAddressModal(false);
    };

    const handleAddressSubmit = async (address, type) => {
        try {
            const response = await fetch('/api/address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...address, IsBilling: type === 'billing', userId }),
            });
            if (!response.ok) throw new Error('Failed to save address');
            const savedAddress = await response.json();
            if (type === 'billing') {
                setBillingAddress(savedAddress);
            } else {
                setShippingAddress(savedAddress);
            }
            setShowAddressModal(false);
        } catch (error) {
            console.error('Failed to save address:', error);
        }
    };

    const handleSubmitOrder = async (event) => {
        event.preventDefault();
        // Handle order submission here
        console.log("Order submitted", { billingAddress, shippingAddress, paymentMethod, cart, cardDetails });
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
                                <h3>Shipping Address</h3>
                                <button type="button" onClick={() => handleOpenModal('shipping')} className={styles.addressButton} style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '4px' }}>Enter Shipping Address</button>
                                {shippingAddress && (
                                    <p>
                                        {shippingAddress.FirstName} {shippingAddress.LastName}<br />
                                        {shippingAddress.Street}{shippingAddress.Street2 && <>, {shippingAddress.Street2}</>}<br />
                                        {shippingAddress.City}, {shippingAddress.State}, {shippingAddress.ZipCode}<br />
                                        {shippingAddress.Country}
                                    </p>
                                )}
                            </div>
                            <div>
                                <h3>Billing Address</h3>
                                <button type="button" onClick={() => handleOpenModal('billing')} className={styles.addressButton} style={{ border: '2px solid #ccc', padding: '10px', borderRadius: '4px' }}>Enter Billing Address</button>
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
                                <div className={styles.paymentOption}>
                                    <input type="radio" id="creditCard" name="paymentMethod" value="creditCard" checked={paymentMethod === 'creditCard'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <label htmlFor="creditCard">Credit / Debit Card <img src="https://cart.tcgplayer.com/content/images/mc-new.png" alt="MC" className={styles.cardIcon} /><img src="https://cart.tcgplayer.com/content/images/visa-new.png" alt="Visa" className={styles.cardIcon} /></label>
                                </div>
                                {paymentMethod === 'creditCard' && (
                                    <div className={styles.cardDetails}>
                                        <input type="text" placeholder="Card Number" value={cardDetails.cardNumber} onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <select value={cardDetails.expMonth} onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value })}>
                                                <option value="">Exp Month</option>
                                                <option value="01">1 - January</option>
                                                <option value="02">2 - February</option>
                                                <option value="03">3 - March</option>
                                                <option value="04">4 - April</option>
                                                <option value="05">5 - May</option>
                                                <option value="06">6 - June</option>
                                                <option value="07">7 - July</option>
                                                <option value="08">8 - August</option>
                                                <option value="09">9 - September</option>
                                                <option value="10">10 - October</option>
                                                <option value="11">11 - November</option>
                                                <option value="12">12 - December</option>
                                            </select>
                                            <select value={cardDetails.expYear} onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value })}>
                                                <option value="">Exp Year</option>
                                                {Array.from({ length: 50 }, (_, i) => 2024 + i).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input type="text" placeholder="Security Code" value={cardDetails.securityCode} onChange={(e) => setCardDetails({ ...cardDetails, securityCode: e.target.value })} className={styles.securityCode} />
                                        <div className={styles.saveCardOption}>
                                            <input type="checkbox" id="saveCard" checked={cardDetails.saveCard} onChange={(e) => setCardDetails({ ...cardDetails, saveCard: e.target.checked })} />
                                            <label htmlFor="saveCard">Save this card for future purchases</label>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.paymentOption}>
                                    <input type="radio" id="paypal" name="paymentMethod" value="paypal" checked={paymentMethod === 'paypal'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <label htmlFor="paypal">PayPal <img src="https://cart.tcgplayer.com/content/images/new-paypal.png" alt="PayPal" className={styles.paypalIcon} /></label>
                                </div>
                            </div>
                            <div className={styles.summary}>
                                <h3>Summary</h3>
                                <p><span className={styles.summaryLabel}>Subtotal:</span> <span className={styles.summaryInfo}>${(cart.reduce((total, item) => total + Number(item.price || 0), 0)).toFixed(2)}</span></p>
                                <p><span className={styles.summaryLabel}>Shipping:</span> <span className={styles.summaryInfo}>${Object.values(groupedCartItems).reduce((total, items) => total + (Number(items[0]?.shippingPrice) || 0), 0).toFixed(2)}</span></p>
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
            <div className={styles.checkoutItemsWrapper}>
                {cart.length === 0 ? (
                    <div className={styles.emptyCartMessage}>
                        <p>Your cart is empty. Shop now!</p>
                        <Link href="/search?cardName=&page=1&showAll=true">
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
                                                <p><strong>{item.name} - {item.sport} - {item.cardSet} #{item.number}</strong></p>
                                                <p>Grade: {item.grade}</p>
                                                <p>Price: ${item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.packageTotal}>
                                    <h2>{storeName}<br />Order Summary</h2>
                                    <p><span className={styles.packageLabel}>Items Subtotal:</span> <span className={styles.packageInfo}>${calculatePackageTotal(groupedCartItems[storeName])}</span></p>
                                    <p><span className={styles.packageLabel}>Shipping Total:</span> <span className={styles.packageInfo}>${(Number(groupedCartItems[storeName][0]?.shippingPrice) || 0).toFixed(2)}</span></p>
                                    <p><span className={styles.packageLabel}>Taxes:</span> <span className={styles.packageInfo}>${calculateTaxes(groupedCartItems[storeName])}</span></p>
                                    <p><span className={styles.packageLabel}><strong>Total:</strong></span> <span className={styles.packageInfo}><strong>${(parseFloat(calculatePackageTotal(groupedCartItems[storeName])) + parseFloat(Number(groupedCartItems[storeName][0]?.shippingPrice) || 0) + parseFloat(calculateTaxes(groupedCartItems[storeName]))).toFixed(2)}</strong></span></p>
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
                    onSubmit={handleAddressSubmit}
                />
            )}
        </div>
    );
};

export default CheckoutPage;
