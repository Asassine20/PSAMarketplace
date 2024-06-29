import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice } = req.body;

    try {
      await query(`
        INSERT INTO Orders (OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice]);

      res.status(200).json({ message: 'Order created successfully' });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
