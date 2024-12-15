const express = require("express");
const router = new express.Router();

const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const ejs = require("ejs");

const isNumeric = require("../functions/isNumeric");
const isEmail = require("../functions/isEmail");
const { newUser, newVerification, removeUser, resetPass, verifyVerification, checkVerification } = require("../controller/auth");
const smtp = require("../modules/smtp");
const { ensureAuthenticated, ensureNotAuthenticated } = require("../middleware/auth");
const isDomainValid = require("../functions/isDomainValid");
const loginLimiter = require("../middleware/loginLimiter");
const registrationLimiter = require("../middleware/registrationLimiter");
const forgotPasswordLimiter = require("../middleware/forgotPasswordLimiter");

require("dotenv").config();

const app = express();

app.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.all("/", ensureAuthenticated, (req, res) => {
    res.redirect("/auth/login");
});

router.get("/login", ensureAuthenticated, (req, res) => {
    return res.render("auth/login",{setting : {appName: process.env.APP_NAME, teleLink: process.env.TELE_LINK}});
});

router.post("/login", ensureAuthenticated, loginLimiter, async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!",
            success: 0
        };

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Email is required";
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData.msg = "Enter a valid email address"
        } else {
            isDomainValid(email, (isValid) => {
                if (!isValid) {
                    isError = true;
                    errorData.msg = "Email is not registered yet."
                }
            });
        }

        /** Validating the password field */
        if (!password && !isError || password.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Password is required"
        }

        /** If known error found return it */
        if (isError) {
            return res.status(400).json(errorData);
        }

        passport.authenticate('local', async (err, user, info) => {
            if (err) {
                isError = true;
            }

            if (!user && !isError) {
                if (info.verification) {
                    const uniqueString = uuidv4();
                    const { _id } = info.userData;
                    const expiresAt = Date.now() + (60000 * 10); //Expires in 10min

                    const newVerifications = await newVerification(_id, uniqueString, expiresAt);

                    if (newVerifications.success) {
                        await smtp.verify();

                        const data = await ejs.renderFile(
                            __dirname + "/../../views/auth/mail/verification.ejs",
                            { link: `${req.protocol}://${req.get('host')}/auth/verify/${_id}/${uniqueString}` }
                        );

                        // Prepare email options
                        var mainOptions = {
                            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
                            to: `${email}`,
                            subject: `Verification for ${process.env.APP_NAME}`,
                            html: data
                        };

                        // Send the email
                        await smtp.sendMail(mainOptions);

                        // Respond with success message
                        return res.status(200).json({ success: 0, msg: "Check your inbox, a mail sent to you", verified: false });
                    } else {
                        isError = true;
                        errorData.msg = (newVerifications.msg ? newVerifications.msg : errorData.msg)
                    }
                }

                isError = true;
                errorData.msg = info.message;
            }

            if (!isError) {
                req.logIn(user, (err) => {
                    if (err) {
                        isError = true;
                    }

                    if (!isError) {
                        return res.status(200).json({ success: 1, msg: "User LoggedIn successfully", verified: true });
                    }
                })
            }

            /** If known error found return it */
            if (isError) {
                return res.status(400).json(errorData);
            }
        })(req, res, next);
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.get("/register", ensureAuthenticated, (req, res) => {
    return res.render("auth/register");
});

