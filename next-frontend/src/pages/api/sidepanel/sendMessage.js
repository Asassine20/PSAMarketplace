import { query } from '@/db';

export default async function handler(req, res) {
  const { userId, orderNumber, subject, messageText, sellerId, buyerId } = req.body;
  let { conversationId } = req.body;

  if (!userId || !messageText || (!conversationId && (!orderNumber || !subject))) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    if (!conversationId) {
      const result = await query(
        `INSERT INTO Conversations (SellerID, BuyerID, Subject, OrderNumber)
        VALUES (?, ?, ?, ?)`,
        [sellerId, buyerId, subject, orderNumber]
      );
      conversationId = result.insertId;
    }

    await query(
      `INSERT INTO Messages (ConversationID, SenderID, MessageText, ResponseNeeded)
      VALUES (?, ?, ?, 0)`,
      [conversationId, userId, messageText]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}
