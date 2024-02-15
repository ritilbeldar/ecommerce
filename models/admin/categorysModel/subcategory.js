const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
    {
      bannerPosition: String,
      shortTitle: String,
      title: String,
      title2: String,
      endDate: String,
      subCategoryBanner: {
        type: Object,
        default: {
          fileId: "",
          url: "",
        },
      },
      parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      allProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product"  }],
    },
    { timestamps: true }
  );

const SubCategory = mongoose.model("SubCategory", SubCategorySchema);

module.exports = SubCategory;
