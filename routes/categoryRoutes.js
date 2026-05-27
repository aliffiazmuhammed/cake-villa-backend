const express = require("express");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryAvailability,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(getCategories)
  .post(protect, createCategory);

router
  .route("/:id")
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

router.route("/:id/toggle-availability").patch(protect, toggleCategoryAvailability);

module.exports = router;
