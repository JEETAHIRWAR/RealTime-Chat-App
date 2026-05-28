const express = require("express");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");


// REGISTER
router.post("/register", register);


// LOGIN
router.post("/login", login);

router.get("/me", protect, (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });

});


module.exports = router;