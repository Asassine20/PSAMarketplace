import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { IoCartOutline } from 'react-icons/io5';
import { FaRegUser } from 'react-icons/fa';
import { useCart } from '../Cart/CartProvider';

const Navbar = () => {
  const [sports, setSports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeSport, setActiveSport] = useState(null);
  const [recentCardSets, setRecentCardSets] = useState([]);
  const router = useRouter();
  const { cart } = useCart();
  const sidePanelRef = useRef(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(decodedToken.email);
        }
      }
    };

    checkLoginStatus();

    fetch('/api/nav-sports')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSports(data.filter(sport => sport.Sport)); // Remove empty nav links
        } else {
          setSports([]);
        }
      })
      .catch(error => console.error('Error fetching sports:', error));

    window.addEventListener('storage', checkLoginStatus);

    setMounted(true);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    router.push({
      pathname: '/search',
      query: {
        cardName: query,
        page: '1',
        inStock: query ? 'false' : 'true',
      },
    });
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleSignOut = async () => {
    const sessionId = localStorage.getItem('sessionId');

    if (sessionId) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ sessionId })
      });
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('sessionId');
    setIsLoggedIn(false);
    router.push('/').then(() => {
      window.location.reload();
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidePanelRef.current && !sidePanelRef.current.contains(event.target)) {
        setIsSidePanelOpen(false);
      }
    };

    if (isSidePanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidePanelOpen]);

  const handleNavLinkClick = (sport) => {
    if (activeSport === sport) {
      setActiveSport(null);
    } else {
      setActiveSport(sport);
      fetch(`/api/nav-cardsets?sport=${sport}`)
        .then(response => response.json())
        .then(data => setRecentCardSets(data))
        .catch(error => console.error('Error fetching recent card sets:', error));
    }
  };

  return (
    <div className={styles.navbarContainer}>
      <div className={styles.headerContainer}>
        <div className={styles.logosContainer}>
          <Link href="/" passHref>
            <Image src="/logo.png" alt="Logo" width={80} height={80} style={{ cursor: 'pointer' }} />
          </Link>
          <a href="https://www.psacard.com" target="_blank" rel="noopener noreferrer">
            <Image src="/psaLogo.png" alt="PSA Logo" width={70} height={70} style={{ cursor: 'pointer', paddingLeft: '10px' }} />
          </a>
        </div>
        <div className={styles.rightNav}>
          <FaRegUser onClick={toggleSidePanel} className={`${styles.navIcon} ${styles.faIcon}`} />
          <a href="http://localhost:3001/register" target="_blank" rel="noopener noreferrer">
            <span className={styles.startSellingButton}>Start Selling</span>
          </a>
          <Link href="/cart" passHref>
            <div className={styles.cartIconWrapper}>
              <IoCartOutline className={`${styles.navIcon} ${styles.mdIcon}`} />
              {mounted && cart.length > 0 && <span className={styles.cartBadge}>{cart.length}</span>}
            </div>
          </Link>
        </div>
      </div>
      {isSidePanelOpen && (
        <div className={styles.sidePanel} ref={sidePanelRef}>
          {isLoggedIn ? (
            <div className={styles.panelContent}>
              <div className={styles.userInfo}>
                <h3>Hello, {userEmail}</h3>
              </div>
              <div className={styles.accountSection}>
                <h3>Account</h3>
                <Link href="/account">Account</Link>
                <Link href="/orders">Orders History</Link>
                <Link href="/messages">Messages</Link>
                <Link href="/payment">Payment Methods</Link>
                <Link href="/address">Address</Link>
              </div>
              <div className={styles.sellerHelpSection}>
                <h3>Seller</h3>
                <Link href="/seller">Seller Account</Link>
                <Link href="/dashboard">Seller Dashboard</Link>
                <h3>Help</h3>
                <Link href="/contact">Contact Us</Link>
                <Link href="/refund">Refund Return Policy</Link>
                <Link href="/protection">GemTCG Order Protection</Link>
                <Link href="/about">About Us</Link>
              </div>
              <button className={styles.signOutButton} onClick={handleSignOut}>Sign Out</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <button className={styles.loginButton} onClick={() => router.push('/login')}>Log In</button>
                <button className={styles.signUpButton} onClick={() => router.push('/register')}>Sign Up</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.searchBarContainer}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search for cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: '20px', color: 'black' }} />
          </button>
        </form>
      </div>
      <nav className={styles.navbar}>
        <div className={styles.sportsLinks}>
          {Array.isArray(sports) && sports.map((sport, index) => (
            <div
              key={index}
              className={styles.navLinkContainer}
            >
              <div
                className={styles.navLink}
                onClick={() => handleNavLinkClick(sport.Sport)}
              >
                {sport.Sport}
              </div>
              {activeSport === sport.Sport && (
                <div className={styles.miniPanel}>
                  <div className={styles.miniPanelHeader}>
                    <span className={styles.miniPanelSport}><b>{sport.Sport}</b></span>
                    <Link
                      href={{
                        pathname: '/search',
                        query: {
                          cardName: '',
                          page: '1',
                          inStock: 'true',
                          sports: sport.Sport
                        }
                      }}
                      passHref
                    >
                      <span className={styles.shopAllButton}>Shop All</span>
                    </Link>
                  </div>
                  <div className={styles.miniPanelTitle}>Recent Sets</div>
                  <ul className={styles.miniPanelList}>
                    {recentCardSets.map((cardSet, idx) => (
                      <li key={idx}>
                        <Link
                          href={{
                            pathname: '/search',
                            query: {
                              cardName: '',
                              page: '1',
                              inStock: 'true',
                              sports: sport.Sport,
                              cardSets: cardSet.CardSet
                            }
                          }}
                          passHref
                        >
                          <span className={styles.miniPanelItem}>{cardSet.CardSet}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
