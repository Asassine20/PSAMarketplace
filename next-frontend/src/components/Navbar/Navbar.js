import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { IoCartOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { useCart } from '../Cart/CartProvider'; // Import the useCart hook

const Navbar = () => {
  const [sports, setSports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [mounted, setMounted] = useState(false); // New state to track if component has mounted
  const router = useRouter();
  const { cart } = useCart(); // Access the cart context
  const panelRef = useRef(null); // Ref for the side panel

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
      console.log('User is logged in:', loggedIn);
    };

    checkLoginStatus();

    fetch('/api/nav-sports')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSports(data);
        } else {
          console.error('Data is not an array:', data);
          setSports([]);
        }
      })
      .catch(error => console.error('Error fetching sports:', error));

    window.addEventListener('storage', checkLoginStatus);

    setMounted(true); // Set mounted to true when component has mounted

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search?cardName=${encodeURIComponent(searchQuery)}`);
  };

  const togglePanel = () => {
    console.log('Panel toggled, isLoggedIn:', isLoggedIn);
    setIsPanelOpen(!isPanelOpen);
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
      window.location.reload(); // Refresh the page after redirecting to the home page
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

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
          <FaRegUser onClick={togglePanel} className={`${styles.navIcon} ${styles.faIcon}`} />
          <a href="http://localhost:3001/register" target="_blank" rel="noopener noreferrer">
            <span className={styles.startSellingButton}>Start Selling</span>
          </a>
          <Link href="/cart" passHref>
            <div className={styles.cartIconWrapper}>
              <IoCartOutline className={`${styles.navIcon} ${styles.mdIcon}`} />
              {mounted && cart.length > 0 && <span className={styles.cartBadge}>{cart.length}</span>} {/* Only render cart badge if component has mounted */}
            </div>
          </Link>
        </div>
      </div>
      {isPanelOpen && (
        <div className={styles.sidePanel} ref={panelRef}>
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
            <Link key={index} href={`/sports/${(sport.Sport || '').toLowerCase()}`} passHref>
              <div className={styles.navLink}>{sport.Sport}</div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
