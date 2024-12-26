require("dotenv").config();

require("./server/dbConnect");

const userModel = require("./models/users");
const smtp = require("./modules/smtp");
const ejs = require("ejs");

// List of emails with corresponding messages
const emailList = [
    { email: '', msg: 'Your account has been banned for violating our terms of service.' }
];

// Function to send banned messages
async function sendBannedMessages(emailList) {
    await smtp.verify();

    for (const { email, msg } of emailList) {
        try {
            const user = await userModel.findOne({ email: email });
            if (!user) {
                console.error(`User not found with email: ${email}`);
                continue;
            }

            if (user.role == "owner") {
                console.error(`Cannot ban the owner account with email: ${email}`);
                continue;
            }

            // Update the user's status to banned
            user.role = "banned";
            await user.save();

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