import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const { method } = req;

  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;

  if (!userId) {
    console.log('Unauthorized access attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (method) {
    case 'GET':
      try {
        console.log('Fetching addresses for user ID:', userId);
        const addresses = await query('SELECT * FROM Addresses WHERE UserID = ?', [userId]);
        res.status(200).json(addresses);
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
      }
      break;
    case 'POST':
      const {
        FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, IsBilling
      } = req.body;

      console.log('Received data:', {
        FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, IsBilling
      });

      try {
        const result = await query(
          'INSERT INTO Addresses (FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, UserID, IsBilling) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, userId, IsBilling]
        );

        const newAddress = {
          AddressID: result.insertId,
          FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, IsBilling
        };

        console.log('Inserted new address:', newAddress);
        res.status(201).json(newAddress);
      } catch (error) {
        console.error('Failed to save address:', error);
        res.status(500).json({ message: 'Failed to save address' });
      }
      break;
    default:
      console.log('Method not allowed:', method);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
