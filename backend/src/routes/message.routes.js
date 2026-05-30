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
GET CHAT HISTORY BY CONVERSATION ID
========================================
*/
router.get(
    "/:conversationId",
    protect,
    getMessages
);

module.exports = router;