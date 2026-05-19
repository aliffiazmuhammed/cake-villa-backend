const Order = require("../models/Order");
const Cake = require("../models/Cake");
const generateOrderId = require("../utils/generateOrderId");
const {
  notifyUserOrderPlaced,
  notifyAdminNewOrder,
  notifyUserOrderStatus,
} = require("../utils/whatsappNotification");

// ─────────────────────────────────────────────
// PUBLIC — Place a new order
// ─────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const { customer, delivery, items } = req.body;

    // --- Basic presence checks ---
    if (!customer || !delivery || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "customer, delivery, and at least one item are required",
      });
    }

    // --- Strict customer validations ---
    if (!customer.name || !customer.name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required.",
      });
    }

    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    if (!customer.phone || !/^\d{10}$/.test(customer.phone.trim())) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be exactly 10 digits.",
      });
    }

    if (!delivery.pincode || !/^\d{6}$/.test(delivery.pincode.trim())) {
      return res.status(400).json({
        success: false,
        error: "Pincode must be exactly 6 digits.",
      });
    }

    // Convert name to full caps
    customer.name = customer.name.trim().toUpperCase();

    // --- Validate delivery date is in the future ---
    const deliveryDate = new Date(delivery.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (deliveryDate < tomorrow) {
      return res.status(400).json({
        success: false,
        error: "Delivery date must be at least 1 day in the future",
      });
    }

    // --- Validate each item against the Cake DB ---
    let totalAmount = 0;
    const validationErrors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const cake = await Cake.findById(item.cake);
      if (!cake) {
        validationErrors.push(`Item ${i + 1}: Cake not found (${item.cake})`);
        continue;
      }
      if (!cake.available) {
        validationErrors.push(
          `Item ${i + 1}: "${cake.name}" is currently unavailable`
        );
        continue;
      }
      if (item.size < cake.sizeWeight.min || item.size > cake.sizeWeight.max) {
        validationErrors.push(
          `Item ${i + 1}: Size ${item.size} is out of range (${cake.sizeWeight.min}–${cake.sizeWeight.max} kg) for "${cake.name}"`
        );
      }

      totalAmount += cake.price * item.quantity;
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    // --- Generate unique order ID (retry if collision) ---
    let orderId;
    let attempts = 0;
    do {
      orderId = generateOrderId();
      const existing = await Order.findOne({ orderId });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate a unique order ID. Please try again.",
      });
    }

    // --- Save order ---
    const order = await Order.create({
      orderId,
      customer,
      delivery,
      items,
      totalAmount,
    });

    // --- Populate cake details for response ---
    await order.populate("items.cake", "name category price imageUrl");

    // --- WhatsApp notifications ---
    try {
      await notifyUserOrderPlaced(customer.phone, orderId, items);
      await notifyAdminNewOrder(orderId, customer.name, customer.phone, items);
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error("placeOrder error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Track order by orderId + phone
// ─────────────────────────────────────────────
exports.getOrderByIdAndPhone = async (req, res) => {
  try {
    const { orderId, phone } = req.query;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        error: "Both orderId and phone are required",
      });
    }

    const order = await Order.findOne({
      orderId,
      "customer.phone": phone,
    }).populate("items.cake", "name category price imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found. Check your order ID and phone number.",
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("getOrderByIdAndPhone error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Cancel a pending order
// ─────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel an order with status "${order.status}". Only pending orders can be cancelled.`,
      });
    }

    order.status = "cancelled";
    await order.save();

    // Notify user
    try {
      await notifyUserOrderStatus(
        order.customer.phone,
        order.orderId,
        "cancelled"
      );
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }
    console.error("cancelOrder error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get all orders (with filters + pagination)
// ─────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, from, to, search, paymentStatus, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.cake", "name category price imageUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get single order detail
// ─────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.cake",
      "name category price imageUrl"
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }
    console.error("getOrderById error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Update order status
// ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "rejected",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Prevent updating already delivered / cancelled orders
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: `Cannot update an order that is already "${order.status}"`,
      });
    }

    order.status = status;
    await order.save();

    // Send WhatsApp notification to user
    try {
      await notifyUserOrderStatus(order.customer.phone, order.orderId, status);
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr.message);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }
    console.error("updateOrderStatus error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Add a payment to an order
// ─────────────────────────────────────────────
exports.addPayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Payment amount must be greater than 0",
      });
    }

    const validMethods = ["cash", "upi", "bank_transfer", "card", "other"];
    if (method && !validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const currentPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = order.totalAmount - currentPaid;

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (₹${amount}) exceeds remaining balance (₹${balance})`,
      });
    }

    order.payments.push({
      amount,
      method: method || "cash",
      note: note || "",
      paidAt: new Date(),
    });

    await order.save();
    await order.populate("items.cake", "name category price imageUrl");

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }
    console.error("addPayment error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Remove a payment from an order
// ─────────────────────────────────────────────
exports.removePayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const paymentIndex = order.payments.findIndex(
      (p) => p._id.toString() === req.params.paymentId
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ success: false, error: "Payment entry not found" });
    }

    order.payments.splice(paymentIndex, 1);
    await order.save();
    await order.populate("items.cake", "name category price imageUrl");

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }
    console.error("removePayment error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
