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

async function ensureAuthenticatedForFetching(req, res) {
    try {
        if (!req.isAuthenticated()) {
            return {authenticated: false, banned: false};
        }

        const user = await users.findById(req.user._id);
        
        if (user && user.role === 'banned') {
            req.logout(function(err) {
                if (err) {
                    return err;
                }

                return {authenticated: true, banned: true};
            });
        } else {
            return {authenticated: true, banned: false};
        }
    } catch (err) {
        console.log(err);
        return err;
    }
}

module.exports = { ensureAuthenticated, ensureNotAuthenticated, ensureAuthenticatedForFetching };