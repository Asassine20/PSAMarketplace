// pages/cards/[CardID]/[slug].js
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import useSWR from 'swr';
import { FaStar } from 'react-icons/fa';
import Image from 'next/image';
import styles from '../../../styles/Card.module.css';
import ImageModal from '../../../components/ImageModal/ImageModal';
import Alert from '../../../components/Alert/Alert';
import { useCart } from '../../../components/Cart/CartProvider';
import SalesModal from '../../../components/SalesModal/SalesModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CardDetails() {
  const router = useRouter();
  const { CardID, slug } = router.query;
  const { data, error } = useSWR(CardID ? `/api/cards/${CardID}` : null, fetcher);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const { addToCart } = useCart();

  const handleImageClick = (images, index) => {
    setModalImages(images);
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setModalImages([]);
  };

  const handleAddToCart = async (listing) => {
    const { success, message } = await addToCart(listing);
    setAlertMessage(message);
    setAlertType(success ? 'success' : 'error');
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
  };

  const handleShowSalesModal = () => {
    setShowSalesModal(true);
  };

  const closeSalesModal = () => {
    setShowSalesModal(false);
  };

  if (error) return <div>Failed to load data</div>;
  if (!data) return <div>Loading...</div>;
  if (!data.card) return <div>Card not found</div>;

  const { card } = data;

  return (
    <div className={styles.cardDetail}>
      <div className={styles.cardImageWrapper}>
        <Image
          src={card.CardImage}
          alt={card.CardName}
          width={400}
          height={600}
          layout="intrinsic"
          className={styles.cardImage}
        />
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardInfo}>
          <h1 style={{ fontSize: '34px' }}>{card.CardName}</h1>
          <p><strong>Sport:</strong> {card.Sport}</p>
          {card.CardYear && <p><strong>Year:</strong> {card.CardYear}</p>}
          <p><strong>Set:</strong> {card.CardSet}</p>
          <p><strong>Number:</strong> {card.CardNumber}</p>
          {card.CardVariant && <p><strong>Variant:</strong> {card.CardVariant}</p>}
          {card.CardColor && <p><strong>Color:</strong> {card.CardColor}</p>}
          {card.Numbered && <p><strong>Numbered:</strong> {card.Numbered}</p>}
          {card.Team && <p><strong>Team:</strong> {card.Team}</p>}
          {card.Auto === 1 && <p><strong>Auto:</strong> Yes</p>}
          {card.ColorPattern && <p><strong>Color Pattern:</strong> {card.ColorPattern}</p>}
          <p><strong>Market Price:</strong> {card.MarketPrice !== null && card.MarketPrice !== undefined ? `$${card.MarketPrice}` : 'N/A'}</p>
        </div>
        <div className={styles.latestSales}>
          <h2 style={{ textAlign: 'left', fontSize: '20px' }}>Latest Sales</h2>
          <div className={data?.card?.sales?.length ? '' : styles.blurEffect}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Grade</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {data?.card?.sales?.slice(0, 3).map((sale, index) => (
                  <tr key={index} className={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td>{new Date(sale.OrderDate).toLocaleDateString()}</td>
                    <td>{sale.GradeValue}</td>
                    <td>${sale.Price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.card.sales.length > 3 && (
              <button onClick={handleShowSalesModal} className={styles.seeMoreButton}>
                See More Sales
              </button>
            )}
          </div>
          {data?.card?.sales?.length === 0 && (
            <div className={styles.noSalesOverlay}>No sales yet for this card</div>
          )}
        </div>
      </div>
      {data.card.listings && data.card.listings.length > 0 ? (
        <>
          <h2 className={styles.listingsHeader}>
            {data.card.listings.length} {data.card.listings.length === 1 ? 'Listing' : 'Listings'}
          </h2>
          <div className={styles.listingsContainer}>
            {data.card.listings.map((listing) => (
              <div key={listing.ListingID} className={styles.listingCard}>
                <div className={styles.listingImages}>
                  <img
                    src={listing.FrontImageURL}
                    alt="Front"
                    className={styles.listingImage}
                    onClick={() => handleImageClick([listing.FrontImageURL, listing.BackImageURL], 0)}
                  />
                  <img
                    src={listing.BackImageURL}
                    alt="Back"
                    className={styles.listingImage}
                    onClick={() => handleImageClick([listing.FrontImageURL, listing.BackImageURL], 1)}
                  />
                </div>
                <div className={styles.listingDetails}>
                  <div className={styles.listingInfo}>
                    <span>{listing.StoreName}</span>
                    {listing.FeedbackAverage > 95 && (
                      <div className={styles.starContainer}>
                        <FaStar style={{ color: '#0070f3', marginLeft: '5px', marginRight: '5px' }} />
                        <span className={styles.tooltip}>Star Seller</span>
                      </div>
                    )}
                    <sup className={styles.feedbackInfo}>({listing.FeedbackAverage}%)</sup>
                  </div>
                  <div className={styles.listingPriceDetails}>
                    <div className={`${styles.listingInfo} ${styles.salePriceInfo}`}>${listing.SalePrice}</div>
                    <div className={`${styles.listingInfo} ${styles.shippingPriceInfo}`}>+ ${listing.ShippingPrice} Shipping</div>
                  </div>
                  <div className={styles.listingInfo}>Grade: {listing.GradeValue}</div>
                  <div className={styles.listingInfo}>
                    <a href={`https://www.psacard.com/cert/${listing.CertNumber}`} target="_blank" rel="noopener noreferrer">
                      Cert Number: <span className={styles.underlinedText}>{listing.CertNumber}</span>
                    </a>
                  </div>
                </div>
                <div className={styles.listingAction}>
                  <button
                    className={styles.button}
                    onClick={() => handleAddToCart(listing)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.listingsEmpty}>
          <h2 className={styles.listingsHeader}>No current listings</h2>
        </div>
      )}

      {modalImages.length > 0 && (
        <ImageModal images={modalImages} initialIndex={currentImageIndex} onClose={closeModal} />
      )}

      {showAlert && <Alert message={alertMessage} onClose={() => setShowAlert(false)} type={alertType} />}

      {showSalesModal && <SalesModal cardID={CardID} onClose={closeSalesModal} />}
    </div>
  );
}

export default CardDetails;
