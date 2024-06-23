import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown } from 'react-icons/fa';
import { PiSmileySadBold } from 'react-icons/pi';
import { MdKeyboardArrowDown } from 'react-icons/md';
import styles from '../styles/search.module.css';

const Spinner = () => (
    <div className={styles.spinner}></div>
);

const SearchInput = ({ onChange, placeholder, value }) => {
    const [inputValue, setInputValue] = useState(value);

    const handleChange = (e) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
    };

    return (
        <input
            type="text"
            onChange={handleChange}
            placeholder={placeholder}
            value={inputValue}
            className={styles.searchInput}
        />
    );
};

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

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
    const [allCardSets, setAllCardSets] = useState([]);
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
    const [hasMoreCardSets, setHasMoreCardSets] = useState(true);

    const [filterPages, setFilterPages] = useState({
        cardSets: 1,
    });
    const filterLimit = 50;
    const resultsPerPage = 10;

    const updateFiltersInUrl = (updatedFilters) => {
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

        router.push(`/search?${queryParameters.toString()}`, undefined, { shallow: true });
    };

    const fetchFilteredCards = async (filtersToApply) => {
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

        const response = await fetch(queryStr);
        if (!response.ok) {
            setIsLoadingCards(false);
            return;
        }

        const { cards, totalCount } = await response.json();
        setFilteredCards(cards);
        setTotalCount(totalCount);
        setIsLoadingCards(false);
    };

    const fetchFilterOptions = async (filterType, filtersToApply, page = 1) => {
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

        const response = await fetch(`/api/search?${queryParams.toString()}`);
        if (response.ok) {
            const data = await response.json();
            if (filterType === 'cardSets' && page === 1) {
                setAllCardSets(data[filterType]);
            }
            if (data[filterType].length < filterLimit) {
                setHasMoreCardSets(false);
            } else {
                setHasMoreCardSets(true);
            }
            setFilterOptions(prevOptions => ({
                ...prevOptions,
                [filterType]: page === 1 ? data[filterType] : [...new Set([...prevOptions[filterType], ...data[filterType]])]
            }));
        } else {
            console.error('Failed to fetch filter options');
        }
        if (filterType === 'cardSets') setIsLoadingCardSets(false);
        else setIsLoadingFilters(false);
    };

    useEffect(() => {
        const filtersToApply = initializeFilters(query);
        setFilters(filtersToApply);
        fetchFilteredCards(filtersToApply);
        fetchFilterOptions('cardSets', filtersToApply, 1);
        fetchFilterOptions('sports', filtersToApply);
        fetchFilterOptions('cardYears', filtersToApply);
        fetchFilterOptions('cardColors', filtersToApply);
        fetchFilterOptions('cardVariants', filtersToApply);
    }, []);

    useEffect(() => {
        if (Object.keys(query).length > 0) {
            const updatedFilters = initializeFilters(query);

            setFilters(updatedFilters);
            fetchFilteredCards(updatedFilters);
            fetchFilterOptions('cardSets', updatedFilters, 1);
            fetchFilterOptions('sports', updatedFilters);
            fetchFilterOptions('cardYears', updatedFilters);
            fetchFilterOptions('cardColors', updatedFilters);
            fetchFilterOptions('cardVariants', updatedFilters);
        }
    }, [query]);

    const handleFilterSearchChange = (filterKey, searchTerm) => {
        const debounceChange = debounce((value) => {
            setFilterSearchTerms((prevTerms) => ({
                ...prevTerms,
                [filterKey]: value,
            }));
        }, 300);

        debounceChange(searchTerm);
    };

    const handleFilterChange = (filterKey, value, isChecked) => {
        setFilterSearchTerms({
            sports: '',
            cardSets: '',
            cardYears: '',
            cardColors: '',
            cardVariants: '',
        });
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                [filterKey]: isChecked
                    ? [...(Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : []), value]
                    : prevFilters[filterKey].filter((v) => v !== value),
                page: '1',
                cardName: ''
            };
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const handleToggleChange = () => {
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                inStock: !prevFilters.inStock,
                page: '1',
                cardName: ''
            };
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const paginate = (pageNumber) => {
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                page: pageNumber,
            };
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };

    const handleSortChange = (e) => {
        const sortBy = e.target.value;
        setFilters((prevFilters) => {
            const updatedFilters = {
                ...prevFilters,
                sortBy,
                page: '1',
                cardName: ''
            };
            updateFiltersInUrl(updatedFilters);
            fetchFilteredCards(updatedFilters);
            return updatedFilters;
        });
    };

    const clearAllFilters = () => {
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
        setFilterSearchTerms({
            sports: '',
            cardSets: '',
            cardYears: '',
            cardColors: '',
            cardVariants: '',
        });
        setFilters(clearedFilters);
        updateFiltersInUrl(clearedFilters);
        fetchFilteredCards(clearedFilters);
        fetchFilterOptions('cardSets', clearedFilters, 1);
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
        cardSets: useCallback(node => createObserver(node, 'cardSets'), [isLoadingCardSets, hasMoreCardSets]),
    };

    const createObserver = (node, filterType) => {
        if (isLoadingCardSets || !hasMoreCardSets) return;
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
        }, { rootMargin: '100px' });
        if (node) observers.current[filterType].observe(node);
    };

    const cardSetsScrollRef = useRef(null);

    useEffect(() => {
        if (cardSetsScrollRef.current) {
            const scrollHeight = cardSetsScrollRef.current.scrollHeight;
            const scrollTop = cardSetsScrollRef.current.scrollTop;
            cardSetsScrollRef.current.scrollTop = scrollTop + (cardSetsScrollRef.current.scrollHeight - scrollHeight);
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
        if (ref.scrollTop + ref.clientHeight >= ref.scrollHeight - 50 && !isLoadingCardSets && hasMoreCardSets) {
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
    }, [hasMoreCardSets]);

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
                    <span className={styles.resultCount}>{totalCount.toLocaleString()} Results</span>
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
                                        value={filterSearchTerms[filterKey]}
                                    />
                                    {filterOptions[filterKey]
                                        .filter(option =>
                                            option &&
                                            option.name &&
                                            option.name.toLowerCase().includes(filterSearchTerms[filterKey].toLowerCase())
                                        )
                                        .map((option, index) => (
                                            <div
                                                key={index}
                                                className={styles.filterOption}
                                                ref={filterKey === 'cardSets' && index === filterOptions[filterKey].length - 1 ? lastElementRefs[filterKey] : null}
                                            >
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        disabled={isLoadingCardSets && filterKey === 'cardSets'}
                                                        checked={Array.isArray(filters[filterKey]) && filters[filterKey].includes(option.name)}
                                                        onChange={(e) => handleFilterChange(filterKey, option.name, e.target.checked)}
                                                    />
                                                    {option.name} ({option.count.toLocaleString()})
                                                </label>
                                            </div>
                                        ))}
                                    {filterKey === 'cardSets' && hasMoreCardSets && (
                                        <div className={styles.scrollIndicator}>
                                            {isLoadingCardSets ? <Spinner /> : <MdKeyboardArrowDown size={24} />}
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
