import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/OrderConfirmed.module.css';

const OrderConfirmed = () => {
  const router = useRouter();
  const { orderNumber, storeName } = router.query;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Thank You for Your Order!</h1>
        <p>{storeName} has been notified and will ship your order as soon as possible.</p>
        <p>
          View your order summary here:{" "}
          <Link href={`/order-history?orderNumber=${orderNumber}`} legacyBehavior>
            <a className={styles.orderLink}>{orderNumber}</a>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmed;
