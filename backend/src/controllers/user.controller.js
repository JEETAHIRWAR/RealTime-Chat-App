const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const {
    createOTP,
    verifyOTP
} = require("../services/otp.service");

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
            .select("name email phone avatar bio isVerified emailVerified phoneVerified lastSeen")
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


/*
========================================
GET PROFILE
========================================
*/
exports.getProfile = async (req, res) =>
{
    try
    {
        const user = await User.findById(
            req.user.id
        ).select(
            "-password -refreshToken"
        );

        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/*
========================================
UPDATE PROFILE
========================================
*/
exports.updateProfile = async (
    req,
    res
) =>
{
    try
    {
        const {
            name,
            bio,
            avatar
        } = req.body;

        const user =
            await User.findByIdAndUpdate(
                req.user.id,
                {
                    name,
                    bio,
                    avatar,
                },
                {
                    new: true,
                }
            ).select(
                "-password -refreshToken"
            );

        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
========================================
CHANGE PASSWORD
========================================
*/
exports.changePassword = async (
    req,
    res
) =>
{
    try
    {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!newPassword || newPassword.length < 6)
        {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters",
            });
        }

        const user = await User.findById(
            req.user.id
        );

        if (!user)
        {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        /*
        ========================================
        IF USER ALREADY HAS PASSWORD
        VERIFY CURRENT PASSWORD
        ========================================
        */
        if (user.password)
        {
            if (!currentPassword)
            {
                return res.status(400).json({
                    success: false,
                    message: "Current password is required",
                });
            }

            const isMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );

            if (!isMatch)
            {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect",
                });
            }
        }

        /*
        ========================================
        HASH NEW PASSWORD
        ========================================
        */
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.password = hashedPassword;

        /*
        ========================================
        OTP / GOOGLE USERS CAN NOW LOGIN
        WITH PASSWORD TOO
        ========================================
        */
        if (
            user.authProvider === "email_otp" ||
            user.authProvider === "phone_otp" ||
            user.authProvider === "google"
        )
        {
            user.authProvider = "local";
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/*
========================================
SEND PHONE VERIFICATION OTP
========================================
*/
exports.sendPhoneVerificationOTP = async (
    req,
    res
) =>
{
    try
    {
        const { phone } = req.body;

        if (!phone)
        {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        /*
        ========================================
        CHECK PHONE ALREADY USED BY OTHER USER
        ========================================
        */
        const existingUser =
            await User.findOne({
                phone,
                _id: {
                    $ne: req.user.id
                }
            });

        if (existingUser)
        {
            return res.status(400).json({
                success: false,
                message: "This mobile number is already linked to another account",
            });
        }

        /*
        ========================================
        CREATE OTP
        ========================================
        */
        const otp =
            await createOTP({
                phone,
                purpose: "phone_verification"
            });

        /*
        ========================================
        TEMPORARY TESTING LOG
        REMOVE IN PRODUCTION
        ========================================
        */
        console.log(
            "PHONE VERIFICATION OTP:",
            otp
        );

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",

            /*
            REMOVE IN PRODUCTION
            */
            otp
        });
    }
    catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/*
========================================
VERIFY PHONE NUMBER
========================================
*/
exports.verifyPhone = async (
    req,
    res
) =>
{
    try
    {
        const {
            phone,
            otp
        } = req.body;

        if (!phone || !otp)
        {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP are required",
            });
        }

        /*
        ========================================
        CHECK PHONE ALREADY USED BY OTHER USER
        ========================================
        */
        const existingUser =
            await User.findOne({
                phone,
                _id: {
                    $ne: req.user.id
                }
            });

        if (existingUser)
        {
            return res.status(400).json({
                success: false,
                message: "This mobile number is already linked to another account",
            });
        }

        /*
        ========================================
        VERIFY OTP
        ========================================
        */
        const result =
            await verifyOTP({
                phone,
                otp,
                purpose: "phone_verification"
            });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        /*
        ========================================
        UPDATE USER PHONE
        ========================================
        */
        const user =
            await User.findByIdAndUpdate(
                req.user.id,
                {
                    phone,
                    phoneVerified: true
                },
                {
                    new: true
                }
            ).select(
                "-password -refreshToken"
            );

        res.status(200).json({
            success: true,
            message: "Phone verified successfully",
            user,
        });
    }
    catch (error)
    {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};