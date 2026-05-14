const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    cake: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cake",
      required: [true, "Cake reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    size: {
      type: Number,
      required: [true, "Size/weight is required"],
      min: [0, "Size/weight cannot be negative"],
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // --- Customer Info (guest, no login) ---
    customer: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Customer phone is required"],
        trim: true,
        index: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // --- Delivery Details ---
    delivery: {
      address: {
        type: String,
        required: [true, "Delivery address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
      },
      date: {
        type: Date,
        required: [true, "Delivery date is required"],
      },
      timeSlot: {
        type: String,
        required: [true, "Delivery time slot is required"],
        trim: true,
      },
      instructions: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // --- Items ---
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },

    // --- Status ---
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },

    totalItems: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compute totalItems before saving
orderSchema.pre("save", function () {
  if (this.items) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
});

module.exports = mongoose.model("Order", orderSchema);
