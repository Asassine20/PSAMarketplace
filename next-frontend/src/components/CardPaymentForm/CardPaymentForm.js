import React, { useState, useEffect } from 'react';
import styles from './CardPaymentForm.module.css';
import useAuth from '../../hooks/useAuth';

const cardTypeRegex = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
};

const cardIcons = {
  visa: 'https://1000logos.net/wp-content/uploads/2021/11/VISA-logo-500x281.png',
  mastercard: 'https://imageio.forbes.com/blogs-images/steveolenski/files/2016/07/Mastercard_new_logo-1200x865.jpg?format=jpg&width=1440',
  amex: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1024px-American_Express_logo_%282018%29.svg.png',
  discover: 'https://www.discover.com/company/images/newsroom/media-downloads/DGN_AcceptanceMark.png',
};

const getCardType = (number) => {
  if (cardTypeRegex.visa.test(number)) return 'visa';
  if (cardTypeRegex.mastercard.test(number)) return 'mastercard';
  if (cardTypeRegex.amex.test(number)) return 'amex';
  if (cardTypeRegex.discover.test(number)) return 'discover';
  return 'Card';
};

const CardPaymentForm = ({ cardDetails, setCardDetails, setSavedCards, savedCards, selectedCard, setSelectedCard, showCardForm, setShowCardForm }) => {
  const [cardType, setCardType] = useState('Card');
  const { userId } = useAuth();

  useEffect(() => {
    setCardType(getCardType(cardDetails.cardNumber));
  }, [cardDetails.cardNumber]);

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/paymentInfo?userId=${userId}`);
        const data = await response.json();
        setSavedCards(data);
      } catch (error) {
        console.error('Failed to fetch saved cards:', error);
      }
    };
    fetchSavedCards();
  }, [userId, setSavedCards]);

  const handleCardSelection = (card) => {
    setSelectedCard(card);
    setShowCardForm(false);
  };

  const handleNewCard = () => {
    setSelectedCard(null);
    setShowCardForm(true);
  };

  return (
    <div className={styles.cardPaymentForm}>
      {savedCards.length > 0 && (
        <div className={styles.savedCards}>
          {savedCards.map((card) => (
            <label key={card.PaymentID} className={styles.cardOption}>
              <input type="radio" name="savedCard" value={card.PaymentID} onChange={() => handleCardSelection(card)} />
              {getCardType(card.CardNumber) !== 'Card' && (
                <img src={cardIcons[getCardType(card.CardNumber)]} alt={getCardType(card.CardNumber)} className={styles.savedCardIcon} />
              )}
              <span className={styles.cardType}>{getCardType(card.CardNumber)}</span> ending in {card.CardNumber.slice(-4)}
            </label>
          ))}
          <label className={styles.cardOption}>
            <input type="radio" name="savedCard" value="new" onChange={handleNewCard} />
            Add a new card
          </label>
        </div>
      )}
      {showCardForm && (
        <div className={styles.cardDetails}>
          <div className={styles.cardInputWrapper}>
            <input type="text" placeholder="Card Number" value={cardDetails.cardNumber} onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })} className={styles.wideInput} />
            {cardType !== 'Card' && <img src={cardIcons[cardType]} alt={cardType} className={styles.cardIcon} />}
          </div>
          <div className={styles.expiryWrapper}>
            <select value={cardDetails.expMonth} onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value })} className={styles.expiryInput}>
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
            <select value={cardDetails.expYear} onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value })} className={styles.expiryInput}>
              <option value="">Exp Year</option>
              {Array.from({ length: 50 }, (_, i) => 2024 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <input type="text" placeholder="Security Code" value={cardDetails.securityCode} onChange={(e) => setCardDetails({ ...cardDetails, securityCode: e.target.value })} className={styles.securityCodeInput} />
          <input type="text" placeholder="Card Holder Name" value={cardDetails.cardHolderName} onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })} className={styles.wideInput} />
          <div className={styles.saveCardOption}>
            <input type="checkbox" id="saveCard" checked={cardDetails.saveCard} onChange={(e) => setCardDetails({ ...cardDetails, saveCard: e.target.checked })} />
            <label htmlFor="saveCard">Save this card for future purchases</label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPaymentForm;
export { getCardType, cardIcons };
