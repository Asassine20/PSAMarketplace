import { query } from '@/db'; // Adjust the path according to your project structure
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const decoded = authenticate(req);
  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = decoded.userId;

  try {
    const submissions = await query(`
      SELECT SubmissionID AS submissionNumber, COUNT(ItemID) AS items, ServiceLevel, DateCompleted, Status
      FROM Submissions
      LEFT JOIN Items ON Submissions.SubmissionID = Items.SubmissionID
      WHERE UserID = ?
      GROUP BY SubmissionID, ServiceLevel, DateCompleted, Status
    `, [userId]);

    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
}
