import { query } from '@/db';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { orders } = req.body;

    if (!orders || orders.length === 0) {
      return res.status(400).json({ error: 'Orders are required' });
    }

    try {
      for (const order of orders) {
        const { OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice, email } = order;

        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        await query(`
          INSERT INTO Orders (OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [OrderNumber, AddressID, SalePrice, OrderDate, BuyerID, SellerID, ShippingPrice]);

        // Send confirmation email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Order Confirmation',
          text: `Thank you for your order! Your order number is ${OrderNumber}. View your order summary here: http://localhost:3000/sidepanel/order-history?orderNumber=${OrderNumber}`
        };

        await transporter.sendMail(mailOptions);
      }

      res.status(200).json({ message: 'Orders created successfully' });
    } catch (error) {
      console.error('Error creating orders:', error);
      res.status(500).json({ error: 'Failed to create orders' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
