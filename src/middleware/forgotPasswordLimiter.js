const rateLimit = require('express-rate-limit');

// In-memory store for tracking email requests
const requestStore = {};

const forgotPasswordLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 2, // Limit each IP to 2 request per window
    handler: (req, res) => {
        const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60); // Minutes left
        res.status(400).json({
            msg: `Too many Request attempts. Please try again in ${retryAfter} minute(s).`,
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = forgotPasswordLimiter;