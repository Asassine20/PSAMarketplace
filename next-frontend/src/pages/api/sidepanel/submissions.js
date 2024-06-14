import { query } from '@/db'; // Adjust the path according to your project structure
import { authenticate } from '@/middleware/auth';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const decoded = authenticate(req);
  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = decoded.userId;

  if (req.method === 'POST') {
    const { serviceLevel, status, itemList, psaOrderNumber } = req.body;
    const itemCount = itemList.length;

    try {
      await query(`
        INSERT INTO Submissions (UserID, ServiceLevel, DateSubmitted, Status, ItemCount, ItemList, PSAOrderNumber)
        VALUES (?, ?, NOW(), ?, ?, ?)
      `, [userId, serviceLevel, status, itemCount, JSON.stringify(itemList), psaOrderNumber]);

      res.status(201).json({ message: 'Submission created successfully' });
    } catch (error) {
      console.error('Error inserting submission:', error);
      res.status(500).json({ message: 'Failed to create submission' });
    }
  } else if (req.method === 'GET') {
    try {
      const submissions = await query(`
        SELECT SubmissionID AS submissionNumber, ServiceLevel, DateSubmitted, Status, ItemCount, PSAOrderNumber
        FROM Submissions
        WHERE UserID = ?
      `, [userId]);

      const submissionsWithProgress = await Promise.all(submissions.map(async (submission) => {
        if (submission.PSAOrderNumber) {
          try {
            const response = await fetch(`https://api.psacard.com/publicapi/order/GetProgress/${submission.PSAOrderNumber}`, {
              headers: {
                'Authorization': `Bearer ${process.env.PSA_API_TOKEN}`,
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const progressData = await response.json();
              const highestCompletedStep = progressData.orderProgressSteps
                .filter(step => step.completed)
                .reduce((prev, current) => (prev.index > current.index ? prev : current), { step: 'In Progress' });

              submission.OrderProgressStep = highestCompletedStep.step;
            } else {
              console.error('Error fetching progress:', await response.text());
              submission.OrderProgressStep = 'Error fetching progress';
            }
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            submission.OrderProgressStep = 'Error fetching progress';
          }
        } else {
          submission.OrderProgressStep = 'No PSA Order Number';
        }
        return submission;
      }));

      res.status(200).json(submissionsWithProgress);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
