// checkoutModel.js
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullname: String,
    phone: String,
    mail: String,
    pincode: String,
    address: String,
    state: String,
    city: String,
    landmark: String,
    alternateNumber: String,
    orderNote: String,
  },
  { timestamps: true }
);

const address = mongoose.model("Address", addressSchema);

module.exports = address;
