import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const gradingRates = await query('SELECT * FROM GradingRates');
      res.status(200).json(gradingRates);
    } catch (error) {
      console.error('Error fetching grading rates:', error);
      res.status(500).json({ message: 'Failed to fetch grading rates' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
