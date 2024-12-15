require("dotenv").config();

const smtp = require("./modules/smtp");
const ejs = require("ejs");

// List of emails with corresponding messages
const emailList = [
    { email: 'suhanirayal95@gmail.com' },
]
// Function to send banned messages
async function sendBannedMessages(emailList) {
    for (const { email } of emailList) {
        try {
            await smtp.verify();

            const data = await ejs.renderFile(
                __dirname + "/../views/auth/mail/custom.ejs",
                { msg: "The verfication link did not sent successfully due to out of storage of your inbox.",
                    title: "Error sending mail"
                 }
            );

            // Define the email content
            const mainOptions = {
                from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
                to: email,
                subject: `Error sending mail`,
                html: data
            };

            // Send the email
            await smtp.sendMail(mainOptions);
            console.log(`Custom message sent to: ${email}`);
        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
        }
    }
}

// Call the function to send the emails
sendBannedMessages(emailList);
