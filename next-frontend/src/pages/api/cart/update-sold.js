import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { listingIds } = req.body;

    try {
      // Start a transaction
      await query('START TRANSACTION');

      // Update each inventory item
      for (const listingId of listingIds) {
        await query(`
          UPDATE Inventory SET Sold = 1 WHERE ListingID = ?
        `, [listingId]);
      }

      // Commit the transaction
      await query('COMMIT');

      res.status(200).json({ message: 'Inventory updated successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await query('ROLLBACK');

      console.error('Error updating inventory:', error);
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
