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
        html: `
            <div style="background-color: #333; padding: 20px; text-align: center;">
                <div style="background-color: white; padding: 20px; display: inline-block; text-align: left; max-width: 600px; width: 100%;">
                    <img src="/images/banner.png" alt="Logo" style="display: block; margin-left: auto; margin-right: auto; width: 50%;" />
                    <h1 style="text-align: center;">Thank you for creating an account with GemTCG</h1>
                    <p style="text-align: center;">Please click the button below to confirm your email address and activate your account.</p>
                    <div style="text-align: center; margin: 20px;">
                        <a href="${confirmationLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Confirm Email</a>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        console.log('Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

