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
  const [isLoadingCardSets, setIsLoadingCardSets] = useState(false);
  const [isLoadingCardVariants, setIsLoadingCardVariants] = useState(false);
  const [isLoadingCardYears, setIsLoadingCardYears] = useState(false);
  const [isLoadingCardColors, setIsLoadingCardColors] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingColorPatterns, setIsLoadingColorPatterns] = useState(false);
  const [isLoadingNumbered, setIsLoadingNumbered] = useState(false);
  const [isLoadingAuto, setIsLoadingAuto] = useState(false);
  const [hasMoreCardSets, setHasMoreCardSets] = useState(true);
  const [hasMoreCardVariants, setHasMoreCardVariants] = useState(true);
  const [hasMoreCardYears, setHasMoreCardYears] = useState(true);
  const [hasMoreCardColors, setHasMoreCardColors] = useState(true);
  const [hasMoreTeams, setHasMoreTeams] = useState(true);
  const [hasMoreColorPatterns, setHasMoreColorPatterns] = useState(true);
  const [hasMoreNumbered, setHasMoreNumbered] = useState(true);
  const [hasMoreAuto, setHasMoreAuto] = useState(true);

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

  // Handles the filters when they are changes. Updates url to include filter parameters.
  const updateFiltersInUrl = (updatedFilters) => {
    const queryParameters = new URLSearchParams({
      cardName: updatedFilters.cardName || '',
      page: updatedFilters.page,
      inStock: updatedFilters.inStock ? 'true' : 'false',
    });
    if (updatedFilters.inStock && updatedFilters.sortBy) {
      queryParameters.append('sortBy', updatedFilters.sortBy);
    }
    // Loops through each filter and appends the selected values to the url
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

  // Updates the card results based on the filters selected
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
    if (filterType === 'cardSets') setIsLoadingCardSets(true);
    else if (filterType === 'cardVariants') setIsLoadingCardVariants(true);
    else if (filterType === 'cardYears') setIsLoadingCardYears(true);
    else if (filterType === 'cardColors') setIsLoadingCardColors(true);
    else if (filterType === 'teams') setIsLoadingTeams(true);
    else if (filterType === 'colorPatterns') setIsLoadingColorPatterns(true);
    else if (filterType === 'numbered') setIsLoadingNumbered(true);
    else if (filterType === 'auto') setIsLoadingAuto(true);
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
      if (filterType === 'cardVariants' && page === 1) {
        setFilterOptions((prevOptions) => ({
          ...prevOptions,
          cardVariants: data.cardVariants
        }));
      }
      if (data[filterType].length < filterLimit) {
        if (filterType === 'cardSets') {
          setHasMoreCardSets(false);
        } else if (filterType === 'cardVariants') {
          setHasMoreCardVariants(false);
        } else if (filterType === 'cardYears') {
          setHasMoreCardYears(false);
        } else if (filterType === 'cardColors') {
          setHasMoreCardColors(false);
        } else if (filterType === 'teams') {
          setHasMoreTeams(false);
        } else if (filterType === 'colorPatterns') {
          setHasMoreColorPatterns(false);
        } else if (filterType === 'numbered') {
          setHasMoreNumbered(false);
        } else if (filterType === 'auto') {
          setHasMoreAuto(false);
        }
      } else {
        if (filterType === 'cardSets') {
          setHasMoreCardSets(true);
        } else if (filterType === 'cardVariants') {
          setHasMoreCardVariants(true);
        } else if (filterType === 'cardYears') {
          setHasMoreCardYears(true);
        } else if (filterType === 'cardColors') {
          setHasMoreCardColors(true);
        } else if (filterType === 'teams') {
          setHasMoreTeams(true);
        } else if (filterType === 'colorPatterns') {
          setHasMoreColorPatterns(true);
        } else if (filterType === 'numbered') {
          setHasMoreNumbered(true);
        } else if (filterType === 'auto') {
          setHasMoreAuto(true);
        }
      }
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        [filterType]: page === 1 ? data[filterType] : [...new Set([...prevOptions[filterType], ...data[filterType]])]
      }));
    } else {
      console.error('Failed to fetch filter options');
    }
    if (filterType === 'cardSets') setIsLoadingCardSets(false);
    else if (filterType === 'cardVariants') setIsLoadingCardVariants(false);
    else if (filterType === 'cardYears') setIsLoadingCardYears(false);
    else if (filterType === 'cardColors') setIsLoadingCardColors(false);
    else if (filterType === 'teams') setIsLoadingTeams(false);
    else if (filterType === 'colorPatterns') setIsLoadingColorPatterns(false);
    else if (filterType === 'numbered') setIsLoadingNumbered(false);
    else if (filterType === 'auto') setIsLoadingAuto(false);
    else setIsLoadingFilters(false);
  };

  useEffect(() => {
    if (Object.keys(query).length > 0) {
      const updatedFilters = initializeFilters(query);

      setFilters(updatedFilters);
      fetchFilteredCards(updatedFilters);
      fetchFilterOptions('cardSets', updatedFilters, 1);
      fetchFilterOptions('sports', updatedFilters);
      fetchFilterOptions('cardYears', updatedFilters, 1);
      fetchFilterOptions('cardColors', updatedFilters, 1);
      fetchFilterOptions('cardVariants', updatedFilters, 1);
      fetchFilterOptions('teams', updatedFilters, 1);
      fetchFilterOptions('colorPatterns', updatedFilters, 1);
      fetchFilterOptions('numbered', updatedFilters, 1);
      fetchFilterOptions('auto', updatedFilters, 1);
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
          sortBy: prevFilters.inStock ? prevFilters.sortBy : '', // Reset sortBy if inStock is false
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
        cardName: prevFilters.cardName, // Preserve the cardName parameter
        sortBy: '', // Reset sortBy to default
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
        inStock: prevFilters.inStock, // Preserve inStock value
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
    fetchFilterOptions('cardSets', clearedFilters, 1);
    fetchFilterOptions('sports', clearedFilters);
    fetchFilterOptions('cardYears', clearedFilters, 1);
    fetchFilterOptions('cardColors', clearedFilters, 1);
    fetchFilterOptions('cardVariants', clearedFilters, 1);
    fetchFilterOptions('teams', clearedFilters, 1);
    fetchFilterOptions('colorPatterns', clearedFilters, 1);
    fetchFilterOptions('numbered', clearedFilters, 1);
    fetchFilterOptions('auto', clearedFilters, 1);
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
  const lastElementRefs = {
    cardSets: useCallback(node => createObserver(node, 'cardSets'), [isLoadingCardSets, hasMoreCardSets]),
    cardVariants: useCallback(node => createObserver(node, 'cardVariants'), [isLoadingCardVariants, hasMoreCardVariants]),
    cardYears: useCallback(node => createObserver(node, 'cardYears'), [isLoadingCardYears, hasMoreCardYears]),
    cardColors: useCallback(node => createObserver(node, 'cardColors'), [isLoadingCardColors, hasMoreCardColors]),
    teams: useCallback(node => createObserver(node, 'teams'), [isLoadingTeams, hasMoreTeams]),
    colorPatterns: useCallback(node => createObserver(node, 'colorPatterns'), [isLoadingColorPatterns, hasMoreColorPatterns]),
    numbered: useCallback(node => createObserver(node, 'numbered'), [isLoadingNumbered, hasMoreNumbered]),
    auto: useCallback(node => createObserver(node, 'auto'), [isLoadingAuto, hasMoreAuto]),
  };

  const createObserver = (node, filterType) => {
    if (
      (isLoadingCardSets && filterType === 'cardSets') ||
      (isLoadingCardVariants && filterType === 'cardVariants') ||
      (isLoadingCardYears && filterType === 'cardYears') ||
      (isLoadingCardColors && filterType === 'cardColors') ||
      (isLoadingTeams && filterType === 'teams') ||
      (isLoadingColorPatterns && filterType === 'colorPatterns') ||
      (isLoadingNumbered && filterType === 'numbered') ||
      (isLoadingAuto && filterType === 'auto')
    ) return;
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
    if (cardSetsScrollRef.current) {
      const scrollHeight = cardSetsScrollRef.current.scrollHeight;
      const scrollTop = cardSetsScrollRef.current.scrollTop;
      cardSetsScrollRef.current.scrollTop = scrollTop + (cardSetsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.cardSets]);

  useEffect(() => {
    if (cardVariantsScrollRef.current) {
      const scrollHeight = cardVariantsScrollRef.current.scrollHeight;
      const scrollTop = cardVariantsScrollRef.current.scrollTop;
      cardVariantsScrollRef.current.scrollTop = scrollTop + (cardVariantsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.cardVariants]);

  useEffect(() => {
    if (cardYearsScrollRef.current) {
      const scrollHeight = cardYearsScrollRef.current.scrollHeight;
      const scrollTop = cardYearsScrollRef.current.scrollTop;
      cardYearsScrollRef.current.scrollTop = scrollTop + (cardYearsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.cardYears]);

  useEffect(() => {
    if (cardColorsScrollRef.current) {
      const scrollHeight = cardColorsScrollRef.current.scrollHeight;
      const scrollTop = cardColorsScrollRef.current.scrollTop;
      cardColorsScrollRef.current.scrollTop = scrollTop + (cardColorsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.cardColors]);

  useEffect(() => {
    if (teamsScrollRef.current) {
      const scrollHeight = teamsScrollRef.current.scrollHeight;
      const scrollTop = teamsScrollRef.current.scrollTop;
      teamsScrollRef.current.scrollTop = scrollTop + (teamsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.teams]);

  useEffect(() => {
    if (colorPatternsScrollRef.current) {
      const scrollHeight = colorPatternsScrollRef.current.scrollHeight;
      const scrollTop = colorPatternsScrollRef.current.scrollTop;
      colorPatternsScrollRef.current.scrollTop = scrollTop + (colorPatternsScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.colorPatterns]);

  useEffect(() => {
    if (numberedScrollRef.current) {
      const scrollHeight = numberedScrollRef.current.scrollHeight;
      const scrollTop = numberedScrollRef.current.scrollTop;
      numberedScrollRef.current.scrollTop = scrollTop + (numberedScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.numbered]);

  useEffect(() => {
    if (autoScrollRef.current) {
      const scrollHeight = autoScrollRef.current.scrollHeight;
      const scrollTop = autoScrollRef.current.scrollTop;
      autoScrollRef.current.scrollTop = scrollTop + (autoScrollRef.current.scrollHeight - scrollHeight);
    }
  }, [filterOptions.auto]);

  useEffect(() => {
    Object.keys(filterPages).forEach(filterType => {
      if (filterPages[filterType] > 1) {
        fetchFilterOptions(filterType, filters, filterPages[filterType]);
      }
    });
  }, [filterPages]);

  const handlePullToRefresh = () => {
    if ((cardSetsScrollRef.current.scrollTop + cardSetsScrollRef.current.clientHeight >= cardSetsScrollRef.current.scrollHeight - 50) && !isLoadingCardSets && hasMoreCardSets) {
      setFilterPages(prevPages => ({
        ...prevPages,
        cardSets: prevPages.cardSets + 1
      }));
    }
    if ((cardVariantsScrollRef.current.scrollTop + cardVariantsScrollRef.current.clientHeight >= cardVariantsScrollRef.current.scrollHeight - 50) && !isLoadingCardVariants && hasMoreCardVariants) {
      setFilterPages(prevPages => ({
        ...prevPages,
        cardVariants: prevPages.cardVariants + 1
      }));
    }
    if ((cardYearsScrollRef.current.scrollTop + cardYearsScrollRef.current.clientHeight >= cardYearsScrollRef.current.scrollHeight - 50) && !isLoadingCardYears && hasMoreCardYears) {
      setFilterPages(prevPages => ({
        ...prevPages,
        cardYears: prevPages.cardYears + 1
      }));
    }
    if ((cardColorsScrollRef.current.scrollTop + cardColorsScrollRef.current.clientHeight >= cardColorsScrollRef.current.scrollHeight - 50) && !isLoadingCardColors && hasMoreCardColors) {
      setFilterPages(prevPages => ({
        ...prevPages,
        cardColors: prevPages.cardColors + 1
      }));
    }
    if ((teamsScrollRef.current.scrollTop + teamsScrollRef.current.clientHeight >= teamsScrollRef.current.scrollHeight - 50) && !isLoadingTeams && hasMoreTeams) {
      setFilterPages(prevPages => ({
        ...prevPages,
        teams: prevPages.teams + 1
      }));
    }
    if ((colorPatternsScrollRef.current.scrollTop + colorPatternsScrollRef.current.clientHeight >= colorPatternsScrollRef.current.scrollHeight - 50) && !isLoadingColorPatterns && hasMoreColorPatterns) {
      setFilterPages(prevPages => ({
        ...prevPages,
        colorPatterns: prevPages.colorPatterns + 1
      }));
    }
    if ((numberedScrollRef.current.scrollTop + numberedScrollRef.current.clientHeight >= numberedScrollRef.current.scrollHeight - 50) && !isLoadingNumbered && hasMoreNumbered) {
      setFilterPages(prevPages => ({
        ...prevPages,
        numbered: prevPages.numbered + 1
      }));
    }
    if ((autoScrollRef.current.scrollTop + autoScrollRef.current.clientHeight >= autoScrollRef.current.scrollHeight - 50) && !isLoadingAuto && hasMoreAuto) {
      setFilterPages(prevPages => ({
        ...prevPages,
        auto: prevPages.auto + 1
      }));
    }
  };

  useEffect(() => {
    if (cardSetsScrollRef.current) {
      cardSetsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardSetsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreCardSets]);

  useEffect(() => {
    if (cardVariantsScrollRef.current) {
      cardVariantsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardVariantsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreCardVariants]);

  useEffect(() => {
    if (cardYearsScrollRef.current) {
      cardYearsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardYearsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreCardYears]);

  useEffect(() => {
    if (cardColorsScrollRef.current) {
      cardColorsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => cardColorsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreCardColors]);

  useEffect(() => {
    if (teamsScrollRef.current) {
      teamsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => teamsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreTeams]);

  useEffect(() => {
    if (colorPatternsScrollRef.current) {
      colorPatternsScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => colorPatternsScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreColorPatterns]);

  useEffect(() => {
    if (numberedScrollRef.current) {
      numberedScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => numberedScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreNumbered]);

  useEffect(() => {
    if (autoScrollRef.current) {
      autoScrollRef.current.addEventListener('scroll', handlePullToRefresh);
      return () => autoScrollRef.current.removeEventListener('scroll', handlePullToRefresh);
    }
  }, [hasMoreAuto]);

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
                      option.name.toLowerCase().includes(filterSearchTerms[filterKey].toLowerCase())
                    )
                    .map((option, index) => (
                      <div
                        key={index}
                        className={styles.filterOption}
                        ref={
                          (filterKey === 'cardSets' || filterKey === 'cardVariants' || filterKey === 'cardYears' || filterKey === 'cardColors' ||
                            filterKey === 'teams' || filterKey === 'colorPatterns' || filterKey === 'numbered' || filterKey === 'auto') &&
                            index === filterOptions[filterKey].length - 1 ? lastElementRefs[filterKey] : null
                        }
                      >
                        <label>
                          <input
                            type="checkbox"
                            disabled={
                              (isLoadingCardSets && filterKey === 'cardSets') ||
                              (isLoadingCardVariants && filterKey === 'cardVariants') ||
                              (isLoadingCardYears && filterKey === 'cardYears') ||
                              (isLoadingCardColors && filterKey === 'cardColors') ||
                              (isLoadingTeams && filterKey === 'teams') ||
                              (isLoadingColorPatterns && filterKey === 'colorPatterns') ||
                              (isLoadingNumbered && filterKey === 'numbered') ||
                              (isLoadingAuto && filterKey === 'auto')
                            }
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
                  {(filterKey === 'cardSets' && hasMoreCardSets) ||
                    (filterKey === 'cardVariants' && hasMoreCardVariants) ||
                    (filterKey === 'cardYears' && hasMoreCardYears) ||
                    (filterKey === 'cardColors' && hasMoreCardColors) ||
                    (filterKey === 'teams' && hasMoreTeams) ||
                    (filterKey === 'colorPatterns' && hasMoreColorPatterns) ||
                    (filterKey === 'numbered' && hasMoreNumbered) ||
                    (filterKey === 'auto' && hasMoreAuto) ? (
                    <div className={styles.scrollIndicator}>
                      {isLoadingCardSets ||
                        isLoadingCardVariants ||
                        isLoadingCardYears ||
                        isLoadingCardColors ||
                        isLoadingTeams ||
                        isLoadingColorPatterns ||
                        isLoadingNumbered ||
                        isLoadingAuto ? <Spinner /> : <MdKeyboardArrowDown size={24} />}
                    </div>
                  ) : null}
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
