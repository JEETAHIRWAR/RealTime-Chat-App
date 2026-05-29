/*
========================================
SOCKET AUTH MIDDLEWARE
========================================
*/
const socketAuth = require(
    "./middleware/socketAuth"
);

/*
========================================
Messages Encrypted
========================================
*/
const {
    encryptMessage,
    decryptMessage
} = require("../utils/encryption");



/*
========================================
ONLINE USERS MANAGER
========================================
*/
const {

    addUserSocket,
    removeUserSocket,
    getOnlineUsers

} = require(
    "./managers/onlineUsers.manager"
);



/*
========================================
MESSAGE MODEL
========================================
*/
const {

    sendMessageService

} = require(
    "../services/message.service"
);



/*
========================================
SOCKET HANDLER
========================================
*/
const socketHandler = (io) =>
{

    /*
    ========================================
    SOCKET AUTH MIDDLEWARE
    ========================================
    */
    io.use(socketAuth);



    /*
    ========================================
    CONNECTION EVENT
    ========================================
    */
    io.on("connection", (socket) =>
    {

        /*
        ========================================
        AUTHENTICATED USER
        ========================================
        */
        const userId = socket.user.id;



        console.log(
            `User Connected: ${userId}`
        );



        /*
        ========================================
        JOIN PERSONAL ROOM
        ========================================

        WHY?
        - multi-device support
        - scalable messaging
        - redis-ready architecture

        ========================================
        */
        socket.join(userId);



        /*
        ========================================
        STORE USER SOCKET
        ========================================
        */
        addUserSocket(
            userId,
            socket.id
        );



        /*
        ========================================
        SEND ONLINE USERS
        ========================================
        */
        io.emit(
            "online_users",
            getOnlineUsers()
        );



        /*
        ========================================
        SEND MESSAGE EVENT
        ========================================
        */
        socket.on(
            "send_message",
            async (data) =>
            {

                try
                {

                    /*
                    ========================================
                    NEVER TRUST FRONTEND senderId
                    ========================================
                    */
                    const senderId =
                        socket.user.id;



                    /*
                    ========================================
                    GET DATA
                    ========================================
                    */
                    const {
                        receiverId,
                        message
                    } = data;



                    /*
                    ========================================
                    VALIDATION
                    ========================================
                    */
                    if (
                        !receiverId ||
                        !message
                    )
                    {

                        return socket.emit(
                            "message_error",
                            {
                                message:
                                    "Invalid data"
                            }
                        );

                    }



                    /*
                    ========================================
                    SEND MESSAGE SERVICE
                    ========================================
                    */
                    const messageData =
                        await sendMessageService({

                            senderId,
                            receiverId,
                            message

                        });

                    /*
                    ========================================
                    SEND MESSAGE TO RECEIVER ROOM
                    ========================================
                    */
                    io.to(receiverId).emit(
                        "receive_message",
                        messageData
                    );



                    /*
                    ========================================
                    SEND CONFIRMATION TO SENDER
                    ========================================
                    */
                    socket.emit(
                        "message_sent",
                        messageData
                    );

                }

                catch (error)
                {

                    console.log(
                        "Message Error Full:",
                        error
                    );

                    console.log(
                        "Message Error Message:",
                        error.message
                    );



                    socket.emit(
                        "message_error",
                        {
                            message:
                                "Failed to send message"
                        }
                    );

                }

            }
        );



        /*
        ========================================
        DISCONNECT EVENT
        ========================================
        */
        socket.on("disconnect", () =>
        {

            console.log(
                `User Disconnected: ${userId}`
            );



            /*
            ========================================
            REMOVE SOCKET
            ========================================
            */
            removeUserSocket(
                userId,
                socket.id
            );



            /*
            ========================================
            UPDATE ONLINE USERS
            ========================================
            */
            io.emit(
                "online_users",
                getOnlineUsers()
            );

        });

    });

};



/*
========================================
EXPORT SOCKET HANDLER
========================================
*/
module.exports = socketHandler;