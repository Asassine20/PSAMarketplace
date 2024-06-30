import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { orderNumbers } = req.body;

    if (!orderNumbers || orderNumbers.length === 0) {
      return res.status(400).json({ error: 'Order numbers are required' });
    }

    try {
      const placeholders = orderNumbers.map(() => '?').join(',');
      const orders = await query(`
        SELECT Orders.OrderNumber, Stores.StoreName
        FROM Orders
        JOIN Stores ON Orders.SellerID = Stores.UserID
        WHERE Orders.OrderNumber IN (${placeholders})
      `, orderNumbers);

      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching store names:', error);
      res.status(500).json({ error: 'Failed to fetch store names' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
