const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wishlistDetails: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Wishlist",
          required: true
        },
        color: String,
        size: String,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    total: {
      type: Array,
      required: true,
    },
    shippingCost: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Checkout = mongoose.model("Checkout", checkoutSchema);

module.exports = Checkout;