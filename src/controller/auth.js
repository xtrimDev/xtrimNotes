const bcrypt = require("bcrypt");

const users = require("../models/users");
const verifications = require("../models/verification");
const { default: mongoose } = require("mongoose");

const newUser = async (name, email, mobile, password) => {
    try {
        const findWithEmail = await users.findOne({ email });
        const findWithMobile = await users.findOne({ mobile });

        const usersCount = await users.countDocuments();
        const role = usersCount === 0 ? 'owner' : 'user';

        if (!findWithEmail && !findWithMobile) {
            const user = new users({
                name,
                email,
                mobile,
                password,
                role
            });

            const result = await user.save();

            if (result) {
                return {
                    success: true,
                    registrationData: result
                }
            } else {
                return {
                    success: false
                };
            }
        } else {
            return { success: false, msg: "User already registered with the email or number" }
        }
    } catch (error) {
        return {
            success: false,
            msg: error
        };
    }
};

const removeUser = async ({ email, mobile }) => {
    try {
        let findWithEmail;
        let findWithMobile;
        if (email) {
            findWithEmail = await users.findOne({ email });
        }

        if (mobile) {
            findWithMobile = await users.findOne({ mobile });
        }

        if (findWithEmail || findWithMobile) {
            if (findWithEmail) {
                await users.deleteOne({ email });
            } else {
                await users.deleteOne({ mobile });
            }

            return { success: true, msg: "User unregistered successfully" };
        } else {
            throw new Error("User is not registered with the email or mobile");
        }
    } catch (error) {
        return {
            success: false,
            msg: error.message
        }
    }
}

const userLogin = async (email, password) => {
    try {
        const result = await users.findOne({ email });

        if (!result) {
            return { success: false, msg: "No user found with this email" }
        }

        if (await bcrypt.compare(password, result.password)) {
            if (result.verified == true) {
                if (result.role == "banned") {
                    return { success: false, msg: "Your account is banned, try contacting to the admin", verified: true }
                } else {
                    return { success: true, msg: "Authenticated successfully", userData: result, verified: true };
                }
            } else {
                return { success: true, msg: "Your account is not activated", userData: result, verified: false };
            }
        } else {
            return { success: false, msg: "Password did not match" }
        }
    } catch (error) {
        return {
            success: false,
            msg: error
        };
    }
}

const newVerification = async (userId, uniqueString, expiresAt, type = "auth") => {
    try {
        await removeVerification(userId, type);

        const verification = new verifications({
            userId,
            uniqueString,
            type,
            expiresAt
        });

        const result = await verification.save();

        if (result) {
            return {
                success: true
            }
        } else {
            return {
                success: false,
                msg: "Error saving the verification"
            };
        }
    } catch (error) {
        return {
            success: false,
            msg: error?.message
        };
    }
};

const checkVerification = async(userId, uniqueString, type = "auth") => {
    try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
            const findById = await users.findById(userId);

            if (findById) {
                const findVerificationOfUser = await verifications.findOne({ userId, type });

                if (findVerificationOfUser) {
                    const isUniqueStringMatched = await bcrypt.compare(uniqueString, findVerificationOfUser.uniqueString);

                    if (isUniqueStringMatched && findVerificationOfUser.expiresAt > Date.now()) {
                        
                        if (type == "auth" && !findById.verified) {
                            return { success: 1,  msg: "User verified successfully", expired: 0}
                        } else if (type == "reset") {
                            return {success: 1, msg: "User verified successfully", expired: 0}
                        } else {
                            return {
                                success: 0,
                                msg: "The link is Invalid.",
                                expired: 1
                            }
                        }
                    } else {
                        return {
                            success: 0,
                            msg: "The link is expired or invalid.",
                            expired: 1
                        }
                    }
                } else {
                    return {
                        success: 0,
                        msg: "The link is expired or invalid.",
                        expired: 1
                    }
                }
            } else {
                return {
                    success: 0,
                    msg: "User is invalid",
                    expired: 0
                }
            }
        }
    } catch (error) {
        return {
            success: 0,
            msg: error,
            expired: 0
        }
    }
}

const verifyVerification = async (userId, uniqueString, type = "auth", extra = {}) => {
    try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
            const findById = await users.findById(userId);

            if (findById) {
                const findVerificationOfUser = await verifications.findOne({ userId, type });

                if (findVerificationOfUser) {
                    const isUniqueStringMatched = await bcrypt.compare(uniqueString, findVerificationOfUser.uniqueString);

                    if (isUniqueStringMatched && findVerificationOfUser.expiresAt > Date.now()) {
                        
                        if (type == "auth" && !findById.verified) {
                            await users.updateOne({ _id: userId }, { $set: { verified: true } });

                            await removeVerification(userId, type);

                            return { success: 1,  msg: "User verified successfully", expired: 0}
                        } else if (type == "reset") {
                            const salt = await bcrypt.genSalt(10);
                            const password = await bcrypt.hash(extra?.password, salt);

                            await users.updateOne({ _id: userId }, { $set: { password} });

                            await removeVerification(userId, type);

                            return {success: 1, msg: "User verified successfully", expired: 0}
                        } else {
                            return {
                                success: 0,
                                msg: "The link is Invalid.",
                                expired: 1
                            }
                        }
                    } else {
                        return {
                            success: 0,
                            msg: "The link is expired or invalid.",
                            expired: 1
                        }
                    }
                } else {
                    return {
                        success: 0,
                        msg: "The link is expired or invalid.",
                        expired: 1
                    }
                }
            } else {
                return {
                    success: 0,
                    msg: "User is invalid",
                    expired: 0
                }
            }
        }
    } catch (error) {
        return {
            success: 0,
            msg: error,
            expired: 0
        }
    }
}

const removeVerification = async (userId, type) => {
    try {
        const findWithId = await verifications.findOne({ userId, type });

        if (findWithId) {
            await verifications.deleteMany({ userId, type });

            return { success: true, msg: "Verification removed successfully" };
        } else {
            throw new Error("User id is invalid");
        }
    } catch (error) {
        return {
            success: false,
            msg: error.message
        }
    }
};

const resetPass = async (email) => {
    try {
        const findByEmail = await users.findOne({ email });

        if (findByEmail) {
            return { success: true, msg: "User details fetched", userData: findByEmail };
        } else {
            return { success: false, msg: "User not found with the email" }
        }
    } catch (error) {
        return {
            success: false,
            msg: error
        }
    }
}

module.exports = { newUser, removeUser, userLogin, checkVerification, verifyVerification, newVerification, removeVerification, resetPass }