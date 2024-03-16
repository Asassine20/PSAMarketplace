const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('Initializing transporter...');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

function generateConfirmationLink(user) {
    console.log(`Generating token for user ID: ${user.id}`);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const link = `http://gemtcg.com/confirm-email?token=${token}`;
    console.log(`Generated link: ${link}`);
    return link;
}

exports.sendConfirmationEmail = async (user) => {
    console.log(`Preparing to send confirmation email to: ${user.email}`);
    const confirmationLink = generateConfirmationLink(user);
    const mailOptions = {
        from: process.env.EMAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Please confirm your email address',
        html: `<p>Please confirm your email by clicking on this link: <a href="${confirmationLink}">${confirmationLink}</a></p>`,
    };

    try {
        console.log('Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
