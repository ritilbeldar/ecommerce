const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const { catchAsyncErrors } = require("./catchAsyncErrors");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    res.redirect("/login_register");
  }

  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  req.id = id;
  next();
});
