const mongoose = require("mongoose");



/*
========================================
USER SCHEMA
========================================
Supports:
- email authentication
- phone authentication
- Google OAuth
- profile system
- refresh tokens
========================================
*/
const userSchema = new mongoose.Schema({

    /*
    ========================================
    BASIC INFO
    ========================================
    */
    name: {
        type: String,
        required: true,
        trim: true
    },



    /*
    ========================================
    EMAIL
    ========================================
    */
    email: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        lowercase: true,
        trim: true
    },



    /*
    ========================================
    PHONE NUMBER
    ========================================
    */
    phone: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        trim: true
    },



    /*
    ========================================
    PASSWORD
    ========================================
    Not required for Google login users
    ========================================
    */
    // password: {
    //     type: String
    // },

    password: {
        type: String,
        required: function ()
        {
            return this.authProvider === "local";
        }
    },



    /*
    ========================================
    GOOGLE AUTH ID
    ========================================
    */
    googleId: {
        type: String,
        default: null
    },



    /*
    ========================================
    USER AVATAR
    ========================================
    */
    avatar: {
        type: String,
        default: ""
    },



    /*
    ========================================
    AUTH PROVIDER
    ========================================
    local
    google
    phone
    ========================================
    */
    authProvider: {
        type: String,
        enum: [
            "local",
            "google",
            "email_otp",
            "phone_otp"
        ],
        default: "local"
    },



    /*
    ========================================
    ACCOUNT VERIFICATION
    ========================================
    Overall account verification
    ========================================
    */
    isVerified: {
        type: Boolean,
        default: false
    },

    /*
    ========================================
    EMAIL VERIFICATION
    ========================================
    */
    emailVerified: {
        type: Boolean,
        default: false
    },

    /*
    ========================================
    PHONE VERIFICATION
    ========================================
    */
    phoneVerified: {
        type: Boolean,
        default: false
    },



    /*
    ========================================
    LAST SEEN
    ========================================
    */
    lastSeen: {
        type: Date,
        default: Date.now
    },



    /*
    ========================================
    USER BIO
    ========================================
    */
    bio: {
        type: String,
        default: ""
    },



    /*
    ========================================
    REFRESH TOKEN
    ========================================
    Used for session management
    ========================================
    */
    refreshToken: {
        type: String,
        default: null
    }

},
    {
        timestamps: true
    });



/*
========================================
EXPORT MODEL
========================================
*/
module.exports = mongoose.model(
    "User",
    userSchema
);