// Navbar.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { IoCartOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";

const Navbar = () => {
  const [sports, setSports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // State to track login status
  const router = useRouter();

  useEffect(() => {
    // Example: Check local storage or cookie for user authentication status
    setIsLoggedIn(!!localStorage.getItem('user'));

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
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search?cardName=${encodeURIComponent(searchQuery)}`);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
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
          <FaRegUser onClick={togglePanel} className={`${styles.navIcon} ${styles.faIcon}`} />
          <a href="http://localhost:3001/register" target="_blank" rel="noopener noreferrer">
            <span className={styles.startSellingButton}>Start Selling</span>
          </a>
          <IoCartOutline className={`${styles.navIcon} ${styles.mdIcon}`} />
        </div>
      </div>
      {isPanelOpen && (
        <div className={styles.sidePanel}>
          {isLoggedIn ? (
            <div className={styles.panelContent}>
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
            </div>
          ) : (
            <>
              <h2>You are not signed in</h2>
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
            <Link key={index} href={`/sports/${sport.Sport.toLowerCase()}`} passHref>
              <div className={styles.navLink}>{sport.Sport}</div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
