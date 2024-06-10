import { query } from '@/db'; // Adjust the path according to your project structure
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const decoded = authenticate(req);
  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = decoded.userId;

  if (req.method === 'POST') {
    const { serviceLevel, status, itemList } = req.body;
    const itemCount = itemList.length;

    try {
      await query(`
        INSERT INTO Submissions (UserID, ServiceLevel, DateSubmitted, Status, ItemCount, ItemList)
        VALUES (?, ?, NOW(), ?, ?, ?)
      `, [userId, serviceLevel, status, itemCount, JSON.stringify(itemList)]);

      res.status(201).json({ message: 'Submission created successfully' });
    } catch (error) {
      console.error('Error inserting submission:', error);
      res.status(500).json({ message: 'Failed to create submission' });
    }
  } else if (req.method === 'GET') {
    try {
      const submissions = await query(`
        SELECT SubmissionID AS submissionNumber, ServiceLevel, DateSubmitted, Status, ItemCount
        FROM Submissions
        WHERE UserID = ?
      `, [userId]);

      res.status(200).json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
