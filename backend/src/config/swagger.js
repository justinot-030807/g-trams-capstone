const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'G-TRAMS API Documentation',
            version: '1.0.0',
            description: 'API Documentation for (G-TRAMS)',
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Local Development Server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [path.join(__dirname, '../routes/*.js')], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
