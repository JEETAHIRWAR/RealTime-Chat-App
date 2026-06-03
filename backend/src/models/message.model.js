const mongoose = require("mongoose");

/*
========================================
MESSAGE SCHEMA
========================================
Stores chat messages between users
========================================
*/
const messageSchema = new mongoose.Schema(
    {
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
        MESSAGE TYPE
        text
        image
        file
        ========================================
        */
        messageType: {
            type: String,
            enum: [
                "text",
                "image",
                "file"
            ],
            default: "text"
        },

        /*
        ========================================
        FILE / IMAGE DATA
        ========================================
        */
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
        REPLY TO MESSAGE
        ========================================
        Stores original message reference
        for WhatsApp-style reply feature
        ========================================
        */
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        /*
        ========================================
        MESSAGE REACTIONS
        One user can react to one message.
        Example:
        [
          {
            userId: "...",
            emoji: "❤️"
          }
        ]
        ========================================
        */
        reactions: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },

                emoji: {
                    type: String,
                    required: true
                },

                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        /*
        ========================================
        MESSAGE STATUS
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
        },


        /*
        ========================================
        DELETE MESSAGE
        ========================================
        */
        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        },

        deletedForEveryone: {
            type: Boolean,
            default: false
        },

        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        /*
        ========================================
        EDIT MESSAGE
        ========================================
        */
        isEdited: {
            type: Boolean,
            default: false
        },

        editedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);




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
REACTION INDEX
========================================
Optimized for:
- finding reactions by user
- preventing duplicate reaction logic
========================================
*/
messageSchema.index({
    "reactions.userId": 1
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