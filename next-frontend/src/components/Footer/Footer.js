// components/Footer.js
import Link from 'next/link';
import { FaFacebookF, FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa'; // Import social media icons
import styles from './Footer.module.css'; // Path to your CSS module file

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerSection}>
        <h4>Contact Us</h4>
        <Link href="/contact" className={styles.link}>Contact Page</Link>
      </div>
      <div className={styles.footerSection}>
        <h4>Shop Categories</h4>
        <Link href="/pokemon-english" className={styles.link}>Pokemon (English)</Link>
        <Link href="/pokemon-japan" className={styles.link}>Pokemon (Japan)</Link>
        <Link href="/football" className={styles.link}>Football</Link>
        <Link href="/baseball" className={styles.link}>Baseball</Link>
        <Link href="/basketball" className={styles.link}>Basketball</Link>
        <Link href="/hockey" className={styles.link}>Hockey</Link>

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
    </footer>
  );
};

export default Footer;
