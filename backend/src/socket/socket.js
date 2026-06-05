
/*
========================================
IMPORTS
========================================
*/
const Message = require("../models/message.model");



const {
    encryptMessage,
    decryptMessage
} = require("../utils/encryption");

const {
    getMessageActionPolicy
} = require("../utils/messagePolicy");

const {

    addUserSocket,
    removeUserSocket,
    getOnlineUsers

} = require(
    "./managers/onlineUsers.manager"
);

const {

    findOrCreateConversation,

    updateLastMessage,

    getUserConversations,

    resetUnreadCount

} = require(
    "../repositories/conversation.repository"
);





/*
========================================
SAFE DECRYPTION
========================================
Prevents crashes if:
- invalid encrypted data
- null values
- malformed strings
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

const emitForbidden = (
    socket,
    message
) =>
{
    socket.emit(
        "message_action_error",
        {
            status: 403,
            message
        }
    );
};

const emitToMessageParticipants = (
    io,
    message,
    eventName,
    payload
) =>
{
    io.to([
        message.conversationId.toString(),
        message.senderId.toString(),
        message.receiverId.toString()
    ]).emit(
        eventName,
        payload
    );
};






/*
========================================
SOCKET HANDLER
========================================
Handles:
- authenticated connections
- realtime messaging
- typing indicators
- online presence
- disconnect cleanup
- conversation rooms
- multi-tab sync
========================================
*/
const socketHandler = (io) =>
{

    /*
    ========================================
    CONNECTION EVENT
    ========================================
    */
    io.on("connection", (socket) =>
    {

        /*
        ====================================
        AUTHENTICATED USER
        ====================================
        */
        const userId =
            socket.user.id;



        console.log(
            "User Connected:",
            userId
        );





        /*
        ====================================
        JOIN PERSONAL ROOM
        ====================================
        Supports:
        - multi-device sync
        - multiple tabs
        - notifications
        ====================================
        */
        socket.join(
            userId.toString()
        );





        /*
        ====================================
        JOIN CONVERSATION ROOM
        ====================================
        */
        socket.on(
            "join_conversation",

            (conversationId) =>
            {

                try
                {

                    if (!conversationId)
                    {
                        return;
                    }



                    socket.join(
                        conversationId.toString()
                    );

                }

                catch (error)
                {

                    console.log(
                        "JOIN CONVERSATION ERROR:",
                        error.message
                    );

                }

            }

        );





        /*
        ====================================
        STORE USER SOCKET
        ====================================
        */
        addUserSocket(
            userId.toString(),
            socket.id
        );





        /*
        ====================================
        BROADCAST ONLINE USERS
        ====================================
        */
        io.emit(
            "online_users",
            getOnlineUsers()
        );






        /*
        ====================================
        SEND MESSAGE
        ====================================
        */
        socket.on(
            "send_message",

            async (payload = {}) =>
            {
                try
                {
                    /*
                    ========================
                    PAYLOAD VALIDATION
                    ========================
                    */
                    const {
                        receiverId,
                        conversationId,
                        message = "",
                        messageType = "text",
                        fileUrl = "",
                        fileName = "",
                        fileSize = 0,
                        mimeType = "",
                        replyTo = null
                    } = payload;

                    if (!receiverId || !conversationId)
                    {
                        return;
                    }

                    if (messageType === "text" && !message.trim())
                    {
                        return;
                    }

                    if (messageType !== "text" && !fileUrl)
                    {
                        return;
                    }

                    /*
                    ========================================
                    FIND OR CREATE CONVERSATION
                    ========================================
                    */
                    const conversation =
                        await findOrCreateConversation(
                            userId,
                            receiverId
                        );

                    const finalConversationId =
                        conversationId || conversation._id;

                    /*
                    ========================
                    ENCRYPT MESSAGE
                    ========================
                    */
                    const encryptedMessage =
                        encryptMessage(
                            message || fileName || ""
                        );

                    /*
                    ========================
                    SAVE MESSAGE
                    ========================
                    */
                    const messageData =
                        await Message.create({

                            conversationId:
                                finalConversationId,

                            senderId:
                                userId,

                            receiverId,

                            message:
                                encryptedMessage,

                            messageType,

                            fileUrl,

                            fileName,

                            fileSize,

                            mimeType,

                            replyTo

                        });

                    /*
                    ========================
                    DELIVERED STATUS
                    ========================
                    */
                    const receiverIsOnline =
                        getOnlineUsers().includes(
                            receiverId.toString()
                        );

                    if (receiverIsOnline)
                    {
                        messageData.status =
                            "delivered";

                        await messageData.save();
                    }


                    let replyMessage = null;

                    if (replyTo)
                    {
                        const replied =
                            await Message.findById(replyTo)
                                .select("message senderId messageType fileName fileUrl");

                        if (replied)
                        {
                            replyMessage = {
                                _id: replied._id,
                                senderId: replied.senderId,
                                message: safeDecrypt(replied.message),
                                messageType: replied.messageType,
                                fileName: replied.fileName,
                                fileUrl: replied.fileUrl
                            };
                        }
                    }




                    /*
                    ========================
                    FORMAT RESPONSE
                    ========================
                    */
                    const formattedMessage = {

                        _id:
                            messageData._id,

                        conversationId:
                            finalConversationId,

                        senderId:
                            messageData.senderId,

                        receiverId:
                            messageData.receiverId,

                        message:
                            safeDecrypt(
                                messageData.message
                            ),

                        messageType:
                            messageData.messageType,

                        fileUrl:
                            messageData.fileUrl,

                        fileName:
                            messageData.fileName,

                        fileSize:
                            messageData.fileSize,

                        mimeType:
                            messageData.mimeType,

                        status:
                            messageData.status,

                        reactions: messageData.reactions || [],

                        replyTo: replyMessage,

                        isEdited:
                            messageData.isEdited,

                        editedAt:
                            messageData.editedAt,

                        editExpiresAt:
                            getMessageActionPolicy(messageData)
                                .editExpiresAt,

                        deleteForEveryoneExpiresAt:
                            getMessageActionPolicy(messageData)
                                .deleteForEveryoneExpiresAt,

                        createdAt:
                            messageData.createdAt

                    };

                    /*
                    ========================================
                    UPDATE CONVERSATION
                    ========================================
                    */
                    await updateLastMessage(

                        finalConversationId,

                        userId,

                        message || fileName || "File",

                        receiverId

                    );

                    /*
                    ========================================
                    GET UPDATED CONVERSATIONS
                    ========================================
                    */
                    const senderConversations =
                        await getUserConversations(
                            userId
                        );

                    const receiverConversations =
                        await getUserConversations(
                            receiverId
                        );

                    /*
                    ========================================
                    REALTIME SIDEBAR UPDATE
                    ========================================
                    */
                    io.to(
                        userId.toString()
                    ).emit(
                        "conversations_updated",
                        senderConversations
                    );

                    io.to(
                        receiverId.toString()
                    ).emit(
                        "conversations_updated",
                        receiverConversations
                    );

                    /*
                    ========================
                    SEND TO RECEIVER
                    ========================
                    */
                    io.to(
                        receiverId.toString()
                    ).emit(
                        "receive_message",
                        formattedMessage
                    );

                    /*
                    ========================
                    MULTI-DEVICE SYNC
                    SEND TO ALL SENDER DEVICES
                    ========================
                    */
                    io.to(
                        userId.toString()
                    ).emit(
                        "message_sent",
                        formattedMessage
                    );
                }

                catch (error)
                {
                    console.log(
                        "SEND MESSAGE ERROR:",
                        error.message
                    );
                }
            }
        );








        /*
        ====================================
        MESSAGE SEEN
        ====================================
        */
        socket.on(
            "message_seen",

            async (payload = {}) =>
            {

                try
                {

                    const {
                        messageId,
                        senderId,
                        conversationId
                    } = payload;



                    if (
                        !messageId ||
                        !senderId || !conversationId
                    )
                    {
                        return;
                    }




                    await Message.findOneAndUpdate(
                        {
                            _id: messageId,
                            conversationId,
                            receiverId: userId
                        },
                        {
                            status: "seen"
                        }
                    );





                    const seenPayload = {
                        messageId,
                        conversationId,
                        status: "seen"
                    };

                    /*
                    ========================================
                    NOTIFY SENDER
                    ========================================
                    Sender sees blue double tick realtime
                    ========================================
                    */
                    io.to(
                        senderId.toString()
                    ).emit(
                        "message_seen",
                        seenPayload
                    );

                    /*
                    ========================================
                    SYNC RECEIVER DEVICES
                    ========================================
                    If receiver has multiple tabs/devices
                    ========================================
                    */
                    io.to(
                        userId.toString()
                    ).emit(
                        "message_seen",
                        seenPayload
                    );

                }

                catch (error)
                {

                    console.log(
                        "MESSAGE SEEN ERROR:",
                        error.message
                    );

                }

            }

        );

        /*
====================================
MESSAGE REACTION
====================================
Adds / updates / removes reaction
====================================
*/
        socket.on(
            "message_reaction",

            async (payload = {}) =>
            {
                try
                {
                    const {
                        messageId,
                        conversationId,
                        emoji
                    } = payload;

                    if (!messageId || !conversationId)
                    {
                        return;
                    }

                    const message =
                        await Message.findOne({
                            _id: messageId,
                            conversationId
                        });

                    if (!message)
                    {
                        return;
                    }

                    const userReactionIndex =
                        message.reactions.findIndex(
                            (reaction) =>
                                String(reaction.userId) ===
                                String(userId)
                        );


                    /*
                    ========================
                    REMOVE REACTION
                    If same emoji clicked again
                    ========================
                    */
                    if (
                        userReactionIndex !== -1 &&
                        message.reactions[userReactionIndex].emoji === emoji
                    )
                    {
                        message.reactions.splice(
                            userReactionIndex,
                            1
                        );
                    }

                    /*
                    ========================
                    UPDATE EXISTING REACTION
                    ========================
                    */
                    else if (userReactionIndex !== -1)
                    {
                        message.reactions[userReactionIndex].emoji =
                            emoji;
                    }

                    /*
                    ========================
                    ADD NEW REACTION
                    ========================
                    */
                    else
                    {
                        message.reactions.push({
                            userId,
                            emoji
                        });
                    }

                    await message.save();


                    const reactionPayload = {
                        messageId,
                        conversationId,
                        reactions: message.reactions
                    };

                    /*
                    ========================
                    SEND REACTION UPDATE
                    To conversation room + both users
                    ========================
                    */
                    io.to(
                        conversationId.toString()
                    ).emit(
                        "message_reaction_updated",
                        reactionPayload
                    );

                    io.to(
                        message.senderId.toString()
                    ).emit(
                        "message_reaction_updated",
                        reactionPayload
                    );

                    io.to(
                        message.receiverId.toString()
                    ).emit(
                        "message_reaction_updated",
                        reactionPayload
                    );
                }
                catch (error)
                {
                    console.log(
                        "MESSAGE REACTION ERROR:",
                        error.message
                    );
                }
            }
        );


        /*
===================================
EDIT MESSAGE
===================================
*/
        socket.on(

            "edit_message",

            async (payload = {}) =>
            {

                try
                {

                    const {
                        messageId,
                        newMessage
                    } = payload;

                    if (
                        !messageId ||
                        !newMessage?.trim()
                    )
                    {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (!message)
                    {
                        return;
                    }

                    if (message.deletedForEveryone)
                    {
                        emitForbidden(
                            socket,
                            "Deleted messages cannot be edited."
                        );

                        return;
                    }

                    if (message.messageType !== "text")
                    {
                        emitForbidden(
                            socket,
                            "Only text messages can be edited."
                        );

                        return;
                    }

                    /*
                    ==========================
                    ONLY SENDER CAN EDIT
                    ==========================
                    */
                    if (
                        String(message.senderId) !==
                        String(userId)
                    )
                    {
                        emitForbidden(
                            socket,
                            "You can only edit your own messages."
                        );

                        return;
                    }

                    const actionPolicy =
                        getMessageActionPolicy(
                            message,
                            new Date()
                        );

                    if (!actionPolicy.canEdit)
                    {
                        emitForbidden(
                            socket,
                            "Message can no longer be edited."
                        );

                        return;
                    }

                    /*
                    ==========================
                    UPDATE MESSAGE
                    ==========================
                    */
                    message.message =
                        encryptMessage(
                            newMessage
                        );

                    message.isEdited = true;

                    message.editedAt =
                        new Date();

                    await message.save();

                    /*
                    ==========================
                    REALTIME UPDATE
                    ==========================
                    */
                    const updatePayload = {
                        messageId,
                        conversationId:
                            message.conversationId,

                        message:
                            newMessage,

                        isEdited: true,

                        editedAt:
                            message.editedAt,

                        editExpiresAt:
                            actionPolicy.editExpiresAt,

                        deleteForEveryoneExpiresAt:
                            actionPolicy.deleteForEveryoneExpiresAt
                    };

                    emitToMessageParticipants(
                        io,
                        message,
                        "message_updated",
                        updatePayload
                    );

                    emitToMessageParticipants(
                        io,
                        message,
                        "message_edited",
                        updatePayload
                    );

                }

                catch (error)
                {

                    console.log(
                        "EDIT MESSAGE ERROR:",
                        error.message
                    );

                }

            }

        );


        /*
        ====================================
        DELETE MESSAGE
        ====================================
        */
        socket.on(

            "delete_message",

            async (payload = {}) =>
            {

                try
                {

                    const {
                        messageId,
                        deleteForEveryone = false
                    } = payload;

                    if (!messageId)
                    {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (!message)
                    {
                        return;
                    }

                    /*
                    ==========================
                    DELETE FOR EVERYONE
                    ==========================
                    */
                    if (
                        deleteForEveryone &&
                        String(message.senderId) ===
                        String(userId)
                    )
                    {
                        const actionPolicy =
                            getMessageActionPolicy(
                                message,
                                new Date()
                            );

                        if (!actionPolicy.canDeleteForEveryone)
                        {
                            emitForbidden(
                                socket,
                                "Delete for everyone time limit exceeded."
                            );

                            return;
                        }

                        message.isDeleted = true;

                        message.deletedForEveryone = true;

                        message.deletedAt =
                            new Date();

                        await message.save();

                        emitToMessageParticipants(
                            io,
                            message,
                            "message_deleted",
                            {
                                messageId,
                                conversationId:
                                    message.conversationId,
                                deleteForEveryone: true
                            }
                        );

                        return;

                    }

                    if (deleteForEveryone)
                    {
                        emitForbidden(
                            socket,
                            "You can only delete your own messages for everyone."
                        );

                        return;
                    }

                    /*
                    ==========================
                    DELETE FOR ME
                    ==========================
                    */
                    const alreadyDeleted =
                        message.deletedFor.some(
                            (id) =>
                                String(id) ===
                                String(userId)
                        );

                    if (!alreadyDeleted)
                    {

                        message.deletedFor.push(
                            userId
                        );

                        await message.save();

                    }

                    io.to(
                        userId.toString()
                    ).emit(
                        "message_deleted",
                        {
                            messageId,
                            conversationId:
                                message.conversationId,
                            deleteForEveryone: false
                        }
                    );

                }

                catch (error)
                {

                    console.log(
                        "DELETE MESSAGE ERROR:",
                        error.message
                    );

                }

            }

        );

        /*
        ====================================
        TYPING START
        ====================================
        */
        socket.on(
            "typing_start",

            (payload = {}) =>
            {
                try
                {
                    const { conversationId } = payload;

                    if (!conversationId)
                    {
                        return;
                    }

                    socket.to(
                        conversationId.toString()
                    ).emit(
                        "typing_start",
                        {
                            senderId: userId,
                            conversationId
                        }
                    );
                }
                catch (error)
                {
                    console.log(
                        "TYPING START ERROR:",
                        error.message
                    );
                }
            }
        );


        /*
        ====================================
        TYPING STOP
        ====================================
        */
        socket.on(
            "typing_stop",

            (payload = {}) =>
            {
                try
                {
                    const { conversationId } = payload;

                    if (!conversationId)
                    {
                        return;
                    }

                    socket.to(
                        conversationId.toString()
                    ).emit(
                        "typing_stop",
                        {
                            senderId: userId,
                            conversationId
                        }
                    );
                }
                catch (error)
                {
                    console.log(
                        "TYPING STOP ERROR:",
                        error.message
                    );
                }
            }
        );





        /*
        ====================================
        MARK CONVERSATION READ
        ====================================
        */
        socket.on(
            "mark_conversation_read",

            async (payload = {}) =>
            {
                try
                {
                    const { conversationId } = payload;

                    if (!conversationId)
                    {
                        return;
                    }

                    await resetUnreadCount(
                        conversationId,
                        userId
                    );

                    const updatedConversations =
                        await getUserConversations(userId);

                    io.to(userId.toString()).emit(
                        "conversations_updated",
                        updatedConversations
                    );
                }
                catch (error)
                {
                    console.log(
                        "MARK READ ERROR:",
                        error.message
                    );
                }
            }
        );





        /*
        ====================================
        DISCONNECT EVENT
        ====================================
        */
        socket.on(
            "disconnect",

            () =>
            {

                console.log(
                    "User Disconnected:",
                    userId
                );




                /*
                ============================
                REMOVE SOCKET
                ============================
                */
                removeUserSocket(
                    userId.toString(),
                    socket.id
                );





                /*
                ============================
                UPDATE ONLINE USERS
                ============================
                */
                io.emit(

                    "online_users",

                    getOnlineUsers()

                );

            }

        );

    });

};






/*
========================================
EXPORT SOCKET HANDLER
========================================
*/
module.exports = socketHandler;
