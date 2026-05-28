const mongoose = require("mongoose");



/*
========================================
MESSAGE SCHEMA
========================================
Stores chat messages between users
========================================
*/
const messageSchema = new mongoose.Schema({

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true
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
    "Message",
    messageSchema
);