const mongoose = require("mongoose");



/*
========================================
CONVERSATION SCHEMA
========================================
Stores:
- chat participants
- last message
- unread counts
- latest activity
========================================
*/
const conversationSchema =
    new mongoose.Schema({

        /*
        ========================================
        CHAT PARTICIPANTS
        ========================================
        */
        participants: [

            {
                type: mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true
            }

        ],




        /*
        ========================================
        LAST MESSAGE
        ========================================
        */
        lastMessage: {

            type: String,

            default: ""

        },




        /*
        ========================================
        LAST MESSAGE SENDER
        ========================================
        */
        lastMessageSender: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User"

        },




        /*
        ========================================
        LAST MESSAGE TIME
        ========================================
        */
        lastMessageAt: {

            type: Date,

            default: Date.now

        },




        /*
        ========================================
        UNREAD COUNTS
        ========================================
        userId -> unread count
        ========================================
        */
        unreadCounts: {

            type: Map,

            of: Number,

            default: {}

        }

    },
        {
            timestamps: true
        });



/*
========================================
INDEXES
========================================
*/
conversationSchema.index({
    participants: 1
});

conversationSchema.index({
    lastMessageAt: -1
});



/*
========================================
EXPORT MODEL
========================================
*/
module.exports = mongoose.model(

    "Conversation",

    conversationSchema

);