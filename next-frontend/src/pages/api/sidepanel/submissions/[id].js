import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const { id } = req.query;
  const decoded = authenticate(req);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const results = await query(`
        SELECT SubmissionID AS submissionNumber, ServiceLevel, ItemCount, ItemList, DateSubmitted, Status, TrackingNumber, PricePerItem, TotalPrice
        FROM Submissions
        WHERE SubmissionID = ? AND UserID = ?
      `, [id, decoded.userId]);

      if (results.length === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json(results[0]);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ message: 'Failed to fetch submission' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
