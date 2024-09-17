const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const isEmail = require("../functions/isEmail");
const isNumeric = require("../functions/isNumeric");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            lowercase: true,
            validate: {
                validator: function (value) {
                    return value.length < 30 && value.length > 3;
                },
                message: "Name length must be between 3 and 30 characters",
            },
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            unique: true,
            lowercase: true,
            validate: {
                validator: isEmail,
                message: "Enter a valid email address",
            },
        },
        mobile: {
            type: String,  // Use String instead of Number
            required: [true, "Mobile number is required"],
            unique: true,
            minlength: [10, "Enter a valid mobile number"],
            maxlength: [10, "Enter a valid mobile number"],
            validate: {
                validator: isNumeric,
                message: "Enter a valid mobile number",
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
        },
        role: {
            type: String,
            enum: {
                values: ['owner', 'admin', 'user', 'banned'],
                message: '{VALUE} is not a valid role'
            },
            default: 'user',
            required: true
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

/** Hash the password before saving to the database */
userSchema.pre("save", async function (next) {
    if (this.isModified("password") || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.pre("updateOne", async function (next) {
    const update = this.getUpdate();

    if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
    }

    next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();

    if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
    }

    next();
});

userSchema.pre("updateMany", async function (next) {
    const update = this.getUpdate();

    if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
    }

    next();
});

module.exports = mongoose.model("Users", userSchema);