// src/pages/order-history.js
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/OrderHistory.module.css'; // Using new CSS file
import Image from 'next/image';
import Link from 'next/link';
import ImageModal from '../../components/ImageModal/ImageModal';
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal';

const OrderHistory = () => {
  const { userId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/sidepanel/order-history?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data);
          } else {
            setOrders([]);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching orders:', error);
          setLoading(false);
        });
    }
  }, [userId]);

  const formatCardInfo = (item) => {
    const info = [
      item.CardName,
      item.CardSet,
      item.CardYear,
      item.CardColor,
      item.CardVariant
    ].filter(Boolean).join(' - ');

    return info;
  };

  const handleImageClick = (imageUrl) => {
    setModalImages([imageUrl]);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setModalImages([]);
  };

  const openFeedbackModal = (order) => {
    setSelectedOrder(order);
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className={styles.orderHistoryPage}>
      <h1 className={styles.title}>Order History</h1>
      <div className={styles.orderHistoryWrapper}>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <div className={styles.emptyMessage}>
            <p>No orders found.</p>
          </div>
        ) : (
          <div className={styles.orders}>
            {orders.map(order => (
              <div key={order.OrderNumber} className={styles.package}>
                <div className={styles.packageHeader}>
                  <div className={styles.storeInfo}>
                    <span>{order.StoreName} ({order.FeedbackAverage}%)</span>
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionButton}>Contact Seller</button>
                    <button className={styles.actionButton} onClick={() => openFeedbackModal(order)}>Leave Feedback</button>
                  </div>
                </div>
                <div className={styles.packageDetails}>
                  <p className={styles.OrderDate}>Order Number: {order.OrderNumber}</p>
                  <p>Order Date: {new Date(order.OrderDate).toLocaleDateString()}</p>
                  <p>Order Amount: ${order.OrderAmount}</p>
                  <h3>Items</h3>
                  <ul>
                    {order.items.length === 0 ? (
                      <li>No items found for this order.</li>
                    ) : (
                      order.items.map(item => (
                        <li key={item.OrderItemID} className={styles.cartItem}>
                          <div className={styles.cartItemDetailsTop}>
                            <div className={styles.cartItemDetailsLeft}>
                              <div className={styles.cartItemImages}>
                                {item.FrontImageUrl ? (
                                  <Image
                                    src={item.FrontImageUrl}
                                    alt={item.CardName}
                                    width={100}
                                    height={100}
                                    className={styles.cartItemImage}
                                    onClick={() => handleImageClick(item.FrontImageUrl)}
                                  />
                                ) : (
                                  <p>No image available</p>
                                )}
                              </div>
                            </div>
                            <div className={styles.cartItemDetails}>
                              <Link href={`/cards/${item.CardID}/${item.CardName}`} className={styles.cartItemDetailsLink}>
                                <p className={styles.largeTextStrong}>
                                  {formatCardInfo(item)}
                                </p>
                              </Link>
                              <p className={styles.largeText}>Grade: {item.GradeValue}</p>
                              <p className={styles.largeText}>
                                <a href={`https://www.psacard.com/cert/${item.CertNumber}`} target="_blank" rel="noopener noreferrer">
                                  Cert Number: {item.CertNumber}
                                </a>
                              </p>
                            </div>
                            <div className={styles.cartItemPrices}>
                              <p className={styles.largeTextStrong}><strong>${(Number(item.Price || 0)).toFixed(2)}</strong></p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalImages.length > 0 && (
        <ImageModal images={modalImages} initialIndex={currentImageIndex} onClose={closeModal} />
      )}

      {isFeedbackModalOpen && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={closeFeedbackModal}
          order={selectedOrder}
          userId={userId}
        />
      )}
    </div>
  );
};

export default OrderHistory;
