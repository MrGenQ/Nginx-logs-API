const nodemailer = require('nodemailer');
require('dotenv').config();

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,  // You can change this to another email service
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
});

// Function to send an email
const sendEmail = async (toEmail, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: toEmail,                  // Recipient address
        subject: subject,             // Subject line
        text: text                    // Email body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;  // Propagate the error to handle it in the caller function
    }
};

// Export the sendEmail function to be used in other parts of the application
module.exports = {
    sendEmail
};
