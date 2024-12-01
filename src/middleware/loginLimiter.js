const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    handler: (req, res) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60; // Remaining time in minutes
        res.status(400).json({
            error: `Too many login attempts. Please try again after ${Math.ceil(retryAfter)} minute(s).`,
        });
    },
    standardHeaders: true, // Send rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

module.exports = loginLimiter;