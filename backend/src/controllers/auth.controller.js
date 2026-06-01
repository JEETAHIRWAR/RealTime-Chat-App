const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");
const {
    createOTP,
    verifyOTP
} = require("../services/otp.service");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/token");

const googleClient =
    new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID
    );


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
            password: hashedPassword,
            isVerified: false
        });

        /*
        ========================================
        SEND OTP
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
        res.status(201).json({
            success: true,
            message: "OTP sent successfully. Verify your email.",
            email,

            /*
            REMOVE IN PRODUCTION
            */
            otp
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
        FIND OR CREATE USER
        ========================================
        For:
        - register OTP verification
        - email OTP login
        - email OTP signup
        ========================================
        */
        let user =
            await User.findOne({
                email
            });

        if (!user)
        {
            const emailName =
                email.split("@")[0];

            user =
                await User.create({
                    name: emailName,
                    email,
                    password: "",
                    authProvider: "email_otp",
                    isVerified: true
                });
        }
        else
        {
            user.isVerified = true;

            if (!user.authProvider)
            {
                user.authProvider = "email_otp";
            }

            await user.save();
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
        user.refreshToken =
            await bcrypt.hash(
                refreshToken,
                10
            );

        await user.save();



        /*
        ========================================
        RESPONSE
        ========================================
        */
        res.status(200).json({

            success: true,

            message:
                "Email verified successfully",

            accessToken,

            refreshToken,

            user

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
SEND FORGOT PASSWORD OTP
========================================
*/
exports.sendForgotPasswordOTP = async (
    req,
    res
) =>
{
    try
    {
        const { email } = req.body;

        const user =
            await User.findOne({
                email
            });

        if (!user)
        {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otp =
            await createOTP({
                email,
                purpose: "forgot_password"
            });

        console.log(
            "FORGOT PASSWORD OTP:",
            otp
        );

        res.status(200).json({
            success: true,
            message:
                "OTP sent successfully"
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
RESET PASSWORD
========================================
*/
exports.resetPassword = async (
    req,
    res
) =>
{
    try
    {
        const {
            email,
            otp,
            password
        } = req.body;

        const result =
            await verifyOTP({
                email,
                otp,
                purpose:
                    "forgot_password"
            });

        if (!result.success)
        {
            return res.status(400).json(
                result
            );
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        await User.findOneAndUpdate(
            { email },
            {
                password:
                    hashedPassword
            }
        );

        res.status(200).json({
            success: true,
            message:
                "Password updated successfully"
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


/*
========================================
GOOGLE LOGIN
========================================
*/
exports.googleLogin = async (req, res) =>
{
    try
    {
        const { token } = req.body;

        if (!token)
        {
            return res.status(400).json({
                success: false,
                message: "Google token is required"
            });
        }

        const ticket =
            await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        const {
            sub,
            email,
            name,
            picture
        } = payload;

        if (!email)
        {
            return res.status(400).json({
                success: false,
                message: "Google email not found"
            });
        }

        let user =
            await User.findOne({
                email
            });

        if (!user)
        {
            user =
                await User.create({
                    name,
                    email,
                    password: "",
                    googleId: sub,
                    avatar: picture || "",
                    authProvider: "google",
                    isVerified: true
                });
        }
        else
        {
            user.googleId =
                user.googleId || sub;

            user.avatar =
                user.avatar || picture || "";

            user.authProvider =
                user.authProvider || "google";

            user.isVerified = true;

            await user.save();
        }

        const accessToken =
            generateAccessToken(user._id);

        const refreshToken =
            generateRefreshToken(user._id);

        user.refreshToken =
            await bcrypt.hash(
                refreshToken,
                10
            );

        await user.save();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user
        });
    }
    catch (error)
    {
        console.log(
            "GOOGLE LOGIN ERROR:",
            error.message
        );

        res.status(401).json({
            success: false,
            message: "Google login failed",
            error: error.message
        });
    }
};

/*
========================================
LOGOUT
========================================
*/
exports.logout = async (
    req,
    res
) =>
{
    try
    {
        const { refreshToken } = req.body;

        if (!refreshToken)
        {
            return res.status(200).json({
                success: true
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        await User.findByIdAndUpdate(
            decoded.id,
            {
                refreshToken: null
            }
        );

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (error)
    {
        res.status(200).json({
            success: true
        });
    }
};