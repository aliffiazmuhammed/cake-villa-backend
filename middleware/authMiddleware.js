const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Protect routes — verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized — no token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach admin to request (exclude password)
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Not authorized — admin not found",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account has been deactivated",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Not authorized — invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Not authorized — token expired",
      });
    }
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Restrict to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: `Role "${req.admin.role}" is not authorized for this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
