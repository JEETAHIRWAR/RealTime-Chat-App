/*
========================================
MESSAGE MODEL
========================================
*/
const Message = require("../models/message.model");



/*
========================================
ONLINE USERS MAP
========================================
Stores:
userId -> socketId
========================================
*/
const onlineUsers = {};



/*
========================================
SOCKET HANDLER
========================================
This file handles:
- realtime socket connections
- online users
- private messaging
- disconnect cleanup
- socket events
========================================
*/
const socketHandler = (io) =>
{

    /*
    ========================================
    CONNECTION EVENT
    ========================================
    Runs whenever a new user connects
    ========================================
    */
    io.on("connection", (socket) =>
    {

        console.log(
            "User Connected:",
            socket.id
        );



        /*
        ========================================
        USER CONNECTED EVENT
        ========================================
        Frontend sends logged-in userId
        ========================================
        */
        socket.on("user_connected", (userId) =>
        {

            // STORE USER
            onlineUsers[userId] = socket.id;


            console.log(
                "Online Users:",
                onlineUsers
            );


            /*
            ========================================
            SEND ONLINE USERS TO ALL CLIENTS
            ========================================
            */
            io.emit(
                "online_users",
                onlineUsers
            );

        });




        /*
        ========================================
        SEND MESSAGE EVENT
        ========================================
        Handles:
        - save message in DB
        - send realtime message
        ========================================
        */
        socket.on("send_message", async (data) =>
        {

            try
            {

                const {
                    senderId,
                    receiverId,
                    message
                } = data;



                /*
                ========================================
                SAVE MESSAGE IN DATABASE
                ========================================
                */
                const newMessage = await Message.create({

                    senderId,
                    receiverId,
                    message

                });



                /*
                ========================================
                FIND RECEIVER SOCKET ID
                ========================================
                */
                const receiverSocketId =
                    onlineUsers[receiverId];



                /*
                ========================================
                SEND MESSAGE TO RECEIVER
                ========================================
                */
                if (receiverSocketId)
                {

                    io.to(receiverSocketId).emit(
                        "receive_message",
                        newMessage
                    );

                }



                /*
                ========================================
                SEND MESSAGE BACK TO SENDER
                ========================================
                Optional:
                Helps sender instantly see saved message
                ========================================
                */
                socket.emit(
                    "message_sent",
                    newMessage
                );

            }

            catch (error)
            {

                console.log(
                    "Message Error:",
                    error.message
                );

            }

        });




        /*
        ========================================
        DISCONNECT EVENT
        ========================================
        Runs when:
        - browser closes
        - internet disconnects
        - tab refreshes

        Removes user from online users map
        ========================================
        */
        socket.on("disconnect", () =>
        {

            console.log(
                "User Disconnected:",
                socket.id
            );


            /*
            ========================================
            FIND USER BY SOCKET ID
            ========================================
            */
            for (const userId in onlineUsers)
            {

                if (
                    onlineUsers[userId] === socket.id
                )
                {

                    // REMOVE USER
                    delete onlineUsers[userId];

                    break;

                }

            }


            console.log(
                "Online Users:",
                onlineUsers
            );



            /*
            ========================================
            UPDATE ONLINE USERS FOR ALL CLIENTS
            ========================================
            */
            io.emit(
                "online_users",
                onlineUsers
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