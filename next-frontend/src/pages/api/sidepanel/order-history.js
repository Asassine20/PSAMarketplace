import { query } from '@/db';

export default async function handler(req, res) {
  const { userId, orderNumber } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let orders;
    if (orderNumber) {
      orders = await query(`
        SELECT 
          o.OrderNumber, 
          o.ListingID, 
          o.AddressID, 
          o.SalePrice, 
          o.OrderDate, 
          o.BuyerID, 
          o.SellerID, 
          o.ShippingPrice, 
          o.OrderAmount, 
          o.FeeAmount, 
          o.NetAmount, 
          s.StoreName, 
          s.FeedbackAverage 
        FROM Orders o
        LEFT JOIN Stores s ON o.SellerID = s.UserID
        WHERE o.BuyerID = ? AND o.OrderNumber = ?
        ORDER BY o.OrderDate DESC
      `, [userId, orderNumber]);
    } else {
      orders = await query(`
        SELECT 
          o.OrderNumber, 
          o.ListingID, 
          o.AddressID, 
          o.SalePrice, 
          o.OrderDate, 
          o.BuyerID, 
          o.SellerID, 
          o.ShippingPrice, 
          o.OrderAmount, 
          o.FeeAmount, 
          o.NetAmount, 
          s.StoreName, 
          s.FeedbackAverage 
        FROM Orders o
        LEFT JOIN Stores s ON o.SellerID = s.UserID
        WHERE o.BuyerID = ?
        ORDER BY o.OrderDate DESC
      `, [userId]);
    }

    if (orders.length === 0) {
      return res.status(200).json([]);
    }

    const orderNumbers = orders.map(order => order.OrderNumber);
    const orderItems = await query(`
      SELECT 
        oi.OrderItemID, 
        oi.OrderNumber, 
        oi.ListingID, 
        oi.Quantity, 
        oi.Price, 
        oi.CardID, 
        c.CardName, 
        c.CardSet, 
        c.CardYear, 
        c.CardColor, 
        c.CardVariant,
        i.FrontImageUrl,
        i.CertNumber,
        g.GradeValue 
      FROM OrderItems oi
      LEFT JOIN Card c ON oi.CardID = c.CardID
      LEFT JOIN Grade g ON oi.GradeID = g.GradeID
      LEFT JOIN Inventory i ON oi.ListingID = i.ListingID
      WHERE oi.OrderNumber IN (?)
    `, [orderNumbers]);

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: orderItems.filter(item => item.OrderNumber === order.OrderNumber)
    }));

    res.status(200).json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}
