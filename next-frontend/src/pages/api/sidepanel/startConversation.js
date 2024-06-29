import { query } from '@/db';

export default async function handler(req, res) {
  const { userId, sellerId, orderNumber, subject, messageText } = req.body;

  if (!userId || !sellerId || !orderNumber || !subject || !messageText) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const result = await query(`
      INSERT INTO Conversations (SellerID, BuyerID, Subject, OrderNumber)
      VALUES (?, ?, ?, ?)
    `, [sellerId, userId, subject, orderNumber]);

    const conversationId = result.insertId;

    await query(`
      INSERT INTO Messages (ConversationID, SenderID, MessageText, IsReadByBuyer)
      VALUES (?, ?, ?, ?)
    `, [conversationId, userId, messageText, 1]);

    res.status(200).json({ success: true, conversationId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start conversation' });
  }
}
