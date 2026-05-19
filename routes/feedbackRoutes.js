const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

// Public endpoints
router.post("/", feedbackController.createFeedback);
router.get("/", feedbackController.getAllFeedback);

// Protected admin endpoints
router.delete("/:id", protect, feedbackController.deleteFeedback);

module.exports = router;
