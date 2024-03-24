import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUser, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const [sports, setSports] = useState([]);

  useEffect(() => {
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

  return (
    <div className={styles.navbarContainer}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={70} height={70} style={{ cursor: 'pointer' }} />
        </Link>
        <div className={styles.rightNav}>
          <FontAwesomeIcon icon={faUser} size="2x" className={styles.navIcon} />
          <Link href="/sell">
            <span className={styles.startSellingButton}>Start Selling</span>
          </Link>
          <FontAwesomeIcon icon={faShoppingCart} size="2x" className={styles.navIcon} />
        </div>
      </div>
      <div className={styles.searchBarContainer}>
        <form className={styles.searchForm}>
          <input type="text" placeholder="Search for cards..." className={styles.searchInput} />
          <button type="submit" className={styles.searchButton}>
            <FontAwesomeIcon icon={faSearch} />
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
