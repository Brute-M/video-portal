const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'BRPL API',
        description: 'API documentation for BRPL backend endpoints',
    },
    host: 'localhost:5000',
    schemes: ['http', 'https'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Enter JWT token',
        }
    },
    security: [{ bearerAuth: [] }]
};

const outputFile = './swagger-output.json';
const routes = ['./server.js']; // Point to your main server or routes file

// This will parse routes and generate the swagger-output.json
swaggerAutogen(outputFile, routes, doc).then(() => {
    console.log("Swagger UI JSON file generated successfully");
});
