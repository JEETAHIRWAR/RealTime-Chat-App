const express = require("express");

const router = express.Router();

const {
    getMessages
} = require("../controllers/message.controller");

const {
    protect
} = require("../middleware/auth.middleware");



/*
========================================
GET CHAT HISTORY
========================================
*/
router.get(
    "/:receiverId",
    protect,
    getMessages
);



module.exports = router;