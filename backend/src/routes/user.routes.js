const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const { searchUsers } = require("../controllers/user.controller");

router.get("/search", protect, searchUsers);

module.exports = router;