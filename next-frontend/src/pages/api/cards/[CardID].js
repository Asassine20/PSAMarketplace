import { query } from '@/db';

export default async function handler(req, res) {
    const CardID = req.query.CardID;
    console.log("Received CardID:", CardID);  // Debugging output to verify the correct ID is received

    try {
        const cardSql = `
            SELECT *
            FROM Card
            WHERE CardID = ?;
        `;
        const listingsSql = `
            SELECT Inventory.*, Stores.StoreName, Stores.ShippingPrice, Stores.FeedbackAverage, Grade.GradeValue
            FROM Inventory
            LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID  
            LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID  
            WHERE Inventory.CardID = ?
            ORDER BY Inventory.SalePrice DESC;
        `;
        const salesSql = `
            SELECT 
                OrderItems.Price as Price, 
                Orders.OrderDate as OrderDate, 
                Grade.GradeValue as GradeValue
            FROM OrderItems
            JOIN Orders ON OrderItems.OrderNumber = Orders.OrderNumber
            JOIN Grade ON OrderItems.GradeID = Grade.GradeID
            WHERE OrderItems.CardID = ?
            ORDER BY Orders.OrderDate DESC;
        `;
    

        // Execute all queries
        const cardResults = await query(cardSql, [CardID]);
        const listingsResults = await query(listingsSql, [CardID]);
        const salesResults = await query(salesSql, [CardID]);
        console.log("Card Results:", cardResults);  // Check the output directly after fetching
        console.log("Sales Results:", salesResults);

        if (cardResults.length > 0) {
            const card = cardResults[0];
            card.listings = listingsResults;
            card.sales = salesResults;  // Attach sales data to the card object
            res.status(200).json({ card });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error fetching card data, listings, and sales:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
}
