const express = require("express");

const router = express.Router();

const {
    getMessages,
    editMessage,
    deleteMessage
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

/*
========================================
EDIT MESSAGE
========================================
*/
router.patch(
    "/:messageId",
    protect,
    editMessage
);

/*
========================================
DELETE MESSAGE
========================================
*/
router.delete(
    "/:messageId",
    protect,
    deleteMessage
);

module.exports = router;
