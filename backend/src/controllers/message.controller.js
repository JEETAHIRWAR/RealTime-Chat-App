const Message = require("../models/message.model");

const Conversation = require(
    "../models/conversation.model"
);

const {
    decryptMessage
} = require("../utils/encryption");

/*
========================================
SAFE DECRYPTION
========================================
*/
const safeDecrypt = (value) =>
{
    try
    {
        return value
            ? decryptMessage(value)
            : "";
    }
    catch (error)
    {
        return "";
    }
};

/*
========================================
GET CONVERSATION MESSAGES
========================================
Returns paginated chat history
using conversationId
========================================
*/
exports.getMessages = async (req, res) =>
{
    try
    {
        const userId =
            req.user.id;

        const {
            conversationId
        } = req.params;

        if (!conversationId)
        {
            return res.status(400).json({
                success: false,
                message: "Conversation ID required"
            });
        }

        /*
        ========================================
        VERIFY USER BELONGS TO CONVERSATION
        ========================================
        */
        const conversation =
            await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

        if (!conversation)
        {
            return res.status(403).json({
                success: false,
                message: "Unauthorized conversation access"
            });
        }

        /*
        ========================================
        PAGINATION
        ========================================
        */
        const page =
            parseInt(req.query.page) || 1;

        const limit =
            parseInt(req.query.limit) || 20;

        const skip =
            (page - 1) * limit;

        /*
        ========================================
        GET MESSAGES
        ========================================
        */
        const messages =
            await Message.find({
                conversationId
            })
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "replyTo",
                    select: "message senderId messageType fileName fileUrl"
                })
                .lean();

        /*
        ========================================
        DECRYPT MESSAGES
        ========================================
        */
        const decryptedMessages =
            messages.map((msg) =>
            {
                return {
                    ...msg,

                    message:
                        safeDecrypt(
                            msg.message
                        ),

                    replyTo: msg.replyTo
                        ? {
                            ...msg.replyTo,
                            message:
                                safeDecrypt(
                                    msg.replyTo.message
                                )
                        }
                        : null
                };
            });

        const totalMessages =
            await Message.countDocuments({
                conversationId
            });

        res.status(200).json({
            success: true,
            currentPage: page,
            totalMessages,
            totalPages:
                Math.ceil(
                    totalMessages / limit
                ),
            hasMore:
                skip + messages.length <
                totalMessages,
            messages:
                decryptedMessages.reverse()
        });
    }
    catch (error)
    {
        console.log(
            "GET MESSAGES ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};