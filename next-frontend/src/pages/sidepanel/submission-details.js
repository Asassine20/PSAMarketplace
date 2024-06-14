import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/SubmissionDetails.module.css';

const cardTypeRegex = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
};

const cardIcons = {
  visa: 'https://1000logos.net/wp-content/uploads/2021/11/VISA-logo-500x281.png',
  mastercard: 'https://imageio.forbes.com/blogs-images/steveolenski/files/2016/07/Mastercard_new_logo-1200x865.jpg?format=jpg&width=1440',
  amex: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1024px-American_Express_logo_%282018%29.svg.png',
  discover: 'https://www.discover.com/company/images/newsroom/media-downloads/DGN_AcceptanceMark.png',
  card: '',
};

const getCardType = (number) => {
  if (cardTypeRegex.visa.test(number)) return 'visa';
  if (cardTypeRegex.mastercard.test(number)) return 'mastercard';
  if (cardTypeRegex.amex.test(number)) return 'amex';
  if (cardTypeRegex.discover.test(number)) return 'discover';
  return 'card';
};

const SubmissionDetails = () => {
  const { accessToken, refreshToken } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
    cardHolderName: '',
  });
  const [cardType, setCardType] = useState('card');

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

  useEffect(() => {
    setCardType(getCardType(cardDetails.cardNumber));
  }, [cardDetails.cardNumber]);

  const handlePayNowClick = () => {
    setShowPayment(!showPayment);
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    alert('Payment submitted');
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
        <button className={`${styles.button} ${styles.optionButton}`} onClick={() => alert('Return for $5 fee per card')}>Return for $5 Fee per Card</button>
        <button className={`${styles.button} ${styles.optionButton}`} onClick={handlePayNowClick}>Pay Now</button>
      </div>
      {showPayment && (
        <div className={styles.paymentContainer}>
          <h2>Payment Details</h2>
          <form onSubmit={handlePaymentSubmit} className={styles.paymentForm}>
            <div className={styles.cardInputWrapper}>
              <input
                type="text"
                placeholder="Card Number"
                value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                className={styles.wideInput}
              />
              {cardType !== 'card' && <img src={cardIcons[cardType]} alt={cardType} className={styles.cardIcon} />}
            </div>
            <div className={styles.expiryWrapper}>
              <select
                value={cardDetails.expMonth}
                onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value })}
                className={styles.expiryInput}
              >
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
              <select
                value={cardDetails.expYear}
                onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value })}
                className={styles.expiryInput}
              >
                <option value="">Exp Year</option>
                {Array.from({ length: 50 }, (_, i) => 2024 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Security Code"
              value={cardDetails.securityCode}
              onChange={(e) => setCardDetails({ ...cardDetails, securityCode: e.target.value })}
              className={styles.securityCodeInput}
            />
            <input
              type="text"
              placeholder="Card Holder Name"
              value={cardDetails.cardHolderName}
              onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })}
              className={styles.wideInput}
            />
            <button type="submit" className={styles.paymentButton}>Submit Payment</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetails;
