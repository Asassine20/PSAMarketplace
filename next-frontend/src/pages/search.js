import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/search.module.css';

const SearchPage = () => {
    const [filteredCards, setFilteredCards] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 24;
    const router = useRouter();
    const { cardName } = router.query;

    useEffect(() => {
        // Reset to the first page on a new search
        setCurrentPage(1);
    }, [cardName]);

    useEffect(() => {
        const fetchFilteredCards = async () => {
            if (!cardName) return;
            const url = `/api/search?cardName=${encodeURIComponent(cardName)}&page=${currentPage}&limit=${cardsPerPage}`;
            const response = await fetch(url);
            const data = await response.json();
            setFilteredCards(data);
        };

        fetchFilteredCards();
    }, [cardName, currentPage]); // Depend on both cardName and currentPage

    // Function to change page
    const paginate = pageNumber => setCurrentPage(pageNumber);

    return (
        <div>
            <div className={styles.mainContent}>
                <section className={styles.cardsSection}>
                    <div className={styles.cardsGrid}>
                        {filteredCards.length > 0 ? (
                            filteredCards.map((card, index) => (
                                <div key={index} className={styles.card}>
                                    <div>{card.CardName}</div>
                                    <div>{card.CardImage}</div>
                                    <div>{card.CardSet}</div>
                                    <div>{card.CardYear}</div>
                                    <div>{card.CardColor || 'N/A'}</div>
                                    <div>{card.CardVariant || 'N/A'}</div>
                                    <div>{card.CardNumber}</div>
                                </div>
                            ))
                        ) : (
                            <div>No results found</div>
                        )}
                    </div>
                    <div className={styles.pagination}>
                        <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>Prev</button>
                        <button onClick={() => paginate(currentPage + 1)}>Next</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SearchPage;
