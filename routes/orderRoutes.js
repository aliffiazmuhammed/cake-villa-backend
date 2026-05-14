const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// --- Public routes ---
router.post("/", orderController.placeOrder);
router.get("/track", orderController.getOrderByIdAndPhone);
router.patch("/:id/cancel", orderController.cancelOrder);

// --- Admin routes (protected) ---
router.get("/", protect, orderController.getAllOrders);
router.get("/:id", protect, orderController.getOrderById);
router.patch("/:id/status", protect, orderController.updateOrderStatus);

module.exports = router;
