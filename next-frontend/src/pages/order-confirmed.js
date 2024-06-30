import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';
import styles from '../styles/OrderConfirmed.module.css';

const OrderConfirmed = () => {
  const router = useRouter();
  const { orderNumbers } = router.query;
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setMounted(true);
    if (orderNumbers) {
      const orderNumbersArray = orderNumbers.split(',');
      fetchStoreNames(orderNumbersArray);
    }
  }, [orderNumbers]);

  const fetchStoreNames = async (orderNumbersArray) => {
    try {
      const response = await fetch('/api/cart/store-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumbers: orderNumbersArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store names');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching store names:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <FaCheckCircle className={styles.icon} />
        <h1>Thank You for Your Order!</h1>
        <p>Your order has been placed with the following stores:</p>
        <ul className={styles.orderList}>
          {orders.map((order, index) => (
            <li key={index} className={styles.orderItem}>
              <span className={styles.storeName}>{order.StoreName}</span> - Order Number:{" "}
              <Link href={`/order-history?orderNumber=${order.OrderNumber}`}>
                <span className={styles.orderLink}>{order.OrderNumber}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>Each store has been notified and will ship your order within 1-3 business days</p>
        <Link href="/search?cardName=&page=1&inStock=true">
          <span className={styles.continueShoppingButton}>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmed;
