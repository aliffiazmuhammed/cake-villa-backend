const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const cakeRoutes = require("./routes/cakeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cakes", cakeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Cake Gallery API is running" });
});

// Connect to DB
connectDB();

// Start server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
