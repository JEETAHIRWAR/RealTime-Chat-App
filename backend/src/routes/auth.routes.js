const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getMe,
    sendEmailOTP,
    verifyEmailOTP,
    refreshAccessToken,
    googleLogin,
    logout,

    sendForgotPasswordOTP,
    resetPassword
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");


// REGISTER
router.post("/register", register);


// LOGIN
router.post("/login", login);

router.get("/me", protect, (req, res) =>
{

    res.status(200).json({
        success: true,
        user: req.user
    });

});

/*
========================================
EMAIL OTP ROUTES
========================================
*/
router.post(
    "/send-email-otp",
    sendEmailOTP
);

router.post(
    "/verify-email-otp",
    verifyEmailOTP
);

router.post(
    "/refresh-token",
    refreshAccessToken
);

/*
========================================
FORGOT PASSWORD
========================================
*/
router.post(
    "/forgot-password",
    sendForgotPasswordOTP
);

router.post(
    "/reset-password",
    resetPassword
);

/*
========================================
GOOGLE LOGIN
========================================
*/
router.post(
    "/google-login",
    googleLogin
);

/*
========================================
LOGOUT
========================================
*/
router.post(
    "/logout",
    logout
);

module.exports = router;