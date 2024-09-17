const nodemailer = require('nodemailer');

require("dotenv").config();

/** Creating a transporter */
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

module.exports = transporter;