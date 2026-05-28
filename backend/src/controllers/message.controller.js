const Message = require("../models/message.model");



/*
========================================
GET CHAT MESSAGES
========================================
Returns paginated chat history
between two users
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
        const senderId = req.user.id;


        /*
        ========================================
        CHAT PARTNER ID
        ========================================
        */
        const { receiverId } = req.params;



        /*
        ========================================
        PAGINATION
        ========================================
        */
        const page = parseInt(req.query.page) || 1;

        const limit = parseInt(req.query.limit) || 20;

        const skip = (page - 1) * limit;



        /*
        ========================================
        FIND CONVERSATION
        ========================================
        */
        const messages = await Message.find({

            $or: [

                {
                    senderId,
                    receiverId
                },

                {
                    senderId: receiverId,
                    receiverId: senderId
                }

            ]

        })

            .sort({ createdAt: -1 })

            .skip(skip)

            .limit(limit);




        /*
        ========================================
        TOTAL MESSAGE COUNT
        ========================================
        */
        const totalMessages =
            await Message.countDocuments({

                $or: [

                    {
                        senderId,
                        receiverId
                    },

                    {
                        senderId: receiverId,
                        receiverId: senderId
                    }

                ]

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

            messages: messages.reverse()

        });

    }

    catch (error)
    {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};