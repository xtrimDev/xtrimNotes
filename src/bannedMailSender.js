require("dotenv").config();

const smtp = require("./modules/smtp");
const ejs = require("ejs");

// List of emails with corresponding messages
const emailList = [
    { email: 'bhandarisameer512@gmail.com' }
]
// Function to send banned messages
async function sendBannedMessages(emailList) {
    for (const { email, msg } of emailList) {
        try {
            await smtp.verify();

            const data = await ejs.renderFile(
                __dirname + "/../views/auth/mail/banned.ejs",
                { msg }
            );

            // Define the email content
            const mainOptions = {
                from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
                to: email,
                subject: `Account Banned on ${process.env.APP_NAME}`,
                html: data
            };

            // Send the email
            await smtp.sendMail(mainOptions);
            console.log(`Banned message sent to: ${email}`);
        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
        }
    }
}

// Call the function to send the emails
sendBannedMessages(emailList);
