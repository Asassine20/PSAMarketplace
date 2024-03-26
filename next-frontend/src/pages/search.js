import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/search.module.css';

const SearchPage = () => {
    // State for filters
    const [sport, setSport] = useState('');
    const [cardSet, setCardSet] = useState('');
    const [cardYear, setCardYear] = useState('');
    const [cardColor, setCardColor] = useState('');
    const [cardVariant, setCardVariant] = useState('');
    const [inStock, setInStock] = useState(false);

    const [filteredCards, setFilteredCards] = useState([]);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const router = useRouter();
    const { cardName, page = '1' } = router.query;
    const cardsPerPage = 24;

    useEffect(() => {
        const fetchFilteredCards = async () => {
            if (!cardName) return;
            const url = `/api/search?cardName=${encodeURIComponent(cardName)}&page=${page}&limit=${cardsPerPage}`;
            const response = await fetch(url);
            const data = await response.json();
            setFilteredCards(data);
        };

        fetchFilteredCards();
    }, [cardName, page]);

    const paginate = pageNumber => {
        router.push(`?cardName=${encodeURIComponent(cardName)}&page=${pageNumber}`);
    };

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };
    const handleFilterChange = () => {
        // Construct the query string with new filter parameters
        let query = `?page=1`; // Reset to page 1 whenever filters change
        if (sport) query += `&sport=${encodeURIComponent(sport)}`;
        if (cardSet) query += `&cardSet=${encodeURIComponent(cardSet)}`;
        if (cardYear) query += `&cardYear=${encodeURIComponent(cardYear)}`;
        if (cardColor) query += `&cardColor=${encodeURIComponent(cardColor)}`;
        if (cardVariant) query += `&cardVariant=${encodeURIComponent(cardVariant)}`;
        if (inStock) query += `&inStock=${inStock}`;
    
        // Assuming you have a function to fetch cards based on the query
        fetchFilteredCards(query);
    };
    
    return (
        <div>
            <div className={styles.mainContent}>
                <div className={styles.controlSection}>
                    <button onClick={toggleFilterVisibility} className={styles.filterToggle}>Filter</button>
                    <select className={styles.sortDropdown}>
                        <option value="name">Best Selling</option>
                        <option value="year">A-Z</option>
                        <option value="sport">Price: High - Low</option>
                        <option value="sport">Price: Low - High</option>
                    </select>
                    <span className={styles.resultCount}>{filteredCards.length} Results</span>
                </div>
                <div className={styles.filterAndCardsContainer}>
                    {isFilterVisible && (
                        <aside className={`${styles.filterSection} ${isFilterVisible ? styles.filterVisible : ''}`}>
                            <button className={styles.closeFilterButton} onClick={toggleFilterVisibility}>X</button>
                            <input
                                type="text"
                                placeholder="Filter by sport..."
                                className={styles.filterInput}
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by card set..."
                                className={styles.filterInput}
                                value={cardSet}
                                onChange={(e) => setCardSet(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by card year..."
                                className={styles.filterInput}
                                value={cardYear}
                                onChange={(e) => setCardYear(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by card color..."
                                className={styles.filterInput}
                                value={cardColor}
                                onChange={(e) => setCardColor(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Filter by card variant..."
                                className={styles.filterInput}
                                value={cardVariant}
                                onChange={(e) => setCardVariant(e.target.value)}
                            />
                            {/* Example of a toggle for 'in stock' - you might need additional logic to handle this */}
                            <div>
                                <label>
                                    In Stock:
                                    <input
                                        type="checkbox"
                                        checked={inStock}
                                        onChange={() => setInStock(!inStock)} // Assuming you add a useState for inStock as a boolean
                                    />
                                </label>
                            </div>
                            <button onClick={handleFilterChange} className={styles.filterApplyButton}>Apply Filters</button>
                        </aside>
                    )}
                    <section className={styles.cardsSection}>
                        <div className={styles.cardsGrid}>
                            {filteredCards.length > 0 ? (
                                filteredCards.map((card, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardImageWrapper}>
                                            <Image
                                                src={card.CardImage}
                                                alt={card.CardName}
                                                width={180}
                                                height={270}
                                                layout="intrinsic"
                                                className={styles.cardImage}
                                            />
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.cardSport}>{card.Sport}</div>
                                            <div className={styles.cardSet}>{card.CardSet}</div>
                                            <div className={styles.cardNumber}># {card.CardNumber}</div>
                                            <div className={styles.cardVariant}>{card.CardVariant || ''}</div>
                                            <div className={styles.cardColor}>{card.CardColor || ''}</div>
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
        </div>
    );
};

export default SearchPage;
