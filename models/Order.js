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
    flavour: {
      type: String,
      default: "",
      trim: true,
    },
    eggOption: {
      type: String,
      enum: ["egg", "eggless", ""],
      default: "",
    },
    pricePerKg: {
      type: Number,
      default: 0,
    },
    itemTotal: {
      type: Number,
      default: 0,
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

    // --- Payment Tracking ---
    payments: [
      {
        amount: {
          type: Number,
          required: [true, "Payment amount is required"],
          min: [1, "Payment amount must be at least 1"],
        },
        method: {
          type: String,
          enum: ["cash", "upi", "bank_transfer", "card", "other"],
          default: "cash",
        },
        note: {
          type: String,
          default: "",
          trim: true,
        },
        paidAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    amountPaid: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

// Compute totalItems and payment fields before saving
orderSchema.pre("save", function () {
  if (this.items) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Auto-compute payment totals
  this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);

  if (this.amountPaid <= 0) {
    this.paymentStatus = "unpaid";
  } else if (this.amountPaid >= this.totalAmount) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
});

module.exports = mongoose.model("Order", orderSchema);
