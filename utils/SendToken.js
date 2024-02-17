exports.sendtoken = (user, statusCode, req, res) => {
  const token = user.getjwttoken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure: true,
  };

  res.status(statusCode).cookie("token", token, options);
  
  req.flash("success", "User logged in successfully.");
  res.redirect("/user/dashboard");
};

