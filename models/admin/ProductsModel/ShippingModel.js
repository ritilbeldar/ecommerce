const mongoose = require("mongoose");

const ShippingModel = new mongoose.Schema(
  {
    price: String,
    status: { type: String, enum: ["Enabled", "Disabled"] },
  },
  { timestamps: true }
);

const Shipping = mongoose.model("ShippingPrice", ShippingModel);

module.exports = Shipping;
