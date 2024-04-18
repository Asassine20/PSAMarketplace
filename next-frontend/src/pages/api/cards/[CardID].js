import { query } from '@/db';

export default async function handler(req, res) {
    const CardID = req.query.CardID;

    try {
        // Fetching card details and market price history
        const cardSql = `
            SELECT *
            FROM Card
            WHERE CardID = ?;
        `;
        const pricesSql = `
            SELECT Price, DateRecorded
            FROM MarketPriceHistory
            WHERE CardID = ?
            ORDER BY DateRecorded ASC;
        `;

        // Execute both queries
        const cardResults = await query(cardSql, [CardID]);
        const priceResults = await query(pricesSql, [CardID]);

        if (cardResults.length > 0) {
            const card = cardResults[0];
            card.prices = priceResults;  // Append price history to the card object
            res.status(200).json({ card });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error fetching card data and price history:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
}
