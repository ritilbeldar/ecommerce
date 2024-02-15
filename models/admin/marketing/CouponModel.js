const mongoose = require("mongoose");

const CouponModel = new mongoose.Schema(
  {
    status: { type: String, enum: ["Enabled", "Disabled"] },
    startDate: { type: String },
    endDate: { type: String },
    code: {
      type: String,
    },
    type: { type: String, enum: ["Percentage", "Fixed amount", "Free shipping"] },
    discountValue: {
        type: String,
      },
  },
  { timestamps: true }
);

const Coupons = mongoose.model("Coupon", CouponModel);

module.exports = Coupons;
