// src/pages/api/cart.js
import { query } from '@/db';
import { authenticate, getSessionId } from '@/middleware/auth';

export default async function handler(req, res) {
  const { method } = req;
  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;
  const sessionId = getSessionId(req, res);

  const idToUse = userId ? { column: 'UserID', value: userId } : { column: 'SessionID', value: sessionId };
  console.log('userId:', userId);
  console.log('sessionId:', sessionId);

  switch (method) {
    case 'GET':
      try {
        const cartData = await query(`SELECT UserCartsID FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
        const userCartsId = cartData.length ? cartData[0].UserCartsID : null;

        if (userCartsId) {
          const cartItems = await query(`
            SELECT CartItems.*, Inventory.SalePrice AS price, Stores.ShippingPrice AS shippingPrice, 
              Card.CardName AS name, Card.Sport AS sport, Card.CardYear AS cardYear, 
              Card.CardSet AS cardSet, Card.CardNumber AS number, Card.CardVariant AS variant, 
              Card.CardColor AS color, Grade.GradeValue AS grade, Inventory.CertNumber AS certNumber,
              Inventory.FrontImageURL AS imageFront, Inventory.BackImageURL AS imageBack, Stores.StoreName AS storeName,
              Stores.FeedbackAverage AS feedback, Inventory.CardID AS cardId
            FROM CartItems 
            JOIN Inventory ON CartItems.ListingID = Inventory.ListingID
            JOIN Card ON Inventory.CardID = Card.CardID
            LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID
            LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID
            WHERE CartItems.UserCartsID = ?
          `, [userCartsId]);

          const savedForLaterItems = await query(`
            SELECT SavedForLaterItems.*, Inventory.SalePrice AS price, Stores.ShippingPrice AS shippingPrice, 
              Card.CardName AS name, Card.Sport AS sport, Card.CardYear AS cardYear, 
              Card.CardSet AS cardSet, Card.CardNumber AS number, Card.CardVariant AS variant, 
              Card.CardColor AS color, Grade.GradeValue AS grade, Inventory.CertNumber AS certNumber,
              Inventory.FrontImageURL AS imageFront, Inventory.BackImageURL AS imageBack, Stores.StoreName AS storeName,
              Stores.FeedbackAverage AS feedback, Inventory.CardID AS cardId
            FROM SavedForLaterItems 
            JOIN Inventory ON SavedForLaterItems.ListingID = Inventory.ListingID
            JOIN Card ON Inventory.CardID = Card.CardID
            LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID
            LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID
            WHERE SavedForLaterItems.UserCartsID = ?
          `, [userCartsId]);

          res.status(200).json({
            cart: cartItems,
            savedForLater: savedForLaterItems,
          });
        } else {
          res.status(200).json({
            cart: [],
            savedForLater: [],
          });
        }
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
        const cartPromises = cart.map(item => {
          return query(
            'INSERT INTO CartItems (UserCartsID, ListingID) VALUES (?, ?) ON DUPLICATE KEY UPDATE ListingID = VALUES(ListingID)',
            [userCartsId, item.ListingID]
          );
        });

        // Insert new saved for later items
        const savedForLaterPromises = savedForLater.map(item => {
          return query(
            'INSERT INTO SavedForLaterItems (UserCartsID, ListingID) VALUES (?, ?)',
            [userCartsId, item.ListingID]
          );
        });

        await Promise.all([...cartPromises, ...savedForLaterPromises]);

        console.log('Cart updated successfully');

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
