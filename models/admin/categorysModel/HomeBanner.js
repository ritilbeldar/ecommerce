const mongoose = require("mongoose");

const HomeBannerModel = new mongoose.Schema(
  {
    backgroundBanner: {
      type: Object,
      default: {
        fileId: "",
        url: "",
      },
    },
    bannerImg: {
      type: Object,
      default: {
        fileId: "",
        url: "",
      },
    },
    shortTitle1: {
      type: String,
    },
    shortTitle2: {
        type: String,
      },
    bigTitle1: {
        type: String,
    },
    bigTitle2: {
        type: String,
      },
   
    bannerURLName: {
      type: String,
    },
    bannerURL: {
      type: String,
    },
    status: {
      type: String,
      default: "",
    },
    publishdate: { type: String },
    allWishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wishlist",
      },
    ],
  },
  { timestamps: true }
);

const HomeBanner = mongoose.model("homebanner", HomeBannerModel);

module.exports = HomeBanner;
