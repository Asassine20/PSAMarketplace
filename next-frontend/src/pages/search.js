import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/search.module.css';

const Spinner = () => (
    <div className={styles.spinner}></div>
);

const SearchInput = ({ onChange, placeholder }) => (
    <input
      type="text"
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={styles.searchInput}
    />
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
    const [totalCount, setTotalCount] = useState(0);
    const router = useRouter();
    const { cardName, page = '1' } = router.query;
    const updateFiltersInUrl = () => {
        const queryParameters = new URLSearchParams({
            cardName: cardName || '',
            page: page,
            showAll: !filters.inStock ? 'false' : 'true',
        });

        Object.keys(filters).forEach(filterKey => {
            const filterValue = filters[filterKey];
            if (Array.isArray(filterValue) && filterValue.length) {
                filterValue.forEach(value => {
                    queryParameters.append(filterKey, value);
                });
            }
        });

        router.push(`/search?${queryParameters.toString()}`, undefined, { shallow: true });
    };

    useEffect(() => {
        updateFiltersInUrl(); // Update URL when filters change
    }, [filters, page]); // React to changes in filters and pagination
    

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

        console.log(`Fetching filtered cards with query: ${query}`);
        const response = await fetch(query);
        if (!response.ok) {
            console.log('Failed to fetch filtered cards');
            setIsLoadingCards(false);
            return;
        }

        const { cards, totalCount } = await response.json(); // Assuming your API response structure
        console.log('Filtered cards data:', cards);
        setFilteredCards(cards);
        setTotalCount(totalCount); // Set the total count from the response
        setIsLoadingCards(false);
    };

    // Fetch filters and default card set on component mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoadingFilters(true);
            let queryParams = new URLSearchParams({
                fetchFilters: 'true',
                cardName: router.query.cardName || '',
                // Pass showAll based on the inStock state
                showAll: filters.inStock ? 'false' : 'true', // Adjust this line
            });

            const response = await fetch(`/api/search?${queryParams.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setFilterOptions(data);
            } else {
                console.error("Failed to fetch filter options");
            }
            setIsLoadingFilters(false);
        };

        fetchFilterOptions();
    }, [router.query, filters.inStock]); // Add filters.inStock as a dependency

    useEffect(() => {
        console.log('URL query parameters changed:', router.query);
        fetchFilteredCards(); // Adjust this function as needed
    }, [router.query]);

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
        setIsLoadingFilters(true); // Set loading to true when a filter is changed
        setFilters(prevFilters => {
            const updatedFilters = {
                ...prevFilters,
                [filterKey]: isChecked
                    ? [...(Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : []), value]
                    : prevFilters[filterKey].filter(v => v !== value),
            };
            console.log(`Filters updated: ${filterKey}`, updatedFilters[filterKey]);
            return updatedFilters;
        });
        setIsLoadingFilters(false); // Consider setting this to false after the data has been fetched/updated
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
                    <span className={styles.resultCount}>{totalCount} Results</span>
                </div>
                <div className={styles.filterAndCardsContainer}>
                    {isFilterVisible && (
                        <aside className={`${styles.filterSection} ${isFilterVisible ? styles.filterVisible : ''}`}>
                            <button onClick={toggleFilterVisibility} className={styles.closeFilterButton}>X</button>
                            {/* Conditionally render the "Applied Filters" heading */}
                            {Object.values(filters).some(filterArray => Array.isArray(filterArray) && filterArray.length > 0) && (
                                <h4 className={styles.appliedFiltersHeading}>Applied Filters</h4>
                            )}
                            <div className={styles.appliedFilters}>
                                {Object.entries(filters).filter(([key, value]) => Array.isArray(value) && value.length > 0).map(([key, values]) => (
                                    <div key={key}>
                                        {values.map((value, index) => (
                                            <button key={`${key}-${index}`} className={styles.filterBubble} onClick={() => handleFilterChange(key, value, false)} aria-label={`Remove ${value}`}>
                                                <span className={styles.filterX}>X</span> {/* Decorative "X", purely for visual cue */}
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
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
                            {isLoadingFilters ? <div className={styles.centeredContent}><Spinner /></div> :
                                Object.keys(filterOptions).map((filterKey) => (
                                    <div key={filterKey} className={`${styles.filterCategory} ${isLoadingFilters ? styles.disabled : ''}`}>
                                        <h4>{filterTitles[filterKey]}</h4>
                                        {filterOptions[filterKey].map((option, index) => (
                                            <div key={index}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        disabled={isLoadingFilters}
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
                                                <div className={styles.cardListings}>{card.numberOfListings} Listings</div>
                                                <div className={styles.cardMarketPrice}>Market Price: ${card.marketPrice}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div>No results found</div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <div className={styles.pagination}>
                <button disabled={page === '1'} onClick={() => paginate(parseInt(page, 10) - 1)}>Prev</button>
                <button onClick={() => paginate(parseInt(page, 10) + 1)}>Next</button>
            </div>
        </div >
    );
};

export default SearchPage;
