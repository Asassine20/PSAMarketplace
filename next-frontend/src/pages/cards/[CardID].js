import { useRouter } from 'next/router';
import useSWR from 'swr';
import Image from 'next/image';
import styles from '../../styles/Card.module.css';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CardDetails() {
    const router = useRouter();
    const { CardID } = router.query;
    const { data, error } = useSWR(CardID ? `/api/cards/${CardID}` : null, fetcher);

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
                    <p><strong>Listings:</strong> {card.ListingsCount}</p>
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
                            <tr>
                                <td>1/4/24</td>
                                <td>9.5</td>
                                <td>$200</td>
                            </tr>
                            <tr>
                                <td>1/4/24</td>
                                <td>10</td>
                                <td>$300</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={styles.listingsTable}>
                <p>Current Sellers Listing Here</p>
            </div>
        </div>
    );
}

export default CardDetails;
