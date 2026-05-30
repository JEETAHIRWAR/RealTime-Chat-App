import express from "express";

import
    {
        startConversation,
        getConversations,
        searchUsers,
    } from "../controllers/chat.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);

router.get("/search", searchUsers);

router.post("/conversation", startConversation);

export default router;