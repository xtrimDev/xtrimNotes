const LocalStrategy = require('passport-local').Strategy;
const {userLogin} = require("../controller/auth");
const users = require("../models/users");

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const result = await userLogin(email, password);

                if (result?.success) {
                    if (result?.verified) {
                        return done(null, result.userData);
                    } else {
                        return done(null, false, { verification: true, userData: result.userData});
                    }
                } else {
                    if (result?.msg?.name === 'ValidationError') {
                        const firstErrorField = Object.keys(result.msg.errors)[0];
                        return done(null, false, { success: false, message: result.msg.errors[firstErrorField].message});
                    } else {
                        return done(null, false, { success: false, message: result.msg});
                    }
                }
            } catch (error) {
                return done(null, false, { message: "Something went wrong"});
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await users.findById(id);
            done(null, result);
        } catch (error) {
            done(error, false)
        }
    });
};
