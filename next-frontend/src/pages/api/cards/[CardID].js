// /api/cards/[CardID].js
import { query } from '@/db';

export default async function handler(req, res) {
  const { CardID } = req.query;
  const { offset = 0, limit = 10 } = req.query;

  try {
    // Card details query
    const cardSql = `
      SELECT *
      FROM Card
      WHERE CardID = ?;
    `;

    // Listings details query including joins with Stores and Grade tables, and filtering out sold items
    const listingsSql = `
      SELECT Inventory.*, Stores.StoreName, Stores.ShippingPrice, Stores.FeedbackAverage, Grade.GradeValue
      FROM Inventory
      LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID  
      LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID  
      WHERE Inventory.CardID = ? AND Inventory.Sold = 0
      ORDER BY Inventory.SalePrice DESC;
    `;

    // Sales details query with pagination
    const salesSql = `
      SELECT OrderItems.Price as Price, Orders.OrderDate as OrderDate, Grade.GradeValue as GradeValue
      FROM OrderItems
      JOIN Orders ON OrderItems.OrderNumber = Orders.OrderNumber
      JOIN Grade ON OrderItems.GradeID = Grade.GradeID
      WHERE OrderItems.CardID = ?
      ORDER BY Orders.OrderDate DESC
      LIMIT ?, ?;
    `;

    // Query to count the number of listings
    const listingsCountSql = `
      SELECT COUNT(*) AS ListingCount
      FROM Inventory
      WHERE CardID = ? AND Sold = 0;
    `;

    // Execute all queries
    const [cardResults, listingsResults, listingsCountResults, salesResults] = await Promise.all([
      query(cardSql, [CardID]),
      query(listingsSql, [CardID]),
      query(listingsCountSql, [CardID]),
      query(salesSql, [CardID, parseInt(offset), parseInt(limit)])
    ]);

    if (cardResults.length > 0) {
      const card = cardResults[0];
      card.listings = listingsResults;
      card.listingCount = listingsCountResults[0].ListingCount; // Store the count of listings
      card.sales = salesResults;
      res.status(200).json({ card });
    } else {
      res.status(404).json({ message: "Card not found" });
    }
  } catch (error) {
    console.error("Error fetching card data, listings, and sales:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
}
