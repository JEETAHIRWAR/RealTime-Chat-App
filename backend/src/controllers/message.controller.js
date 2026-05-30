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
Prevents crashes if:
- invalid encrypted data
- malformed strings
- null values
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

        /*
        ========================================
        CURRENT LOGGED-IN USER
        ========================================
        */
        const userId =
            req.user.id;





        /*
        ========================================
        CONVERSATION ID
        ========================================
        */
        const {
            conversationId
        } = req.params;





        /*
        ========================================
        VALIDATION
        ========================================
        */
        if (!conversationId)
        {

            return res.status(400).json({

                success: false,

                message:
                    "Conversation ID required"

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

                message:
                    "Unauthorized conversation access"

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
        Optimized for:
        - pagination
        - infinite scroll
        - realtime systems
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

                .lean();






        /*
        ========================================
        DECRYPT ALL MESSAGES
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
                        )

                };

            });






        /*
        ========================================
        TOTAL MESSAGE COUNT
        ========================================
        */
        const totalMessages =
            await Message.countDocuments({

                conversationId

            });






        /*
        ========================================
        RESPONSE
        ========================================
        */
        res.status(200).json({

            success: true,

            currentPage: page,

            totalMessages,

            totalPages: Math.ceil(
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

            message:
                "Internal Server Error"

        });

    }

};








/*
========================================
GET USER CONVERSATIONS
========================================
Sidebar conversation list
========================================
*/
exports.getConversations =
    async (req, res) =>
    {

        try
        {

            /*
            ========================================
            CURRENT USER
            ========================================
            */
            const userId =
                req.user.id;





            /*
            ========================================
            FIND CONVERSATIONS
            ========================================
            */
            const conversations =
                await Conversation.find({

                    participants: userId

                })

                    .populate(
                        "participants",
                        "name email avatar"
                    )

                    .populate({

                        path: "lastMessage",

                        select:
                            "message senderId receiverId createdAt status"
                    })

                    .sort({
                        updatedAt: -1
                    })

                    .lean();






            /*
            ========================================
            DECRYPT LAST MESSAGE
            ========================================
            */
            const formattedConversations =
                conversations.map((conv) =>
                {

                    if (conv.lastMessage)
                    {

                        conv.lastMessage.message =
                            safeDecrypt(
                                conv.lastMessage.message
                            );

                    }

                    return conv;

                });






            /*
            ========================================
            RESPONSE
            ========================================
            */
            res.status(200).json({

                success: true,

                conversations:
                    formattedConversations

            });

        }

        catch (error)
        {

            console.log(
                "GET CONVERSATIONS ERROR:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Internal Server Error"

            });

        }

    };








/*
========================================
START CONVERSATION
========================================
Creates new conversation
if not exists
========================================
*/
exports.startConversation =
    async (req, res) =>
    {

        try
        {

            /*
            ========================================
            CURRENT USER
            ========================================
            */
            const currentUserId =
                req.user.id;





            /*
            ========================================
            TARGET USER
            ========================================
            */
            const {
                userId
            } = req.body;





            /*
            ========================================
            VALIDATION
            ========================================
            */
            if (!userId)
            {

                return res.status(400).json({

                    success: false,

                    message:
                        "User ID required"

                });

            }






            /*
            ========================================
            CHECK EXISTING CONVERSATION
            ========================================
            */
            let conversation =
                await Conversation.findOne({

                    participants: {

                        $all: [
                            currentUserId,
                            userId
                        ]

                    }

                })

                    .populate(
                        "participants",
                        "name email avatar"
                    );






            /*
            ========================================
            CREATE NEW CONVERSATION
            ========================================
            */
            if (!conversation)
            {

                conversation =
                    await Conversation.create({

                        participants: [
                            currentUserId,
                            userId
                        ]

                    });





                conversation =
                    await Conversation.findById(
                        conversation._id
                    )

                        .populate(
                            "participants",
                            "name email avatar"
                        );

            }






            /*
            ========================================
            RESPONSE
            ========================================
            */
            res.status(200).json({

                success: true,

                conversation

            });

        }

        catch (error)
        {

            console.log(
                "START CONVERSATION ERROR:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Internal Server Error"

            });

        }

    };
