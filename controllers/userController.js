const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const { isAuthenticated } = require("../middlewares/auth");

const Category = require("../models/admin/categorysModel/category");
const HomeBanner = require("../models/admin/categorysModel/HomeBanner");
const User = require("../models/frontend/userModel");
const Products = require("../models/admin/ProductsModel/Products");
const Shippings = require("../models/admin/ProductsModel/ShippingModel");
const Coupons = require("../models/admin/marketing/CouponModel");
const Wishlist = require("../models/frontend/wishlistModel");
const Checkout = require("../models/frontend/checkoutModel");
const Address = require("../models/frontend/addressModel");
const Order = require("../models/frontend/orderModel");
const RateReviews = require("../models/frontend/rateReviewModel");
const PaymentDetail = require("../models/frontend/payment-detail");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const { read } = require("fs");

let razorPayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// accounts start

exports.currentUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const homebanners = await HomeBanner.find();
    const products = await Products.find().populate({
      path: "productsRateReview",
    });
  
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();
  
    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
  
    res.render("frontend/index", {
      title: `${user.fullname} Home`,
      categorys,
      homebanners,
      products,
      user,
      wishlistItemss,
      isAuthenticated: true,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
 
});

exports.user_dashboard = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;
    res.render("frontend/accounts/dashboard", {
      title: `${user.fullname} Dashboard`,
      categorys,
      user,
      currentPath,
      messages: req.flash(),
      isAuthenticated: true,
      wishlistItemss,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.usersignout = catchAsyncErrors(async (req, res, next) => {

  try {
    res.clearCookie("token");
    req.flash("success", "User logged out successfully.");
    res.redirect("/login_register");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

// user account start

exports.accountDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/accountDetails", {
      title: `${user.fullname} Account Details`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.updateUserDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.id);

    user.fullname = req.body.fullname || user.fullname;
    user.displayName = req.body.displayName || user.displayName;
    user.email = req.body.email || user.email;
    user.number = req.body.number || user.number;

    await user.save();
    req.flash("success","user details update successfully.");
    res.redirect("/user/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message || "Failed to update user details.");
    res.redirect("/user/account_details");
  }
});


exports.password_update = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.id).select("+password").exec();

    if (!user) {
      req.flash("error", "User not found."); 
      return res.redirect("back");
    }

    const isMatch = await user.comparepassword(req.body.password);
    if (!isMatch) {
      req.flash("error", "Current password is incorrect."); 
      return res.redirect("back");
    }

    // Update the password
    user.password = req.body.newpassword;
    await user.save();


    res.clearCookie("token");
    req.flash("success", "Password updated successfully. Please login with your new password.");
    res.redirect("/login_register");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});



// adress start

