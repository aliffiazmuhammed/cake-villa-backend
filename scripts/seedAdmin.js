/**
 * Seed script — creates the first superadmin account.
 *
 * Usage:  node scripts/seedAdmin.js
 *
 * If a superadmin already exists the script exits gracefully.
 * You can customise credentials via environment variables:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if any superadmin already exists
    const existing = await Admin.findOne({ role: "superadmin" });
    if (existing) {
      console.log(`Superadmin already exists: ${existing.email}`);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: process.env.ADMIN_NAME || "Super Admin",
      email: process.env.ADMIN_EMAIL || "admin@cakegallery.com",
      password: process.env.ADMIN_PASSWORD || "admin123456",
      role: "superadmin",
    });

    console.log("✅ Superadmin created successfully!");
    console.log(`   Name  : ${admin.name}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role}`);
    console.log("\n⚠️  Change the default password immediately after first login.");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
