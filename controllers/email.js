const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

function generateConfirmationLink(user) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return `http://gemtcg.com/confirm-email?token=${token}`;
}

exports.sendConfirmationEmail = async (user) => {
    const confirmationLink = generateConfirmationLink(user);
    const mailOptions = {
        from: process.env.EMAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Please confirm your email address',
        html: `<p>Please confirm your email by clicking on this link: <a href="${confirmationLink}">${confirmationLink}</a></p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
