// /api/cart/add.js
import { query } from '@/db';
import { authenticate, getSessionId } from '@/middleware/auth';

export default async function handler(req, res) {
  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;
  const sessionId = getSessionId(req, res);
  const { ListingID } = req.body;

  const idToUse = userId ? { column: 'UserID', value: userId } : { column: 'SessionID', value: sessionId };

  try {
    const existingCart = await query(`SELECT * FROM UserCarts WHERE ${idToUse.column} = ?`, [idToUse.value]);
    let userCartsId;

    if (existingCart.length > 0) {
      userCartsId = existingCart[0].UserCartsID;
    } else {
      const result = await query('INSERT INTO UserCarts (UserID, SessionID) VALUES (?, ?)', [userId, sessionId]);
      userCartsId = result.insertId;
    }

    // Check if the item already exists in the cart
    const existingItem = await query('SELECT * FROM CartItems WHERE UserCartsID = ? AND ListingID = ?', [userCartsId, ListingID]);
    if (existingItem.length === 0) {
      await query('INSERT INTO CartItems (UserCartsID, ListingID) VALUES (?, ?)', [userCartsId, ListingID]);
    }

    const cartItems = await query(`
      SELECT CartItems.*, Inventory.SalePrice AS price, Stores.ShippingPrice AS shippingPrice, 
        Card.CardName AS name, Card.Sport AS sport, Card.CardYear AS cardYear, 
        Card.CardSet AS cardSet, Card.CardNumber AS number, Card.CardVariant AS variant, 
        Card.CardColor AS color, Card.Numbered AS numbered, Card.Team AS team, 
        Card.Auto AS auto, Card.ColorPattern AS colorPattern, 
        Grade.GradeValue AS grade, Inventory.CertNumber AS certNumber,
        Inventory.FrontImageURL AS imageFront, Inventory.BackImageURL AS imageBack, Stores.StoreName AS storeName,
        Stores.FeedbackAverage AS feedback
      FROM CartItems 
      JOIN Inventory ON CartItems.ListingID = Inventory.ListingID
      JOIN Card ON Inventory.CardID = Card.CardID
      LEFT JOIN Grade ON Inventory.GradeID = Grade.GradeID
      LEFT JOIN Stores ON Inventory.SellerID = Stores.UserID
      WHERE CartItems.UserCartsID = ?
    `, [userCartsId]);

    res.status(200).json({
      cart: cartItems,
    });
  } catch (error) {
    console.error("Failed to add item to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
}
