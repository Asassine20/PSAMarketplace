import { query } from '@/db';

export default async function handler(req, res) {
    const CardID = req.query.CardID;

    try {
        const cardSql = `
            SELECT *
            FROM Card
            WHERE CardID = ?;
        `;

        const listingsSql = `
            SELECT *
            FROM Inventory
            WHERE CardID = ?
            ORDER BY SalePrice DESC;  
        `;

        // Execute both queries
        const cardResults = await query(cardSql, [CardID]);
        const listingsResults = await query(listingsSql, [CardID]);

        if (cardResults.length > 0) {
            const card = cardResults[0];
            card.listings = listingsResults;  // Attach listings to the card object
            res.status(200).json({ card });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error fetching card data and listings:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
}
