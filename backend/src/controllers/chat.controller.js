import { Conversation } from "../models/conversation.model.js";

export const startConversation = async (req, res) =>
{
    try
    {
        const currentUserId = req.user.id;

        const { userId } = req.body;

        if (!userId)
        {
            return res.status(400).json({
                success: false,
                message: "User ID required",
            });
        }

        let conversation = await Conversation.findOne({
            participants: {
                $all: [currentUserId, userId],
            },
        }).populate("participants", "name email avatar");

        if (!conversation)
        {
            conversation = await Conversation.create({
                participants: [currentUserId, userId],
            });

            conversation = await conversation.populate(
                "participants",
                "name email avatar"
            );
        }

        res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error)
    {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};