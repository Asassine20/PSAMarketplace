// pages/account.js
import React from 'react';
import useAuth from '../../hooks/useAuth';
import Link from 'next/link';
import styles from '../../styles/sidepanel/Account.module.css';

const Account = () => {
  const { email } = useAuth();

  return (
    <div className={styles.accountContainer}>
      {email ? (
        <div className={styles.userInfo}>
          <h3>Hello, {email}</h3>
          <div className={styles.linksContainer}>
            <Link href="/orders">
              <div className={styles.dashboardLink}>Your Orders</div>
            </Link>
            <Link href="/resolution-center">
              <div className={styles.dashboardLink}>Resolution Center</div>
            </Link>
            <Link href="/messages">
              <div className={styles.dashboardLink}>Messages</div>
            </Link>
            <Link href="/payment-methods">
              <div className={styles.dashboardLink}>Payment Methods</div>
            </Link>
            <Link href="/address">
              <div className={styles.dashboardLink}>Address</div>
            </Link>
            <Link href="/contact">
              <div className={styles.dashboardLink}>Contact Us</div>
            </Link>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Account;
