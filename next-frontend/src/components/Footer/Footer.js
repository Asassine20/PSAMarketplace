import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa';
import styles from './Footer.module.css';

const Footer = () => {
  const [sports, setSports] = useState([]);

  useEffect(() => {
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
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerSections}>
        <div className={styles.footerSection}>
          <h4>Contact Us</h4>
          <Link href="/contact" className={styles.link}>Contact Page</Link>
        </div>
        <div className={styles.footerSection}>
          <h4>Shop Categories</h4>
          {sports.map((sport, index) => (
            <Link
              key={index}
              href={{
                pathname: '/search',
                query: {
                  cardName: '',
                  page: '1',
                  inStock: 'true',
                  sports: sport.Sport
                }
              }}
              className={styles.link}
            >
              {sport.Sport}
            </Link>
          ))}
        </div>
        <div className={styles.footerSection}>
          <h4>Articles</h4>
          <Link href="/articles" className={styles.link}>Articles</Link>
        </div>
        <div className={styles.footerSection}>
          <h4>Become a Seller</h4>
          <Link href="/sell" className={styles.link}>Sell with Us</Link>
        </div>
        <div className={styles.footerSection}>
          <h4>About</h4>
          <Link href="/about" className={styles.link}>About Us</Link>
        </div>
        <div className={styles.footerSection}>
          <h4>PSA Grading</h4>
          <Link href="/grading" className={styles.link}>Grade Through Us</Link>
        </div>
        <div className={styles.socialMediaSection}>
          <h4>Follow us on social media</h4>
          <div className={styles.socialIcons}>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer">
              <FaTiktok className={styles.tiktokIcon} />
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebookF className={styles.facebookIcon} />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram className={styles.instagramIcon} />
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
              <FaYoutube className={styles.youtubeIcon} />
            </a>
          </div>
        </div>
      </div>
      <div className={styles.creditSection}>
        <p>This site utilizes data provided by PSA’s public API. For more information, visit <a href="https://www.psacard.com/publicapi" target="_blank" rel="noopener noreferrer">PSA's website</a>.</p>
      </div>
    </footer>
  );
};

export default Footer;
