const express = require("express");

const router = express.Router();

/*
========================================
AUTH MIDDLEWARE
========================================
*/
const {
    protect
} = require("../middleware/auth.middleware");

/*
========================================
CONTROLLER
========================================
*/
const {
    getConversations,
    startConversation
} = require(
    "../controllers/conversation.controller"
);

/*
========================================
GET USER CONVERSATIONS
========================================
*/
router.get(
    "/",
    protect,
    getConversations
);

/*
========================================
START CONVERSATION
========================================
*/
router.post(
    "/start",
    protect,
    startConversation
);

/*
========================================
EXPORT ROUTER
========================================
*/
module.exports = router;