const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const {
    uploadFile
} = require("../controllers/upload.controller");

router.post(
    "/",
    protect,
    upload.single("file"),
    uploadFile
);

module.exports = router;