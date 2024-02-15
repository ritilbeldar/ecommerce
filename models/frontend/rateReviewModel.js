const mongoose = require("mongoose");

const rateReviewModel = new mongoose.Schema(
  {
    username: String,
    useremail: String,
    rate: String,
    review: String,
    User:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    Product:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  { timestamps: true }
);

// Create Wishlist model
const rateReview = mongoose.model("rateReview", rateReviewModel);

module.exports = rateReview;
