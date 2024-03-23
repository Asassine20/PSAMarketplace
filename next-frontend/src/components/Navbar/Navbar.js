import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

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
      <div className={styles.searchBarContainer}>
        <form className={styles.searchForm}>
          <input type="text" placeholder="Search for cards..." className={styles.searchInput}/>
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
