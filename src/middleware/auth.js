const users = require('../models/users'); 

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect(`/`);
    }
    next();
}

async function ensureNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        const fullUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
        return res.redirect(`/auth/login?redirectTo=${fullUrl}`);
    }

    try {
        const user = await users.findById(req.user._id);
        
        if (user && user.role === 'banned') {
            req.logout(function(err) {
                if (err) {
                    return next(err);
                }

                const fullUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
                return res.redirect(`/auth/login?redirectTo=${fullUrl}`);
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
        return err;
    }
}

async function ensureAdminAuthenticated (req, res) {
    try {
        if (!req.isAuthenticated()) {
            return {authenticated: false, admin: false};
        }

        const user = await users.findById(req.user._id);
        
        if (user && user.role === 'admin' || user && user.role == "owner") {
            return {authenticated: true, admin: true};
        } else {
            return {authenticated: true, admin: false};
        }
    } catch (err) {
        return err;
    }
}

module.exports = { ensureAuthenticated, ensureNotAuthenticated, ensureAuthenticatedForFetching, ensureAdminAuthenticated };