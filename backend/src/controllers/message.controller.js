const Message = require("../models/message.model");

const Conversation = require(
    "../models/conversation.model"
);

const {
    decryptMessage,
    encryptMessage
} = require("../utils/encryption");

const {
    getMessageActionPolicy
} = require("../utils/messagePolicy");

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
                conversationId,
                deletedForEveryone: {
                    $ne: true
                },
                deletedFor: {
                    $ne: userId
                }
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
                const actionPolicy =
                    getMessageActionPolicy(
                        msg,
                        new Date()
                    );

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
                        : null,

                    editExpiresAt:
                        actionPolicy.editExpiresAt,

                    deleteForEveryoneExpiresAt:
                        actionPolicy.deleteForEveryoneExpiresAt,

                    canEdit:
                        actionPolicy.canEdit,

                    canDeleteForEveryone:
                        actionPolicy.canDeleteForEveryone
                };
            });

        const totalMessages =
            await Message.countDocuments({
                conversationId,
                deletedForEveryone: {
                    $ne: true
                },
                deletedFor: {
                    $ne: userId
                }
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

/*
========================================
EDIT MESSAGE
========================================
Enforces 15 minute server-side edit window
========================================
*/
exports.editMessage = async (req, res) =>
{
    try
    {
        const userId =
            req.user.id;

        const {
            messageId
        } = req.params;

        const {
            message: newMessage
        } = req.body;

        if (
            !messageId ||
            !newMessage?.trim()
        )
        {
            return res.status(400).json({
                success: false,
                message: "Message content required"
            });
        }

        const message =
            await Message.findById(messageId);

        if (!message)
        {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (
            String(message.senderId) !==
            String(userId)
        )
        {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own messages."
            });
        }

        if (message.deletedForEveryone)
        {
            return res.status(403).json({
                success: false,
                message: "Deleted messages cannot be edited."
            });
        }

        if (message.messageType !== "text")
        {
            return res.status(403).json({
                success: false,
                message: "Only text messages can be edited."
            });
        }

        const actionPolicy =
            getMessageActionPolicy(
                message,
                new Date()
            );

        if (!actionPolicy.canEdit)
        {
            return res.status(403).json({
                success: false,
                message: "Message can no longer be edited."
            });
        }

        const trimmedMessage =
            newMessage.trim();

        message.message =
            encryptMessage(
                trimmedMessage
            );

        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();

        const updatePayload = {
            messageId:
                message._id,
            conversationId:
                message.conversationId,
            message:
                trimmedMessage,
            isEdited: true,
            editedAt:
                message.editedAt,
            editExpiresAt:
                actionPolicy.editExpiresAt,
            deleteForEveryoneExpiresAt:
                actionPolicy.deleteForEveryoneExpiresAt
        };

        emitToMessageParticipants(
            req,
            message,
            "message_updated",
            updatePayload
        );

        emitToMessageParticipants(
            req,
            message,
            "message_edited",
            updatePayload
        );

        res.status(200).json({
            success: true,
            message: "Message updated",
            data: updatePayload
        });
    }
    catch (error)
    {
        console.log(
            "EDIT MESSAGE ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

/*
========================================
DELETE MESSAGE
========================================
Delete for everyone: 1 hour.
Delete for me: always available.
========================================
*/
exports.deleteMessage = async (req, res) =>
{
    try
    {
        const userId =
            req.user.id;

        const {
            messageId
        } = req.params;

        const {
            deleteForEveryone = false
        } = req.body;

        if (!messageId)
        {
            return res.status(400).json({
                success: false,
                message: "Message ID required"
            });
        }

        const message =
            await Message.findById(messageId);

        if (!message)
        {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (deleteForEveryone)
        {
            if (
                String(message.senderId) !==
                String(userId)
            )
            {
                return res.status(403).json({
                    success: false,
                    message: "You can only delete your own messages for everyone."
                });
            }

            const actionPolicy =
                getMessageActionPolicy(
                    message,
                    new Date()
                );

            if (!actionPolicy.canDeleteForEveryone)
            {
                return res.status(403).json({
                    success: false,
                    message: "Delete for everyone time limit exceeded."
                });
            }

            message.isDeleted = true;
            message.deletedForEveryone = true;
            message.deletedAt = new Date();

            await message.save();

            emitToMessageParticipants(
                req,
                message,
                "message_deleted",
                {
                    messageId:
                        message._id,
                    conversationId:
                        message.conversationId,
                    deleteForEveryone: true
                }
            );

            return res.status(200).json({
                success: true,
                message: "Message deleted for everyone"
            });
        }

        const alreadyDeleted =
            message.deletedFor.some(
                (id) =>
                    String(id) ===
                    String(userId)
            );

        if (!alreadyDeleted)
        {
            message.deletedFor.push(userId);
            await message.save();
        }

        const io =
            req.app.get("io");

        if (io)
        {
            io.to(userId.toString()).emit(
                "message_deleted",
                {
                    messageId:
                        message._id,
                    conversationId:
                        message.conversationId,
                    deleteForEveryone: false
                }
            );
        }

        res.status(200).json({
            success: true,
            message: "Message deleted for me"
        });
    }
    catch (error)
    {
        console.log(
            "DELETE MESSAGE ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const emitToMessageParticipants = (
    req,
    message,
    eventName,
    payload
) =>
{
    const io =
        req.app.get("io");

    if (!io)
    {
        return;
    }

    io.to([
        message.conversationId.toString(),
        message.senderId.toString(),
        message.receiverId.toString()
    ]).emit(
        eventName,
        payload
    );
};
