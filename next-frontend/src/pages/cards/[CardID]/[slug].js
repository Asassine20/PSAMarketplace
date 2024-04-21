import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import styles from '../../../styles/Card.module.css';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CardDetails() {
    const router = useRouter();
    const { CardID, slug } = router.query;
    const { data, error } = useSWR(CardID ? `/api/cards/${CardID}` : null, fetcher);
    console.log("Data loaded:", data);  // Check what data is actually being loaded
    console.log("Error:", error);  // Check if there are any errors
    const [hoveredImage, setHoveredImage] = useState(null);
    const imageRef = useRef(null);

    useEffect(() => {
        window.addEventListener('resize', checkSize);
        checkSize();  // Initial check
        return () => {
            window.removeEventListener('resize', checkSize);
            imageRef.current?.removeEventListener('click', handleImageClick);
        };
    }, []);

    const handleImageClick = (event) => setHoveredImage(event.target.src);

    const checkSize = () => {
        if (window.innerWidth <= 768) {
            imageRef.current?.addEventListener('click', handleImageClick);
        } else {
            imageRef.current?.removeEventListener('click', handleImageClick);
        }
    };

    if (error) return <div>Failed to load data</div>;
    if (!data) return <div>Loading...</div>;
    if (!data.card) return <div>Card not found</div>;

    const { card } = data;
    return (
        <div className={styles.cardDetail}>
            <div className={styles.cardImageWrapper}>
                <Image src={card.CardImage} alt={card.CardName} width={400} height={600} layout="intrinsic" className={styles.cardImage} />
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardInfo}>
                    <h1 style={{ fontSize: '34px' }}>{card.CardName}</h1>
                    <p><strong>Sport:</strong> {card.Sport}</p>
                    <p><strong>Set:</strong> {card.CardSet}</p>
                    <p><strong>Number:</strong> {card.CardNumber}</p>
                    <p><strong>Variant:</strong> {card.CardVariant || 'N/A'}</p>
                    <p><strong>Color:</strong> {card.CardColor || 'N/A'}</p>
                    <p><strong>Market Price:</strong> ${card.MarketPrice}</p>
                </div>
                <div className={styles.latestSales}>
                    <h2 style={{ textAlign: 'left' }}>Latest Sales</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Grade</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.card?.sales?.map((sale, index) => (
                                <tr key={index}>
                                    <td>{new Date(sale.OrderDate).toLocaleDateString()}</td>
                                    <td>{sale.GradeValue}</td>
                                    <td>${sale.Price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {data.card.listings && data.card.listings.length > 0 ? (
                <div className={styles.listingsContainer}>
                    {data.card.listings.map((listing, index) => (
                        <div key={index} className={styles.listingCard}>
                            <div className={styles.listingImages}>
                                <img
                                    src={listing.FrontImageURL}
                                    alt="Front"
                                    className={styles.listingImage}
                                    onMouseEnter={() => setHoveredImage(listing.FrontImageURL)}
                                    onMouseLeave={() => setHoveredImage(null)}
                                />
                                <img
                                    src={listing.BackImageURL}
                                    alt="Back"
                                    className={styles.listingImage}
                                    onMouseEnter={() => setHoveredImage(listing.BackImageURL)}
                                    onMouseLeave={() => setHoveredImage(null)}
                                />
                            </div>
                            <div className={styles.listingDetails}>
                                <div className={styles.listingInfo}><span>{listing.StoreName}</span><sup className={styles.feedbackInfo}>({listing.FeedbackAverage}%)</sup></div>
                                <div className={styles.listingPriceDetails}>
                                    <div className={`${styles.listingInfo} ${styles.salePriceInfo}`}>${listing.SalePrice}</div>
                                    <div className={`${styles.listingInfo} ${styles.shippingPriceInfo}`}>+ ${listing.ShippingPrice} Shipping</div>
                                </div>
                                <div className={styles.listingInfo}>Grade: {listing.GradeValue}</div>
                                <div className={styles.listingInfo}>
                                    <a href={`https://www.psacard.com/cert/${listing.CertNumber}`} target="_blank" rel="noopener noreferrer">
                                        Cert Number: {listing.CertNumber}
                                    </a>
                                </div>
                            </div>
                            <div className={styles.listingAction}>
                                <button className={styles.button}>Add to Cart</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.listingsTable}>
                    <p>No listings available for this card.</p>
                </div>
            )}
            {hoveredImage && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }}>
                    <img
                        src={hoveredImage}
                        style={{ width: '500px', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
                        alt="Enlarged"
                    />
                </div>
            )}
        </div>
    );
}

export default CardDetails;
