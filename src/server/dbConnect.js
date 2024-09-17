const mongoose = require("mongoose");

require("dotenv").config();

const dbURL = process.env.DB_URL;

const dbConnect = async () => {
    try {
        await mongoose.connect(`${dbURL}`);
        console.log(`Connected to database Successfully.`);
    } catch(e) {
        console.log("Error connecting to the database.");
        console.log(e);
    } 
}

dbConnect();