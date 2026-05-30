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
        sparse: true
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
            "phone"
        ],
        default: "local"
    },



    /*
    ========================================
    ACCOUNT VERIFICATION
    ========================================
    */
    isVerified: {
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