const fs = require('fs');
const readline = require('readline');
const moment = require('moment');
const { faker } = require('@faker-js/faker');
const Log = require('../models/Logs'); // Ensure you have a Log model defined

// Helper function to parse a single log line and format the timestamp
function parseLogLine(line) {
    const regex = /^([\d.]+) - - \[([^\]]+)\] "(\S+) (\S+) HTTP\/1.1" (\d+) (\d+)/;
    const match = line.match(regex);

    if (match) {
        const rawTimestamp = match[2];
        let timestamp;
        
        // List of possible formats
        const formats = [
            'YYYY-MM-DD HH:mm:ss.SSS',
            'DD/MMM/YYYY:HH:mm:ss Z',
            'YYYY-MM-DDTHH:mm:ss.SSSZ', // ISO 8601
            'ddd, DD MMM YYYY HH:mm:ss Z', // RFC 2822
            'X', // Unix timestamp (seconds)
            'x', // Unix timestamp (milliseconds)
            'MM/DD/YYYY HH:mm:ss',
            'YYYY/MM/DD HH:mm:ss'
        ];
        
        // Attempt to parse using each format
        for (let format of formats) {
            if (moment(rawTimestamp, format, true).isValid()) {
                timestamp = moment(rawTimestamp, format).format('YYYY-MM-DD HH:mm:ss');
                break;
            }
        }
        
        // Handle invalid timestamp
        if (!timestamp) {
            console.warn(`Unrecognized timestamp format: ${rawTimestamp}`);
            return null;
        }

        return {
            ip: match[1],
            timestamp: timestamp,  // Using formatted timestamp
            method: match[3],
            route: match[4],
            statusCode: match[5],
            responseSize: match[6],
        };
    }
    return null;
}

// Function to process a single log file
async function processLogFile(filePath) {
    console.log(`Processing file: ${filePath}`);

    try {
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
        
        // After successful processing, remove the file
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            } else {
                console.log(`Successfully deleted file: ${filePath}`);
            }
        });

    } catch (error) {
        console.error(`Error processing file: ${filePath}`, error);
    }
}

// Helper function to generate a single log line
function generateLogLine() {
    const ip = faker.internet.ipv4();  // Ensures only IPv4 address
    const timestamp = moment().format('DD/MMM/YYYY:HH:mm:ss Z');  // Current timestamp
    const route = `/some/route/${faker.number.int({min: 1, max: 1000})}`;  // Random route
    const statusCode = faker.helpers.arrayElement([200, 301, 404, 502]);  // Random status code
    const responseTime = faker.number.int({ min: 100, max: 5000 });  // Random response time
    const userAgent = faker.internet.userAgent();  // Random User-Agent string
    const method = faker.helpers.arrayElement(['GET', 'POST', 'DELETE', 'PUT']);  // Random method

    return `${ip} - - [${timestamp}] "${method} ${route} HTTP/1.1" ${statusCode} ${responseTime} "-" "${userAgent}"\n`;
}

module.exports = {
    parseLogLine,
    processLogFile,
    generateLogLine,
};
