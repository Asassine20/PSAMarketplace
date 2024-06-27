// src/pages/api/feedback.js
import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { SellerID, BuyerID, FeedbackText, Rating, FeedbackDate, OrderNumber } = req.body;

    try {
      const result = await query(`
        INSERT INTO Feedback (SellerID, BuyerID, FeedbackText, Rating, FeedbackDate, OrderNumber)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [SellerID, BuyerID, FeedbackText, Rating, FeedbackDate, OrderNumber]);

      res.status(200).json({ message: 'Feedback submitted successfully', feedbackId: result.insertId });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
