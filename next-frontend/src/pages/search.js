import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown } from 'react-icons/fa';
import { PiSmileySadBold } from 'react-icons/pi';
import { MdKeyboardArrowDown } from 'react-icons/md'; // Add this import for the down arrow
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
    const router = useRouter();
    const { query } = router;

    const initializeFilters = (query) => ({
        sports: query.sports ? (Array.isArray(query.sports) ? query.sports : [query.sports]) : [],
        cardSets: query.cardSets ? (Array.isArray(query.cardSets) ? query.cardSets : [query.cardSets]) : [],
        cardYears: query.cardYears ? (Array.isArray(query.cardYears) ? query.cardYears : [query.cardYears]) : [],
        cardColors: query.cardColors ? (Array.isArray(query.cardColors) ? query.cardColors : [query.cardColors]) : [],
        cardVariants: query.cardVariants ? (Array.isArray(query.cardVariants) ? query.cardVariants : [query.cardVariants]) : [],
        inStock: query.inStock === 'true',
        cardName: query.cardName || '',
        page: query.page || '1',
        sortBy: query.sortBy || '',
    });

    const [filters, setFilters] = useState(initializeFilters(query));

    const [filterOptions, setFilterOptions] = useState({
        sports: [],
        cardSets: [],
        cardYears: [],
        cardColors: [],
        cardVariants: [],
    });
    const [filteredCards, setFilteredCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [filterSearchTerms, setFilterSearchTerms] = useState({
        sports: '',
        cardSets: '',
        cardYears: '',
        cardColors: '',
        cardVariants: '',
    });
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);
    const [isLoadingCardSets, setIsLoadingCardSets] = useState(false);
    const [delayedSearch, setDelayedSearch] = useState(null);

    const [filterPages, setFilterPages] = useState({
        cardSets: 1,
    }); // New state for filter pagination
    const filterLimit = 50; // Limit for each filter fetch

    const resultsPerPage = 10; // Assume a constant for results per page (can be adjusted as needed)

    const updateFiltersInUrl = (updatedFilters) => {
        console.log('Updating filters in URL:', updatedFilters);
        const queryParameters = new URLSearchParams({
            cardName: updatedFilters.cardName || '',
            page: updatedFilters.page,
            inStock: updatedFilters.inStock ? 'true' : 'false',
            sortBy: updatedFilters.sortBy || '',
        });

        Object.keys(updatedFilters).forEach((filterKey) => {
            const filterValue = updatedFilters[filterKey];
            if (Array.isArray(filterValue) && filterValue.length) {
                filterValue.forEach((value) => {
                    queryParameters.append(filterKey, value);
                });
            }
        });

        console.log('Updated query parameters:', queryParameters.toString());
        router.push(`/search?${queryParameters.toString()}`, undefined, { shallow: true });
    };

    const fetchFilteredCards = async (filtersToApply) => {
        console.log('Fetching filtered cards with filters:', filtersToApply);
        setIsLoadingCards(true);
        let queryStr = `/api/search?cardName=${encodeURIComponent(filtersToApply.cardName || '')}&page=${filtersToApply.page}&inStock=${filtersToApply.inStock}`;

        Object.keys(filtersToApply).forEach((filterKey) => {
            const filterValue = filtersToApply[filterKey];
            if (Array.isArray(filterValue)) {
                filterValue.forEach((value) => {
                    queryStr += `&${filterKey}[]=${encodeURIComponent(value)}`;
                });
            }
        });

        if (filtersToApply.sortBy) {
            queryStr += `&sortBy=${encodeURIComponent(filtersToApply.sortBy)}`;
        }

        console.log('Fetching with query:', queryStr);
        const response = await fetch(queryStr);
        if (!response.ok) {
            setIsLoadingCards(false);
            return;
        }

        const { cards, totalCount } = await response.json();
        setFilteredCards(cards);
        setTotalCount(totalCount);
        setIsLoadingCards(false);
        console.log('Fetched cards:', cards);
    };

    const fetchFilterOptions = async (filterType, filtersToApply, page = 1) => {
        console.log(`Fetching ${filterType} filter options with filters:`, filtersToApply);
        if (filterType === 'cardSets') setIsLoadingCardSets(true);
        else setIsLoadingFilters(true);
        let queryParams = new URLSearchParams({
            fetchFilters: 'true',
            cardName: filtersToApply.cardName || '',
            inStock: filtersToApply.inStock ? 'true' : 'false',
            filterPage: page,
            filterLimit: filterLimit,
            filterType: filterType
        });

        Object.keys(filtersToApply).forEach((filterKey) => {
            const filterValue = filtersToApply[filterKey];
            if (Array.isArray(filterValue) && filterValue.length > 0) {
                filterValue.forEach((value) => {
                    queryParams.append(`${filterKey}[]`, value);
                });
            }
        });

        console.log('Fetching filter options with query:', queryParams.toString());
        const response = await fetch(`/api/search?${queryParams.toString()}`);
        if (response.ok) {
            const data = await response.json();
            setFilterOptions(prevOptions => ({
                ...prevOptions,
                [filterType]: page === 1 ? data[filterType] : [...new Set([...prevOptions[filterType], ...data[filterType]])] // Append new data for the specific filter without duplicates
            }));
            console.log('Fetched filter options:', data);
        } else {
            console.error('Failed to fetch filter options');
        }
        if (filterType === 'cardSets') setIsLoadingCardSets(false);
        else setIsLoadingFilters(false);
    };

    // Fetch filters and cards on initial load
    useEffect(() => {
        console.log('useEffect - initial fetch filtered cards and filter options');
        fetchFilteredCards(initializeFilters(query));
        fetchFilterOptions('cardSets', initializeFilters(query), 1); // Load initial cardSets
        fetchFilterOptions('sports', initializeFilters(query));
        fetchFilterOptions('cardYears', initializeFilters(query));
        fetchFilterOptions('cardColors', initializeFilters(query));
        fetchFilterOptions('cardVariants', initializeFilters(query));
    }, []);

    // Update filters and cards when query changes
    useEffect(() => {
        if (Object.keys(query).length > 0) {
            console.log('useEffect - router query change:', query);
            const updatedFilters = initializeFilters(query);

            console.log('Updated filters from query:', updatedFilters);
            setFilters(updatedFilters);
            fetchFilteredCards(updatedFilters);
            fetchFilterOptions('cardSets', updatedFilters, 1); // Reset cardSets to initial load
            fetchFilterOptions('sports', updatedFilters);
            fetchFilterOptions('cardYears', updatedFilters);
            fetchFilterOptions('cardColors', updatedFilters);
            fetchFilterOptions('cardVariants', updatedFilters);
        }
    }, [query]);

    const handleFilterSearchChange = (filterKey, searchTerm) => {
        if (delayedSearch) {
            clearTimeout(delayedSearch);
        }

        const newTimeout = setTimeout(() => {
            setFilterSearchTerms((prevTerms) => ({
                ...prevTerms,
                [filterKey]: searchTerm,
            }));
        }, 500);

        setDelayedSearch(newTimeout);
    };

    const handleFilterChange = (filterKey, value, isChecked) => {
        console.log(`handleFilterChange - filterKey: ${filterKey}, value: ${value}, isChecked: ${isChecked}`);
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                [filterKey]: isChecked
                    ? [...(Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : []), value]
                    : prevFilters[filterKey].filter((v) => v !== value),
            };
            console.log('Updated filters:', updatedFilters);
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const handleToggleChange = () => {
        console.log('handleToggleChange');
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                inStock: !prevFilters.inStock,
            };
            console.log('Updated filters:', updatedFilters);
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const paginate = (pageNumber) => {
        console.log(`paginate - pageNumber: ${pageNumber}`);
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                page: pageNumber,
            };
            console.log('Updated filters:', updatedFilters);
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const toggleFilterVisibility = () => {
        console.log('toggleFilterVisibility');
        setIsFilterVisible(!isFilterVisible);
    };

    const handleSortChange = (e) => {
        const sortBy = e.target.value;
        console.log('handleSortChange - sortBy:', sortBy);
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                sortBy,
            };
            console.log('Updated filters:', updatedFilters);
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const clearAllFilters = () => {
        console.log('clearAllFilters');
        const clearedFilters = {
            sports: [],
            cardSets: [],
            cardYears: [],
            cardColors: [],
            cardVariants: [],
            inStock: false,
            cardName: '',
            page: '1',
            sortBy: '',
        };
        setFilters(clearedFilters);
        updateFiltersInUrl(clearedFilters);
        fetchFilteredCards(clearedFilters);
        fetchFilterOptions('cardSets', clearedFilters, 1); // Reset cardSets to initial load
        fetchFilterOptions('sports', clearedFilters);
        fetchFilterOptions('cardYears', clearedFilters);
        fetchFilterOptions('cardColors', clearedFilters);
        fetchFilterOptions('cardVariants', clearedFilters);
    };

    const filterTitles = {
        sports: 'Category',
        cardSets: 'Set',
        cardYears: 'Year',
        cardColors: 'Color',
        cardVariants: 'Variant',
    };

    const totalPages = Math.ceil(totalCount / resultsPerPage);

    const observers = useRef({});
    const lastElementRefs = {
        cardSets: useCallback(node => createObserver(node, 'cardSets'), [isLoadingCardSets]),
    };

    const createObserver = (node, filterType) => {
        if (isLoadingCardSets) return;
        if (observers.current[filterType]) observers.current[filterType].disconnect();
        observers.current[filterType] = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && entries[0].intersectionRatio > 0) {
                setTimeout(() => {
                    setFilterPages(prevPages => ({
                        ...prevPages,
                        [filterType]: prevPages[filterType] + 1
                    }));
                }, 500);
            }
        }, { rootMargin: '100px' }); // Add rootMargin for stiffness
        if (node) observers.current[filterType].observe(node);
    };

    const cardSetsScrollRef = useRef(null);

    useEffect(() => {
        if (cardSetsScrollRef.current) {
            cardSetsScrollRef.current.scrollTop = cardSetsScrollRef.current.scrollHeight - 200; // Reload slightly above the bottom
        }
    }, [filterOptions.cardSets]);

    useEffect(() => {
        Object.keys(filterPages).forEach(filterType => {
            if (filterPages[filterType] > 1) {
                fetchFilterOptions(filterType, filters, filterPages[filterType]);
            }
        });
    }, [filterPages]);

    const handlePullToRefresh = () => {
        const ref = cardSetsScrollRef.current;
        if (ref.scrollTop + ref.clientHeight >= ref.scrollHeight - 50 && !isLoadingCardSets) {
            setFilterPages(prevPages => ({
                ...prevPages,
                cardSets: prevPages.cardSets + 1
            }));
        }
    };

    useEffect(() => {
        const ref = cardSetsScrollRef.current;
        if (ref) {
            ref.addEventListener('scroll', handlePullToRefresh);
            return () => ref.removeEventListener('scroll', handlePullToRefresh);
        }
    }, []);

    return (
        <div>
            <div className={styles.mainContent}>
                <div className={styles.controlSection}>
                    <button onClick={toggleFilterVisibility} className={styles.filterToggle}>Filter</button>
                    <div className={styles.dropdownContainer}>
                        <select className={styles.sortDropdown} value={filters.sortBy} onChange={handleSortChange}>
                            <option value="">Sort By</option>
                            <option value="nameAsc">Card Name (A-Z)</option>
                            <option value="priceHighToLow">Price: High to Low</option>
                            <option value="priceLowToHigh">Price: Low to High</option>
                        </select>
                        <FaCaretDown className={styles.dropdownIcon} />
                    </div>
                    <span className={styles.resultCount}>{totalCount} Results</span>
                </div>
                <div className={styles.filterAndCardsContainer}>
                    {isFilterVisible && (
                        <aside className={`${styles.filterSection} ${isFilterVisible ? styles.filterVisible : ''}`}>
                            <div className={styles.filterHeader}>
                                <button onClick={toggleFilterVisibility} className={styles.closeFilterButton}>X</button>
                                <h2 className={styles.filterTitle}>Filters</h2>
                            </div>
                            {Object.values(filters).some(filterArray => Array.isArray(filterArray) && filterArray.length > 0) && (
                                <div className={styles.appliedFiltersContainer}>
                                    <h4 className={styles.appliedFiltersHeading}>Applied Filters</h4>
                                    <button className={styles.clearFiltersButton} onClick={clearAllFilters}>Clear Filters</button>
                                </div>
                            )}
                            <div className={styles.appliedFilters}>
                                {Object.entries(filters).filter(([key, value]) => Array.isArray(value) && value.length > 0).map(([key, values]) => (
                                    <div key={key}>
                                        {values.map((value, index) => (
                                            <button key={`${key}-${index}`} className={styles.filterBubble} onClick={() => handleFilterChange(key, value, false)} aria-label={`Remove ${value}`}>
                                                <span className={styles.filterX}>X</span>
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
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
                            {Object.keys(filterOptions).map((filterKey) => (
                                <div key={filterKey} className={`${styles.filterCategory}`} ref={filterKey === 'cardSets' ? cardSetsScrollRef : null}>
                                    <h4>{filterTitles[filterKey]}</h4>
                                    <SearchInput
                                        onChange={(value) => handleFilterSearchChange(filterKey, value)}
                                        placeholder={`Search ${filterTitles[filterKey]}`}
                                    />
                                    {isLoadingCardSets && filterKey === 'cardSets' ? <div className={styles.centeredContent}><Spinner /></div> :
                                        filterOptions[filterKey]
                                            .filter(option =>
                                                option &&
                                                option.name &&
                                                option.name.toLowerCase().includes(filterSearchTerms[filterKey].toLowerCase())
                                            )
                                            .map((option, index) => (
                                                <div
                                                    key={index}
                                                    className={styles.filterOption}
                                                    ref={filterKey === 'cardSets' && index === filterOptions[filterKey].length - 1 ? lastElementRefs[filterKey] : null} // Set ref to the last item of cardSets only
                                                >
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            disabled={isLoadingCardSets && filterKey === 'cardSets'}
                                                            checked={Array.isArray(filters[filterKey]) && filters[filterKey].includes(option.name)}
                                                            onChange={(e) => handleFilterChange(filterKey, option.name, e.target.checked)}
                                                        />
                                                        {option.name} ({option.count})
                                                    </label>
                                                </div>
                                            ))}
                                    {filterKey === 'cardSets' && !isLoadingCardSets && (
                                        <div className={styles.scrollIndicator}>
                                            <MdKeyboardArrowDown size={24} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </aside>
                    )}
                    <section className={styles.cardsSection}>
                        {isLoadingCards ? (
                            <div className={styles.centeredContent}><Spinner /></div>
                        ) : (
                            <div className={styles.cardsGridWrapper}>
                                {filteredCards.length > 0 ? (
                                    <div className={styles.cardsGrid}>
                                        {filteredCards.map((card, index) => (
                                            <Link key={index} href={`/cards/${card.CardID}/${encodeURIComponent(card.CardSet + '+' + card.CardName)}`}>
                                                <div className={styles.card}>
                                                    <div className={styles.cardImageWrapper}>
                                                        <Image src={card.CardImage} alt={card.CardName} width={180} height={270} layout="intrinsic" className={styles.cardImage} />
                                                    </div>
                                                    <div className={styles.cardInfo}>
                                                        <div className={styles.cardYear}>{card.CardYear}</div>
                                                        <div className={styles.cardSport}>{card.Sport}</div>
                                                        <div className={styles.cardSet}>{card.CardSet}</div>
                                                        <div className={styles.cardNumber}># {card.CardNumber}</div>
                                                        <div className={styles.cardVariant}>{card.CardVariant || ''}</div>
                                                        <div className={styles.cardColor}>{card.CardColor || ''}</div>
                                                        <div className={styles.cardName}>{card.CardName}</div>
                                                        <div className={styles.cardListings}>Listings: {card.ListingsCount}</div>
                                                        <div className={styles.cardMarketPrice}>
                                                            {card.MarketPrice !== null && card.MarketPrice !== undefined ? (
                                                                `Market Price: $${card.MarketPrice}`
                                                            ) : (
                                                                'Market Price: N/A'
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.noResultsWrapper}>
                                        <div className={styles.noResults}>
                                            <PiSmileySadBold size={250} />
                                            <p>We're sorry but there are no items that match your criteria. Please try searching again.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <div className={styles.pagination}>
                <button disabled={filters.page === '1'} onClick={() => paginate(parseInt(filters.page, 10) - 1)}>Prev</button>
                <button disabled={parseInt(filters.page, 10) >= totalPages} onClick={() => paginate(parseInt(filters.page, 10) + 1)}>Next</button>
            </div>
        </div>
    );
};

export default SearchPage;
