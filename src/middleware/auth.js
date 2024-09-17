const users = require('../models/users'); 

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect(`${req.protocol}://${req.get('host')}/`);
    }
    next();
}

async function ensureNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(`${req.protocol}://${req.get('host')}/auth/login`);
    }

    try {
        const user = await users.findById(req.user._id);
        
        if (user && user.role === 'banned') {
            req.logout(function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect(`${req.protocol}://${req.get('host')}/auth/login`);
            });
        } else {
            return next();
        }
    } catch (err) {
        return next(err);
    }
}

module.exports = { ensureAuthenticated, ensureNotAuthenticated };