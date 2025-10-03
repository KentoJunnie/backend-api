const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuFood API Documentation',
      version: '1.0.0',
      description: 'API documentation for BuFood application',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './routes/authRoutes.js',
    './routes/productRoutes.js',
    './routes/storeRoutes.js',
    './routes/customerRoutes.js',
    './routes/sellerRoutes.js',
    './routes/cartRoutes.js',
    './routes/orderRoutes.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;