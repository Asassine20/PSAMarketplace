import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown } from 'react-icons/fa';
import { PiSmileySadBold } from 'react-icons/pi';
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

    const [filters, setFilters] = useState({
        sports: query.sports ? (Array.isArray(query.sports) ? query.sports : [query.sports]) : [],
        cardSets: query.cardSets ? (Array.isArray(query.cardSets) ? query.cardSets : [query.cardSets]) : [],
        cardYears: query.cardYears ? (Array.isArray(query.cardYears) ? query.cardYears : [query.cardYears]) : [],
        cardColors: query.cardColors ? (Array.isArray(query.cardColors) ? query.cardColors : [query.cardColors]) : [],
        cardVariants: query.cardVariants ? (Array.isArray(query.cardVariants) ? query.cardVariants : [query.cardVariants]) : [],
        inStock: query.inStock === 'true',
        cardName: query.cardName || '',
        page: query.page || '1',
    });

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
    const [delayedSearch, setDelayedSearch] = useState(null);

    const resultsPerPage = 10; // Assume a constant for results per page (can be adjusted as needed)

    const updateFiltersInUrl = (updatedFilters) => {
        console.log('Updating filters in URL:', updatedFilters);
        const queryParameters = new URLSearchParams({
            cardName: updatedFilters.cardName || '',
            page: updatedFilters.page,
            inStock: updatedFilters.inStock ? 'true' : 'false',
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

    const fetchFilterOptions = async (filtersToApply) => {
        console.log('Fetching filter options with filters:', filtersToApply);
        setIsLoadingFilters(true);
        let queryParams = new URLSearchParams({
            fetchFilters: 'true',
            cardName: filtersToApply.cardName || '',
            inStock: filtersToApply.inStock ? 'true' : 'false',
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
            setFilterOptions(data);
            console.log('Fetched filter options:', data);
        } else {
            console.error('Failed to fetch filter options');
        }
        setIsLoadingFilters(false);
    };

    useEffect(() => {
        console.log('useEffect - initial fetch filtered cards and filter options');
        fetchFilteredCards(filters);
        fetchFilterOptions(filters);
    }, []);

    useEffect(() => {
        if (Object.keys(query).length > 0) {
            console.log('useEffect - router query change:', query);
            const updatedFilters = {
                sports: query.sports ? (Array.isArray(query.sports) ? query.sports : [query.sports]) : [],
                cardSets: query.cardSets ? (Array.isArray(query.cardSets) ? query.cardSets : [query.cardSets]) : [],
                cardYears: query.cardYears ? (Array.isArray(query.cardYears) ? query.cardYears : [query.cardYears]) : [],
                cardColors: query.cardColors ? (Array.isArray(query.cardColors) ? query.cardColors : [query.cardColors]) : [],
                cardVariants: query.cardVariants ? (Array.isArray(query.cardVariants) ? query.cardVariants : [query.cardVariants]) : [],
                inStock: query.inStock === 'true',
                cardName: query.cardName || '',
                page: query.page || '1',
            };

            console.log('Updated filters from query:', updatedFilters);
            setFilters(updatedFilters);
            fetchFilteredCards(updatedFilters);
            fetchFilterOptions(updatedFilters);
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
            fetchFilterOptions(updatedFilters); // Fetch updated filter options based on current selection
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
            fetchFilterOptions(updatedFilters); // Fetch updated filter options based on current selection
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

    const filterTitles = {
        sports: 'Category',
        cardSets: 'Set',
        cardYears: 'Year',
        cardColors: 'Color',
        cardVariants: 'Variant',
    };

    const totalPages = Math.ceil(totalCount / resultsPerPage);

    return (
        <div>
            <div className={styles.mainContent}>
                <div className={styles.controlSection}>
                    <button onClick={toggleFilterVisibility} className={styles.filterToggle}>Filter</button>
                    <div className={styles.dropdownContainer}>
                        <select className={styles.sortDropdown}>
                            <option value="name">Best Selling</option>
                            <option value="year">A-Z</option>
                            <option value="sport">Price: High - Low</option>
                            <option value="sport">Price: Low - High</option>
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
                                <h4 className={styles.appliedFiltersHeading}>Applied Filters</h4>
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
                            {isLoadingFilters ? <div className={styles.centeredContent}><Spinner /></div> :
                                Object.keys(filterOptions).map((filterKey) => (
                                    <div key={filterKey} className={`${styles.filterCategory} ${isLoadingFilters ? styles.disabled : ''}`}>
                                        <h4>{filterTitles[filterKey]}</h4>
                                        <SearchInput
                                            onChange={(value) => handleFilterSearchChange(filterKey, value)}
                                            placeholder={`Search ${filterTitles[filterKey]}`}
                                        />
                                        {filterOptions[filterKey]
                                            .filter(option =>
                                                option &&
                                                option.toString().toLowerCase().includes(filterSearchTerms[filterKey].toLowerCase())
                                            )
                                            .map((option, index) => (
                                                <div key={index} className={styles.filterOption}>
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
