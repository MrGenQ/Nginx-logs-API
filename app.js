require('dotenv').config(); // Load .env file

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const axios = require('axios'); // For calling API endpoints
const { initializeCrons } = require('./cronjobManager/crons');
const { swaggerUi, swaggerDocs } = require('./documentation/swagger');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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

// Initialize Cron Jobs
initializeCrons();

// Serve Swagger UI at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/documentation/postman', express.static(path.join(__dirname, 'documentation/postman')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${BASE_URL}`);
});
