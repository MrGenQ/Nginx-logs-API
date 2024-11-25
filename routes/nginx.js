const multer = require('multer');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate'); // Make sure the path is correct
const fs = require('fs');
const Log = require('../models/Logs');
const moment = require('moment');  // Use moment.js for date formatting
const path = require('path');
const { processLogFile, generateLogLine } = require('../helpers/fileProcessor');

// Multer setup for file uploads
const upload = multer({ dest: 'files/uploads/' });
const logDirectory = path.join(__dirname, '../files/logs');
if (!fs.existsSync(logDirectory)) { // ensure files/uploads directory exists
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Endpoint to process all files
router.post('/process-all', async (req, res) => {
    try {
        const files = fs.readdirSync(logDirectory);

        for (const file of files) {
            const filePath = path.join(logDirectory, file);
            console.log(`Processing file: ${filePath}`);
            await processLogFile(filePath); // Using the helper function
        }

        res.status(200).json({ success: true, message: 'All files processed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: true, message: 'Error processing files.', error: error.message });
    }
});
  
// Endpoint to process a single file
router.post('/process-one', authenticateToken, async (req, res) => {
    const { fileName } = req.body;
  
    if (!fileName) {
        return res.status(400).json({ success: false, message: 'fileName is required.' });
    }
  
    const filePath = path.join(logDirectory, fileName);
  
    try {
        console.log(`Processing single file: ${filePath}`);
        await processFile(filePath); // Reuse helper
        res.status(200).json({ success: true, message: `File ${fileName} processed successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing file.', error: error.message });
    }
});

// Endpoint to upload log files
router.post('/upload', authenticateToken, upload.array('files'), async (req, res) => {
    const uploadDir = path.join(__dirname, '../files/uploads');
    if (!fs.existsSync(uploadDir)) { // ensure files/uploads directory exists
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    try {
        const files = req.files;

        for (const file of files) {
            await processLogFile(file.path);
            // fs.unlinkSync(file.path); // Clean up uploaded file
        }
        res.status(200).json({ success: true, message: 'Logs processed and saved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error processing log files.' });
    }
});

// API endpoint to retrieve logs with pagination and ordering
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 1000, order = 'id ASC' } = req.query; // Default ordering by `id` ascending
        const offset = (page - 1) * limit;

        // Parse the order parameter
        const [orderField, orderDirection] = order.split(' ');
        const allowedFields = ['id', 'ip', 'route', 'timestamp'];
        const allowedDirections = ['ASC', 'DESC'];

        // Validate the order field and direction
        if (!allowedFields.includes(orderField) || !allowedDirections.includes(orderDirection?.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order parameter. Use a valid field and direction - ASC/DESC.',
            });
        }

        // Fetch logs with pagination and dynamic ordering
        const { count, rows: logs } = await Log.findAndCountAll({
            order: [[orderField, orderDirection.toUpperCase()]],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        });

        res.status(200).json({
            success: true,
            data: logs,
            meta: {
                totalRecords: count,
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error retrieving logs.' });
    }
});

// Route to generate a sample Nginx log file with 1 million lines
router.get('/generate-nginx-file', authenticateToken, async (req, res) => {
    const timestamp = moment().format('YYYYMMDD_HHmmss');  // Format: YYYYMMDD_HHmmss
    const logFilePath = path.join(__dirname, `../files/logs/${timestamp}.log`);  // Log file location with timestamp to prevent overlapping files

    // Default number of lines to generate
    let numLines = 1000000;

    // Override numLines if provided in the query parameters
    if (req.query.numLines) {
        const requestedLines = parseInt(req.query.numLines, 10);

        if (isNaN(requestedLines) || requestedLines <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid number of lines provided. Must be a positive number.' });
        }

        if (requestedLines > 1000000) {
            return res.status(400).json({ success: false, message: 'Requested number of lines exceeds the maximum limit of 1,000,000.' });
        }

        numLines = requestedLines;
    }

    // Create a writable stream to the file
    const stream = fs.createWriteStream(logFilePath, { flags: 'w' });

    let count = 0;
    const interval = setInterval(() => {
        if (count >= numLines) {
            clearInterval(interval);
            stream.end();  // Close the stream when done
            console.log(`Generated log file with ${numLines} lines.`);
            
            res.json({ success: true, message: 'Generated nginx sample file successfully' });
        } else {
            const logLine = generateLogLine();
            stream.write(logLine);
            count++;
        }
    }, 0);  // Write line by line with no delay
});

module.exports = router;
