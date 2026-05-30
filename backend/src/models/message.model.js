
const mongoose = require("mongoose");



/*
========================================
MESSAGE SCHEMA
========================================
Stores chat messages between users
========================================
*/
const messageSchema = new mongoose.Schema({

    /*
    ========================================
    CONVERSATION ID
    ========================================
    Used for:
    - chat history
    - pagination
    - realtime rooms
    - scalable conversations
    ========================================
    */
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Conversation",

        required: true,

        index: true
    },




    /*
    ========================================
    SENDER
    ========================================
    */
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },




    /*
    ========================================
    RECEIVER
    ========================================
    */
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },




    /*
    ========================================
    ENCRYPTED MESSAGE
    ========================================
    */
    message: {
        type: String,
        required: true,
        trim: true
    },

    /*
    ========================================
    Upload content MESSAGE
    ========================================
    */

    messageType: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text"
    },

    fileUrl: {
        type: String,
        default: ""
    },

    fileName: {
        type: String,
        default: ""
    },

    fileSize: {
        type: Number,
        default: 0
    },

    mimeType: {
        type: String,
        default: ""
    },

    /*
    ========================================
    MESSAGE STATUS
    ========================================
    sent
    delivered
    seen
    ========================================
    */
    status: {

        type: String,

        enum: [
            "sent",
            "delivered",
            "seen"
        ],

        default: "sent"
    }

},
    {
        timestamps: true
    });




/*
========================================
INDEXES
========================================
Optimized for:
- chat history loading
- pagination
- realtime performance
========================================
*/
messageSchema.index({
    conversationId: 1,
    createdAt: -1
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
