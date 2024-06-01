import { query } from '@/db';
import jwt from 'jsonwebtoken';

const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Authorization header missing');

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  return decoded;
};

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const { userId, sessionId } = req.body;

  try {
    const decoded = authenticate(req);
    if (!decoded || decoded.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [userCartData] = await query('SELECT Cart, SavedForLater FROM UserCarts WHERE UserID = ?', [userId]);
    const [sessionCartData] = await query('SELECT Cart, SavedForLater FROM UserCarts WHERE UserID = ?', [sessionId]);

    const mergedCart = [...(userCartData?.cart || []), ...(sessionCartData?.cart || [])];
    const mergedSavedForLater = [...(userCartData?.savedForLater || []), ...(sessionCartData?.savedForLater || [])];

    await query('DELETE FROM UserCarts WHERE userId = ?', [sessionId]);

    await query(`
      INSERT INTO UserCarts (UserID, Cart, SavedForLater)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Cart = VALUES(Cart),
        SavedForLater = VALUES(SavedForLater)
    `, [userId, JSON.stringify(mergedCart), JSON.stringify(mergedSavedForLater)]);

    res.status(200).json({ message: 'Cart migrated' });
  } catch (error) {
    console.error("Failed to migrate cart:", error);
    res.status(500).json({ message: "Failed to migrate cart" });
  }
}