router.post("/register", ensureAuthenticated, registrationLimiter, async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const tel = req.body.tel;
        const password = req.body.password;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!",
            reset: true,
            success: 0
        };

        /** Validating the name field */
        if (!name && !isError || name.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Name is required";
        }
        if (name.length < 3 && !isError || name.length > 30 && !isError) {
            isError = true;
            errorData.msg = "Name length must be between 3 and 30 characters";
        }

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Email is required";
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData.msg = "Enter a valid email address"
        } else {
            isDomainValid(email, (isValid) => {
                if (!isValid) {
                    isError = true;
                    errorData.msg = "Only @gmail.com, @gehu.ac.in and @geu.ac.in emails are allowed.";
                }
            });
        }

        /** Validating the mobile field */
        if (!tel && !isError || tel.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Mobile number is required";
        }
        if (tel.length != 10 && !isError || !isNumeric(tel) && !isError) {
            isError = true;
            errorData.msg = "Enter a valid mobile number";
        }

        /** Validating the password field */
        if (!password && !isError || password.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Password is required"
        }
        if (password.length < 8 && !isError) {
            isError = true;
            errorData.msg = "Password must be at least 8 characters long";
        }

        /** Registering user to the database */
        const result = await newUser(name, email, tel, password);

        if (result && !isError) {
            if (result.success) {
                const uniqueString = uuidv4();
                const { _id } = result.registrationData;
                const expiresAt = Date.now() + (60000 * 10); //Expires in 10min

                const newVerifications = await newVerification(_id, uniqueString, expiresAt);

                if (newVerifications.success) {
                    await smtp.verify();

                    const data = await ejs.renderFile(
                        __dirname + "/../../views/auth/mail/verification.ejs",
                        { link: `${req.protocol}://${req.get('host')}/auth/verify/${_id}/${uniqueString}` }
                    );

                    // Prepare email options
                    var mainOptions = {
                        from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
                        to: `${email}`,
                        subject: `Verification for ${process.env.APP_NAME}`,
                        html: data
                    };

                    // Send the email
                    await smtp.sendMail(mainOptions);

                    // Respond with success message
                    return res.status(200).json({ success: 1, msg: "User registered successfully" });
                } else {
                    isError = true;
                    errorData.msg = (newVerifications.msg ? newVerifications.msg : errorData.msg)
                }
            } else {
                isError = true;

                if (result?.msg?.name === 'ValidationError') {
                    const firstErrorField = Object.keys(result.msg.errors)[0];

                    errorData.msg = result.msg.errors[firstErrorField].message
                } else {
                    errorData.msg = (result.msg ? result.msg : errorData.msg)
                    errorData.reset = false;
                }
            }
        } else {
            isError = true;
        }

        /** If known error found return it */
        if (isError) {
            if (errorData.reset) {
                await removeUser({ email, mobile: tel });
            }
            return res.status(400).json(errorData);
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.get("/forgotPassword", ensureAuthenticated, (req, res) => {
    return res.render("auth/forgotPassword");
});

router.post("/forgotPassword", forgotPasswordLimiter, ensureAuthenticated, async (req, res) => {
    try {
        const email = req.body.email;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!",
            success: 0
        }

        /** Validating the email field */
        if (!email && !isError || email.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Email is required"
        }
        if (!isEmail(email) && !isError) {
            isError = true;
            errorData.msg = "Enter a valid email address"
        } else {
            isDomainValid(email, (isValid) => {
                if (!isValid) {
                    isError = true;
                    errorData.msg = "Enter a valid email address";
                }
            });
        }

        if (!isError) {
            const result = await resetPass(email);

            if (result.success) {
                const uniqueString = uuidv4();
                const { _id } = result.userData;
                const expiresAt = Date.now() + (60000 * 10); //Expires in 10min

                const newVerifications = await newVerification(_id, uniqueString, expiresAt, "reset");

                if (newVerifications.success) {
                    await smtp.verify();

                    const data = await ejs.renderFile(
                        __dirname + "/../../views/auth/mail/passwordReset.ejs",
                        { link: `${req.protocol}://${req.get('host')}/auth/reset/${_id}/${uniqueString}` }
                    );

                    // Prepare email options
                    var mainOptions = {
                        from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
                        to: `${email}`,
                        subject: `Password reset for ${process.env.APP_NAME}`,
                        html: data
                    };

                    // Send the email
                    await smtp.sendMail(mainOptions);

                    // Respond with success message
                    return res.status(200).json({ success: 1, msg: "Password reset mail has been sent." });
                } else {
                    isError = true;
                    errorData.msg = (newVerifications.msg ? newVerifications.msg : errorData.msg);
                }
            } else {
                isError = true;

                if (result?.msg?.name === 'ValidationError') {
                    const firstErrorField = Object.keys(result.msg.errors)[0];

                    errorData.mg = result.msg.errors[firstErrorField].message
                } else {
                    errorData.msg = (result.msg ? result.msg : errorData.msg)
                }
            }
        }

        /** If known error found return it */
        if (isError) {
            return res.status(400).json(errorData);
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.get("/verify/:userId/:uniqueString", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const uniqueString = req.params.uniqueString;

        const result = await verifyVerification(userId, uniqueString, "auth");

        if (result?.success && !result?.expired) {
            return res.render("auth/verified", { redirectUrl: '/auth/login' });
        } else {
            return res.render("auth/expiredLink");
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.get("/reset/:userId/:uniqueString", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const uniqueString = req.params.uniqueString;

        const result = await checkVerification(userId, uniqueString, "reset");

        if (result?.success && !result?.expired) {
            return res.render("auth/resetPassword", { userId, uniqueString });
        } else {
            return res.render("auth/expiredLink");
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.post("/resetPassword", ensureAuthenticated, async (req, res) => {
    try {
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        const userId = req.body.userId;
        const uniqueString = req.body.uniqueString;

        let isError = false;
        let errorData = {
            msg: "Something went wrong!",
            success: 0
        };

        /** Validating the password field */
        if (!password && !isError || password.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Password is required";
        }
        if (password.length < 8 && !isError) {
            isError = true;
            errorData.msg = "Password must be at least 8 characters long"
        }

        /** Validating the confirmPassword field */
        if (!confirmPassword && !isError || confirmPassword.trim() === '' && !isError) {
            isError = true;
            errorData.msg = "Confirm Password is required"
        }

        /** Check if the passwords are equal or not  */
        if (confirmPassword != password && !isError) {
            isError = true;
            errorData.msg = "Both password do not match"
        }

       if (!isError) {
            const result = await verifyVerification(userId, uniqueString, "reset", {password});

            if (result?.success && !result?.expired) {
                return res.status(200).json({success: 1, msg: "Password updated successfully", expired: 0});
            } else {
                return res.status(200).json({success: 0, msg: "The link is invalid or expired", expired: 1});
            }
       }

        /** check for the authorization */
        if (uniqueString.length != 32 && userId.length != 24) {
            isError = true;
        }
    } catch(error) {
        return res.status(500).render("errors/500");
    }
});

router.get("/logout", ensureNotAuthenticated, async (req, res) => {
    try {
        req.logout(function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect(`/auth/login`);
        });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;