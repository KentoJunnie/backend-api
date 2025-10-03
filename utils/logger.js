const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Build transports dynamically to support environments with read-only FS (e.g., Vercel)
const transports = [];

// Always log to console
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
);

// Enable file logging only if explicitly requested
if (process.env.ENABLE_FILE_LOGS === 'true') {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
        })
    );
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    format: logFormat,
    transports
});

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id
        });
    });
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        requestId: req.id
    });
    next(err);
};

module.exports = {
    logger,
    requestLogger,
    errorLogger
};