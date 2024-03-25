import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image'; // Import Image from next/image
import styles from '../styles/search.module.css'; // Adjust the import path as necessary

const SearchPage = () => {
    const [filteredCards, setFilteredCards] = useState([]);
    const router = useRouter();
    const { cardName, page = '1' } = router.query; // Use page from the query params, default to 1
    const cardsPerPage = 24;

    useEffect(() => {
        const fetchFilteredCards = async () => {
            if (!cardName) return;
            // Use the page from router.query for pagination
            const url = `/api/search?cardName=${encodeURIComponent(cardName)}&page=${page}&limit=${cardsPerPage}`;
            const response = await fetch(url);
            const data = await response.json();
            setFilteredCards(data);
        };

        fetchFilteredCards();
    }, [cardName, page]); // Depend on both cardName and page from query

    // Function to change page, updating the URL
    const paginate = pageNumber => {
        router.push(`?cardName=${encodeURIComponent(cardName)}&page=${pageNumber}`);
    };

    return (
        <div>
            <div className={styles.mainContent}>
                <section className={styles.cardsSection}>
                    <div className={styles.cardsGrid}>
                        {filteredCards.length > 0 ? (
                            filteredCards.map((card, index) => (
                                <div key={index} className={styles.card}>
                                    <div className={styles.cardImageWrapper}>
                                        <Image
                                            src={card.CardImage}
                                            alt={card.CardName}
                                            width={180} // Adjusted width
                                            height={270} // Adjusted height
                                            layout="intrinsic"
                                            className={styles.cardImage}
                                        />
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.cardSport}>{card.Sport}</div>
                                        <div className={styles.cardSetNumber}>{card.CardSet} - {card.CardNumber}</div>
                                        <div className={styles.cardVariantColor}>{card.CardVariant || 'N/A'} - {card.CardColor || 'N/A'}</div>
                                        <div className={styles.cardName}>{card.CardName}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>No results found</div>
                        )}
                    </div>
                    <div className={styles.pagination}>
                        <button disabled={page === '1'} onClick={() => paginate(parseInt(page, 10) - 1)}>Prev</button>
                        <button onClick={() => paginate(parseInt(page, 10) + 1)}>Next</button>
                    </div>
                </section>
            </div>
        </div>

    );
};

export default SearchPage;


