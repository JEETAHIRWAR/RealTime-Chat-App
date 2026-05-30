const User = require("../models/user.model");

/*
========================================
SEARCH USERS
========================================
Search users by name, email, or phone
========================================
*/
exports.searchUsers = async (req, res) =>
{
    try
    {
        const currentUserId = req.user.id;
        const { q } = req.query;

        if (!q || !q.trim())
        {
            return res.status(200).json({
                success: true,
                users: [],
            });
        }

        const users = await User.find({
            _id: { $ne: currentUserId },

            $or: [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { phone: { $regex: q, $options: "i" } },
            ],
        })
            .select("name email phone avatar bio isVerified lastSeen")
            .limit(20);

        res.status(200).json({
            success: true,
            users,
        });
    } catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};