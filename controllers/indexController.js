const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Category = require("../models/admin/categorysModel/category");
const SubCategory = require("../models/admin/categorysModel/subcategory");
const HomeBanner = require("../models/admin/categorysModel/HomeBanner");
const Products = require("../models/admin/ProductsModel/Products");
const User = require("../models/frontend/userModel");
const Newsletter = require("../models/frontend/NewsletterModel");
const otpSend = require("../utils/otpmailer");

const ErorrHandler = require("../utils/ErrorHandler");
const { sendtoken } = require("../utils/SendToken");
const flash = require("express-flash");

exports.notfound = catchAsyncErrors(async (req, res, next) => {
  res.render("404", { title: "Page Not Found" });
});

exports.homepage = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const homebanners = await HomeBanner.find();
    const products = await Products.find().populate({
      path: "productsRateReview",
    });
    const { token } = req.cookies;
    if (token) {
      res.redirect("/user");
    } else {
      res.render("frontend/index", {
        messages: req.flash(),
        title: "Home",
        categorys,
        homebanners,
        products,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

exports.ProductsDetails = catchAsyncErrors(async (req, res, next) => {
  const ProductId = req.params.id;
  try {
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate({
        path: "UserOrders",
        populate: { path: "orderProducts.item" },
      })
      .exec();

    const categorys = await Category.find().populate("subcategories");
    const product = await Products.findById(ProductId)
      .populate('subcategories')
      .populate('productsRateReview');

    if (!product) {
      req.flash("warning", "Product not found");
      return res.redirect("/");
    }

    // Check if the current user has ordered the product
    let hasOrderedProduct = false; // Initialize to false by default

    if (req.cookies.token) { // Check if user is authenticated
      hasOrderedProduct = user.UserOrders.some(order => {
        return order.orderProducts.some(orderProduct => orderProduct.item._id.toString() === ProductId);
      });
    }

    // Render the page with appropriate data
    res.render("frontend/products/productsDetails", {
      product,
      categorys,
      title: product.name,
      messages: req.flash(),
      user,
      isAuthenticated: !!req.cookies.token,
      hasOrderedProduct,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

exports.SubCategoryProducts = catchAsyncErrors(async (req, res, next) => {
  const subcategoryId = req.params.id;
  try {
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();

    const categorys = await Category.find().populate("subcategories");
    const subcategory = await SubCategory.findById(subcategoryId).populate(
      "allProducts"
    ) .populate({
      path: "allProducts",
      populate: { path: "productsRateReview" },
    });

    if (!subcategory) {
      req.flash("warning", "Subcategory not found");
      return res.redirect("/");
    }

    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;

    res.render("frontend/products/SubCategoryProducts", {
      subcategory,
      categorys,
      messages: req.flash(),
      title: `${subcategory.title} ${subcategory.title2}`,
      messages: req.flash(),
      isAuthenticated,
      user,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

// accounts start

exports.Register_Login = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const { token } = req.cookies;
    if (token) {
      res.redirect("/user/dashboard");
    } else {
      res.render("frontend/accounts/register", {
        title: "Login & Register",
        messages: req.flash(),
        categorys,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.userRegister = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, fullname } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      if (user.verified) {
        req.flash("error", "This email is already registered.");
        return res.redirect("back");
      } else {
        // Resend OTP if the email is registered but not verified
        const otp = Math.floor(1000 + Math.random() * 9000);
        user.otp = otp;
        await user.save();
        await otpSend(email, otp, fullname);
        
        req.flash("success", "OTP sent to your email for verification.");
        return res.redirect(`/verify_otp/${user.id}`);
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    user = new User({
      ...req.body,
      otp,
    });
    await user.save();

    await otpSend(email, otp, fullname);

    req.flash("success", "OTP sent to your email for verification.");
    res.redirect(`/verify_otp/${user.id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again later.");
    res.redirect("back");
  }
});

exports.verify_otp = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      throw new ErorrHandler('User not found', 404);
    }
    const { token } = req.cookies;
    if (token) {
      res.redirect("/user/dashboard");
    } else {
      res.render("frontend/accounts/verify_otp", {
        title: "Verify OTP",
        messages: req.flash(),
        categorys,
        isAuthenticated: false,
        user,
      });
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.otp_verify = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { otp } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      throw new ErrorHandler('User not found', 404);
    }

    // Check if the OTP matches
    if (!user.otp || otp !== user.otp.toString()) {
      req.flash('error', 'Invalid OTP. Please try again.');
      return res.redirect('back');
    }

    // Mark the user as verified
    user.verified = true;
    user.otp = undefined;
    await user.save();

    req.flash("success", "You have successfully verified. now proceed to log in.")
    res.redirect("/login_register");
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong. Please try again later.');
    res.redirect('back');
  }
});

exports.usersignin = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })
      .select("+password +verified") 
      .exec();

    if (!user) {
      req.flash("error", "User not found with this email address."); 
      return res.redirect("back");
    }

    if (!user.verified) {
      req.flash("error", "Your email is not verified. Please verify your email to login."); 
      return res.redirect("back");
    }

    const isMatch = user.comparepassword(req.body.password);
    if (!isMatch) {
      req.flash("error", "Wrong credentials."); 
      return res.redirect("back");
    }
    sendtoken(user, 200, req, res);
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

exports.SaveNewsletter = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingEmail = await Newsletter.findOne({ email });
    if (existingEmail) {
      req.flash("error", "Email already exists in the newsletter list.");
      return res.redirect("back");
    }
    await Newsletter.create({ email });
    req.flash("success", "Email added to the newsletter successfully.");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again later.");
    return res.redirect("back");
  }
});

// accounts end


