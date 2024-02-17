// Assuming this is in a file named "adminModel.js"
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminModel = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      select: false,
      maxLength: [15, "Password should not exceed more than 15 characters"],
      minLength: [6, "Password should have at least 6 characters"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    otp: Number,
  },
  { timestamps: true }
);

adminModel.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

adminModel.methods.comparepassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

adminModel.methods.getjwttoken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const Admin = mongoose.model("admin", adminModel);

module.exports = Admin;
