import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/search.module.css';

const Spinner = () => (
    <div className={styles.spinner}></div>
);

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
        inStock: true
    });
    const [filteredCards, setFilteredCards] = useState([]);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);
    const [isLoadingCards, setIsLoadingCards] = useState(true);
    const router = useRouter();
    const { cardName, page = '1' } = router.query;

    const fetchFilteredCards = async () => {
        setIsLoadingCards(true);
        let query = `/api/search?cardName=${encodeURIComponent(cardName || '')}&page=${page}&showAll=${!filters.inStock}`;

        Object.keys(filters).forEach(filterKey => {
            const filterValue = filters[filterKey];
            if (Array.isArray(filterValue)) {
                filterValue.forEach(value => {
                    query += `&${filterKey}[]=${encodeURIComponent(value)}`;
                });
            }
        });

        const response = await fetch(query);
        const data = await response.json();
        setFilteredCards(data);
        setIsLoadingCards(false);
    };

    // Fetch filters and default card set on component mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoadingFilters(true);
            const response = await fetch('/api/search?fetchFilters=true');
            if (!response.ok) {
                console.error("Failed to fetch filter options");
                setIsLoadingFilters(false);
                return;
            }
            const data = await response.json();
            setFilterOptions(data);
            setIsLoadingFilters(false);
        };

        fetchFilterOptions();
        fetchFilteredCards(); // Fetch cards on initial render
    }, []);

    useEffect(() => {
        fetchFilteredCards(); // Fetch cards when filters change
    }, [cardName, filters, page]);
    useEffect(() => {
        function handleResize() {
            const shouldShowFilter = window.innerWidth > 1201;
            setIsFilterVisible(shouldShowFilter);
        }

        // Call handleResize initially in case the initial width is > 1201
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array ensures this runs once on mount

    const handleFilterChange = (filterKey, value, isChecked) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterKey]: isChecked
                ? [...(Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : []), value]
                : prevFilters[filterKey].filter(v => v !== value),
        }));
    };
    const handleToggleChange = () => {
        setFilters(prevFilters => ({
            ...prevFilters,
            inStock: !prevFilters.inStock
        }));
        // You might want to re-fetch cards based on the new inStock value
        fetchFilteredCards();
    };

    const paginate = pageNumber => {
        router.push(`?cardName=${encodeURIComponent(cardName)}&page=${pageNumber}`);
    };

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };

    const filterTitles = {
        sports: 'Category',
        cardSets: 'Set',
        cardYears: 'Year',
        cardColors: 'Color',
        cardVariants: 'Variant',
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
                            <button onClick={toggleFilterVisibility} className={styles.closeFilterButton}>X</button>
                            {/* Toggle Switch and Label */}
                            <div className={styles.toggleSwitchContainer}>
                                <div className={styles.toggleLabel}>In stock only</div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={filters.inStock}
                                        onChange={handleToggleChange}
                                    />
                                    <span className={`${styles.slider} ${styles.round}`}></span>
                                </label>
                            </div>
                            {/* Filter Options */}
                            {isLoadingFilters ? <div className={styles.centeredContent}><Spinner /></div> : Object.keys(filterOptions).map((filterKey) => (
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
                        </aside>
                    )}

                    <section className={styles.cardsSection}>
                        {isLoadingCards ? <div className={styles.centeredContent}><Spinner /></div> : (
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
                        )}
                        <div className={styles.pagination}>
                            <button disabled={page === '1'} onClick={() => paginate(parseInt(page, 10) - 1)}>Prev</button>
                            <button onClick={() => paginate(parseInt(page, 10) + 1)}>Next</button>
                        </div>
                    </section>
                </div>
            </div>
        </div >
    );
};

export default SearchPage;
