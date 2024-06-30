// /api/contact.js
import nodemailer from 'nodemailer';
import { query } from '@/db';
import { authenticate } from '@/middleware/auth';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { userId, subject, content } = req.body;

  if (!userId || !subject || !content) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const userResult = await query('SELECT Email FROM Users WHERE UserID = ?', [userId]);
    const userEmail = userResult[0]?.Email;

    if (!userEmail) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a Nodemailer transporter using your email service
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use your email service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email app password
      },
    });

    // Define the email options for sending to your contact email
    const mailOptions = {
      from: userEmail,
      to: process.env.CONTACT_EMAIL, // Your email address to receive the contact form emails
      subject: `Contact Form: ${subject}`,
      text: content,
    };

    // Send the email to your contact email
    await transporter.sendMail(mailOptions);

    // Define the email options for sending the auto-reply to the user
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'We received your email',
      text: `Hello,

Thank you for contacting us. We are sending this to let you know that your email has been received and we will respond within 24 hours. Thank you for shopping with GemTCG.

Best regards,
Andrew Sassine
GemTCG`,
    };

    // Send the auto-reply email to the user
    await transporter.sendMail(autoReplyOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}
