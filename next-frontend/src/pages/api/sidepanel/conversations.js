import { query } from '@/db';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const conversations = await query(
      `SELECT c.ConversationID, c.SellerID, c.BuyerID, c.Subject, c.OrderNumber, s.StoreName,
              (SELECT COUNT(*) FROM Messages m WHERE m.ConversationID = c.ConversationID AND m.SenderID != ? AND m.IsReadByBuyer = 0) AS HasUnreadMessages,
              (SELECT MAX(m.Timestamp) FROM Messages m WHERE m.ConversationID = c.ConversationID) AS LastMessageTimestamp
       FROM Conversations c
       LEFT JOIN Stores s ON c.SellerID = s.UserID
       WHERE c.SellerID = ? OR c.BuyerID = ?
       ORDER BY LastMessageTimestamp DESC`,
      [userId, userId, userId]
    );

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}
