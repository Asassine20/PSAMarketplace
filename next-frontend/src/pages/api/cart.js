import { query } from '@/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import cookie from 'cookie';

const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

export default async function handler(req, res) {
  const { method } = req;
  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies.sessionId || uuidv4();

  if (!cookies.sessionId) {
    res.setHeader('Set-Cookie', cookie.serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/'
    }));
  }

  const idToUse = userId || sessionId;

  switch (method) {
    case 'GET':
      try {
        const cartData = await query('SELECT Cart, SavedForLater FROM UserCarts WHERE UserID = ?', [idToUse]);

        if (cartData.length > 0) {
          res.status(200).json(cartData[0]);
        } else {
          res.status(200).json({ cart: [], savedForLater: [] });
        }
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
        res.status(500).json({ message: "Failed to fetch cart data" });
      }
      break;

    case 'POST':
      const { cart, savedForLater } = req.body;
      try {
        const existingCart = await query('SELECT * FROM UserCarts WHERE UserID = ?', [idToUse]);
        
        if (existingCart.length > 0) {
          await query(`
            UPDATE UserCarts SET Cart = ?, SavedForLater = ? WHERE UserID = ?
          `, [JSON.stringify(cart), JSON.stringify(savedForLater), idToUse]);
        } else {
          await query(`
            INSERT INTO UserCarts (UserID, Cart, SavedForLater)
            VALUES (?, ?, ?)
          `, [idToUse, JSON.stringify(cart), JSON.stringify(savedForLater)]);
        }

        res.status(200).json({ message: "Cart updated" });
      } catch (error) {
        console.error("Failed to update cart data:", error);
        res.status(500).json({ message: "Failed to update cart data" });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
