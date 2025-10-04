require('dotenv').config();

const app = require('./app');
const mongoose = require('mongoose');
const { redisClient } = require('./utils/cacheConfig');
const { logger } = require('./utils/logger');

const port = process.env.PORT || 8000;

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, starting graceful shutdown...');
    try {
        if (process.env.USE_REDIS === 'true' && redisClient) {
            try {
                await redisClient.quit();
                logger.info('Redis connection closed');
            } catch (e) {
                logger.warn('Redis quit error (ignored):', e);
            }
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        }
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server for local/VM environments
app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server started on port ${port}`);
    logger.info(`📚 API Documentation available at http://localhost:${port}/api-docs`);
});
