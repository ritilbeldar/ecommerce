// checkoutModel.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orderProducts: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        color: String,
        size: String,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    orderTotal: String,
    orderAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    orderShipping: {
      type: String,
      default: "",
    },
    orderMethod: String,
    onlinepayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentDetail",
    },
    status: {
      type: String,
      default:"new",
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
