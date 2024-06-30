import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { listingIds } = req.body;

    try {
      const inventoryDetails = await query(`
        SELECT Inventory.ListingID, Inventory.SellerID, Inventory.CardID, Inventory.GradeID, Stores.StoreName
        FROM Inventory
        JOIN Stores ON Inventory.SellerID = Stores.UserID
        WHERE Inventory.ListingID IN (?)
      `, [listingIds]);

      res.status(200).json(inventoryDetails);
    } catch (error) {
      console.error('Error fetching inventory details:', error);
      res.status(500).json({ error: 'Failed to fetch inventory details' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
