const Category = require("../models/Category");

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { available } = req.query;
    const filter = {};
    if (available !== undefined) filter.available = available === "true";

    const categories = await Category.find(filter).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "Category slug must be unique" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error("createCategory error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "Category slug must be unique" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid category ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid category ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Toggle category availability
exports.toggleCategoryAvailability = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }
    category.available = !category.available;
    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid category ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};
