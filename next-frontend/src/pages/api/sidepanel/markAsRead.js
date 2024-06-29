import { query } from '@/db';

export default async function handler(req, res) {
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  try {
    await query(
      `UPDATE Messages SET IsRead = 1 WHERE ConversationID = ?`,
      [conversationId]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}
