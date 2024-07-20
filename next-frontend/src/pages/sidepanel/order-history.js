import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/OrderHistory.module.css';
import Image from 'next/image';
import Link from 'next/link';
import ImageModal from '../../components/ImageModal/ImageModal';
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal';

const subjects = [
  'Request To Cancel',
  'Condition Issue',
  'Item Never Arrived',
  'Change Address',
  'Items Missing',
  'Received Wrong Item(s)',
  'General Message'
];

const OrderHistory = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (userId) {
      const { orderNumber } = router.query;
      fetch(`/api/sidepanel/order-history?userId=${userId}&orderNumber=${orderNumber || ''}`)
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
  }, [userId, router.query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      router.push(`/sidepanel/order-history?orderNumber=${searchOrderNumber.trim()}`);
    } else {
      router.push('/sidepanel/order-history');
    }
  };

  const formatCardInfo = (item) => {
    const info = [
      item.CardName,
      item.CardSet,
      item.CardYear,
      item.CardColor,
      item.CardVariant,
      item.Numbered ? `Numbered: ${item.Numbered}` : '',
      item.Team,
      item.Auto === 1 ? 'Auto' : '',
      item.ColorPattern
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

  const handleContactSeller = (order) => {
    setSelectedOrder(order);
    setSelectedSeller(order.SellerID);
    setIsSubjectModalOpen(true);
  };

  const handleStartConversation = () => {
    fetch('/api/sidepanel/startConversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sellerId: selectedSeller,
        orderNumber: selectedOrder.OrderNumber,
        subject: selectedSubject,
        messageText // send the message text to the server
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          router.push(`/sidepanel/messages?conversationId=${data.conversationId}`);
        }
      })
      .catch(error => console.error('Error starting conversation:', error));
  };

  const handleDidntReceiveItem = (order) => {
    setSelectedSubject('Item Never Arrived');
    handleContactSeller(order);
  };

  const handleReturnItem = (order) => {
    setSelectedSubject('Request To Cancel');
    handleContactSeller(order);
  };

  return (
    <div className={styles.orderHistoryPage}>
      <h1 className={styles.title}>Order History</h1>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={searchOrderNumber}
          onChange={(e) => setSearchOrderNumber(e.target.value)}
          placeholder="Enter order number"
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>Search</button>
      </form>
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
                    <button className={styles.actionButton} onClick={() => handleContactSeller(order)}>Contact Seller</button>
                    <button className={styles.actionButton} onClick={() => openFeedbackModal(order)}>Leave Feedback</button>
                    <button className={styles.actionButton} onClick={() => handleDidntReceiveItem(order)}>Didn't Receive Item</button>
                    <button className={styles.actionButton} onClick={() => handleReturnItem(order)}>Return Item</button>
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

      {isSubjectModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Contact Seller</h2>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={styles.subjectSelect}
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here"
              className={styles.messageTextArea}
            />
            <button onClick={() => setIsSubjectModalOpen(false)} className={styles.cancelButton}>Cancel</button>
            <button onClick={handleStartConversation} className={styles.actionButton}>Start Conversation</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
