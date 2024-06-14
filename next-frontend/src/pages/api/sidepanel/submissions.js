import { query } from '@/db'; // Adjust the path according to your project structure
import { authenticate } from '@/middleware/auth';
import fetch from 'node-fetch';

const PSA_API_URL = 'https://api.psacard.com/publicapi/order/GetProgress/';
const PSA_API_TOKEN = process.env.PSA_API_TOKEN;

export default async function handler(req, res) {
  const decoded = authenticate(req);
  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = decoded.userId;

  if (req.method === 'POST') {
    const { serviceLevel, status, itemList, psaOrderNumber, trackingNumber, pricePerItem, totalPrice } = req.body;
    const itemCount = Array.isArray(itemList) ? itemList.length : itemList;

    try {
      await query(`
        INSERT INTO Submissions (UserID, ServiceLevel, DateSubmitted, Status, ItemCount, ItemList, PSAOrderNumber, TrackingNumber, PricePerItem, TotalPrice)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
      `, [userId, serviceLevel, status, itemCount, JSON.stringify(itemList), psaOrderNumber, trackingNumber, pricePerItem, totalPrice]);

      res.status(201).json({ message: 'Submission created successfully' });
    } catch (error) {
      console.error('Error inserting submission:', error);
      res.status(500).json({ message: 'Failed to create submission' });
    }
  } else if (req.method === 'GET') {
    try {
      const submissions = await query(`
        SELECT SubmissionID AS submissionNumber, ServiceLevel, DateSubmitted, Status, ItemCount, PSAOrderNumber, TrackingNumber, PricePerItem, TotalPrice
        FROM Submissions
        WHERE UserID = ?
      `, [userId]);

      const submissionsWithProgress = await Promise.all(submissions.map(async (submission) => {
        if (submission.PSAOrderNumber) {
          try {
            const response = await fetch(`${PSA_API_URL}${submission.PSAOrderNumber}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${PSA_API_TOKEN}`,
                'Accept': 'application/json'
              }
            });

            if (!response.ok) {
              throw new Error(`Error fetching order progress for PSA Order Number: ${submission.PSAOrderNumber}`);
            }

            const progressData = await response.json();
            return { ...submission, OrderProgress: progressData };
          } catch (error) {
            console.error(error);
            return { ...submission, OrderProgress: null };
          }
        } else {
          return { ...submission, OrderProgress: null };
        }
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
