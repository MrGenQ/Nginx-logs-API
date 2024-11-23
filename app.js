require('dotenv').config(); // Load .env file

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
const authRoutes = require('./routes/auth');
const nginxLogs = require('./routes/nginx');

// Use Routes
app.use('/auth', authRoutes); // For register and token retvieval
app.use('/nginx', nginxLogs); // Nginx logs methods

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
