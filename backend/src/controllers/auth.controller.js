const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
    createOTP,
    verifyOTP
} = require("../services/otp.service");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/token");



// REGISTER
exports.register = async (req, res) =>
{

    try
    {

        // GET DATA
        const { name, email, password } = req.body;

        // CHECK EXISTING USER
        const existingUser = await User.findOne({ email });

        if (existingUser)
        {

            return res.status(400).json({
                success: false,
                message: "User already exists"
            });

        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // RESPONSE
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error)
    {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// LOGIN
exports.login = async (req, res) =>
{

    try
    {

        // GET DATA
        const { email, password } = req.body;

        // CHECK USER
        const user = await User.findOne({ email });

        if (!user)
        {
            return res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not registered"
            });
        }

        // COMPARE PASSWORD
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch)
        {
            return res.status(400).json({
                success: false,
                code: "INVALID_PASSWORD",
                message: "Invalid password"
            });
        }

        /*
        ========================================
        GENERATE TOKENS
        ========================================
        */
        const accessToken =
            generateAccessToken(user._id);

        const refreshToken =
            generateRefreshToken(user._id);




        /*
        ========================================
        SAVE REFRESH TOKEN
        ========================================
        */
        const hashedRefreshToken = await bcrypt.hash(
            refreshToken,
            10
        );

        user.refreshToken = await bcrypt.hash(
            refreshToken,
            10
        );

        await user.save();

        // RESPONSE
        res.status(200).json({

            success: true,

            accessToken,

            refreshToken,

            user

        });

    } catch (error)
    {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


/*
========================================
SEND EMAIL OTP
========================================
*/
exports.sendEmailOTP = async (req, res) =>
{

    try
    {

        const { email } = req.body;



        /*
        ========================================
        VALIDATE EMAIL
        ========================================
        */
        if (!email)
        {

            return res.status(400).json({

                success: false,
                message: "Email is required"

            });

        }




        /*
        ========================================
        GENERATE OTP
        ========================================
        */
        const otp = await createOTP({

            email,
            purpose: "email_verification"

        });




        /*
        ========================================
        RESPONSE
        ========================================
        */
        res.status(200).json({

            success: true,
            message: "OTP sent successfully",

            /*
            ====================================
            TEMPORARY FOR TESTING
            REMOVE IN PRODUCTION
            ====================================
            */
            otp

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
VERIFY EMAIL OTP
========================================
*/
exports.verifyEmailOTP = async (req, res) =>
{

    try
    {

        const {
            email,
            otp
        } = req.body;



        /*
        ========================================
        VALIDATE INPUT
        ========================================
        */
        if (!email || !otp)
        {

            return res.status(400).json({

                success: false,
                message: "Email and OTP are required"

            });

        }




        /*
        ========================================
        VERIFY OTP
        ========================================
        */
        const result = await verifyOTP({

            email,
            otp,
            purpose: "email_verification"

        });




        /*
        ========================================
        OTP FAILED
        ========================================
        */
        if (!result.success)
        {

            return res.status(400).json(result);

        }




        /*
        ========================================
        UPDATE USER VERIFICATION
        ========================================
        */
        await User.findOneAndUpdate(

            { email },

            {
                isVerified: true
            }

        );




        /*
        ========================================
        RESPONSE
        ========================================
        */
        res.status(200).json({

            success: true,
            message: "Email verified successfully"

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
REFRESH ACCESS TOKEN
========================================
*/
exports.refreshAccessToken = async (
    req,
    res
) =>
{

    try
    {

        const { refreshToken } = req.body;



        /*
        ========================================
        VALIDATE TOKEN
        ========================================
        */
        if (!refreshToken)
        {

            return res.status(401).json({

                success: false,
                message: "Refresh token required"

            });

        }




        /*
        ========================================
        VERIFY REFRESH TOKEN
        ========================================
        */
        const decoded = jwt.verify(

            refreshToken,

            process.env.JWT_REFRESH_SECRET

        );




        /*
        ========================================
        FIND USER
        ========================================
        */
        const user = await User.findById(
            decoded.id
        );



        /*
        ========================================
        INVALID USER
        ========================================
        */
        if (!user)
        {

            return res.status(401).json({

                success: false,
                message: "Invalid user"

            });

        }




        /*
        ========================================
        TOKEN MISMATCH
        ========================================
        */
        const isRefreshTokenValid =
            await bcrypt.compare(
                refreshToken,
                user.refreshToken
            );

        if (!isRefreshTokenValid)
        {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }




        /*
        ========================================
        GENERATE NEW ACCESS TOKEN
        ========================================
        */
        const newAccessToken =
            generateAccessToken(user._id);




        /*
        ========================================
        RESPONSE
        ========================================
        */
        res.status(200).json({

            success: true,

            accessToken: newAccessToken

        });

    }

    catch (error)
    {

        res.status(401).json({

            success: false,
            message: "Invalid or expired token"

        });

    }

};