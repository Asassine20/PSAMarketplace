import { query } from '@/db';
import jwt from 'jsonwebtoken';
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
  let sessionId = cookies.sessionId;

  if (!sessionId && !userId) {
    sessionId = Math.floor(Math.random() * 1e17).toString();
    res.setHeader('Set-Cookie', cookie.serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/'
    }));
  }

  const idToUse = userId ? { column: 'UserID', value: userId } : { column: 'SessionID', value: sessionId };
  console.log('idToUse:', idToUse);

  switch (method) {
    case 'GET':
      try {
        const cartData = await query(`SELECT UserCartsID FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
        const userCartsId = cartData.length ? cartData[0].UserCartsID : null;

        const [cartItems, savedForLaterItems] = await Promise.all([
          userCartsId ? query('SELECT * FROM CartItems WHERE UserCartsID = ?', [userCartsId]) : [],
          userCartsId ? query('SELECT * FROM SavedForLaterItems WHERE UserCartsID = ?', [userCartsId]) : [],
        ]);

        res.status(200).json({
          cart: cartItems,
          savedForLater: savedForLaterItems,
        });
      } catch (error) {
        console.error("Failed to fetch cart data:", error);
        res.status(500).json({ message: "Failed to fetch cart data" });
      }
      break;

    case 'POST':
      const { cart, savedForLater } = req.body;
      try {
        let userCartsId;

        const existingCart = await query(`SELECT * FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
        if (existingCart.length > 0) {
          userCartsId = existingCart[0].UserCartsID;
        } else {
          const result = await query('INSERT INTO UserCarts (UserID, SessionID) VALUES (?, ?)', [userId, sessionId]);
          userCartsId = result.insertId;
        }

        console.log('userId:', userId);  // Debugging: Log the userId
        console.log('sessionId:', sessionId);  // Debugging: Log the sessionId
        console.log('userCartsId:', userCartsId);  // Debugging: Log the userCartsId

        // Clear existing cart items
        await query('DELETE FROM CartItems WHERE UserCartsID = ?', [userCartsId]);
        await query('DELETE FROM SavedForLaterItems WHERE UserCartsID = ?', [userCartsId]);

        // Insert new cart items
        const cartPromises = cart.map(item => query(
          'INSERT INTO CartItems (UserCartsID, ListingID) VALUES (?, ?)',
          [userCartsId, item.ListingID]
        ));

        // Insert new saved for later items
        const savedForLaterPromises = savedForLater.map(item => query(
          'INSERT INTO SavedForLaterItems (UserCartsID, ListingID) VALUES (?, ?)',
          [userCartsId, item.ListingID]
        ));

        await Promise.all([...cartPromises, ...savedForLaterPromises]);

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
