require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./utils/swaggerConfig');
const { redisClient, cache } = require('./utils/cacheConfig');
const { logger, requestLogger, errorLogger } = require('./utils/logger');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeMemberRoutes = require('./routes/storeMemberRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
// Trust the reverse proxy so req.ip reflects the real client IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https:", "http:"]
        }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' }
}));

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req, _res) => req.ip,
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500,
});

// Middleware
app.use(compression());

// Allow CORS from specific origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://delibup.netlify.app',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'https://dellibup.onrender.com',
    'https://delibup.netlify.app',
    // Add your Netlify site URL here, e.g., 'https://your-site.netlify.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Add request ID to each request
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    next();
});

// Apply rate limiting
app.use('/api', limiter);
app.use('/api', speedLimiter);

// Initialize Redis connection if enabled (best-effort)
if (process.env.USE_REDIS === 'true' && redisClient) {
    (async () => {
        try {
            if (!redisClient.isOpen) {
                await redisClient.connect();
                logger.info('Redis connected successfully');
            }
        } catch (error) {
            logger.error('Redis connection error:', error);
            logger.info('Continuing with in-memory cache');
        }
    })();
} else {
    logger.info('Running with in-memory cache (Redis disabled)');
}

// MongoDB connection (reuse connection across function invocations)
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => logger.info('✅ Successfully connected to MongoDB'))
        .catch(err => {
            logger.error('❌ Error connecting to MongoDB:', err);
        });
}

mongoose.connection.once('open', async () => {
    logger.info('MongoDB connection established successfully');
    try {
        const Cart = mongoose.model('Cart');
        await Cart.collection.dropIndexes();
        logger.info('Successfully dropped all indexes from cart collection');
    } catch (err) {
        logger.error('Error dropping indexes:', err);
    }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Root route handler
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the BuFood API backend!',
        status: 'ok',
    });
});

// Routes with caching where appropriate
app.use('/api/auth', authRoutes);
app.use('/api/products', cache('10 minutes'), productRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/store', storeMemberRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', reviewRoutes);

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error(`[Error] [${req.id}] ${err.stack}`);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message,
            requestId: req.id,
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Authentication Error',
            details: err.message,
            requestId: req.id,
        });
    }

    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        requestId: req.id,
    });
});

module.exports = app;
