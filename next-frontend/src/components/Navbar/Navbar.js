import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { IoCartOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";


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
        <div className={styles.logosContainer}> {/* Container for both logos */}
          <Link href="/">
            <Image src="/logo.png" alt="Logo" width={80} height={80} style={{ cursor: 'pointer' }} />
          </Link>
          <a href="https://www.psacard.com" target="_blank" rel="noopener noreferrer">
            <Image src="/psaLogo.png" alt="PSA Logo" width={70} height={70} style={{ cursor: 'pointer', paddingLeft: '10px' }}/>
          </a>
        </div>
        <div className={styles.rightNav}>
          <FaRegUser className={`${styles.navIcon} ${styles.faIcon}`} />
          <Link href="/sell">
            <span className={styles.startSellingButton}>Start Selling</span>
          </Link>
          <IoCartOutline className={`${styles.navIcon} ${styles.mdIcon}`} />
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
