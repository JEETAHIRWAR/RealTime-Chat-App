const {

    getUserConversations,
    findOrCreateConversation

} = require(
    "../repositories/conversation.repository"
);





/*
========================================
GET USER CONVERSATIONS
========================================
*/
const getConversations =
    async (req, res) =>
    {

        try
        {

            const userId =
                req.user.id;





            /*
            ====================================
            FETCH CONVERSATIONS
            ====================================
            */
            const conversations =

                await getUserConversations(
                    userId
                );





            /*
            ====================================
            RESPONSE
            ====================================
            */
            res.status(200).json({

                success: true,

                conversations

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


/*
========================================
START CONVERSATION
========================================
Creates conversation if not exists
========================================
*/
const startConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const conversation = await findOrCreateConversation(
            currentUserId,
            userId
        );

        await conversation.populate(
            "participants",
            "name email phone avatar"
        );

        res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/*
========================================
EXPORTS
========================================
*/
module.exports = {

    getConversations,
    startConversation,

};