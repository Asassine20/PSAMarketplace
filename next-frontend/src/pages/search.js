import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/search.module.css';

const SearchPage = () => {
    const [filterOptions, setFilterOptions] = useState({
        sports: [],
        cardSets: [],
        cardYears: [],
        cardColors: [],
        cardVariants: []
    });
    const [filters, setFilters] = useState({
        sport: [],
        cardSet: [],
        cardYear: [],
        cardColor: [],
        cardVariant: [],
        inStock: false
    });
    const [filteredCards, setFilteredCards] = useState([]);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const router = useRouter();
    const { cardName, page = '1' } = router.query;

    const fetchFilteredCards = async () => {
        if (!cardName) return;
        let query = `/api/search?cardName=${encodeURIComponent(cardName)}&page=${page}`;
        console.log('Filters before making request:', JSON.stringify(filters));
        Object.keys(filters).forEach(filterKey => {
            const filterValue = filters[filterKey];
            if (Array.isArray(filterValue)) {
                filterValue.forEach(value => {
                    query += `&${filterKey}[]=${encodeURIComponent(value)}`;
                });
            } else {
                if (filterKey === 'inStock') {
                    query += `&inStock=${filterValue}`;
                }
            }
        });

        console.log('Query:', query);
        const response = await fetch(query);
        const data = await response.json();
        setFilteredCards(data);
    };

    useEffect(() => {
        const fetchFilterOptions = async () => {
            // Include the current search parameters in the filter options request
            const searchParams = new URLSearchParams({ fetchFilters: 'true', cardName });
            const response = await fetch(`/api/search?${searchParams}`);
            if (!response.ok) {
                console.error("Failed to fetch filter options");
                return;
            }
            const data = await response.json();
            setFilterOptions({
                sports: data.sports || [],
                cardSets: data.cardSets || [],
                cardYears: data.cardYears || [],
                cardColors: data.cardColors || [],
                cardVariants: data.cardVariants || []
            });
        };
    
        if (cardName) {
            fetchFilterOptions();
        }
    }, [cardName]);

    useEffect(() => {
        fetchFilteredCards();
    }, [cardName, page, filters]);

    const handleFilterChange = (filterKey, value, isChecked) => {
        setFilters(prevFilters => {
            // Ensure prevFilters[filterKey] is always an array
            const currentFilterValues = Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : [];
            
            const updatedFilter = isChecked
                ? [...currentFilterValues, value]
                : currentFilterValues.filter(v => v !== value);
        
            console.log(`Updated ${filterKey} filters:`, updatedFilter);
            return { ...prevFilters, [filterKey]: updatedFilter };
        });        
    };

    const paginate = pageNumber => {
        router.push(`?cardName=${encodeURIComponent(cardName)}&page=${pageNumber}`);
    };

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };

    const filterTitles = {
        sports: 'Sports',
        cardSets: 'Card Sets',
        cardYears: 'Card Years',
        cardColors: 'Card Colors',
        cardVariants: 'Card Variants',
    };

    return (
        <div>
            <div className={styles.mainContent}>
                {/* Control Section remains unchanged */}
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
                            <button onClick={toggleFilterVisibility} className={styles.closeFilterButton}>X</button>
                            {Object.keys(filterOptions).map((filterKey) => (
                                <div key={filterKey} className={styles.filterCategory}>
                                    <h4>{filterTitles[filterKey]}</h4>
                                    {filterOptions[filterKey].map((option, index) => (
                                        <div key={index}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={Array.isArray(filters[filterKey]) && filters[filterKey].includes(option)}
                                                    onChange={(e) => handleFilterChange(filterKey, option, e.target.checked)}
                                                />
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <button onClick={fetchFilteredCards} className={styles.filterApplyButton}>Apply Filters</button>
                        </aside>

                    )}
                    <section className={styles.cardsSection}>
                        <div className={styles.cardsGrid}>
                            {filteredCards.length > 0 ? (
                                filteredCards.map((card, index) => (
                                    <div key={index} className={styles.card}>
                                        <div className={styles.cardImageWrapper}>
                                            <Image src={card.CardImage} alt={card.CardName} width={180} height={270} layout="intrinsic" className={styles.cardImage} />
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
