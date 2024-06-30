import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const { method } = req;
  const { userId, addressId } = req.query;

  const decoded = authenticate(req);
  const authenticatedUserId = decoded ? decoded.userId : null;

  if (!authenticatedUserId || authenticatedUserId !== parseInt(userId)) {
    console.log('Unauthorized access attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (method) {
    case 'GET':
      try {
        const addresses = await query('SELECT * FROM Addresses WHERE UserID = ?', [userId]);
        res.status(200).json(addresses);
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
      }
      break;
    case 'POST':
      const {
        FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary
      } = req.body;

      try {
        if (IsPrimary) {
          // Set all other addresses for this user to not be primary
          await query('UPDATE Addresses SET IsPrimary = 0 WHERE UserID = ?', [userId]);
        }

        const result = await query(
          'INSERT INTO Addresses (FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, userId]
        );

        const newAddress = {
          AddressID: result.insertId,
          FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary
        };

        res.status(201).json(newAddress);
      } catch (error) {
        console.error('Failed to save address:', error);
        res.status(500).json({ message: 'Failed to save address' });
      }
      break;
    case 'DELETE':
      try {
        if (!addressId) {
          return res.status(400).json({ message: 'Address ID is required' });
        }

        await query('DELETE FROM Addresses WHERE AddressID = ? AND UserID = ?', [addressId, userId]);

        res.status(200).json({ message: 'Address deleted successfully' });
      } catch (error) {
        console.error('Failed to delete address:', error);
        res.status(500).json({ message: 'Failed to delete address' });
      }
      break;
    default:
      console.log('Method not allowed:', method);
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
