import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items } = req.body;

    try {
      // Start a transaction
      await query('START TRANSACTION');

      // Insert each order item
      for (const item of items) {
        await query(`
          INSERT INTO OrderItems (OrderNumber, ListingID, Quantity, Price, CardID, GradeID)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [item.OrderNumber, item.ListingID, item.Quantity, item.Price, item.CardID, item.GradeID]);
      }

      // Commit the transaction
      await query('COMMIT');

      res.status(200).json({ message: 'Order items created successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await query('ROLLBACK');

      console.error('Error creating order items:', error);
      res.status(500).json({ error: 'Failed to create order items' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
