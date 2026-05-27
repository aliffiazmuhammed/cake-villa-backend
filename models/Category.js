const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, "Slug is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  icon: {
    type: String,
    required: [true, "Icon is required"],
  },
  available: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
