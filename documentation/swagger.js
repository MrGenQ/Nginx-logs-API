require('dotenv').config(); // Load .env file
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Swagger JSDoc setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nginx Logs API',
            version: '1.0.0',
            description: `
              API Documentation for managing Nginx logs and authentication.
              
              **Download the Postman Collection and Environment variables:**
              Localhost:
              - [Collection](${BASE_URL}/documentation/postman/collection.json)
              - [Environment](${BASE_URL}/documentation/postman/environment.json)
            `,
          },
        servers: [
            {
                url: BASE_URL,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        paths: {
            '/auth/token': {
                post: {
                    summary: 'Obtain a JWT token',
                    description: 'Authenticate with client credentials and secret to receive a JWT token.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        client_credentials: { type: 'string', example: 'cronjobManager' },
                                        client_secret: { type: 'string', example: 'password' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Successfully authenticated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: { type: 'string', example: 'eyJhbGciOi...' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/auth/register': {
                post: {
                    summary: 'Register a new client',
                    description: 'Registers a new client with credentials, secret, and email.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        client_credentials: { type: 'string', example: 'cronjobManager' },
                                        client_secret: { type: 'string', example: 'password' },
                                        email: { type: 'string', example: 'test@gmail.com' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Client successfully registered',
                        },
                    },
                },
            },
            '/auth/change-client_secret': {
                post: {
                    summary: 'Change the client secret',
                    description: 'Update the client secret using the old and new secret.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        oldclient_secret: { type: 'string', example: 'password' },
                                        newclient_secret: { type: 'string', example: 'admin' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Client secret successfully updated',
                        },
                    },
                },
            },
            '/nginx/logs': {
                get: {
                    summary: 'Retrieve paginated logs',
                    description: 'Fetch paginated logs with optional sorting.',
                    parameters: [
                        {
                            name: 'order',
                            in: 'query',
                            schema: { type: 'string', example: 'ip asc' },
                            description: 'Sorting order for the logs',
                        },
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer', example: 1 },
                            description: 'Page number for pagination',
                        },
                    ],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Logs retrieved successfully',
                        },
                    },
                },
            },
            '/nginx/upload': {
                post: {
                    summary: 'Upload log files',
                    description: 'Upload Nginx log files for processing.',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        files: {
                                            type: 'array',
                                            items: { type: 'string', format: 'binary' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Log files uploaded successfully',
                        },
                    },
                },
            },
            '/nginx/generate-nginx-file': {
                get: {
                    summary: 'Generate a sample Nginx log file',
                    description: 'Create a sample Nginx log file with a specified number of lines.',
                    parameters: [
                        {
                            name: 'numLines',
                            in: 'query',
                            schema: { type: 'integer', example: 1000 },
                            description: 'Number of lines to generate',
                        },
                    ],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Log file generated successfully',
                        },
                    },
                },
            },
          },
    },
    apis: ['./routes/*.js'],
};
  
// Generate Swagger documentation
const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs,
};