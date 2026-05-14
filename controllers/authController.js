const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/register — Register a new admin
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: "An admin with this email already exists",
      });
    }

    const admin = await Admin.create({ name, email, password, role });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login — Admin login
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find admin and include password field
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account has been deactivated. Contact a superadmin.",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/profile — Get current admin profile
// ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.admin,
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/auth/profile — Update current admin profile
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.admin._id);

    if (name) admin.name = name;
    if (email) {
      // Check if email is already taken by another admin
      const existing = await Admin.findOne({
        email,
        _id: { $ne: admin._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Email is already in use by another admin",
        });
      }
      admin.email = email;
    }

    await admin.save();

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error("updateProfile error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/auth/change-password — Change password
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

    // Generate new token after password change
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      token,
    });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
