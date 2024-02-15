const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "scheduled", "hidden"],
      default: "published",
    },
    description: String,
    shortDescription: String,
    productLocation: String,
    productsImages: [
      {
        fileId: String,
        url: String,
      },
    ],
    productsColor: [
      {
        favcolor: String,
        colorname: String,
      },
    ],
    discountPrice: {
      type: Number,
      required: true,
    },
    price : Number,
    categories: [String],
    tags: [String],
    whyChoose: [String],
    sku: String,
    quantity: Number,
    sizes: [String],
    subcategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    wishlists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wishlist",
      },
    ],
    cartusers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    productsRateReview: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "rateReview",
      },
    ],
  },
  { timestamps: true }
);

const Products = mongoose.model("Product", ProductSchema);

module.exports = Products;
