const Conversation = require(
    "../models/conversation.model"
);

const {
    encryptMessage,
    decryptMessage
} = require("../utils/encryption");





/*
========================================
SAFE DECRYPT
========================================
*/
const safeDecrypt = (value) =>
{

    try
    {

        return value
            ? decryptMessage(value)
            : "";

    } catch
    {

        return "";

    }

};





/*
========================================
FIND OR CREATE CONVERSATION
========================================
*/
const findOrCreateConversation =
    async (

        senderId,
        receiverId

    ) =>
    {

        let conversation =
            await Conversation.findOne({

                participants: {
                    $all: [
                        senderId,
                        receiverId
                    ]
                }

            });

        if (!conversation)
        {

            conversation =
                await Conversation.create({

                    participants: [
                        senderId,
                        receiverId
                    ]

                });

        }

        return conversation;

    };





/*
========================================
UPDATE LAST MESSAGE
========================================
Stores encrypted lastMessage in DB
========================================
*/
const updateLastMessage =
    async (

        conversationId,
        senderId,
        message,
        receiverId

    ) =>
    {

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation)
        {
            return null;
        }

        conversation.lastMessage =
            encryptMessage(message);

        conversation.lastMessageSender =
            senderId;

        conversation.lastMessageAt =
            new Date();

        const currentCount =
            conversation.unreadCounts.get(
                receiverId.toString()
            ) || 0;

        conversation.unreadCounts.set(
            receiverId.toString(),
            currentCount + 1
        );

        await conversation.save();

        return conversation;

    };





/*
========================================
GET USER CONVERSATIONS
========================================
Returns decrypted lastMessage to frontend
========================================
*/
const getUserConversations =
    async (userId) =>
    {

        const conversations =
            await Conversation.find({
                participants: userId
            })
                .populate(
                    "participants",
                    "name email avatar"
                )
                .sort({
                    lastMessageAt: -1
                });

        return conversations.map((conversation) =>
        {

            const conv =
                conversation.toObject();

            const unreadCount =
                conversation.unreadCounts?.get(
                    userId.toString()
                ) || 0;

            return {
                ...conv,

                lastMessage: safeDecrypt(
                    conv.lastMessage
                ),

                unreadCount
            };

        });

    };





/*
========================================
RESET UNREAD COUNT
========================================
*/
const resetUnreadCount =
    async (

        conversationId,
        userId

    ) =>
    {

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation)
        {
            return null;
        }

        conversation.unreadCounts.set(
            userId.toString(),
            0
        );

        await conversation.save();

        return conversation;

    };





/*
========================================
EXPORT REPOSITORY
========================================
*/
module.exports = {

    findOrCreateConversation,

    updateLastMessage,

    getUserConversations,

    resetUnreadCount

};