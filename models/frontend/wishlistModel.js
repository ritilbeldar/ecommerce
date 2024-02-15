const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    quantity: {
      type: Number,
      default: 1 ,
    },
    allUsers:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    allProduct:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  { timestamps: true }
);

// Create Wishlist model
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;
