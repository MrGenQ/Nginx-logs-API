const multer = require('multer');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate'); // Make sure the path is correct
const fs = require('fs');
const readline = require('readline');
const Log = require('../models/Logs');
const moment = require('moment');  // Use moment.js for date formatting
const faker = require('faker');
const path = require('path');

// Multer setup for file uploads
const upload = multer({ dest: 'files/uploads/' });

// Helper function to parse a single log line and format the timestamp
function parseLogLine(line) {
    const regex = /^([\d.]+) - - \[([^\]]+)\] "GET (\S+) HTTP\/1.1" \d+ \d+/;
    const match = line.match(regex);

    if (match) {
        // Parse the timestamp from the log line and format it into MySQL-compatible format
        const timestamp = moment(match[2], 'DD/MMM/YYYY:HH:mm:ss Z').format('YYYY-MM-DD HH:mm:ss');

        return {
            ip: match[1],
            timestamp: timestamp,  // Using formatted timestamp
            route: match[3],
        };
    }
    return null;
}

// Function to process a single log file
async function processLogFile(filePath) {
    console.log(`Processing file: ${filePath}`);
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    const logsBatch = [];
    const batchSize = 1000; // Adjust this for performance testing
    let totalProcessed = 0;

    for await (const line of rl) {
        const log = parseLogLine(line);

        if (log) {
            logsBatch.push(log);

            // When the batch size is reached, insert into the database
            if (logsBatch.length >= batchSize) {
                await Log.bulkCreate(logsBatch); // Bulk insert
                totalProcessed += logsBatch.length;
                console.log(`Inserted ${logsBatch.length} logs. Total processed: ${totalProcessed}`);
                logsBatch.length = 0; // Clear the batch
            }
        }
    }

    // Insert any remaining logs in the last batch
    if (logsBatch.length > 0) {
        await Log.bulkCreate(logsBatch);
        totalProcessed += logsBatch.length;
        console.log(`Inserted final ${logsBatch.length} logs. Total processed: ${totalProcessed}`);
    }

    console.log(`Finished processing file: ${filePath}. Total logs processed: ${totalProcessed}`);
}

// Helper function to generate a single log line
function generateLogLine() {
    const ip = faker.internet.ip();  // Random IP address
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -1);  // Current timestamp
    const route = `/some/route/${faker.datatype.number({min: 1, max: 1000})}`;  // Random route
    const statusCode = faker.random.arrayElement([200, 301, 404, 502]);  // Random status code
    const responseTime = faker.datatype.number({ min: 100, max: 5000 });  // Random response time
    const userAgent = faker.internet.userAgent();  // Random User-Agent string
    const method = faker.random.arrayElement(['GET', 'POST', 'DELETE', 'PUT']);  // Random status code

    return `${ip} - - [${timestamp}] "${method} ${route} HTTP/1.1" ${statusCode} ${responseTime} "-" "${userAgent}"\n`;
}


// Endpoint to upload log files
router.post('/upload', authenticateToken, upload.array('files'), async (req, res) => {
    const logDir = path.join(__dirname, '../files/uploads');
    if (!fs.existsSync(logDir)) { // ensure files/uploads directory exists
        fs.mkdirSync(logDir, { recursive: true });
    }

    try {
        const files = req.files;

        for (const file of files) {
            await processLogFile(file.path);
            // fs.unlinkSync(file.path); // Clean up uploaded file
        }
        res.status(200).send('Logs processed and saved successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing log files.');
    }
});

// API endpoint to retrieve logs, sorted by IP and route
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const logs = await Log.findAll({ order: [['ip', 'ASC'], ['route', 'ASC']] });
        res.status(200).json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving logs.');
    }
});

// Route to generate a sample Nginx log file with 1 million lines
router.get('/generate-nginx-file', authenticateToken, async (req, res) => {
    const timestamp = moment().format('YYYYMMDD_HHmmss');  // Format: YYYYMMDD_HHmmss
    const logFilePath = path.join(__dirname, `../files/logs/${timestamp}.log`);  // Log file location with timestamp to prevent overlapping files

    const logDir = path.join(__dirname, '../files/logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Default number of lines to generate
    let numLines = 1000000;

    // Override numLines if provided in the query parameters
    if (req.query.numLines) {
        const requestedLines = parseInt(req.query.numLines, 10);

        if (isNaN(requestedLines) || requestedLines <= 0) {
            return res.status(400).send('Invalid number of lines provided. Must be a positive number.');
        }

        if (requestedLines > 1000000) {
            return res.status(400).send('Requested number of lines exceeds the maximum limit of 1,000,000.');
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
            
            res.send('Generated nginx sample file successfully');
        } else {
            const logLine = generateLogLine();
            stream.write(logLine);
            count++;
        }
    }, 0);  // Write line by line with no delay
});


module.exports = router;
