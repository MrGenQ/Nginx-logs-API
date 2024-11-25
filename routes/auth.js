const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const mailer = require('../services/mailer'); // Import the mailer service
const ApiUser = require('../models/ApiUsers'); // Correctly import the User model here

// Register a new user
router.post('/register', async (req, res) => {
    const { client_credentials, client_secret, email } = req.body;
    
    if (!client_credentials || !client_secret) {
        return res.status(400).json(
            { 
                success: false,
                message: 'client_credentials and client_secret are required.' 
            }
        );
    }

    try {
        // Hash the client_secret
        const hashedSecret = await bcrypt.hash(client_secret, 10);

        // Create the user using Sequelize's .create() method
        const newUser = await ApiUser.create({
            client_credentials,
            client_secret: hashedSecret,
            email
        });

        // Send welcome email after successful registration
        const emailSubject = 'Welcome to our application!';
        const emailBody = `Hi ${client_credentials},\n\nThank you for registering with us! We're excited to have you on board.`;

        try {
            // Send the email to the new user
            if (process.env.EMAIL_SERVICE_ENABLED === 1) {
                await mailer.sendEmail(email, emailSubject, emailBody);
                res.status(201).json({ success: true, message: 'User registered successfully and email sent.' });
            } else {
                res.status(201).json({ success: true, message: 'User registered successfully.' });
            }
            
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            res.status(500).json({ success: false, message: 'User registered but email could not be sent.' });
        }
    } catch (err) {
        const errorMessages = err.errors.map((error) => error.message);

        console.error('Error registering user:', err);
        res.status(500).json({ success: false, message: 'Error registering user.', errors: errorMessages});
    }
});

// Retrieve JWT auth token
router.post('/token', async (req, res) => {
    const { client_credentials, client_secret } = req.body;

    if (!client_credentials || !client_secret) {
        return res.status(400).json(
            {
                success: false,
                message: 'client_credentials and client_secret are required.'
            }
        );
    }

    try {
        // Find the user using Sequelize's .findOne() method
        const user = await ApiUser.findOne({
            where: { client_credentials }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Compare the client_secret with the hashed password stored in the database
        const isMatch = await bcrypt.compare(client_secret, user.client_secret);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Optionally, you can set the token in cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only secure in production
        });

        // Send response with the token
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Change client_secret Route
router.post('/change-client_secret', authenticateToken, async (req, res) => {
    const { oldclient_secret, newclient_secret } = req.body;

    if (!oldclient_secret || !newclient_secret) {
        return res.status(400).json({ success: false, message: 'Old client_secret and new client_secret are required.' });
    }

    try {
        const userId = req.user.id; // Extract user ID from the authenticated token

        // Find the user using Sequelize's .findOne() method
        const user = await ApiUser.findOne({ where: { id: userId } });

        // Check if the user exists and has a client_secret
        if (!user || !user.client_secret) {
            return res.status(404).json({ success: false, message: 'User not found or client_secret is undefined.' });
        }

        // Compare the old client_secret with the stored hashed client_secret
        const isMatch = await bcrypt.compare(oldclient_secret, user.client_secret);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Old client_secret is incorrect.' });
        }

        // Hash the new client_secret
        const hashedSecret = await bcrypt.hash(newclient_secret, 10);

        // Update the client_secret in the database using Sequelize's .update() method
        await user.update({ client_secret: hashedSecret });

        res.status(200).json({ success: true, message: 'client_secret updated successfully.' });
    } catch (err) {
        console.error('Error during client_secret change:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


module.exports = router;
