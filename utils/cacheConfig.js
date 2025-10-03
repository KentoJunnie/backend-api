const { createClient } = require('redis');
const apicache = require('apicache');

let redisClient = null;
let cache = null;

// Redis client configuration
if (process.env.USE_REDIS === 'true') {
    redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Connected to Redis'));

    // Configure API caching with Redis
    cache = apicache.options({
        redisClient,
        statusCodes: {
            include: [200]
        },
        headers: {
            'cache-control': 'max-age=300, public'
        }
    }).middleware;
} else {
    // Use memory cache if Redis is not enabled
    cache = apicache.options({
        statusCodes: {
            include: [200]
        },
        headers: {
            'cache-control': 'max-age=300, public'
        }
    }).middleware;
}

// Configure API caching rules
const cacheRules = {
    listProducts: '15 minutes',
    listStores: '10 minutes',
    getProduct: '5 minutes',
    getStore: '5 minutes'
};

// Cache invalidation functions
const invalidateCache = {
    products: () => apicache.clear('/api/products'),
    stores: () => apicache.clear('/api/stores')
};

module.exports = {
    redisClient,
    cache,
    cacheRules,
    invalidateCache
};