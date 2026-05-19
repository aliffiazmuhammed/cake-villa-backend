const Cake = require("../models/Cake");

// Create a new cake
exports.createCake = async (req, res) => {
  try {
    const cake = await Cake.create(req.body);
    res.status(201).json({ success: true, data: cake });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error("createCake error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Get all cakes (with optional filters)
exports.getCakes = async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category.toLowerCase();
    if (available !== undefined) filter.available = available === "true";
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [cakes, total] = await Promise.all([
      Cake.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Cake.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: cakes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Get a single cake by ID
exports.getCakeById = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, error: "Cake not found" });
    }
    res.status(200).json({ success: true, data: cake });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid cake ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update a cake
exports.updateCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cake) {
      return res.status(404).json({ success: false, error: "Cake not found" });
    }
    res.status(200).json({ success: true, data: cake });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid cake ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Delete a cake
exports.deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, error: "Cake not found" });
    }
    res.status(200).json({ success: true, message: "Cake deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid cake ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, error: "Cake not found" });
    }
    cake.available = !cake.available;
    await cake.save();
    res.status(200).json({ success: true, data: cake });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, error: "Invalid cake ID" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};
