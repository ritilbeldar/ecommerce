const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
    {
        title: String,
        url: String,
        subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }],
    },
    { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;
