import { query } from '@/db';

export default async function handler(req, res) {
    const { method } = req;
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    switch (method) {
        case 'GET':
            try {
                const paymentMethods = await query(`
                    SELECT PaymentID, CardNumber, ExpMonth, ExpYear, CardHolderName, SecurityCode
                    FROM PaymentInfo
                    WHERE UserID = ?
                `, [userId]);
                res.status(200).json(paymentMethods);
            } catch (error) {
                console.error('Failed to fetch payment methods:', error);
                res.status(500).json({ error: 'Failed to fetch payment methods' });
            }
            break;

        case 'POST':
            const { cardNumber, expMonth, expYear, cardHolderName, securityCode } = req.body;
            try {
                await query(`
                    INSERT INTO PaymentInfo (UserID, CardNumber, ExpMonth, ExpYear, CardHolderName, SecurityCode, DateCreated)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                `, [userId, cardNumber, expMonth, expYear, cardHolderName, securityCode]);
                res.status(201).json({ message: 'Payment method added successfully' });
            } catch (error) {
                console.error('Failed to add payment method:', error);
                res.status(500).json({ error: 'Failed to add payment method' });
            }
            break;

        case 'DELETE':
            const { paymentId } = req.body;
            try {
                await query(`
                    DELETE FROM PaymentInfo WHERE UserID = ? AND PaymentID = ?
                `, [userId, paymentId]);
                res.status(200).json({ message: 'Payment method deleted successfully' });
            } catch (error) {
                console.error('Failed to delete payment method:', error);
                res.status(500).json({ error: 'Failed to delete payment method' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
