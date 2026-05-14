const express = require("express");
const router = express.Router();
const cakeController = require("../controllers/cakeController");
const { protect } = require("../middleware/authMiddleware");

// --- Public routes ---
router.get("/", cakeController.getCakes);
router.get("/:id", cakeController.getCakeById);

// --- Admin routes (protected) ---
router.post("/", protect, cakeController.createCake);
router.put("/:id", protect, cakeController.updateCake);
router.delete("/:id", protect, cakeController.deleteCake);
router.patch("/:id/toggle-availability", protect, cakeController.toggleAvailability);

module.exports = router;
