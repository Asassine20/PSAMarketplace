// /api/paymentInfo.js
import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const { method } = req;
  const decoded = authenticate(req);
  const userId = decoded ? decoded.userId : null;

  switch (method) {
    case 'GET':
      try {
        if (!userId) throw new Error('Not authenticated');
        const paymentInfo = await query(`
          SELECT * FROM PaymentInfo WHERE UserID = ?
        `, [userId]);
        res.status(200).json(paymentInfo);
      } catch (error) {
        console.error("Failed to fetch payment info:", error);
        res.status(500).json({ message: "Failed to fetch payment info" });
      }
      break;

    case 'POST':
      try {
        if (!userId) throw new Error('Not authenticated');
        const { cardNumber, expMonth, expYear, cardHolderName } = req.body;
        const result = await query(`
          INSERT INTO PaymentInfo (UserID, CardNumber, ExpMonth, ExpYear, CardHolderName, DateCreated) 
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [userId, cardNumber, expMonth, expYear, cardHolderName]);
        res.status(200).json({ PaymentID: result.insertId });
      } catch (error) {
        console.error("Failed to save payment info:", error);
        res.status(500).json({ message: "Failed to save payment info" });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
