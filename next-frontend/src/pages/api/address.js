// src/pages/api/address.js
import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, IsBilling
  } = req.body;

  try {
    const result = await query(
      'INSERT INTO Addresses (FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, UserID, IsBilling) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, userId, IsBilling]
    );

    const newAddress = {
      AddressID: result.insertId,
      FirstName, LastName, Street, Street2, City, State, ZipCode, Country, IsPrimary, IsBilling
    };

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Failed to save address:', error);
    res.status(500).json({ message: 'Failed to save address' });
  }
}
