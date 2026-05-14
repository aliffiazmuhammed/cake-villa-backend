const mongoose = require("mongoose");

const cakeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Cake name is required"],
      trim: true,
    },
    ingredients: {
      type: [String],
      required: [true, "At least one ingredient is required"],
      validate: {
        validator: (v) => v.length > 0,
        message: "Ingredients list cannot be empty",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "wedding",
        "birthday",
        "photo",
        "cupcake",
        "fondant",
        "cheesecake",
      ],
      lowercase: true,
    },
    sizeWeight: {
      min: {
        type: Number,
        required: [true, "Minimum size/weight is required"],
        min: [0, "Min size/weight cannot be negative"],
      },
      max: {
        type: Number,
        required: [true, "Maximum size/weight is required"],
        min: [0, "Max size/weight cannot be negative"],
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate max >= min
cakeSchema.pre("validate", function () {
  if (this.sizeWeight && this.sizeWeight.max < this.sizeWeight.min) {
    this.invalidate(
      "sizeWeight.max",
      "Max size/weight must be greater than or equal to min"
    );
  }
});

module.exports = mongoose.model("Cake", cakeSchema);
