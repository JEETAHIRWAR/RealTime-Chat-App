
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
                        mimeType = ""
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

                            mimeType

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





                    io.to(
                        senderId.toString()
                    ).emit(

                        "message_seen",

                        {
                            messageId
                        }

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
