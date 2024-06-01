import { query } from '@/db';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  console.log('Received Token:', token); // Debugging: Log the token
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('Decoded Token:', decoded); // Debugging: Log the decoded token
    return decoded;
  } catch (err) {
    console.error("Authentication error:", err);
    return null;
  }
};

export default async function handler(req, res) {
  const { method } = req;
  const decoded = authenticate(req);
  const cookies = cookie.parse(req.headers.cookie || '');
  let sessionId = cookies.sessionId;

  if (!sessionId && !decoded) {
    sessionId = Math.floor(Math.random() * 1e17).toString();
    res.setHeader('Set-Cookie', cookie.serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/'
    }));
  }

  let userId = null;
  if (decoded) {
    userId = decoded.userId;
  } else if (sessionId) {
    const session = await query('SELECT UserID FROM UserSessions WHERE SessionID = ?', [sessionId]);
    userId = session.length > 0 ? session[0].UserID : null;
  }

  const idToUse = userId ? { column: 'UserID', value: userId } : { column: 'SessionID', value: sessionId };
  console.log('idToUse:', idToUse);  // Debugging: Log the idToUse

  switch (method) {
    case 'GET':
      try {
        const cartData = await query(`SELECT Cart, SavedForLater FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
        console.log('cartData:', cartData);  // Debugging: Log the cart data

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
        const existingCart = await query(`SELECT * FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
        console.log('existingCart:', existingCart);  // Debugging: Log the existing cart

        if (existingCart.length > 0) {
          await query(`
            UPDATE UserCarts SET Cart = ?, SavedForLater = ?, SessionID = NULL WHERE ${idToUse.column} = ?
          `, [JSON.stringify(cart), JSON.stringify(savedForLater), idToUse.value]);
        } else {
          await query(`
            INSERT INTO UserCarts (${idToUse.column}, Cart, SavedForLater)
            VALUES (?, ?, ?)
          `, [idToUse.value, JSON.stringify(cart), JSON.stringify(savedForLater)]);
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