exports.accountAddresses = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate("UserAddress")
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });

    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/address/addresses", {
      title: `${user.fullname} Addresses`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.AddressSave = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.id).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const address = new Address(req.body);
    address.User = user._id;

    await address.save();
    user.UserAddress.push(address._id);
    await user.save();
    req.flash("success", "Address Save successfully.");
    res.redirect("/user/shopCheckout");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.AddressEdit = catchAsyncErrors(async (req, res, next) => {
  const AdreesId = req.params.id;
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate("UserAddress")
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const address = await Address.findById(AdreesId);

    if (!address) {
      req.flash("warning", "Coupon not found");
      return res.redirect("/user/addresses");
    }

    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/address/edit_address", {
      title: `${address.fullname} Address Edit`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      address,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.AddressUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    const address = await Address.findOneAndUpdate(req.body);
    await address.save();
    req.flash("success", "Address update successfully.");
    res.redirect("/user/shopCheckout");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.AddressDelete = catchAsyncErrors(async (req, res, next) => {
  try {
    // Find the address
    const address = await Address.findOne({ _id: req.params.id });

    if (!address) {
      req.flash("error", "Address not found.");
      return res.redirect("/user/addresses");
    }

    // Remove the address reference from the User model
    await User.updateMany(
      { UserAddress: req.params.id },
      { $pull: { UserAddress: req.params.id } }
    );

    // Delete the address
    await Address.deleteOne({ _id: req.params.id });
    req.flash("success", "Address successfully Deleted.");
    res.redirect("/user/addresses");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/user/addresses");
  }
});

exports.AddAddress = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/address/add_address", {
      title: `${user.fullname} Account Details`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

// adress end

exports.accountWishlist = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate("UserCart")
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/wishlist", {
      title: `${user.fullname} Wishlist`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.addProductToWishlist = catchAsyncErrors(async (req, res) => {
  try {
    const user = await User.findById(req.id).exec();
    const product = await Products.findById(req.params.id).exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingWishlistItem = await Wishlist.findOne({
      allUsers: user._id,
      allProduct: product._id,
    }).exec();

    if (existingWishlistItem) {
    req.flash("error", "Product already exists in wishlist.");
    res.redirect("/");
    }

    const productExistsInWishlist = user.UserWishlists.includes(product._id);

    if (productExistsInWishlist) {
      req.flash("error", "Product already exists in wishlist.");
      res.redirect("/");
    }

    const wishlistItem = new Wishlist({
      size: req.body.size,
      color: req.body.color,
      quantity: req.body.quantity,
      allUsers: [user._id],
      allProduct: [product._id],
    });

    const savedWishlistItem = await wishlistItem.save();

    user.UserWishlists.push(savedWishlistItem._id);
    product.wishlists.push(savedWishlistItem._id);

    await user.save();
    await product.save();
    req.flash("success", "Product Add successfully in Cart.");
    res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.updateProductToWishlist = catchAsyncErrors(async (req, res) => {
  try {
    const user = await User.findById(req.id).exec();
    if (!user) {
      req.flash("error", "User not found.");
      res.redirect("/");
    }
    if (typeof req.body !== "object" || req.body === null) {
      req.flash("error", "Invalid request body.");
    }
    const quantityKeys = Object.keys(req.body).filter((key) =>
      key.startsWith("quantity[")
    );
    for (const key of quantityKeys) {
      const index = key.match(/\[(.*?)\]/)[1];
      const wishlistItemId = req.body["wishlistItemId[" + index + "]"];
      const quantity = parseInt(req.body[key]);

      const wishlistItem = await Wishlist.findById(wishlistItemId).exec();
      if (wishlistItem) {
        wishlistItem.quantity = quantity;
        await wishlistItem.save();
      }
    }
    req.flash("success", "Cart successfully Updated.");
    res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.removeProductFromWishlist = catchAsyncErrors(async (req, res) => {
  try {
    const user = await User.findById(req.id).exec();
    const product = await Products.findById(req.params.id).exec();

    if (!product) {
      req.flash("error", "Product not found.");
      res.redirect("/");
    }

    if (!user) {
      req.flash("error", "User not found.");
      res.redirect("/");
    }

    const wishlistItem = await Wishlist.findOne({
      allProduct: product._id,
    }).exec();

    if (!wishlistItem) {
      req.flash("error", "Product not found in wishlist.");
      res.redirect("/");
    }

    user.UserWishlists.pull(wishlistItem._id);
    product.wishlists.pull(wishlistItem._id);

    await Wishlist.deleteOne({ _id: wishlistItem._id });

    await user.save();
    await product.save();

    req.flash("success", "Product successfully removed on Cart.");
    res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

exports.addToCart = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await User.findById(req.id).exec();
    const opening = await Products.findById(req.params.id).exec();
  
    // Update student and opening data
    student.UserCart.push(opening._id);
    opening.cartusers.push(student._id);
  
    await student.save();
    await opening.save();

    req.flash("success", "Product successfully Add in on Wishlist.");
    res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

exports.removeToCart = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await User.findById(req.id).exec();
    const opening = await Products.findById(req.params.id).exec();

    if (!student || !opening) {
      req.flash("error", "User or product not found.");
      res.redirect("back")
    }

    const studentIndex = student.UserCart.indexOf(opening._id);
    if (studentIndex !== -1) {
      student.UserCart.splice(studentIndex, 1);
      await student.save();
    }

    const openingIndex = opening.cartusers.indexOf(student._id);
    if (openingIndex !== -1) {
      opening.cartusers.splice(openingIndex, 1);
      await opening.save();
    }
    req.flash("success", "Product successfully Removed in Wishlist.");
    res.redirect("back");
  } catch (error) {
    console.error("Error in removeToCart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// user account end

// order process start

exports.CouponCodeApply = catchAsyncErrors(async (req, res, next) => {
  try {
    const { coupon_code } = req.body;

    // Check if coupon code exists in the database
    const coupon = await Coupons.findOne({ code: coupon_code }).exec();

    if (!coupon) {
      return res.status(400).json({ error: "Invalid coupon code." });
    }

    // Check if coupon status is Disabled
    if (coupon.status === "Disabled") {
      return res.status(400).json({ error: "This coupon is disabled." });
    }

    // Check if coupon is expired
    const currentDate = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (currentDate < startDate || currentDate > endDate) {
      return res.status(400).json({ error: "This coupon is expired." });
    }

    let total = 8490;

    // Apply discount based on coupon type
    if (coupon.type === "Percentage") {
      const discountPercentage = parseFloat(coupon.discountValue);
      total *= (100 - discountPercentage) / 100;
    } else if (coupon.type === "Fixed amount") {
      const discountAmount = parseFloat(coupon.discountValue);
      total -= discountAmount;
    } else if (coupon.type === "Free shipping") {
      // Implement logic to remove shipping charges
      // You may need to update the shipping cost calculation here
    }

    return res
      .status(200)
      .json({ success: "Coupon applied successfully.", total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Oops! Something went wrong." });
  }
});

exports.shopCart = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();
    if (!user.UserWishlists || user.UserWishlists.length === 0) {
      return res.redirect("/user/addresses");
    }

    const shippings = await Shippings.find();
    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/orderProcess/shop_cart", {
      title: `${user.fullname} Shopping Bag`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      shippings,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.shopCheckout = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");

    // Find the checkout for the logged-in user and populate wishlist items
    const checkout = await Checkout.findOne({ user: req.id }).populate({
      path: "wishlistDetails.item",
      populate: { path: "allProduct" },
    });

    if (!checkout) {
      res.redirect("/user/shopCart");
    }

    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate("UserAddress")
      .exec();

    // Check if wishlistDetails is available
    const wishlistItemsData = checkout.wishlistDetails
      ? checkout.wishlistDetails.map((item) => ({
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          product: item.item.allProduct,
        }))
      : [];

    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;

    res.render("frontend/orderProcess/shop_Checkout", {
      title: `${user.fullname} Shipping & Checkout`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemsData,
      checkout,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.proceedToCheckout = catchAsyncErrors(async (req, res) => {
  try {
    const userId = req.id;
    const { total, shippingCost, productQuantity } = req.body;
    console.log(productQuantity);

    // Convert single values to arrays if necessary
    const wishlistItemIds = Array.isArray(req.body.wishlistItemIds) ? req.body.wishlistItemIds : [req.body.wishlistItemIds];
    const colors = Array.isArray(req.body.color) ? req.body.color : [req.body.color];
    const sizes = Array.isArray(req.body.size) ? req.body.size : [req.body.size];
    const quantities = Array.isArray(req.body.quantity) ? req.body.quantity : [req.body.quantity];

    // Map wishlist items with details
    const wishlistDetails = wishlistItemIds.map((itemId, index) => ({
      item: itemId,
      color: colors[index],
      size: sizes[index],
      quantity: quantities[index],
    }));

    
    for (let i = 0; i < productQuantity.length; i++) {
      if (parseInt(productQuantity[i]) < parseInt(quantities[i])) {
        throw new Error(`Product quantity for item exceeds available stock.`);
        res.redirect("back")
      }
    }

    // Find existing checkout document for the user
    let checkout = await Checkout.findOne({ user: userId });

    if (!checkout) {
      // If no checkout exists, create a new one
      checkout = new Checkout({
        user: userId,
        wishlistDetails: wishlistDetails,
        total,
        shippingCost,
        grandTotal: total + shippingCost,
      });
    } else {
      // If checkout exists, update it with new data
      checkout.wishlistDetails = wishlistDetails;
      checkout.total = total;
      checkout.shippingCost = shippingCost;
      checkout.grandTotal = total + shippingCost;
    }

    // Save the updated or new checkout document
    await checkout.save();

    req.flash("success", "Successfully proceeded to checkout.");
    res.redirect("/user/shopCheckout");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message || "Oops! Something went wrong.");
    res.redirect("/");
  }
});

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

exports.placeOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.id;
    const {
      orderAddress,
      orderShipping,
      payment,
      subtotal,
      orderProduct,
      productscolor,
      productssize,
      productsquantity,
    } = req.body;

    const wishlistItemIds = Array.isArray(orderProduct) ? orderProduct : [orderProduct];
    const colors = Array.isArray(productscolor) ? productscolor : [productscolor];
    const sizes = Array.isArray(productssize) ? productssize : [productssize];
    const quantities = Array.isArray(productsquantity) ? productsquantity : [productsquantity];

    const wishlistDetails = wishlistItemIds.map((itemId, index) => ({
      item: itemId,
      color: colors[index],
      size: sizes[index],
      quantity: quantities[index],
    }));

    // Calculate total quantity of all products ordered
    const productsTotalQuantity = quantities.reduce(
      (total, quantity) => total + parseInt(quantity),
      0
    );

    // Save productsTotalQuantity to Products collection and deduct from product's quantity
    for (let i = 0; i < wishlistItemIds.length; i++) {
      const productId = wishlistItemIds[i];
      const product = await Products.findById(productId);
      product.quantity -= quantities[i];
      await product.save();
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash("success", "User not found.");
      return res.redirect("back");
    }

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });

    let orderId;
    if (lastOrder) {
      const lastAlphabet = lastOrder.orderId.charAt(3); // Update index to start from the alphabet part
      const lastSerialNumber = parseInt(lastOrder.orderId.slice(4)); // Update index to start from the serial number part
      let nextAlphabet = lastAlphabet;
      let nextSerialNumber = lastSerialNumber + 1;
      if (nextSerialNumber > 999) {
        // reset serial number and move to next alphabet
        nextAlphabet = alphabet.charAt(
          (alphabet.indexOf(lastAlphabet) + 1) % alphabet.length
        );
        nextSerialNumber = 1;
      }
      orderId = `CLT${nextAlphabet}${String(nextSerialNumber).padStart(
        3,
        "0"
      )}`;
    } else {
      orderId = "CLTA001";
    }

    let newOrder;
    if (payment === "Cash on delivery") {
      newOrder = new Order({
        user: userId,
        orderId: orderId,
        orderProducts: wishlistDetails,
        orderTotal: subtotal,
        orderAddress: orderAddress,
        orderShipping: orderShipping,
        orderMethod: payment,
      });

      await newOrder.save();
      user.UserOrders.push(newOrder._id);
      await user.save();
      await Checkout.deleteOne({ user: req.id });
      await Wishlist.deleteMany({ allUsers: req.id });
      user.UserCart = [];
      await user.save();
      
      res.redirect(`/user/order_Confirm/${newOrder._id}`);
    } else if (payment === "Pay Online") {
      const params = {
        amount: subtotal * 100,
        currency: "INR",
        receipt: uuidv4(),
        payment_capture: "1",
      };

      const response = await razorPayInstance.orders.create(params);

      const paymentDetail = new PaymentDetail({
        orderId: response.id,
        receiptId: response.receipt,
        amount: response.amount,
        currency: response.currency,
        createdAt: response.created_at,
        status: response.status,
      });

      await paymentDetail.save();

      newOrder = new Order({
        user: userId,
        orderId: orderId,
        orderProducts: wishlistDetails,
        orderTotal: subtotal,
        orderAddress: orderAddress,
        orderShipping: orderShipping,
        orderMethod: payment,
        onlinepayment: paymentDetail._id,
      });

      await newOrder.save();
      user.UserOrders.push(newOrder._id);
      await user.save();
      return res.render("frontend/orderProcess/checkout", {
        title: "Confirm Order",
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        paymentDetail: paymentDetail,
        messages: req.flash(),
      });
    } else {
      req.flash("error", "Invalid payment option.");
      res.redirect("back")
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.paymentVerify = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Concatenate order_id and payment_id
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Create HMAC SHA256 hash
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Compare signatures
    if (expectedSignature === razorpay_signature) {
      // Update payment details in the database
      const paymentDetail = await PaymentDetail.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "paid",
        },
        { new: true }
      );

      if (!paymentDetail) {
        req.flash("error", "Payment detail not found.");
        res.redirect("back")
      }

      // Delete checkout document associated with the user

      await Checkout.deleteOne({ user: req.id });

      await Wishlist.deleteMany({ allUsers: req.id });

      // Clear user's cart
      const user = await User.findById(req.id);
      if (user) {
        user.UserWishlists = [];
        await user.save();
      }
      req.flash("success", "Order Placed successfully.");
      res.redirect("/user/orders");
    } else {
      req.flash("error", "Oops! Something went wrong.");
      res.redirect("/user/shopCart");
    }
  } catch (error) {
    console.error("Error in payment verification:", error);
    res.render("pages/error", { error }); // Render error page
  }
});

exports.OrderConfirm = catchAsyncErrors(async (req, res, next) => {
  const orderId = req.params.id;
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .exec();
    const order = await Order.findById(orderId)
      .populate({
        path: "orderProducts.item",
        model: "Product",
      })
      .populate({
        path: "orderAddress",
      })
      .populate({
        path: "onlinepayment",
      })
      .exec();

    if (!order) {
      req.flash("error", "Order not found.");
      return res.redirect("/user/orders");
    }

    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/orderProcess/order_confirm", {
      title: `${user.fullname} Thank You`,
      categorys,
      user,
      isAuthenticated,
      order: order || {},
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.accountOrders = catchAsyncErrors(async (req, res, next) => {
  try {
    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate({
        path: "UserOrders",
        populate: [
          {
            path: "orderProducts.item",
            model: "Product",
          },
          {
            path: "onlinepayment",
            model: "PaymentDetail",
          }
        ],
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });
    const currentPath = req.path;

    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;
    res.render("frontend/accounts/orders", {
      title: `${user.fullname} Orders`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("back");
  }
});

exports.OrderView = catchAsyncErrors(async (req, res, next) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId)
      .populate({
        path: "orderProducts.item",
        model: "Product",
      })
      .populate({
        path: "orderAddress",
      })
      .populate({
        path: "onlinepayment",
      })
      .exec();

    if (!order) {
      req.flash("warning", "Order not found");
      return res.redirect("/user/orders");
    }

    const categorys = await Category.find().populate("subcategories");
    const user = await User.findById(req.id)
      .populate({
        path: "UserWishlists",
        populate: { path: "allProduct" },
      })
      .populate({
        path: "UserOrders",
        populate: {
          path: "orderProducts.item",
          model: "Product",
        },
      })
      .exec();

    const wishlistItemss = user.UserWishlists.map((wishlist) => {
      return wishlist.allProduct;
    });

    const currentPath = req.path;
    const { token } = req.cookies;
    const isAuthenticated = token ? true : false;

    res.render("frontend/accounts/orders_view", {
      title: `${user.fullname} Order Details`,
      categorys,
      user,
      currentPath,
      isAuthenticated,
      wishlistItemss,
      order,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("back");
  }
});

exports.rateReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const { username, useremail, rate, review, productId } = req.body;
    const userId = await User.findById(req.id);
    const newRateReview = new RateReviews({
      username,
      useremail,
      rate,
      review,
      User: userId,
      Product: productId,
    });

    await newRateReview.save();

    await User.findByIdAndUpdate(userId, {
      $push: { userRateReview: newRateReview._id },
    });

    await Products.findByIdAndUpdate(productId, {
      $push: { productsRateReview: newRateReview._id },
    });
    req.flash("error", "Rating and Review add successfully.");
    res.redirect("back");
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("back");
  }
});

exports.retry_payment = catchAsyncErrors(async (req, res, next) => {
  const paymentId = req.params.id;
  try {
    const paymentDetails = await PaymentDetail.findById(paymentId);

    if (!paymentDetails) {
      req.flash("warning", "Payment Details Not Found");
      return res.redirect("back");
    }

    return res.render("frontend/orderProcess/checkout", {
      title: "Confirm Order",
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      paymentDetail: paymentDetails,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});


// order process end

// accounts end
