import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/search.module.css'; // Ensure the correct path to your CSS module

const SearchPage = () => {
  const [filteredCards, setFilteredCards] = useState([]);
  const router = useRouter();
  const { cardName } = router.query;

  useEffect(() => {
    const fetchFilteredCards = async () => {
      if (!cardName) return;
      const response = await fetch(`/api/search?cardName=${encodeURIComponent(cardName)}`);
      const data = await response.json();
      setFilteredCards(data);
    };

    fetchFilteredCards();
  }, [cardName]);

  return (
    <div>
      <div className={styles.mainContent}>
        <section className={styles.cardsSection}>
          <div className={styles.cardsGrid}>
            {filteredCards.length > 0 ? (
              filteredCards.map((card, index) => (
                <div key={index} className={styles.card}>
                  <div>{card.CardName}</div>
                  <div>{card.CardSet}</div>
                  <div>{card.CardYear}</div>
                  <div>{card.CardColor}</div>
                  <div>{card.CardVariant}</div>
                  <div>{card.CardNumber}</div>
                </div>
              ))
            ) : (
              <div>No results found</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
