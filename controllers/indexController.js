const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const { isAuthenticated } = require("../middlewares/auth");

const Category = require("../models/admin/categorysModel/category");
const SubCategory = require("../models/admin/categorysModel/subcategory");
const HomeBanner = require("../models/admin/categorysModel/HomeBanner");
const Products = require("../models/admin/ProductsModel/Products");
const User = require("../models/frontend/userModel");

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
    const user = await new User(req.body).save();
    sendtoken(user, 201, res);
  } catch (error) {
    console.error(error);
    req.flash("error", "This email is already registered.");
    res.redirect("back");
  }
});

exports.usersignin = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })
      .select("+password")
      .exec();
    if (!user) {
      req.flash("error", "User not found with this email address."); 
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


// accounts end
