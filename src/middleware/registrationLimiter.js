const rateLimit = require('express-rate-limit');

const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 registrations per window
    handler: (req, res) => {
        const retryAfter = Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000 / 60); // Minutes left
        res.status(400).json({
            error: `Too many registration attempts. Please try again in ${retryAfter} minute(s).`,
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = registrationLimiter;