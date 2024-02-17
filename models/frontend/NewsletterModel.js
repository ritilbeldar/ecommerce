const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
  },
  { timestamps: true }
);

const Newsletters = mongoose.model("Newsletter", NewsletterSchema);

module.exports = Newsletters;
