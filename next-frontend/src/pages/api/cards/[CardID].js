import { query } from '@/db';  // Ensure this import path is correctly pointing to your database module

export default async function handler(req, res) {
    // Since you've renamed your route parameter to CardID, use it directly
    const CardID = req.query.CardID;

    console.log("Received CardID: ", CardID);  // Debugging output to verify the correct ID is received

    try {
        const sql = `
            SELECT Card.*, 
                   Card.MarketPrice, 
                   COUNT(Inventory.CardID) as ListingsCount
            FROM Card
            LEFT JOIN Inventory ON Card.CardID = Inventory.CardID
            WHERE Card.CardID = ?
            GROUP BY Card.CardID`;

        // Use the CardID directly in your query parameter list
        const results = await query(sql, [CardID]);

        if (results.length > 0) {
            res.status(200).json({ card: results[0] });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error fetching card data:", error);
        res.status(500).json({ message: "Error fetching card data" });
    }
}
