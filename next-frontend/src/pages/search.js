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
    teams: query.teams ? (Array.isArray(query.teams) ? query.teams : [query.teams]) : [],
    colorPatterns: query.colorPatterns ? (Array.isArray(query.colorPatterns) ? query.colorPatterns : [query.colorPatterns]) : [],
    numbered: query.numbered ? (Array.isArray(query.numbered) ? query.numbered : [query.numbered]) : [],
    auto: query.auto ? (Array.isArray(query.auto) ? query.auto : [query.auto]) : [],
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
    teams: [],
    colorPatterns: [],
    numbered: [],
    auto: [],
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
    teams: '',
    colorPatterns: '',
    numbered: '',
    auto: '',
  });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [hasMore, setHasMore] = useState({
    cardSets: true,
    cardVariants: true,
    cardYears: true,
    cardColors: true,
    teams: true,
    colorPatterns: true,
    numbered: true,
    auto: true,
  });

  const [filterPages, setFilterPages] = useState({
    cardSets: 1,
    cardVariants: 1,
    cardYears: 1,
    cardColors: 1,
    teams: 1,
    colorPatterns: 1,
    numbered: 1,
    auto: 1,
  });
  const filterLimit = 50;
  const resultsPerPage = 10;

  const updateFiltersInUrl = (updatedFilters) => {
    const queryParameters = new URLSearchParams({
      cardName: updatedFilters.cardName || '',
      page: updatedFilters.page,
      inStock: updatedFilters.inStock ? 'true' : 'false',
    });
    if (updatedFilters.inStock && updatedFilters.sortBy) {
      queryParameters.append('sortBy', updatedFilters.sortBy);
    }
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

    let queryStr = `/api/search?cardName=${encodeURIComponent(filtersToApply.cardName || '')}&page=${filtersToApply.page}&inStock=${filtersToApply.inStock ? 'true' : 'false'}`;
    Object.keys(filtersToApply).forEach((filterKey) => {
      const filterValue = filtersToApply[filterKey];
      if (Array.isArray(filterValue)) {
        filterValue.forEach((value) => {
          queryStr += `&${filterKey}[]=${encodeURIComponent(value)}`;
        });
      }
    });

    if (filtersToApply.inStock && filtersToApply.sortBy) {
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
    setIsLoadingFilters(true);

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
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        [filterType]: page === 1 ? data[filterType] : [...new Set([...prevOptions[filterType], ...data[filterType]])]
      }));
      setHasMore(prevHasMore => ({
        ...prevHasMore,
        [filterType]: data[filterType].length >= filterLimit
      }));
    } else {
      console.error('Failed to fetch filter options');
    }
    setIsLoadingFilters(false);
  };

  const fetchAllFilterOptions = (filtersToApply) => {
    const filterTypes = Object.keys(filterOptions);
    filterTypes.forEach(filterType => {
      fetchFilterOptions(filterType, filtersToApply, 1);
    });
  };

  useEffect(() => {
    if (Object.keys(query).length > 0) {
      const updatedFilters = initializeFilters(query);
      setFilters(updatedFilters);
      fetchFilteredCards(updatedFilters);
      fetchAllFilterOptions(updatedFilters);
    }
  }, [query]);

  const handleFilterSearchChange = (filterKey, searchTerm) => {
    const debounceChange = debounce((value) => {
      setFilterSearchTerms((prevTerms) => ({
        ...prevTerms,
        [filterKey]: value,
      }));
      setFilters((prevFilters) => {
        const updatedFilters = {
          ...prevFilters,
          [filterKey]: value,
          page: '1',
          sortBy: prevFilters.inStock ? prevFilters.sortBy : '',
        };
        updateFiltersInUrl(updatedFilters);
        fetchFilteredCards(updatedFilters);
        return updatedFilters;
      });
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
      teams: '',
      colorPatterns: '',
      numbered: '',
      auto: '',
    });

    setFilters((prevFilters) => {
      const updatedFilters = {
        ...prevFilters,
        [filterKey]: isChecked
          ? [...(Array.isArray(prevFilters[filterKey]) ? prevFilters[filterKey] : []), value]
          : prevFilters[filterKey].filter((v) => v !== value),
        page: '1',
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
        cardName: prevFilters.cardName,
        sortBy: '',
      };
      updateFiltersInUrl(updatedFilters);
      fetchFilteredCards(updatedFilters);
      return updatedFilters;
    });
  };

  const handleCardNameChange = (cardName) => {
    setFilters((prevFilters) => {
      const updatedFilters = {
        ...prevFilters,
        cardName: cardName,
        page: '1',
        inStock: prevFilters.inStock,
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
      teams: [],
      colorPatterns: [],
      numbered: [],
      auto: [],
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
      teams: '',
      colorPatterns: '',
      numbered: '',
      auto: '',
    });
    setFilters(clearedFilters);
    updateFiltersInUrl(clearedFilters);
    fetchFilteredCards(clearedFilters);
    fetchAllFilterOptions(clearedFilters);
  };

  const filterTitles = {
    sports: 'Category',
    cardSets: 'Set',
    cardYears: 'Year',
    cardColors: 'Color',
    cardVariants: 'Variant',
    teams: 'Team',
    colorPatterns: 'Color Pattern',
    numbered: 'Numbered',
    auto: 'Auto',
  };

  const totalPages = Math.ceil(totalCount / resultsPerPage);

  const observers = useRef({});
  const lastElementRefs = useRef({});

  const createObserver = (node, filterType) => {
    if (isLoadingFilters) return;
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
  const cardVariantsScrollRef = useRef(null);
  const cardYearsScrollRef = useRef(null);
  const cardColorsScrollRef = useRef(null);
  const teamsScrollRef = useRef(null);
  const colorPatternsScrollRef = useRef(null);
  const numberedScrollRef = useRef(null);
  const autoScrollRef = useRef(null);

  useEffect(() => {
    Object.keys(filterOptions).forEach(filterKey => {
      if (filterPages[filterKey] > 1) {
        fetchFilterOptions(filterKey, filters, filterPages[filterKey]);
      }
    });
  }, [filterPages]);

  const handlePullToRefresh = () => {
    Object.keys(filterOptions).forEach(filterKey => {
      if (observers.current[filterKey]) {
        if (
          (filterKey === 'cardSets' && cardSetsScrollRef.current && cardSetsScrollRef.current.scrollTop + cardSetsScrollRef.current.clientHeight >= cardSetsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'cardVariants' && cardVariantsScrollRef.current && cardVariantsScrollRef.current.scrollTop + cardVariantsScrollRef.current.clientHeight >= cardVariantsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'cardYears' && cardYearsScrollRef.current && cardYearsScrollRef.current.scrollTop + cardYearsScrollRef.current.clientHeight >= cardYearsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'cardColors' && cardColorsScrollRef.current && cardColorsScrollRef.current.scrollTop + cardColorsScrollRef.current.clientHeight >= cardColorsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'teams' && teamsScrollRef.current && teamsScrollRef.current.scrollTop + teamsScrollRef.current.clientHeight >= teamsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'colorPatterns' && colorPatternsScrollRef.current && colorPatternsScrollRef.current.scrollTop + colorPatternsScrollRef.current.clientHeight >= colorPatternsScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'numbered' && numberedScrollRef.current && numberedScrollRef.current.scrollTop + numberedScrollRef.current.clientHeight >= numberedScrollRef.current.scrollHeight - 50) ||
          (filterKey === 'auto' && autoScrollRef.current && autoScrollRef.current.scrollTop + autoScrollRef.current.clientHeight >= autoScrollRef.current.scrollHeight - 50)
        ) {
          setFilterPages(prevPages => ({
            ...prevPages,
            [filterKey]: prevPages[filterKey] + 1
          }));
        }
      }
    });
  };

  useEffect(() => {
    if (cardSetsScrollRef.current) {
      cardSetsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardSetsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.cardSets]);

  useEffect(() => {
    if (cardVariantsScrollRef.current) {
      cardVariantsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardVariantsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.cardVariants]);

  useEffect(() => {
    if (cardYearsScrollRef.current) {
      cardYearsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardYearsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.cardYears]);

  useEffect(() => {
    if (cardColorsScrollRef.current) {
      cardColorsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardColorsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.cardColors]);

  useEffect(() => {
    if (teamsScrollRef.current) {
      teamsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => teamsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.teams]);

  useEffect(() => {
    if (colorPatternsScrollRef.current) {
      colorPatternsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => colorPatternsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.colorPatterns]);

  useEffect(() => {
    if (numberedScrollRef.current) {
      numberedScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => numberedScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.numbered]);

  useEffect(() => {
    if (autoScrollRef.current) {
      autoScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => autoScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMore.auto]);

  const handleOutOfStockClick = () => {
    setFilters((prevFilters) => {
      const updatedFilters = {
        ...prevFilters,
        inStock: false,
        page: '1',
      };
      updateFiltersInUrl(updatedFilters);
      fetchFilteredCards(updatedFilters);
      return updatedFilters;
    });
  };

  return (
    <div>
      <div className={styles.mainContent}>
        <div className={styles.controlSection}>
          <button onClick={toggleFilterVisibility} className={styles.filterToggle}>Filter</button>
          {filters.inStock && (
            <div className={styles.dropdownContainer}>
              <select className={styles.sortDropdown} value={filters.sortBy} onChange={handleSortChange}>
                <option value="">Sort By</option>
                <option value="nameAsc">Card Name (A-Z)</option>
                <option value="priceHighToLow">Price: High to Low</option>
                <option value="priceLowToHigh">Price: Low to High</option>
              </select>
              <FaCaretDown className={styles.dropdownIcon} />
            </div>
          )}
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
                <div key={filterKey} className={`${styles.filterCategory}`} ref={
                  filterKey === 'cardSets' ? cardSetsScrollRef :
                    filterKey === 'cardVariants' ? cardVariantsScrollRef :
                      filterKey === 'cardYears' ? cardYearsScrollRef :
                        filterKey === 'cardColors' ? cardColorsScrollRef :
                          filterKey === 'teams' ? teamsScrollRef :
                            filterKey === 'colorPatterns' ? colorPatternsScrollRef :
                              filterKey === 'numbered' ? numberedScrollRef :
                                filterKey === 'auto' ? autoScrollRef : null}>
                  <h4>{filterTitles[filterKey]}</h4>
                  <SearchInput
                    onChange={(value) => handleFilterSearchChange(filterKey, value)}
                    placeholder={`Search ${filterTitles[filterKey]}`}
                    value={filterSearchTerms[filterKey]}
                  />
                  {filterOptions[filterKey]
                    .filter(option =>
                      option &&
                      typeof option.name === 'string' &&
                      option.name.toLowerCase().includes(filterSearchTerms[filterKey]?.toLowerCase() || '')
                    )
                    .map((option, index) => (
                      <div
                        key={index}
                        className={styles.filterOption}
                        ref={
                          (filterKey === 'cardSets' || filterKey === 'cardVariants' || filterKey === 'cardYears' || filterKey === 'cardColors' ||
                            filterKey === 'teams' || filterKey === 'colorPatterns' || filterKey === 'numbered' || filterKey === 'auto') &&
                            index === filterOptions[filterKey].length - 1 ? (node) => createObserver(node, filterKey) : null
                        }
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={Array.isArray(filters[filterKey]) && filters[filterKey].includes(option.name)}
                            onChange={(e) => handleFilterChange(filterKey, option.name, e.target.checked)}
                          />
                          <span className={styles.optionLabel}>
                            {option.name}
                          </span>
                          <span className={styles.optionCount}>
                            ({option.count.toLocaleString()})
                          </span>
                        </label>
                      </div>
                    ))}
                  {hasMore[filterKey] && (
                    <div className={styles.scrollIndicator}>
                      {isLoadingFilters ? <Spinner /> : <MdKeyboardArrowDown size={24} />}
                    </div>
                  )}
                </div>
              ))}
            </aside>
          )}
          <section className={styles.cardsSection}>
            {isLoadingCards ? (
              <div className={styles.centeredContent}><Spinner /></div>
            ) : filteredCards.length > 0 ? (
              <div className={styles.cardsGridWrapper}>
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
                          <div className={styles.cardTeam}>{card.Team || ''}</div>
                          <div className={styles.cardColorPattern}>{card.ColorPattern || ''}</div>
                          <div className={styles.cardNumbered}>{card.Numbered || ''}</div>
                          <div className={styles.cardAuto}>{card.Auto || ''}</div>
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
              </div>
            ) : (
              <div className={styles.noResultsWrapper}>
                <div className={styles.noResults}>
                  <PiSmileySadBold size={250} />
                  <p>There are no in stock cards that match your search request. Try searching for all results.</p>
                  <button onClick={handleOutOfStockClick} className={styles.outOfStockButton}>Search all results</button>
                </div>
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
