import React, { useState, useEffect } from 'react';
import styles from './SalesModal.module.css';

const SalesModal = ({ cardID, onClose }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardID}?offset=${offset}&limit=100`);
      const data = await response.json();
      if (data.card && data.card.sales.length > 0) {
        setSales((prevSales) => [...prevSales, ...data.card.sales]);
        setOffset((prevOffset) => prevOffset + 100);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}>X</button>
        <h2 className={styles.modalHeader}>Sales History</h2>
        <table className={styles.salesTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Grade</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr key={index} className={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                <td>{new Date(sale.OrderDate).toLocaleDateString()}</td>
                <td>{sale.GradeValue}</td>
                <td>${sale.Price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p>Loading...</p>}
        {!loading && hasMore && (
          <button onClick={loadSales} className={styles.loadMoreButton}>Load More</button>
        )}
      </div>
    </div>
  );
};

export default SalesModal;
