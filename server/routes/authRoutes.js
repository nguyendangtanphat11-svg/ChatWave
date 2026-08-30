const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    googleLogin,
    logoutUser
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/logout", protect, logoutUser);

module.exports = router;