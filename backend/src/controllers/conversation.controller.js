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
Sidebar conversation list
========================================
*/
const getConversations = async (req, res) =>
{
    try
    {
        const userId =
            req.user.id;

        const conversations =
            await getUserConversations(
                userId
            );

        res.status(200).json({
            success: true,
            conversations
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
            message: "Internal Server Error"
        });
    }
};

/*
========================================
START CONVERSATION
========================================
Creates conversation if it does not exist
========================================
*/
const startConversation = async (req, res) =>
{
    try
    {
        const currentUserId =
            req.user.id;

        const {
            userId
        } = req.body;

        if (!userId)
        {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const conversation =
            await findOrCreateConversation(
                currentUserId,
                userId
            );

        await conversation.populate(
            "participants",
            "name email phone avatar"
        );

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
            message: "Internal Server Error"
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
    startConversation
};