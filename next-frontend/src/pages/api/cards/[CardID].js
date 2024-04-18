import { query } from '@/db';

export default async function handler(req, res) {
    const CardID = req.query.CardID;

    try {
        const cardSql = `
            SELECT *
            FROM Card
            WHERE CardID = ?;
        `;

        // Updated SQL to join Inventory with Stores and Grade tables and fetch additional details
        const listingsSql = `
            SELECT Inventory.*, Stores.StoreName, Stores.ShippingPrice, Stores.FeedbackAverage, Grade.GradeValue
            FROM Inventory
            LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID  
            LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID  
            WHERE Inventory.CardID = ?
            ORDER BY Inventory.SalePrice DESC;  
        `;

        // Execute both queries
        const cardResults = await query(cardSql, [CardID]);
        const listingsResults = await query(listingsSql, [CardID]);

        if (cardResults.length > 0) {
            const card = cardResults[0];
            card.listings = listingsResults;  // Attach enhanced listings to the card object
            res.status(200).json({ card });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error fetching card data and listings:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
}
