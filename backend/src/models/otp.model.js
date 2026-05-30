const mongoose = require("mongoose");



/*
========================================
OTP SCHEMA
========================================
Supports:
- email OTP
- phone OTP
- password reset OTP
========================================
*/
const otpSchema = new mongoose.Schema({

    /*
    ========================================
    EMAIL
    ========================================
    */
    email: {
        type: String,
        lowercase: true,
        trim: true
    },



    /*
    ========================================
    PHONE NUMBER
    ========================================
    */
    phone: {
        type: String
    },



    /*
    ========================================
    HASHED OTP
    ========================================
    Never store raw OTP
    ========================================
    */
    otp: {
        type: String,
        required: true
    },



    /*
    ========================================
    OTP PURPOSE
    ========================================
    */
    purpose: {
        type: String,
        enum: [
            "email_verification",
            "phone_verification",
            "password_reset"
        ],
        required: true
    },



    /*
    ========================================
    VERIFICATION STATUS
    ========================================
    */
    verified: {
        type: Boolean,
        default: false
    },



    /*
    ========================================
    OTP EXPIRY
    ========================================
    */
    expiresAt: {
        type: Date,
        required: true
    },



    /*
    ========================================
    OTP ATTEMPTS
    ========================================
    Prevent brute force attacks
    ========================================
    */
    attempts: {
        type: Number,
        default: 0
    }

},
    {
        timestamps: true
    });



/*
========================================
AUTO DELETE EXPIRED OTPs
========================================
MongoDB TTL Index
========================================
*/
otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);



/*
========================================
EXPORT MODEL
========================================
*/
module.exports = mongoose.model(
    "OTP",
    otpSchema
);