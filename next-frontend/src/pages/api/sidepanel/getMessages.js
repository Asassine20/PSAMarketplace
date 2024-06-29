import { query } from '@/db';

export default async function handler(req, res) {
  const { conversationId, userId } = req.query;

  if (!conversationId || !userId) {
    return res.status(400).json({ error: 'Conversation ID and User ID are required' });
  }

  try {
    // Fetch messages
    const messages = await query(
      `SELECT MessageID, ConversationID, SenderID, MessageText, Timestamp, IsReadByBuyer
       FROM Messages
       WHERE ConversationID = ?`,
      [conversationId]
    );

    // Mark messages as read by buyer
    await query(
      `UPDATE Messages SET IsReadByBuyer = 1 WHERE ConversationID = ? AND SenderID != ?`,
      [conversationId, userId]
    );

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
