const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
    searchUsers,
    getProfile,
    updateProfile,
    changePassword,
    sendPhoneVerificationOTP,
    verifyPhone
} = require("../controllers/user.controller");


router.get(
    "/search",
    protect,
    searchUsers
);

router.get(
    "/profile",
    protect,
    getProfile
);

router.put(
    "/profile",
    protect,
    updateProfile
);

router.put(
    "/change-password",
    protect,
    changePassword
);

/*
========================================
PHONE VERIFICATION
========================================
*/
router.post(
    "/send-phone-verification-otp",
    protect,
    sendPhoneVerificationOTP
);

router.post(
    "/verify-phone",
    protect,
    verifyPhone
);


module.exports = router;