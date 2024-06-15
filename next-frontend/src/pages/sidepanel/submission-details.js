import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/SubmissionDetails.module.css';
import CardPaymentForm from '../../components/CardPaymentForm/CardPaymentForm';
import AddressModal from '../../components/Address/AddressModal';

const SubmissionDetails = () => {
  const { accessToken, refreshToken, userId } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState('');
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [isSameAsBilling, setIsSameAsBilling] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
    cardHolderName: '',
  });
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/sidepanel/submissions/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubmission(data);
        } else if (response.status === 401) {
          await refreshToken();
        } else {
          console.error('Failed to fetch submission details');
        }
      } catch (error) {
        console.error('Error fetching submission details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && accessToken) {
      fetchSubmission();
    } else if (!accessToken) {
      refreshToken().then(() => {
        if (id) fetchSubmission();
      });
    }
  }, [accessToken, id, refreshToken]);

  const handlePayNowClick = () => {
    setShowPayment(true);
    setShowReturn(false);
  };

  const handleReturnClick = () => {
    setShowPayment(false);
    setShowReturn(true);
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    alert('Payment submitted');
  };

  const handleOpenModal = (type) => {
    setAddressType(type);
    setShowAddressModal(true);
  };

  const handleCloseModal = (sameAsBilling) => {
    setShowAddressModal(false);
    setIsSameAsBilling(sameAsBilling);
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
        if (isSameAsBilling) {
          setShippingAddress(savedAddress);
        }
      } else {
        setShippingAddress(savedAddress);
      }
      setShowAddressModal(false);
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!submission) {
    return <p>Submission not found.</p>;
  }

  const { ItemList, ItemCount, ServiceLevel, TrackingNumber, Status, PricePerItem, TotalPrice } = submission;

  let items = [];
  if (Array.isArray(ItemList)) {
    items = ItemList;
  } else if (typeof ItemList === 'string') {
    try {
      items = JSON.parse(ItemList);
      if (!Array.isArray(items)) {
        items = [];
      }
    } catch (error) {
      console.error('Error parsing ItemList:', error);
    }
  }

  const formattedPricePerItem = PricePerItem ? parseFloat(PricePerItem).toFixed(2) : 'N/A';
  const formattedTotalPrice = TotalPrice ? parseFloat(TotalPrice).toFixed(2) : 'N/A';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Submission Details</h1>
      <p className={styles.paragraph}><strong className={styles.bold}>Submission Number:</strong> {id}</p>
      <p className={styles.paragraph}><strong className={styles.bold}>Service Level:</strong> {ServiceLevel}</p>
      <p className={styles.paragraph}><strong className={styles.bold}>Item Count:</strong> {ItemCount}</p>
      {items.length > 0 ? (
        <div>
          <h2 className={styles.subtitle}>Item List</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Year</th>
                <th>Set</th>
                <th>Number</th>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.year}</td>
                  <td>{item.set}</td>
                  <td>{item.number}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.paragraph}><strong className={styles.bold}>Declared Value:</strong> ${formattedTotalPrice}</p>
      )}
      <p className={styles.paragraph}><strong className={styles.bold}>Price per Item:</strong> ${formattedPricePerItem}</p>
      <p className={styles.paragraph}><strong className={styles.bold}>Total Price:</strong> ${formattedTotalPrice}</p>
      <div className={styles.options}>
        <button className={`${styles.button} ${styles.optionButton}`} onClick={handleReturnClick}>Return for $5 Fee per Card</button>
        <button className={`${styles.button} ${styles.optionButton}`} onClick={handlePayNowClick}>Pay Now</button>
      </div>
      {(showPayment || showReturn) && (
        <div className={styles.paymentContainer}>
          <div className={styles.addressButtons}>
            <div>
              <h3>Billing Address</h3>
              <button className={styles.button} onClick={() => handleOpenModal('billing')}>Enter Billing Address</button>
              {billingAddress && (
                <p className={styles.address}>
                  {billingAddress.FirstName} {billingAddress.LastName}, {billingAddress.Street} {billingAddress.Street2}, {billingAddress.City}, {billingAddress.State}, {billingAddress.ZipCode}, {billingAddress.Country}
                </p>
              )}
            </div>
            {showReturn && (
              <div>
                <h3>Shipping Address</h3>
                <button className={styles.button} onClick={() => handleOpenModal('shipping')}>Enter Shipping Address</button>
                {shippingAddress && (
                  <p className={styles.address}>
                    {shippingAddress.FirstName} {shippingAddress.LastName}, {shippingAddress.Street} {shippingAddress.Street2}, {shippingAddress.City}, {shippingAddress.State}, {shippingAddress.ZipCode}, {shippingAddress.Country}
                  </p>
                )}
              </div>
            )}
          </div>
          <h2>Payment Details</h2>
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
          <button type="submit" className={styles.paymentButton} onClick={handlePaymentSubmit}>Submit Payment</button>
        </div>
      )}
      {showAddressModal && (
        <AddressModal
          addressType={addressType}
          onClose={handleCloseModal}
          onSubmit={handleAddressSubmit}
          setBillingAddress={setBillingAddress}
          setShippingAddress={setShippingAddress}
        />
      )}
    </div>
  );
};

export default SubmissionDetails;
