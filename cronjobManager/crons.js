require('dotenv').config(); // Load environment variables
const cron = require('node-cron');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

let token = null;

// Function to fetch a JWT token
async function getToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/token`, {
            client_credentials: process.env.CRON_USERNAME,
            client_secret: process.env.CRON_PASSWORD,
        });

        return response.data.token; // Assuming the token is in `response.data.token`
    } catch (error) {
        console.error('Error fetching JWT token:', error.message);
        throw error;
    }
}

// Function to refresh the JWT token
async function refreshToken() {
    try {
        token = await getToken();
        console.log('JWT token refreshed successfully.');
    } catch (error) {
        console.error('Error refreshing JWT token:', error.message);
    }
}

// Cron job to process Nginx logs
async function processNginxLogs() {
    console.log('Starting scheduled task: Process all Nginx logs.');

    if (!token) {
        console.error('JWT token is not available. Skipping task.');
        await refreshToken();
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/nginx/process-all`,
            {}, // Empty body
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log('Cron task completed:', response.data.message);
    } catch (error) {
        console.error('Error during cron task:', error.message);

        // Retry fetching the token if it's expired
        if (error.response?.status === 401) {
            console.log('Refreshing token due to 401 error.');
            await refreshToken();
        }
    }
}

// Initialize cron jobs
async function initializeCrons() {
    console.log('Initializing cron jobs...');

    // Fetch the token before starting any jobs
    try {
        await refreshToken(); // Ensure token is fetched
        console.log('Initial JWT token retrieved successfully.');
    } catch (error) {
        console.error('Failed to retrieve initial JWT token. Aborting cron job initialization.');
        return; // Abort further initialization
    }

    // Refresh token every hour to keep it valid
    cron.schedule('0 * * * *', async () => {
        console.log('Refreshing JWT token...');
        await refreshToken();
    });

    // Process logs every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Processing Nginx logs...');
        await processNginxLogs();
    });

    console.log('Cron jobs initialized.');
}

module.exports = { initializeCrons };
