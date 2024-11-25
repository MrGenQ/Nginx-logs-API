# API Summary
This API, built using Node.js, is designed to efficiently process and manage large Nginx log files. Users can upload log files directly through the system or place them in a designated logs directory. A cron job manager automates the reading and parsing of these log files, inserting the extracted data into a database for further use.

Key features include:
- Log Management: Automatically processes large Nginx log files via cron jobs.
- Data Retrieval: Supports paginated queries with flexible sorting options, such as by id, ip, route, or timestamp.
- Security: Implements JWT authentication to ensure secure access to API endpoints.

This combination of automation, flexibility, and security makes the API a robust solution for managing and analyzing log data.

# Project npm commands used
## Table of Contents
- Project Initialization
- Core Dependencies
    - Express
    - Environment Variables
    - CORS
    - Database Connection
- Authentication
- Development Tools
- Mailer
- Log File Handling
- Cron Jobs
- Data Generation
- Documentation

## Project Initialization
- mkdir Nginx-Logs-API
- cd Nginx-Logs-API
- npm init -y

## Core Dependencies
### Install Express to handle HTTP requests.
- npm install express
### Environment Variables
- npm install dotenv
### Enable Cross-Origin Resource Sharing for the API.
- npm install cors

### Use Sequelize as the ORM and MySQL for the database.
- npm install mysql2 sequelize

## Authentication
### Implement JWT-based authentication and password hashing.
- npm install jsonwebtoken bcryptjs

## Development Tools
### Install Nodemon for easier development with automatic server restarts.
- npm install -g nodemon

## Mailer
### Enable email functionality using nodemailer.
- npm install nodemailer

## Log File Handling
### Install the necessary tools for managing and processing Nginx log files.
- npm install multer readline fs
- npm install morgan

## Cron Jobs
### Use node-cron for task scheduling and axios for making HTTP requests within jobs.
- npm install node-cron
- npm install axios

## Data Generation
### Add fake data generation capabilities for testing with Faker.js.
- npm install @faker-js/faker

## Documentation
### Used swagger to generate api documentation
#### documentation url base_url/api/docs
- npm install swagger-jsdoc swagger-ui-express

# How to get started
## Project uses docker engine. run the following
- docker compose up -d
## Thanks to development tool - nodemon to start the server run the following
- npm run dev
#### or regular (note program will not automaticly restart)
- node app.js
## Environment variables setup
- create .env file from sample.env file (by just removing the word 'sample') these are the dotenv variables used
