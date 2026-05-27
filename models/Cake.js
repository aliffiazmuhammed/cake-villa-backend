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
    pricePerKg: {
      type: Number,
      required: [true, "Price per kg is required"],
      min: [0, "Price per kg cannot be negative"],
    },
    isFlavoured: {
      type: Boolean,
      default: false,
    },
    flavours: {
      type: [String],
      default: [],
    },
    eggOptionAvailable: {
      type: Boolean,
      default: false,
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
  // Validate flavours when isFlavoured is true
  if (this.isFlavoured && (!this.flavours || this.flavours.length === 0)) {
    this.invalidate(
      "flavours",
      "At least one flavour is required when cake is flavoured"
    );
  }
});

module.exports = mongoose.model("Cake", cakeSchema);
