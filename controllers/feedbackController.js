const Feedback = require("../models/Feedback");

// ─────────────────────────────────────────────
// USER — Create feedback
// ─────────────────────────────────────────────
exports.createFeedback = async (req, res) => {
  try {
    const { name, rating, feedback } = req.body;

    if (!name || !rating || !feedback) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, rating, and feedback text) are required.",
      });
    }

    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be an integer between 1 and 5.",
      });
    }

    const newFeedback = await Feedback.create({
      name: name.trim().toUpperCase(),
      rating: numericRating,
      feedback,
    });

    res.status(201).json({
      success: true,
      data: newFeedback,
    });
  } catch (error) {
    console.error("createFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while saving feedback.",
    });
  }
};

// ─────────────────────────────────────────────
// ADMIN/PUBLIC — Get all feedback
// ─────────────────────────────────────────────
exports.getAllFeedback = async (req, res) => {
  try {
    const { rating, limit } = req.query;
    const query = {};

    if (rating) {
      const numericRating = parseInt(rating);
      if (!isNaN(numericRating)) {
        query.rating = numericRating;
      }
    }

    let dbQuery = Feedback.find(query).sort({ createdAt: -1 });

    if (limit) {
      const numericLimit = parseInt(limit);
      if (!isNaN(numericLimit) && numericLimit > 0) {
        dbQuery = dbQuery.limit(numericLimit);
      }
    }

    const feedbackList = await dbQuery;
    res.status(200).json({
      success: true,
      data: feedbackList,
    });
  } catch (error) {
    console.error("getAllFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching feedback list.",
    });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Delete feedback
// ─────────────────────────────────────────────
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Testimonial not found.",
      });
    }

    await Feedback.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    console.error("deleteFeedback error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting testimonial.",
    });
  }
};
